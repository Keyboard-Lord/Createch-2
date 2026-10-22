import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';

// Installed native/configuration contract only. This does not run an electrical
// network or prove a loaded capability provider has been selected by NeoForge.
export function firstPowerContract(root, overrides={}) {
 const startup=overrides.startup??fs.readFileSync(path.join(root,'config/modern_industrialization-startup.toml'),'utf8');
 const server=overrides.server??fs.readFileSync(path.join(root,'config/modern_industrialization-server.toml'),'utf8');
 assert(/^\s*bidirectionalEnergyCompat\s*=\s*true\b/m.test(startup),'MI FE input bridge is disabled');
 const ratio=Number(/^\s*forgeEnergyPerEu\s*=\s*(\d+)/m.exec(server)?.[1]);assert(ratio>0,'Invalid FE/EU ratio');
 const mi=path.join(root,'mods/Modern-Industrialization-2.5.10.jar'),ee=path.join(root,'mods/electroenergetics-1.21.1-1.1.4.jar');
 const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
 const nested=execFileSync('/usr/bin/unzip',['-p',mi,'META-INF/jarjar/GrandPower-3.0.0.jar']);
 const gp=path.join(os.tmpdir(),'mission02-grandpower-'+hash(nested).slice(0,16)+'.jar');
 if(!fs.existsSync(gp))fs.writeFileSync(gp,nested);
 const dis=(jar,name)=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar,name],{encoding:'utf8'});
 const api=dis(mi,'aztech.modern_industrialization.api.energy.EnergyApi');
 const wrapper=dis(mi,'aztech.modern_industrialization.api.energy.EnergyApi$WrappedMIStorage');
 const grand=dis(gp,'dev.technici4n.grandpower.impl.GrandPowerImpl');
 const converter=dis(ee,'com.george_vi.electroenergetics.content.converter.ConverterDevice');
 const registrations=dis(mi,'aztech.modern_industrialization.machines.init.SingleBlockCraftingMachines');
 const tiers=dis(mi,'aztech.modern_industrialization.machines.init.MachineTier');
 const steam=dis(mi,'aztech.modern_industrialization.machines.blockentities.SteamCraftingMachineBlockEntity');
 assert(steam.includes('SteamHelper.consumeSteamEu'),'Steam processors no longer consume recipe EU as steam');
 const steamTiers={};
 for(const tier of ['bronze','steel']){const match=new RegExp('String '+tier+'\\n\\s+\\d+: iconst_1\\n\\s+\\d+: iconst_(\\d)\\n\\s+\\d+: iconst_(\\d)').exec(tiers);assert(match,'Unmodeled native steam tier '+tier);assert.equal(match[1],match[2]);steamTiers[tier]=Number(match[1]);}
 const steamProcessors={};
 for(const type of ['macerator','compressor','mixer','cutting_machine','packer','unpacker','wiremill']){
  const start=registrations.indexOf('// String '+type+'\n');assert(start>=0,'Missing native processor '+type);
  const end=registrations.indexOf('Method registerMachineTiers:',start),segment=registrations.slice(start,end);
  const constants=[...segment.matchAll(/\b(?:iconst_(\d)|bipush\s+(\d+))/g)].map(m=>Number(m[1]??m[2]));
  assert.equal(constants.at(-1),16,'Unmodeled machine registration tail '+type);const mask=constants.at(-2);assert(mask>0&&mask<8);
  steamProcessors[type]=['bronze','steel'].filter((_,i)=>mask&(1<<i)).map(tier=>({item:'modern_industrialization:'+tier+'_'+type,tier,maxEu:steamTiers[tier]}));
 }
 assert(steamProcessors.packer.some(p=>p.tier==='steel'));assert(!steamProcessors.packer.some(p=>p.tier==='bronze'));
 for(const text of ['bidirectionalEnergyCompat','registerBlock','WrappedMIStorage.of'])assert(api.includes(text),'Missing MI energy contract '+text);
 assert(/public long receive\(long, boolean\);[\s\S]*?ldiv[\s\S]*?ILongEnergyStorage.receive:[\s\S]*?lmul/.test(wrapper),'MI receive wrapper lacks configured FE-to-EU conversion');
 for(const text of ['registerBlockWrapper','Capabilities$EnergyStorage.BLOCK','ILongEnergyStorage.BLOCK'])assert(grand.includes(text),'Missing GrandPower bridge '+text);
 for(const text of ['Capabilities$EnergyStorage.BLOCK','IEnergyStorage.receiveEnergy:(IZ)I','wattFeTConversionRate'])assert(converter.includes(text),'Missing native EE output contract '+text);
 return {truth:'STATIC_NATIVE_FE_EU_BRIDGE',fePerEu:ratio,steamTiers,steamProcessors,entry:'Native EE ConverterDevice pushes FE into the adjacent receiving face; MI exposes its insertable EU storage through the enabled GrandPower/FE wrapper. Registered bronze/steel processors consume eligible recipe EU as steam.',pins:{mi:hash(fs.readFileSync(mi)),ee:hash(fs.readFileSync(ee)),bundledGrandPower:hash(nested)},witnesses:{miEnergyApi:hash(api),miReceiveWrapper:hash(wrapper),grandPowerBridge:hash(grand),eeConverterDevice:hash(converter),miRegistrations:hash(registrations),miMachineTiers:hash(tiers),miSteamProcessor:hash(steam)},limits:['Installed bytecode and current profile configuration only; library selection and actual capability registration remain runtime qualification.','Electrical generation, facing, network stability, delivered throughput and sustained operation remain runtime qualification.']};
}
