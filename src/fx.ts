import {useEffect,useState} from 'react';
export type Fx={date:string;base:'EUR';quote:'HUF';rate:number;checkedAt:string};
export const FX_URL='https://api.frankfurter.dev/v2/rate/eur/huf';
export function validFx(value:unknown):value is Fx {const x=value as Fx;return !!x&&x.base==='EUR'&&x.quote==='HUF'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&Number.isFinite(x.rate)&&x.rate>0&&Number.isFinite(Date.parse(x.checkedAt));}
export function convertHuf(price:number|null,currency:string,fx:Fx|null){return price===null?null:currency==='HUF'?price:currency==='EUR'&&fx?Math.round(price*fx.rate):null;}
export const formatHuf=(value:number)=>new Intl.NumberFormat('hu-HU',{style:'currency',currency:'HUF',maximumFractionDigits:0}).format(value);
export function useFx(){
 const [fx,setFx]=useState<Fx|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true,running=false;let cached:Fx|null=null;try{const raw=JSON.parse(localStorage.getItem('df:fx')??'null');if(validFx(raw)){cached=raw;setFx(raw);}}catch{}
 const refresh=async()=>{if(running)return;running=true;setBusy(true);try{const response=await fetch(FX_URL,{signal:AbortSignal.timeout(12000),credentials:'omit'});if(!response.ok)throw Error('Árfolyamforrás nem elérhető');const value={...await response.json(),checkedAt:new Date().toISOString()};if(!validFx(value))throw Error('Hibás árfolyamadat');cached=value;try{localStorage.setItem('df:fx',JSON.stringify(value));}catch{}if(active){setFx(value);setError('');}}catch{if(active)setError('Árfolyamfrissítés nem sikerült; az utolsó mentett adat látható.');}finally{running=false;if(active)setBusy(false);}};
 void refresh();const timer=setInterval(()=>void refresh(),3600000);window.addEventListener('online',refresh);return()=>{active=false;clearInterval(timer);window.removeEventListener('online',refresh);};},[]);
 return {fx,error,busy};
}
