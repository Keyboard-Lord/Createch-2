import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Static deployed-code admission contract; this does not simulate a rocket.
export function firstRocketFuelContract(root,tags,overrides={}) {
 const core=path.join(root,'mods/createch2core.jar');
 const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
 const dis=args=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',args,{encoding:'utf8'});
 const config=overrides.config??JSON.parse(execFileSync('/usr/bin/unzip',['-p',core,'createch2core.mixins.json'],{encoding:'utf8'}));
 const allowedTag=overrides.allowedTag??read('kubejs/data/createch2/tags/item/fuels/rocket.json');
 const name='createch2.core.mixin.compat.StellarisRocketFuelMixin';
 const code=overrides.code??dis(['-c','-p','-classpath',core,name]);
 const annotations=overrides.annotations??dis(['-v','-p','-classpath',core,name]);
 const stellar=path.join(root,'mods/stellaris-1.21-neoforge-1.4.25.jar');
 const nativeTags=dis(['-c','-p','-classpath',stellar,'com.st0x0ef.stellaris.common.registry.TagRegistry']);
 const nativeIds=dis(['-c','-p','-classpath',stellar,'com.st0x0ef.stellaris.common.utils.ResourceLocationUtils']);
 assert(/String fuels\n[^\n]*ResourceLocationUtils.ctag:[\s\S]*?Field FUEL:/.test(nativeTags),'Native rocket fuel tag changed');
 assert(/ctag\(java.lang.String\);[\s\S]*?String c\n[\s\S]*?ResourceLocation.fromNamespaceAndPath:/.test(nativeIds));
 assert.equal(config.required,true);
 assert(config.mixins.includes('compat.StellarisRocketFuelMixin'),'Rocket admission guard is not configured');
 assert.deepEqual(allowedTag,{replace:false,values:['stellaris:fuel_bucket']},'Only the reviewed petroleum fuel bucket belongs in the private rocket tag');
 assert(annotations.includes('tryFillUpRocket(Lnet/minecraft/world/item/Item;)Z')&&annotations.includes('value="HEAD"')&&annotations.includes('cancellable=true')&&annotations.includes('require=1'),'Required cancellable rocket entry binding changed');
 // Verify the actual compiled conditional branches: null, non-shared and
 // explicitly admitted fuels fall through; the remaining shared fuels cancel.
 assert(/ifnull\s+(\d+)[\s\S]*?CREATECH2\$SHARED_FUELS:[\s\S]*?Holder\$Reference.is:[\s\S]*?ifeq\s+\1[\s\S]*?CREATECH2\$ROCKET_FUELS:[\s\S]*?Holder\$Reference.is:[\s\S]*?ifne\s+\1[\s\S]*?iconst_0[\s\S]*?Boolean.valueOf:[\s\S]*?CallbackInfoReturnable.setReturnValue:[\s\S]*?\1: return/.test(code),'Compiled admission branch changed');
 assert(/String c\n[\s\S]*?String fuels\n[\s\S]*?putstatic[^\n]*CREATECH2\$SHARED_FUELS:/.test(code));
 assert(/String createch2\n[\s\S]*?String fuels\/rocket\n[\s\S]*?putstatic[^\n]*CREATECH2\$ROCKET_FUELS:/.test(code));
 const common=[...tags.members('c:fuels')].sort(),allowed=[...tags.members('createch2:fuels/rocket')].sort();
 assert.deepEqual(allowed,['stellaris:fuel_bucket']);
 assert(common.includes(allowed[0]));
 const blocked=common.filter(id=>!allowed.includes(id));
 for(const id of ['createaddition:biomass','mekanism:bio_fuel','mekanism:block_bio_fuel','oritech:biomass','oritech:biomass_block','techreborn:plantball'])assert(blocked.includes(id),'Shared machine-fuel membership changed: '+id);
 return {truth:'STATIC_DEPLOYED_ROCKET_FUEL_ADMISSION',allowed,blockedSharedFuels:blocked,commonMachineFuelsRetained:common,guardSha256:crypto.createHash('sha256').update(code).digest('hex'),limits:'Compiled entry guard and resolved tag declarations only. Native other motor fuels remain delegated; actual injection application, fuel transfer, inventory and flight require runtime qualification.'};
}
