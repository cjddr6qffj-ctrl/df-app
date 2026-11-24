import {useEffect,useRef,useState} from 'react';
import {read,write} from './store';
import {releaseNotes as notes} from './release-notes';
export function WhatsNew({ready}:{ready:boolean}){
 const [open,setOpen]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(!ready)return;let live=true;void read<string|null>('releaseNotesSeen',null).then(version=>{if(live&&version!==notes.version)setOpen(true);}).catch(()=>{});return()=>{live=false;};},[ready]);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 async function close(){setSaving(true);try{await write('releaseNotesSeen',notes.version);setOpen(false);}catch{setError('Nem sikerült megjegyezni. Próbáld újra!');}finally{setSaving(false);}}
 return <dialog ref={dialog} className="whats-new panel" aria-labelledby="whats-new-title" onCancel={e=>{e.preventDefault();void close();}}><p className="eyebrow">DF TUNING · ÚJDONSÁGOK</p><h2 id="whats-new-title">{notes.title}</h2><ul>{notes.items.map(item=><li key={item}>{item}</li>)}</ul>{error&&<p role="alert">{error}</p>}<button autoFocus className="primary" disabled={saving} onClick={()=>void close()}>Szuper, kipróbálom!</button><small>{notes.version}</small></dialog>;
}
