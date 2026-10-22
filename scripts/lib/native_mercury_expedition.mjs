import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// Reuse the reviewed basic rocket, bucket admission, recovery and life-support
// suppliers. The new dependency is a four-leg journey with two Venus stops.
export function nativeMercuryExpedition({root,travel,travelCode,rocketCode,fuelCode,tankCode,environmentProfile}) {
  const jar=path.join(root,'mods/stellaris-1.21-neoforge-1.4.25.jar');
  const mercury=JSON.parse(execFileSync('unzip',['-p',jar,'data/stellaris/planets/mercury.json'],{encoding:'utf8'}));
  assert.equal(mercury.level,'stellaris:mercury');assert.equal(mercury.distanceFromEarth,92000);
  assert.equal(mercury.oxygen,false);assert.equal(mercury.temperature,430);
  assert.equal(travel.basicTank,3000);assert.equal(travel.fuelMegametersPerMb,19.22);
  assert.equal(travel.returnSuppliers.truth,'STATIC_NATIVE_ROCKET_RECOVERY_AND_RETURN_FUEL');
  assert.equal(travel.venusEnvironment.truth,'STATIC_DECLARED_VENUS_PRESSURE_EQUIPMENT');
  const screen=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar,'com.st0x0ef.stellaris.client.screens.PlanetSelectionScreen'],{encoding:'utf8'});
  const method=(code,name,next)=>{assert(code.includes(name),name);return code.split(name,2)[1].split(next,1)[0];};
  const bodies={
    range:method(rocketCode,'public boolean canGoTo(', '\n}'),
    cost:method(fuelCode,'public static float getFuelNeededToGoOnPlanet(', '\n  public '),
    fill:method(rocketCode,'public boolean tryFillUpRocket(', '\n  public '),
    transfer:method(travelCode.utils,'public static void changeDimension(net.minecraft.world.entity.player.Player, com.st0x0ef.stellaris.common.data.planets.Planet, net.minecraft.world.phys.Vec3);','\n  public static void changeDimensionWithVehicle'),
    selection:method(screen,'public boolean canLaunch(', '\n  private void initializeAllButtons')
  };
  const reviews={
    range:code=>{assert.equal(code.split('Planet.distanceFromEarth:').length-1,2);assert(/isub[\s\S]*?Mth.abs:[\s\S]*?RocketEntity|isub[\s\S]*?Mth.abs:[\s\S]*?Field FUEL:/.test(code));assert(code.includes('FuelType.getMegametersTraveled:'));},
    cost:code=>{assert.equal(code.split('Planet.distanceFromEarth:').length-1,2);assert(/isub[\s\S]*?Mth.abs:/.test(code));assert(code.includes('float 19.22f'));assert(code.includes('fdiv'));},
    fill:code=>{for(const term of ['FuelType$Type.getTypeBasedOnItem:','MotorUpgrade.getFuelType:','FuelType$Type.getMotorType:','sipush        1000','SimpleContainer.removeItem:'])assert(code.includes(term),term);assert(/if_icmple[\s\S]*?TankUpgrade.getTankCapacity:[\s\S]*?putfield[^\n]*Field FUEL:/.test(code),'Native refill caps the tank after the 1000mB addition');},
    transfer:code=>assert(/ServerPlayer.level:[\s\S]*?Level.dimension:[\s\S]*?ResourceKey.location:[\s\S]*?PlanetUtil.getPlanet:[\s\S]*?aload_1[\s\S]*?FuelType.getFuelNeededToGoOnPlanet:[\s\S]*?Math.round:[\s\S]*?isub[\s\S]*?putfield[^\n]*RocketEntity.FUEL:/.test(code),'Debit uses the actual current dimension and selected destination'),
    selection:code=>assert(/PlanetUtil.isPlanet:[\s\S]*?Player.level:[\s\S]*?Level.dimension:[\s\S]*?PlanetUtil.getPlanet:[\s\S]*?aload_1[\s\S]*?RocketEntity.canGoTo:/.test(code),'Normal planet selection supplies the current planet')
  };
  for(const[k,fn]of Object.entries(reviews))fn(bodies[k]);
  assert(/getBasic\(\);[\s\S]*?sipush\s+3000/.test(tankCode));
  for(const term of ['Utils.changeDimension:','PlanetSelectionServerEvents.LAUNCH_BUTTON','PlanetUtil.getPlanet:'])assert(travelCode.transferPacket.includes(term),term);
  const nativeNegativeCases=[];
  for(const[k,old]of [['range','isub'],['cost','isub'],['fill','TankUpgrade.getTankCapacity:'],['transfer','ServerPlayer.level:'],['selection','PlanetUtil.isPlanet:']]){
    assert.throws(()=>reviews[k](bodies[k].replaceAll(old,'BROKEN_MERCURY_BINDING')));nativeNegativeCases.push({name:'missing_'+k+'_binding',rejected:true});
  }
  const positions={'minecraft:overworld':0,'stellaris:venus':41000,'stellaris:mercury':92000};
  const itinerary=['minecraft:overworld','stellaris:venus','stellaris:mercury','stellaris:venus','minecraft:overworld'];
  const run=({route=itinerary,buckets=[0,2,3,2],initialFuel=3000}={})=>{
    assert.equal(route.length,buckets.length+1);let fuel=initialFuel,discarded=0,refills=0,consumed=0;const legs=[];
    assert(fuel<=3000&&fuel>=0);for(let i=0;i<buckets.length;i++){
      const from=route[i],to=route[i+1];assert(Object.hasOwn(positions,from)&&Object.hasOwn(positions,to));
      const beforeRefilling=fuel;for(let j=0;j<buckets[i];j++){assert(fuel<3000,'A full tank cannot consume another bucket');const added=fuel+1000;fuel=Math.min(3000,added);discarded+=added-fuel;refills++;}
      const distance=Math.abs(positions[from]-positions[to]),range=Math.fround(Math.fround(fuel)*Math.fround(19.22));
      assert(distance<=range,'Insufficient fuel for '+from+' -> '+to);
      const cost=Math.round(Math.fround(Math.fround(distance)/Math.fround(19.22))),beforeFlight=fuel;fuel-=cost;assert(fuel>=0);consumed+=cost;
      legs.push({from,to,distance,fuelBeforeRefillingMb:beforeRefilling,refillBuckets:buckets[i],fuelBeforeFlightMb:beforeFlight,consumedMb:cost,fuelAfterFlightMb:fuel});
    }
    assert.equal(initialFuel+1000*refills,consumed+discarded+fuel);return {legs,initialFuelMb:initialFuel,reserveBuckets:refills,totalNewFuelMb:initialFuel+1000*refills,consumedMb:consumed,discardedAtTankCapMb:discarded,fuelAfterReturnMb:fuel};
  };
  const plan=run();assert.deepEqual(plan.legs.map(l=>l.consumedMb),[2133,2653,2653,2133]);
  assert.equal(plan.reserveBuckets,7);assert.equal(plan.totalNewFuelMb,10000);assert.equal(plan.fuelAfterReturnMb,214);assert.equal(plan.discardedAtTankCapMb,214);
  const negativeCases=[];
  for(const[name,args]of [['direct_earth_to_mercury',{route:['minecraft:overworld','stellaris:mercury'],buckets:[0]}],['one_less_initial_bucket',{initialFuel:2000}],['short_first_venus_refill',{buckets:[0,1,3,2]}],['short_mercury_refill',{buckets:[0,2,2,2]}],['short_return_venus_refill',{buckets:[0,2,3,1]}],['extra_bucket_into_full_tank',{buckets:[0,4,3,2]}]]){
    assert.throws(()=>run(args),undefined,name);negativeCases.push({name,rejected:true});
  }
  // An extra early bucket is legal while the tank is below capacity, but not
  // needed for the selected route. Its unused fuel is never reused elsewhere.
  assert(environmentProfile.dimensions['stellaris:mercury']);
  return {truth:'STATIC_NATIVE_STAGED_MERCURY_RETURN_FUEL',itinerary,plan,nativeCodeSha256:Object.fromEntries(Object.entries({rocket:rocketCode,fuel:fuelCode,tank:tankCode,utils:travelCode.utils,selection:screen,packet:travelCode.transferPacket}).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')])),nativeNegativeCases,negativeCases,environment:{nativePlanet:{oxygen:mercury.oxygen,temperature:mercury.temperature},profile:environmentProfile.dimensions['stellaris:mercury'],venusEquipmentSource:'firstSpaceTravel.venusEnvironment',pressureSuit:travel.venusEnvironment.pressureSuit},actorConditions:['Normal survival travel with a basic liquid-fuel motor/tank, complete pressure suit and supplied oxygen; keep the same fuel type.','Supply ten new Stellaris fuel buckets: three for the starting tank and seven carried reserves. Clear returned empty buckets from the rocket output before each subsequent refill.','Recover the rocket with remaining-fuel components and ordinary cargo after every landing; supply launch-pad equipment for each field departure, including both Venus visits. Reaching the same preplaced pad on the second visit is not assumed.','Carry survey/mining tools, provisions and exposure/oxygen reserves for both Venus stops and Mercury. Permission, event hooks, actual placement and native controls must allow the trip.'],stockCredited:0,observedOutputs:false,limits:['Installed bytecode, current planet data and conserved single-precision fuel arithmetic only. Actual menu selection, launch, safe landing, rocket recovery, refill, cargo and return remain runtime qualification.','No direct Earth-Mercury flight, forced menu flag, free Earth-return exception, death/keepInventory, creative travel or later tank upgrade is credited.','This is a separately procured trip, not a debit from earlier finite inventories or a paid quantity proof for the whole rocket/fuel factory. Suit classification does not prove oxygen duration, thermal/radiation protection, terrain access or survival.']};
}
