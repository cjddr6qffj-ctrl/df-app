import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,createPublicKey,verify} from 'node:crypto';
const dir=process.argv[2]??'delivery/release-v0.1.1';
const manifest=JSON.parse(await fs.readFile(path.join(dir,'latest.json'),'utf8'));
const config=JSON.parse(await fs.readFile('src-tauri/tauri.conf.json','utf8'));
const keyText=Buffer.from(config.plugins.updater.pubkey,'base64').toString();
const key=Buffer.from(keyText.trim().split('\n')[1],'base64');
const publicKey=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),key.subarray(10)]),format:'der',type:'spki'});
for(const platform of ['darwin-aarch64','darwin-x86_64','windows-x86_64-nsis','windows-x86_64-msi']){
 const entry=manifest.platforms[platform];if(!entry)throw Error(`Missing platform: ${platform}`);
 const url=new URL(entry.url);if(url.protocol!=='https:'||!url.pathname.includes(`/v${manifest.version}/`))throw Error('Invalid versioned URL');
 const file=decodeURIComponent(url.pathname.split('/').pop());
 const data=await fs.readFile(path.join(dir,file));
 const signature=(await fs.readFile(path.join(dir,file+'.sig'),'utf8')).trim();
 if(signature!==entry.signature.trim())throw Error('Manifest and signature differ');
 const lines=Buffer.from(signature,'base64').toString().trim().split('\n');
 const sig=Buffer.from(lines[1],'base64');
 if(!sig.subarray(2,10).equals(key.subarray(2,10)))throw Error('Signing key mismatch');
 const algorithm=sig.subarray(0,2).toString();
 if(!['ED','Ed'].includes(algorithm))throw Error('Unknown signature algorithm');
 const payload=algorithm==='ED'?createHash('blake2b512').update(data).digest():data;
 if(!verify(null,payload,publicKey,sig.subarray(10)))throw Error(`Invalid signature: ${file}`);
 const trusted=lines[2].replace(/^trusted comment: /,'');
 if(!verify(null,Buffer.concat([sig.subarray(10),Buffer.from(trusted)]),publicKey,Buffer.from(lines[3],'base64')))throw Error('Invalid trusted comment');
 const corrupt=Buffer.from(payload);corrupt[0]^=1;
 if(verify(null,corrupt,publicKey,sig.subarray(10)))throw Error('Corruption accepted');
 console.log(`${platform}: signature OK; altered payload rejected (${file})`);
}
