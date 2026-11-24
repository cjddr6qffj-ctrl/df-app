import {useEffect,useRef,useState} from 'react';
import type {Product} from './model';
import {native,read,write} from './store';
import {runPriceQueue,type PriceUpdate} from './price-sync';
export function PriceSync({products,onPrice}:{products:Product[];onPrice:(u:PriceUpdate)=>void}){
 const current=useRef(products);current.current=products;
 const callback=useRef(onPrice);callback.current=onPrice;
 const running=useRef(false),stop=useRef(false),mounted=useRef(true);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function start(){
  if(!native||running.current)return;
  if(!navigator.onLine){setMessage('Offline: az utolsó ismert termékárak láthatók.');return;}
  running.current=true;stop.current=false;setBusy(true);setMessage('Termékárak ellenőrzése…');
  try{
   const {invoke}=await import('@tauri-apps/api/core');
   const updates=await read<Record<string,PriceUpdate>>('priceUpdates',{});
   const result=await runPriceQueue(current.current,{
    check:p=>invoke('check_product_price',{url:p.url,sku:p.sku}),
    stopped:()=>stop.current||!navigator.onLine,
    save:async(p,u)=>{updates[p.id]=u;await write('priceUpdates',updates);if(mounted.current)callback.current(u);},
    progress:(n,total,errors)=>{if(mounted.current)setMessage(`Árak: ${n} / ${total} ellenőrizve${errors?` · ${errors} sikertelen`:''}. A katalógus közben használható.`);}
   });
   const summary={...result,finishedAt:new Date().toISOString(),interrupted:stop.current||!navigator.onLine};
   await write('priceSyncStatus',summary);
   if(mounted.current)setMessage(result.blocked??(summary.interrupted?'Árfrissítés szünetel. A már ellenőrzött árakat elmentettük.':result.total===0?'Minden termékárat ellenőriztünk az elmúlt 24 órában.':`${result.updated} ár ellenőrizve${result.errors?`; ${result.errors} tételnél a régi ár maradt`:''}.`));
  }catch{if(mounted.current)setMessage('Az árfrissítés nem sikerült. Az utolsó mentett árak megmaradtak.');}
  finally{running.current=false;if(mounted.current)setBusy(false);}
 }
 useEffect(()=>{mounted.current=true;const t=setTimeout(()=>void start(),300);const online=()=>void start();window.addEventListener('online',online);return()=>{mounted.current=false;stop.current=true;clearTimeout(t);window.removeEventListener('online',online);};},[]);
 if(!native)return null;
 return <div className="notice price-sync"><p role="status">{message||'Termékárak ellenőrzésére vár…'}</p>{busy?<button onClick={()=>{stop.current=true;setMessage('Az aktuális termék után szüneteltetjük az árfrissítést.');}}>Szüneteltetés</button>:<button onClick={()=>void start()}>Árak ellenőrzése</button>}</div>;
}
