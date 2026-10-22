"""Sample one explicitly selected Minecraft PID without collecting credentials."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import time

parser = argparse.ArgumentParser()
parser.add_argument("pid", type=int)
parser.add_argument("label")
args = parser.parse_args()
assert args.pid > 0
assert args.label.replace("-", "").replace("_", "").isalnum()
root = Path(__file__).resolve().parents[2]
state = root / "createch-dev/runtime-state/mission04"
output = state / f"{args.label}-process.jsonl"
assert not output.exists(), "Keep earlier samples intact"
with output.open("x") as journal:
    for _ in range(7200):
        result = subprocess.run(["/bin/ps", "-p", str(args.pid), "-o", "pid=,ppid=,etime=,%cpu=,rss=,comm="], capture_output=True, text=True)
        at = datetime.now(timezone.utc).isoformat()
        if result.returncode:
            journal.write(json.dumps({"at": at, "event": "process_absent", "pid": args.pid}) + "\n")
            journal.flush()
            print(f"PID {args.pid} is absent; samples saved to {output}", flush=True)
            break
        parts = result.stdout.strip().split(None, 5)
        if len(parts) != 6 or not parts[5].endswith("/bin/java"):
            journal.write(json.dumps({"at": at, "event": "selected_process_stopped_or_changed", "pid": args.pid}) + "\n")
            journal.flush()
            print(f"PID {args.pid} no longer identifies the selected Java executable; sampling stopped.", flush=True)
            break
        journal.write(json.dumps({"at": at, "pid": int(parts[0]), "ppid": int(parts[1]), "elapsed": parts[2], "cpuPercent": float(parts[3]), "rssKiB": int(parts[4]), "executable": parts[5]}) + "\n")
        journal.flush()
        time.sleep(2)
    else:
        print("Sampling time limit reached; process state must be checked separately.", flush=True)
