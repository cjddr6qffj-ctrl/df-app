import fs from 'node:fs';
const endpoint=process.env.DF_UPDATE_URL;
const pubkey=process.env.DF_UPDATE_PUBLIC_KEY||fs.readFileSync('.release/updater.key.pub','utf8').trim();
if(!endpoint||new URL(endpoint).protocol!=='https:')throw Error('DF_UPDATE_URL must be an HTTPS manifest endpoint');
if(!pubkey.trim())throw Error('Updater public key is required');
fs.writeFileSync('src-tauri/tauri.release.conf.json',JSON.stringify({bundle:{createUpdaterArtifacts:true},plugins:{updater:{pubkey:pubkey.trim(),endpoints:[endpoint],windows:{installMode:'passive'}}}},null,2));
fs.writeFileSync('.env.production.local','VITE_UPDATER_ENABLED=true\n');
console.log('Release updater configured. Signing private key must be supplied through TAURI_SIGNING_PRIVATE_KEY.');
