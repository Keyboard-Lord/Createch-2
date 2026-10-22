"""Read-only assertions for closed disposable-world native processing fixtures."""
import argparse, gzip, hashlib, io, json, pathlib, struct, zipfile, zlib
development=pathlib.Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser()
parser.add_argument('--report', default='basin-fluid-binding-saved-fixtures.json')
parser.add_argument('--archive', type=pathlib.Path,
 help='Read the disposable world region directly from a backup ZIP without restoring any save')
args=parser.parse_args()
assert pathlib.Path(args.report).name == args.report and args.report.endswith('.json')
live=pathlib.Path(json.loads((development/'live-instance.json').read_text())['instance'])
world=live/'saves/086a Compatibility'
region=world/'region/r.-2.-1.mca'
if args.archive:
 archive=args.archive.resolve(strict=True)
 with zipfile.ZipFile(archive) as backup:
  entry='saves/086a Compatibility/region/r.-2.-1.mca'
  assert backup.namelist().count(entry)==1, 'Missing or duplicate disposable region'
  raw=backup.read(entry)
else:
 raw=region.read_bytes()
coords=set()
for x in (-780,-776):
 coords.update([(x,100,-276),(x,102,-276),(x-1,102,-276),(x,99,-276)])
for x,z in [(-786,-262),(-782,-262),(-786,-266),(-786,-270)]:
 coords.update([(x,100,z),(x,102,z),(x-1,100,z),(x-1,102,z)])
coords.update([(-782,100,-266),(-782,102,-266),(-783,102,-266),(-783,103,-266),(-783,100,-266),(-782,100,-270),(-782,102,-270),(-783,100,-270),(-783,102,-270),(-786,100,-276),(-786,102,-276),(-787,102,-276),(-788,100,-276),(-787,100,-276),(-787,101,-277),(-788,101,-277)])
class Reader:
 def __init__(self,data): self.s=io.BytesIO(data)
 def take(self,n):
  b=self.s.read(n)
  if len(b)!=n: raise ValueError('Truncated NBT')
  return b
 def num(self,fmt): return struct.unpack('>'+fmt,self.take(struct.calcsize('>'+fmt)))[0]
 def name(self): return self.take(self.num('H')).decode('utf-8')
 def payload(self,t,depth=0):
  if depth>128: raise ValueError('NBT depth')
  if t in range(1,7): return self.num({1:'b',2:'h',3:'i',4:'q',5:'f',6:'d'}[t])
  if t==8: return self.name()
  if t==10:
   d={}
   while (child:=self.num('B')):
    name=self.name(); d[name]=self.payload(child,depth+1)
   return d
  if t in (7,9,11,12):
   child=self.num('B') if t==9 else {7:1,11:3,12:4}[t]
   n=self.num('i')
   if n<0 or n>10000000: raise ValueError('NBT array length')
   return [self.payload(child,depth+1) for _ in range(n)]
  raise ValueError('Unknown NBT tag '+str(t))
entities={}
for cx,cz in {(x//16,z//16) for x,y,z in coords}:
 index=(cx%32)+(cz%32)*32
 loc=int.from_bytes(raw[index*4:index*4+4],'big'); offset=(loc>>8)*4096; sectors=loc&255
 assert offset>=8192 and sectors>0
 length=int.from_bytes(raw[offset:offset+4],'big'); assert 1<length<=sectors*4096-4
 compression=raw[offset+4]; body=raw[offset+5:offset+4+length]
 if compression==1: body=gzip.decompress(body)
 elif compression==2: body=zlib.decompress(body)
 elif compression!=3: raise ValueError('Unsupported region compression')
 r=Reader(body); assert r.num('B')==10; r.name(); chunk=r.payload(10)
 for e in chunk['block_entities']:
  if (e['x'],e['y'],e['z']) in coords: entities[','.join(str(e[k]) for k in ('x','y','z'))]=e

missing=sorted(coords-{tuple(map(int,k.split(','))) for k in entities})
assert not missing,missing
report={'truth':'READ_ONLY_CLOSED_WORLD_NBT','world':str(world),'regionSha256':hashlib.sha256(raw).hexdigest(),'blockEntities':entities,'fixtureInputsPowerAndSelectedResearch':'Provided in the disposable validation world; no earned acquisition or completed progression claim'}
if args.archive:
 report['truth']='READ_ONLY_BACKUP_POINT_IN_TIME_NBT'
 report['archive']={'path':str(archive),'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),
  'entry':entry,'restored':False,
  'limits':'Backup-time fixture state; does not establish subsequent clean shutdown retention or runtime recovery.'}
def item_at(key): return entities[key].get('HeldItem',{}).get('Item')
expected={'-786,100,-262':('modern_industrialization:copper_curved_plate',1),'-782,100,-262':('modern_industrialization:copper_curved_plate',1),'-786,100,-266':('modern_industrialization:rubber_sheet',1),'-786,100,-270':('greate:andesite_alloy_plate',1)}
for key,(id,count) in expected.items():
 item=item_at(key); assert item['id']==id and item['count']==count,(key,item)
mix=entities['-782,100,-266']; belt=entities['-782,100,-270']; pvc=entities['-786,100,-276']
assert mix['OutputItems']['Items'][0]['id']=='minecraft:orange_dye' and mix['OutputItems']['Items'][0]['count']==2,mix
assert belt['OutputItems']['Items'][0]['id']=='greate:rubber_belt_connector' and belt['OutputItems']['Items'][0]['count']==1,belt
assert not belt['InputItems']['Items'],belt
report['qualifiedSavedOutputs']={key:item_at(key) for key in expected}
report['qualifiedSavedOutputs']['mixing']=mix['OutputItems']
report['qualifiedSavedOutputs']['sixRawRubberCompacting']=belt['OutputItems']
pvc_fluid=pvc['InputTanks'][0]['TankContent']['Fluid']
assert pvc_fluid['id']=='modern_industrialization:polyvinyl_chloride' and pvc_fluid['amount']==68,pvc
assert pvc['OutputItems']['Items'][0]['id']=='gtceu:polyvinyl_chloride_plate' and pvc['OutputItems']['Items'][0]['count']==4,pvc
assert not entities['-788,100,-276'].get('TankContent'),entities['-788,100,-276']
report['pvcFixture']={'truth':'PHYSICAL_PUMP_AND_FORMING_STOCK_CONSERVATION_PASS','startingProvidedMillibuckets':644,'plateCount':4,'plateMillibuckets':144,'remainingMillibuckets':68,'emptyTransportTank':True,'inputTanks':pvc['InputTanks'],'outputItems':pvc['OutputItems'],'limits':'Stock, power, fuel, owner and selected research were provided; no earned acquisition claim.'}
for key,id in [('-780,100,-276','gtceu:polyvinyl_chloride_plate'),('-776,100,-276','greate:silicone_rubber_belt_connector')]:
 e=entities[key]
 assert e['OutputItems']['Items'][0]['id']==id and e['OutputItems']['Items'][0]['count']==1,(key,e)
 assert all(not t.get('TankContent') for t in e['InputTanks']),(key,e)
 report['qualifiedSavedOutputs'][key]=e['OutputItems']
out=development/'createch-dev/runtime-state/086a'/args.report
out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ('qualifiedSavedOutputs','pvcFixture')}))
