"""User-authorized native keyboard tests; Minecraft supplies its own screenshots.

No OS permission changes, pack copies, clipboard access or original-save edits.
"""
import argparse
import ctypes
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import subprocess
import time
import re
import sys
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("--pid", type=int, help="Select the observed Minecraft PID when a headless Java diagnostic is also running")
parser.add_argument("--window-bounds", nargs=4, type=int, help="Freshly observed native window X Y width height when accessibility omits its window")
parser.add_argument("--keys", default="")
parser.add_argument("--text", default="")
parser.add_argument("--no-screenshot", action="store_true", help="Skip F2 when screenshots would disturb a native performance recording")
parser.add_argument("--chord", default="", help="Two or three native key codes pressed together, then released in reverse order")
parser.add_argument("--select-all", action="store_true")
parser.add_argument("--command", default="")
parser.add_argument("--commands-file", type=Path, help="At most 32 deterministic game commands; verify all outcomes in the game log")
parser.add_argument("--click", nargs=2, type=float, help="Normalized coordinates in the latest game screenshot")
parser.add_argument("--hold-seconds", type=float, help="Hold one observed mouse click for 0.08 to 5 seconds, e.g. native mining or eating")
parser.add_argument("--clicks-file", type=Path, help="Up to 24 ordered normalized clicks from one verified screen; no adaptive navigation")
parser.add_argument("--move", nargs=2, type=float, help="Hover normalized coordinates in the latest game screenshot")
parser.add_argument("--button", choices=["left", "right"], default="left", help="Mouse button for the observed game control")
parser.add_argument("--pause-before-click", action="store_true", help="Open the pause menu after focus returns, then click the observed menu control")
args = parser.parse_args()
assert args.pid is None or args.pid > 0
assert args.window_bounds is None or (args.pid is not None and args.window_bounds[2] > 0 and args.window_bounds[3] > 0)
game_process = f'(first application process whose unix id is {args.pid})' if args.pid else 'process "java"'
assert args.hold_seconds is None or (args.click and math.isfinite(args.hold_seconds) and 0.08 <= args.hold_seconds <= 5), "A bounded hold requires one observed click"
assert sum(bool(x) for x in (args.click, args.move, args.clicks_file)) <= 1, "Choose one pointer action"
click_sequence = json.loads(args.clicks_file.read_text()) if args.clicks_file else []
assert isinstance(click_sequence, list) and len(click_sequence) <= 24
if args.clicks_file:
    assert click_sequence, "Click sequence must not be empty"
assert all(isinstance(p, list) and len(p) == 2 and all(isinstance(n, (int, float)) and not isinstance(n, bool) and 0 <= n <= 1 for n in p) for p in click_sequence)
assert args.button == "left" or args.click or click_sequence, "Right-click requires observed coordinates"
keys = [int(x) for x in args.keys.split(",") if x]
assert all(0 <= key <= 127 for key in keys)
chord = [int(x) for x in args.chord.split(",") if x]
assert not args.chord or (2 <= len(chord) <= 3 and len(set(chord)) == len(chord) and all(0 <= key <= 127 for key in chord)), "Chord requires two or three distinct native key codes"
assert not (chord and (keys or args.text or args.command or args.commands_file or args.click or args.move or args.clicks_file or args.pause_before_click or args.select_all)), "Chord is a separate input path"
assert not ((args.command or args.commands_file) and (keys or args.text)), "Commands have a separate input path"
assert not (args.command and args.commands_file)
commands = [args.command] if args.command else []
if args.commands_file:
    commands = [line.strip() for line in args.commands_file.read_text().splitlines() if line.strip() and not line.startswith('#')]
    assert 0 < len(commands) <= 32
# Minecraft's chat input is bounded to 256 characters, including the slash.
# Reject oversized fixture commands before typing rather than silently truncating NBT.
assert all('\n' not in c and '\r' not in c and len(c) <= 255 for c in commands)
development = Path(__file__).resolve().parents[2]
live = Path(json.loads((development / "live-instance.json").read_text())["instance"])
started = time.time()
coordinates = args.click or args.move or (click_sequence[0] if click_sequence else None)
if coordinates:
    assert all(0 <= n <= 1 for n in coordinates)
    cg = ctypes.CDLL('/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics')
    cg.CGPreflightPostEventAccess.restype = ctypes.c_bool
    assert cg.CGPreflightPostEventAccess(), "Native event posting is not permitted; do not request or change OS permissions"
    subprocess.run(['/usr/bin/osascript', '-e', f'tell application "System Events" to set frontmost of {game_process} to true'], check=True, capture_output=True)
    if args.pause_before_click:
        subprocess.run(['/usr/bin/osascript', '-e', 'tell application "System Events" to key code 53'], check=True, capture_output=True)
        time.sleep(0.3)
    if args.window_bounds is not None:
        left, top, width, height = args.window_bounds
    else:
        bounds = subprocess.check_output(['/usr/bin/osascript', '-e', f'tell application "System Events" to get {{position of window 1, size of window 1}} of {game_process}'], text=True)
        left, top, width, height = map(int, re.findall(r'-?\d+', bounds))
    previous = max((live / 'screenshots').glob('*.png'), key=lambda p: p.stat().st_mtime)
    with Image.open(previous) as image: pixels_w, pixels_h = image.size
    client_h = pixels_h * width / pixels_w
    class Point(ctypes.Structure):
        _fields_ = [('x', ctypes.c_double), ('y', ctypes.c_double)]
    cg.CGEventCreateMouseEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint32, Point, ctypes.c_uint32]
    cg.CGEventCreateMouseEvent.restype = ctypes.c_void_p
    cg.CGEventPost.argtypes = [ctypes.c_uint32, ctypes.c_void_p]
    cf = ctypes.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
    cf.CFRelease.argtypes = [ctypes.c_void_p]
    # GLFW updates its cached cursor location from a move event, independently
    # of the position attached to a button event.
    mouse_button = 1 if args.button == "right" else 0
    for coordinate in (click_sequence or [coordinates]):
        point = Point(left + coordinate[0] * width, top + height - client_h + coordinate[1] * client_h)
        def post_mouse(event_type):
            event = cg.CGEventCreateMouseEvent(None, event_type, point, mouse_button)
            assert event
            cg.CGEventPost(0, event)
            cf.CFRelease(event)
        post_mouse(5)
        time.sleep(0.2)
        if not args.move:
            try:
                post_mouse(3 if mouse_button else 1)
                time.sleep(args.hold_seconds if args.hold_seconds is not None else 0.08)
            finally:
                post_mouse(4 if mouse_button else 2)
            time.sleep(0.08)
if chord:
    cg = ctypes.CDLL('/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics')
    cg.CGPreflightPostEventAccess.restype = ctypes.c_bool
    assert cg.CGPreflightPostEventAccess(), "Native event posting is not permitted; do not request or change OS permissions"
    subprocess.run(['/usr/bin/osascript', '-e', 'tell application "System Events"\nif (count of (application processes whose name is "java")) is not 1 then error "Expected exactly one running Minecraft process"\nset frontmost of process "java" to true\nend tell'], check=True, capture_output=True)
    cg.CGEventCreateKeyboardEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint16, ctypes.c_bool]
    cg.CGEventCreateKeyboardEvent.restype = ctypes.c_void_p
    cg.CGEventPost.argtypes = [ctypes.c_uint32, ctypes.c_void_p]
    cf = ctypes.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
    cf.CFRelease.argtypes = [ctypes.c_void_p]
    def post_key(key, down):
        event = cg.CGEventCreateKeyboardEvent(None, key, down)
        assert event
        cg.CGEventPost(0, event)
        cf.CFRelease(event)
        time.sleep(0.08)
    pressed = []
    try:
        for key in chord:
            pressed.append(key)
            post_key(key, True)
    finally:
        for key in reversed(pressed):
            post_key(key, False)
process_selector = f'application processes whose unix id is {args.pid}' if args.pid else 'application processes whose name is "java"'
script = ['on run argv', 'tell application "System Events"',
          f'if (count of ({process_selector})) is not 1 then error "Expected exactly one selected Minecraft process"',
          f'set frontmost of {game_process} to true']
if args.select_all: script += ['keystroke "a" using command down']
for key in keys: script += [f'key code {key}', 'delay 0.08']
if args.text: script += ['keystroke item 1 of argv']
if commands:
    # Open the observed T chat binding, then type the full slash command into
    # its text field. Posting '/' as a shortcut is layout-dependent on macOS.
    for index in range(len(commands)):
        script += ['key code 17', 'delay 0.5', f'keystroke "/" & item {index + 1} of argv', 'delay 0.5', 'key code 36', 'delay 0.7']
script += ['delay 0.7'] + ([] if args.no_screenshot else ['key code 120']) + ['end tell', 'end run']
subprocess.run(['/usr/bin/osascript', '-e', '\n'.join(script), *(commands or [args.text])], check=True, capture_output=True, text=True)
record = {'actionUtc': datetime.fromtimestamp(started, timezone.utc).isoformat(),
          'keys': keys, 'chord': chord, 'text': args.text, 'command': args.command, 'commands': commands, 'click': args.click, 'move': args.move, 'button': args.button, 'clickSequence': click_sequence, 'pauseBeforeClick': args.pause_before_click, 'noScreenshot': args.no_screenshot}
if args.pid is not None: record['pid'] = args.pid
if args.window_bounds is not None: record['windowBounds'] = args.window_bounds
if args.hold_seconds is not None: record['holdSeconds'] = args.hold_seconds
with (development / 'createch-dev/runtime-state/086a/native-actions.jsonl').open('a') as journal:
    journal.write(json.dumps(record) + '\n')
if args.no_screenshot:
    print(json.dumps({**record, 'screenshot': None, 'reason': 'Screenshot intentionally omitted; verify native action in game logs.'}))
    sys.exit(0)
deadline = time.monotonic() + 5
while time.monotonic() < deadline:
    images = [p for p in (live / 'screenshots').glob('*.png') if p.stat().st_mtime >= started]
    if images:
        screenshot = max(images, key=lambda p: p.stat().st_mtime)
        # Wait for Minecraft's asynchronous image writer to close the file.
        time.sleep(0.2)
        print(json.dumps({**record, 'screenshot': str(screenshot)}))
        break
    time.sleep(0.1)
else:
    print(json.dumps({**record, 'screenshot': None, 'reason': 'Input sent; render thread has not produced a new screenshot. Inspect state before more input.'}))
    raise SystemExit(2)
