"""Compare archived native workloads. No runtime mutation or automatic flag changes."""
from pathlib import Path
from datetime import datetime, timezone
import argparse, json, re, statistics, subprocess
from lib.native_encoding_context import census_immutability, compare_contexts
from lib.native_wire_evidence import compare_selected_wire, qualify_selected_wire

BASE = Path(__file__).resolve().parents[2] / 'createch-dev/runtime-state/086a/artifacts/performance-qualification'
parser = argparse.ArgumentParser()
parser.add_argument('off')
parser.add_argument('on')
args = parser.parse_args()

def load(folder, name): return json.loads((folder / name).read_text())
def optional_load(folder, name): return load(folder, name) if (folder / name).is_file() else None
def stats(values):
    values = sorted(v for v in values if v is not None)
    if not values: return None
    return {'samples':len(values), 'median':statistics.median(values), 'p95':values[min(len(values)-1, int(.95*len(values)))], 'max':max(values)}

def summarize(trial):
    folder = BASE / trial
    lines = (folder / 'latest.log').read_text().splitlines()
    events, clients = [], []
    recipe_events, recipe_totals = [], []
    for line in lines:
        if '[086a Perf] ' in line: events.append(json.loads(line.split('[086a Perf] ',1)[1]))
        if '[086a Perf client] ' in line: clients.append(json.loads(line.split('[086a Perf client] ',1)[1]))
        match = re.search(r'Posted recipe events in ([0-9.]+) s', line)
        if match: recipe_events.append(float(match[1])*1000)
        match = re.search(r'Added (\d+) recipes, removed (\d+) recipes, modified (\d+) recipes, with (\d+) failed recipes taking ([0-9.]+) s',line)
        if match: recipe_totals.append({'added':int(match[1]),'removed':int(match[2]),'modified':int(match[3]),'failed':int(match[4]),'durationMs':float(match[5])*1000})
    phases = [e for e in events if e['event']=='phase']
    def in_phase(sample, name):
        for i, phase in enumerate(phases):
            if phase['phase']==name:
                end=phases[i+1]['at'] if i+1<len(phases) else float('inf')
                if phase['at']<=sample['at']<end:return True
        return False
    phases_report = {}
    for name in ['stationary','new_chunks','settle']:
        server=[e for e in events if e['event']=='server_sample' and e['phase']==name]
        client=[c for c in clients if 'fps' in c and c['focused'] and not c['screenOpen'] and in_phase(c,name)]
        phases_report[name]={'rollingServerMspt':stats([s['mspt'] for s in server]),'sampledFps':stats([s['fps'] for s in client]),
                             'sampledFrameWorkMs':stats([s['frameWorkMs'] for s in client])}
    # Align native samples to real workload transitions, excluding the census.
    bounds = {}
    for i, phase in enumerate(phases[:-1]):
        if phase['phase'] in ['reload_1','reload_2','stationary','new_chunks','settle']:
            bounds[phase['phase']] = [datetime.fromtimestamp(t / 1000, timezone.utc).isoformat()
                                      for t in [phase['at'], phases[i+1]['at']]]
    (folder / 'measured-phases.json').write_text(json.dumps(bounds, indent=2) + '\n')
    recording = folder / 'runtime.jfr'
    assert recording.is_file(), 'Paired workload requires native JFR'
    subprocess.run([__import__('sys').executable, str(Path(__file__).with_name('analyze_runtime_jfr.py')),
                    str(recording), str(folder / 'measured-phases.json'), str(folder / 'measured-jfr.json')],
                   check=True, stdout=subprocess.DEVNULL)
    jfr = load(folder, 'measured-jfr.json')
    for name, phase in jfr['phases'].items():
        phases_report.setdefault(name, {}).update({'gcPauses':phase['gcPauses'],
            'maxReportedHeapBytes':max((h['usedBytes'] for h in phase['gcHeap']), default=None),
            'executionSamples':phase['executionSamples']})
    waypoints=[e for e in events if e['event']=='waypoint']
    assert [int(e['index']) for e in waypoints]==list(range(12)), 'Incomplete chunk traversal'
    reloads=[e['durationMs'] for e in events if e['event']=='reload_complete']
    assert len(reloads)==2 and any(e['phase']=='complete' for e in phases), 'Incomplete workload'
    assert any(e.get('event')=='clean_stop' for e in clients), 'No native clean client stop'
    snapshot=load(folder,'snapshot.json')
    both_unsupported=set(snapshot['unsupportedRecipeCodecs']) & set(snapshot['unsupportedRecipeNetworkCodecs'])
    return {'trial':trial,'reloadMs':reloads,'recipeEventsMs':recipe_events,'recipeTotals':recipe_totals,'phases':phases_report,
            'unsupportedDataCodecs':len(snapshot['unsupportedRecipeCodecs']),'unsupportedNetworkCodecs':len(snapshot['unsupportedRecipeNetworkCodecs']),
            'recipesWithoutEitherEncoding':sorted(both_unsupported),'dataRecipeCount':len(snapshot['recipePayloadHashes']),
            'networkRecipeCount':len(snapshot['recipeNetworkHashes']),'snapshot':snapshot}

off, on = summarize(args.off), summarize(args.on)
a, b = load(BASE / args.off,'prelaunch.json'), load(BASE / args.on,'prelaunch.json')
changed_inputs=[n for n in set(a['inputs'])|set(b['inputs']) if a['inputs'].get(n)!=b['inputs'].get(n)]
assert set(changed_inputs)=={'kubejs/config/createch2_performance.json','kubejs/config/createch2_perf_trial.json'}, changed_inputs
assert a['coreSha256']==b['coreSha256'] and a['pristineWorldSha256']==b['pristineWorldSha256'] and a['optionsSha256']==b['optionsSha256']
assert a['loaderVersion']==b['loaderVersion'], 'Native loader changed between trials'
assert a.get('workloadSettingsSha256') == b.get('workloadSettingsSha256'), 'Operator capture settings changed between trials'
context = compare_contexts(optional_load(BASE / args.off, 'encoding-context.json'),
                           optional_load(BASE / args.on, 'encoding-context.json'))
immutability = {trial: census_immutability(optional_load(BASE / trial, 'selected-payloads.json'))
                for trial in [args.off, args.on]}
wire_captures = {trial: optional_load(BASE / trial, 'selected-network.json') for trial in [args.off, args.on]}
wire_provenance = {trial: qualify_selected_wire(wire_captures[trial], result['snapshot']['recipeNetworkHashes'])
                   for trial, result in [(args.off, off), (args.on, on)]}
wire_details = compare_selected_wire(wire_captures[args.off], wire_captures[args.on])
differences={}
for name in ['recipePayloadHashes','recipeNetworkHashes','unsupportedRecipeCodecs','unsupportedRecipeNetworkCodecs','itemTags','fluidTags']:
    av,bv=off['snapshot'][name],on['snapshot'][name]
    differences[name]=[key for key in sorted(set(av)|set(bv)) if av.get(key)!=bv.get(key)]
complete_coverage=not off['recipesWithoutEitherEncoding'] and not on['recipesWithoutEitherEncoding']
equivalent=complete_coverage and all(not keys for keys in differences.values()) and context['wireHashesComparable'] \
    and all(value['status'] == 'UNCHANGED' for value in immutability.values()) \
    and all(value['status'] == 'PASS' for value in wire_provenance.values()) and wire_details['status'] == 'IDENTICAL'
off.pop('snapshot');on.pop('snapshot')
ratio=statistics.median(on['recipeEventsMs'])/statistics.median(off['recipeEventsMs'])
report={'truth':'NATIVE_PAIR_IDENTICAL' if equivalent else 'NATIVE_PAIR_REQUIRES_REVIEW', 'coreSha256':a['coreSha256'], 'loaderVersion':a['loaderVersion'],
        'allowedInputChanges':sorted(changed_inputs),'semanticDifferences':differences,'completeNativeEncodingCoverage':complete_coverage,
        'nativeEncodingContext': context, 'selectedPayloadImmutability': immutability,
        'selectedWireProvenance': wire_provenance, 'selectedWireDifferences': wire_details,
        'off':off,'on':on,'recipeEventMedianReductionPercent':100*(1-ratio),
        'limits':['One sequential pair; order, OS caches and thermal state remain confounds.',
                  'Rolling server average and once-per-second frame samples do not measure every tick or frame.',
                  'Unsupported data encoders are additionally compared through their native network codecs.',
                  'Snapshot work occurs after measured workload; it is not included in workload timing.'],
        'activation':'REVIEW_MEASURED_BENEFIT_AND_SEMANTIC_DIFFERENCES'}
target=BASE/'paired-native-analysis.json'
target.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'truth':report['truth'],'recipeEventMedianReductionPercent':report['recipeEventMedianReductionPercent'],
                  'differences':{k:len(v) for k,v in differences.items()},'completeCoverage':complete_coverage}))
