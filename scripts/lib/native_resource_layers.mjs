import path from 'node:path';

// NeoForge's built-in common-tag recipes replace vanilla resources before
// ordinary mod packs. Keep every ordinary overlay when its order is unknown.
export const platformProvider='neoforge-21.1.256-universal.jar';
export function nativeRecipeLayers(rows){
 const mods=rows.filter(r=>!['1.21.1.jar',platformProvider].includes(r.provider));
 const platform=rows.filter(r=>r.provider===platformProvider);
 return mods.length?mods:platform.length?platform:rows;
}
export function nativeArchivePath(root,provider){
 return provider==='1.21.1.jar'?path.resolve(root,'../../Install/versions/1.21.1/1.21.1.jar'):provider===platformProvider?path.resolve(root,'../../Install/libraries/net/neoforged/neoforge/21.1.256',provider):path.join(root,'mods',provider);
}
