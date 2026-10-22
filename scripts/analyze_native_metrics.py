"""Summarize Minecraft F3+L archives without treating server loop time as MSPT."""
import argparse
import csv
import hashlib
import io
import json
import math
from pathlib import Path
import re
import statistics
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('archive', type=Path)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()

def summary(values):
    assert values
    values = sorted(values)
    def percentile(p):
        return values[max(0, min(len(values)-1, math.ceil(p*len(values))-1))]
    return {'count':len(values), 'mean':statistics.mean(values), 'p50':percentile(.5),
            'p95':percentile(.95), 'p99':percentile(.99), 'max':values[-1]}

with zipfile.ZipFile(args.archive) as archive:
    report = {'archive':str(args.archive.resolve()),
              'sha256':hashlib.sha256(args.archive.read_bytes()).hexdigest(),
              'method':'Native F3+L ten-second metrics and profiling report',
              'units':'ticktime CSV values are nanoseconds; output distributions are milliseconds',
              'boundaries':['Client ticks in this recorder are rendered frame loops, not server ticks.',
                            'Server ticktime CSV covers the loop including waiting; it is not processing MSPT.',
                            'All-dimension debug archive generation happens after the recording window.',
                            'Native CPU counters returning all zero are unavailable, not zero CPU usage.']}
    for side in ['client','server']:
        text = archive.read(side+'/profiling.txt').decode()
        match = re.search(r'Time span: (\d+) ms.*?Tick span: (\d+) ticks',text,re.S)
        assert match
        duration,count = map(int,match.groups())
        rows=list(csv.DictReader(io.StringIO(archive.read(side+'/metrics/ticking.csv').decode())))
        assert len(rows)==count
        report[side]={'durationMs':duration,'loops':count,'loopsPerSecond':count*1000/duration,
                      'loopMs':summary([float(r['ticktime'])/1e6 for r in rows])}
    report['client']['renderedFramesPerSecond']=report['client']['loopsPerSecond']
    for file,key,column in [('jvm','heapMiB','heap MiB'),('gpu','nativeGpuUtilization','gpuUtilization')]:
        name='client/metrics/'+file+'.csv'
        if name in archive.namelist():
            report[key]=summary([float(r[column]) for r in csv.DictReader(io.StringIO(archive.read(name).decode()))])
    rendering=list(csv.DictReader(io.StringIO(archive.read('client/metrics/chunk_rendering.csv').decode())))
    report['clientChunkMetrics']={k:sorted(set(float(r[k]) for r in rendering)) for k in rendering[0] if k!='@tick'}
    options=archive.read('client/options.txt').decode().splitlines()
    report['graphicsOptions']=[line for line in options if line.split(':',1)[0] in {
        'renderDistance','simulationDistance','maxFps','enableVsync','graphicsMode','particles','biomeBlendRadius','fov'}]
args.output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'framesPerSecond':report['client']['renderedFramesPerSecond'],
                  'frameLoopMs':report['client']['loopMs'],'output':str(args.output)}))
