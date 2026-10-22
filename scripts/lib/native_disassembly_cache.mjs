import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';

// Cache pure javap output, never a verification result. Every contract still
// runs its current assertions. Tool/JDK/archive bytes are part of the key;
// changing a mod or the classpath invalidates the corresponding disassembly.
const original=childProcess.execFileSync,hashes=new Map();
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const fileHash=p=>{p=fs.realpathSync(p);const stat=fs.statSync(p,{bigint:true}),version=[stat.size,stat.mtimeNs,stat.ctimeNs].join(':');if(hashes.get(p)?.version!==version)hashes.set(p,{version,value:hash(fs.readFileSync(p))});return hashes.get(p).value;};
const directory=path.join(os.tmpdir(),'createch-native-disassembly-v1');
childProcess.execFileSync=function(file,args,options){
 if(!file.endsWith('/bin/javap')||!Array.isArray(args)||options?.input!==undefined)return original.apply(this,arguments);
 const cp=args.indexOf('-classpath');if(cp<0)return original.apply(this,arguments);
 const tool=fs.realpathSync(file),jdk=path.resolve(path.dirname(tool),'../lib/modules');
 const archives=args[cp+1].split(path.delimiter).map(p=>[fs.realpathSync(p),fileHash(p)]);
 const key=hash(JSON.stringify([fileHash(tool),fileHash(jdk),args,archives,process.env.LANG,process.env.LC_ALL,process.env.JAVA_TOOL_OPTIONS,process.env.JDK_JAVA_OPTIONS]));
 const cached=path.join(directory,key+'.bin');
 if(fs.existsSync(cached)){
  const data=fs.readFileSync(cached);
  if(data.length<=(options?.maxBuffer??1024*1024))return options?.encoding?data.toString(options.encoding):data;
 }
 const result=original.apply(this,arguments);
 fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(cached,result);
 return result;
};
syncBuiltinESMExports();
