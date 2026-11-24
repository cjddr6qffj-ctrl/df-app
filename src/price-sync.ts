import {z} from 'zod';
import type {Product} from './model';
export const priceUpdateSchema=z.object({id:z.string(),sku:z.string(),url:z.string().url(),price:z.number().finite().min(0).max(1e8),currency:z.literal('EUR'),checkedAt:z.string().datetime()});
export type PriceUpdate=z.infer<typeof priceUpdateSchema>;
export function applyPrice(p:Product,raw:unknown):Product {
 const parsed=priceUpdateSchema.safeParse(raw);if(!parsed.success)return p;
 const u=parsed.data;
 if(u.id!==p.id||u.sku!==p.sku||u.url!==p.url||p.currency!==u.currency||Date.parse(u.checkedAt)>Date.now()+60000||Date.parse(u.checkedAt)<Date.parse(p.priceCheckedAt??'1970-01-01'))return p;
 return {...p,price:u.price,priceCheckedAt:u.checkedAt};
}
export function priceQueue(products:Product[],now=Date.now()){
 return products.filter(p=>p.source==='signeda'&&p.currency==='EUR'&&(!p.priceCheckedAt||!Number.isFinite(Date.parse(p.priceCheckedAt))||now-Date.parse(p.priceCheckedAt)>=86400000)).sort((a,b)=>Date.parse(a.priceCheckedAt??'1970-01-01')-Date.parse(b.priceCheckedAt??'1970-01-01'));
}
export async function runPriceQueue(products:Product[],io:{check:(p:Product)=>Promise<unknown>;save:(p:Product,u:PriceUpdate)=>Promise<void>;stopped:()=>boolean;progress:(done:number,total:number,errors:number)=>void}){
 const queue=priceQueue(products);let updated=0,errors=0,consecutive=0;
 for(const p of queue){
  if(io.stopped())break;
  try{
   const raw=await io.check(p);
   const u=priceUpdateSchema.parse({...raw as object,id:p.id,checkedAt:new Date().toISOString()});
   if(applyPrice(p,u)===p)throw Error('Az ár nem ehhez a termékhez tartozik.');
   // Save completed work even if the user stopped during the in-flight request.
   try{await io.save(p,u);}catch{throw Error('STOP: Az ár helyi mentése nem sikerült.');}
   updated++;consecutive=0;
  }catch(e){errors++;consecutive++;if(String(e).includes('STOP:')||consecutive>=3)return {updated,errors,total:queue.length,blocked:String(e).replace(/^Error:\s*(STOP:\s*)?/, '')};}
  io.progress(updated,queue.length,errors);
 }
 return {updated,errors,total:queue.length,blocked:null};
}
