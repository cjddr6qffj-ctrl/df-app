import {useEffect,useRef,useState} from 'react';
import {native} from './store';
import {check,type Update} from '@tauri-apps/plugin-updater';
import {relaunch} from '@tauri-apps/plugin-process';
const configured=import.meta.env.VITE_UPDATER_ENABLED==='true';
export function Updater(){
 const [message,setMessage]=useState(''),[available,setAvailable]=useState<Update|null>(null),[busy,setBusy]=useState(false);const lock=useRef(false);
 async function inspect(){if(lock.current||!native||!configured)return;lock.current=true;try{const update=await check({timeout:15000});setAvailable(update);setMessage(update?`Új verzió: ${update.version}`:'Az alkalmazás naprakész.');}catch{setMessage('A frissítés most nem ellenőrizhető. A jelenlegi verzió használható.');}finally{lock.current=false;}}
 useEffect(()=>{void inspect();},[]);
 async function install(){if(!available||lock.current)return;lock.current=true;setBusy(true);let downloaded=0,total=0;try{await available.downloadAndInstall(event=>{if(event.event==='Started')total=event.data.contentLength??0;if(event.event==='Progress'){downloaded+=event.data.chunkLength;setMessage(total?`Frissítés letöltése: ${Math.round(downloaded/total*100)}%`:'Frissítés letöltése…');}if(event.event==='Finished')setMessage('Telepítés és újraindítás…');});await relaunch();}catch{setMessage('A frissítés nem sikerült. Próbáld újra később.');}finally{lock.current=false;setBusy(false);}}
 useEffect(()=>{if(available)void install();},[available]);
 if(!native)return null;
 if(!configured)return null;
 return <div className="notice update-notice"><p role="status">{message}</p><button disabled={busy} onClick={()=>void inspect()}>Új verzió keresése</button>{available&&<button className="primary" disabled={busy} onClick={()=>void install()}>Frissítés telepítése és újraindítás</button>}</div>;
}
