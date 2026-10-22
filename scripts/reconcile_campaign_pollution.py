"""Narrow combustion parity, pinned to the installed MI activity serialization."""
import hashlib,json,pathlib,subprocess,sys
ROOT=pathlib.Path('/Users/mcrae/Documents/curseforge/minecraft/Instances/Createch 2')
DEV=pathlib.Path(__file__).resolve().parents[2]
jar=ROOT/'mods/Modern-Industrialization-2.5.10.jar'
javap='/opt/homebrew/opt/openjdk@21/bin/javap'
fuel=subprocess.check_output([javap,'-c','-p','-classpath',str(jar),'aztech.modern_industrialization.machines.components.FuelBurningComponent'],text=True)
assert 'String burningEuBuffer' in fuel and 'Method net/minecraft/nbt/CompoundTag.putLong:' in fuel
method=fuel.split('public boolean isBurning();')[1].split('public void')[0]
assert 'Field burningEuBuffer:J' in method and 'lconst_0' in method and 'lcmp' in method
boiler=subprocess.check_output([javap,'-c','-p','-classpath',str(jar),'aztech.modern_industrialization.machines.blockentities.BoilerMachineBlockEntity'],text=True)
assert 'FuelBurningComponent.isBurning:()Z' in boiler
changed=[]
for name in ['bronze_boiler','steel_boiler']:
 for mod in ['adpother','adchimneys']:
  template=(ROOT/f'config/{mod}/Emitters/create$blaze_burner.cfg').read_text()
  result='# Createch combustion parity: MI FuelBurningComponent.isBurning() == burningEuBuffer > 0.\n'+template.replace('create:blaze_burner',f'modern_industrialization:{name}').replace('burnTimeRemaining','burningEuBuffer')
  result='\n'.join(line.rstrip() for line in result.splitlines()).rstrip()+'\n'
  path=ROOT/f'config/{mod}/Emitters/modern_industrialization${name}.cfg'
  if '--check' in sys.argv: assert path.read_text()==result,str(path)
  else: path.write_text(result)
  changed.append(str(path.relative_to(ROOT)))
review=[
 ['TFMG','Coke/blast engines and refinery exhaust','12 existing emitters; CE exhaust activity adapter retained'],
 ['Create/Greate','Burner-fed heat and crushing dust','Existing Create burner/mill/crusher; Greate dynamic block activity needs live qualification; pure transmission gets no combustion tax'],
 ['MI','Fuel-fired bronze/steel boilers','Two new emitters and two matching chimney entries; exact saved field equals native isBurning; electric machines stay clean'],
 ['GT','Combustion generators and blast/chemical facilities','48 existing namespace configs; hardcoded activity and multi-block emission require live verification'],
 ['Mekanism','Combustion and ore dust','Existing six machinery configs and generator coverage; radiation remains separate'],
 ['Oritech','Bio/combustion generation and refining','No new emitter: machine progress is not an active-burn predicate; verify provider state before adding'],
 ['Railcraft','Coke/blast ovens and fueled fireboxes','Seven existing emitters with native activity and master-only selection'],
 ['Electro Energetics','Physical grid and electric loads','No blanket emissions; generation process owns combustion, conductors/converters do not']]
report={'truth':'VERIFIED_STATIC','provider':jar.name,'sha256':hashlib.sha256(jar.read_bytes()).hexdigest(),'changed':changed,'comparison':review,'runtime_status':'RUNTIME_UNVERIFIED','limits':['Native field is saved server-side and mirrors provider isBurning; chimney capture, idle/blocked/stalled behavior, dose rates and multi-block deduplication require operation.','Rates use the existing Create burner baseline (0.016 carbon, 0.0016 sulfur per TILE update); no calibrated pollution or performance claim.']}
(DEV/'createch-dev/runtime-state/campaign-unity/pollution-review.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'emitters':2,'matchingChimneys':2,'providerPredicate':'burningEuBuffer > 0'}))
