"""Summarize sampled hot paths and GC within explicit measured game phases."""
import argparse
from collections import Counter
from datetime import datetime
import json
from pathlib import Path
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('recording', type=Path)
parser.add_argument('phases', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
definitions = json.loads(args.phases.read_text())
events = json.loads(subprocess.check_output([
    '/opt/homebrew/opt/openjdk@21/bin/jfr', 'print', '--json', '--events',
    'jdk.ExecutionSample,jdk.GCPhasePause,jdk.GCHeapSummary', str(args.recording)
]))['recording']['events']

def timestamp(value):
    # JFR can emit nanoseconds; datetime accepts and truncates to microseconds.
    return datetime.fromisoformat(value).timestamp()

def duration(value):
    match = re.fullmatch(r'PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?', value)
    assert match, value
    return sum(float(x or 0) * scale for x, scale in zip(match.groups(), [3600, 60, 1]))

report = {'recording': str(args.recording.resolve()), 'phases': {}, 'limits': [
    'Execution samples locate active Java stacks; sample shares are not wall-clock timings or a measured speedup.',
    'The late-started baseline recording excludes early JVM and loader startup.',
    'Human waits and overlapping measurements must be excluded with explicit phase bounds.'
]}
for name, bounds in definitions.items():
    start, end = map(timestamp, bounds)
    assert start < end
    threads, self_frames, inclusive = Counter(), Counter(), Counter()
    pauses, heaps = [], []
    for event in events:
        values = event['values']
        if not start <= timestamp(values['startTime']) < end:
            continue
        if event['type'] == 'jdk.ExecutionSample':
            thread = values['sampledThread']['javaName']
            threads[thread] += 1
            frames = values.get('stackTrace') or {}
            names = [f["method"]["type"]["name"] + '.' + f["method"]["name"] for f in frames.get('frames', [])]
            if names:
                self_frames[(thread, names[0])] += 1
            inclusive.update((thread, frame) for frame in set(names))
        elif event['type'] == 'jdk.GCPhasePause':
            pauses.append(duration(values['duration']) * 1000)
        elif event['type'] == 'jdk.GCHeapSummary':
            heaps.append({'time': values['startTime'], 'when': values['when'], 'usedBytes': values['heapUsed']})
    def ranked(counter):
        return [{'thread': key[0], 'method': key[1], 'samples': count} for key, count in counter.most_common(40)]
    report['phases'][name] = {
        'bounds': bounds, 'wallSeconds': end - start, 'executionSamples': sum(threads.values()),
        'threads': dict(threads.most_common()), 'self': ranked(self_frames), 'inclusive': ranked(inclusive),
        'gcPauses': {'count': len(pauses), 'totalMs': sum(pauses), 'maxMs': max(pauses, default=0)},
        'gcHeap': heaps
    }
args.output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({name: {'samples': p['executionSamples'], 'gc': p['gcPauses'], 'topInclusive': p['inclusive'][:8]} for name, p in report['phases'].items()}))
