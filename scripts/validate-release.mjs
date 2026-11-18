import fs from 'node:fs';
const version=JSON.parse(fs.readFileSync('package.json')).version;
const tauri=JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json')).version;
const cargo=fs.readFileSync('src-tauri/Cargo.toml','utf8').match(/^version = "([^"]+)"/m)?.[1];
if(process.env.RELEASE_TAG!==`v${version}`||version!==tauri||version!==cargo)throw Error('Release tag, package.json, Cargo.toml and tauri.conf.json versions must match.');
console.log(`Validated release v${version}`);
