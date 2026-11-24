import {useEffect,useRef,useState} from 'react';
import {read,write,native} from './store';
import {pricingSchema,dfPricesSchema,type Pricing,type DfPrices} from './pricing';
export function usePricing(ready:boolean){
 const [settings,setSettings]=useState<Pricing>({source:'public',markup:0}),[prices,setPrices]=useState<DfPrices>({}),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
 const queue=useRef(Promise.resolve());
 useEffect(()=>{if(!ready)return;let live=true;void Promise.all([read('pricing-v1',{source:'public',markup:0}),read('df-private-prices-v1',{})]).then(async ([s,p])=>{const settings=pricingSchema.parse(s),prices=dfPricesSchema.parse(p);if(native){try{const {invoke}=await import('@tauri-apps/api/core');const raw=await invoke<string|null>('read_df_prices');if(raw){const incoming=dfPricesSchema.parse(JSON.parse(raw));for(const [id,value] of Object.entries(incoming)){if(!prices[id]||value.checkedAt>=prices[id].checkedAt)prices[id]=value;}await write('df-private-prices-v1',prices);}}catch{if(live)setError('A helyi DF-árfájl nem tölthető be. A korábbi árakat megtartottuk.');}}if(live){setSettings(settings);setPrices(prices);setLoaded(true);}}).catch(()=>setError('Az árazási beállítások nem tölthetők be.'));return()=>{live=false;};},[ready]);
 function change(next:Pricing){if(!loaded)return;const parsed=pricingSchema.safeParse(next);if(!parsed.success)return;setSettings(parsed.data);const task=queue.current.catch(()=>{}).then(()=>write('pricing-v1',parsed.data));queue.current=task;void task.then(()=>{if(queue.current===task)setError('');}).catch(()=>setError('Az árazás mentése nem sikerült.'));}
 return {settings,prices,loaded,error,change};
}
