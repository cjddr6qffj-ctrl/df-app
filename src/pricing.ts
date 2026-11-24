import {z} from 'zod';
import type {Product} from './model';
export const pricingSchema=z.object({source:z.enum(['public','df']),markup:z.number().finite().min(0).max(1000)});
export type Pricing=z.infer<typeof pricingSchema>;
export const dfPricesSchema=z.record(z.object({sku:z.string(),url:z.string().url(),price:z.number().finite().min(0).max(1e8),currency:z.literal('EUR'),checkedAt:z.string().datetime()}));
export type DfPrices=z.infer<typeof dfPricesSchema>;
export function pricedProduct(p:Product,settings:Pricing,prices:DfPrices):Product{
 const df=prices[p.id];const valid=df&&df.sku===p.sku&&df.url===p.url&&df.currency===p.currency;
 const base=settings.source==='public'?p.price:valid?df.price:null;
 return {...p,price:base===null?null:Math.round(base*(1+settings.markup/100)*100)/100,priceCheckedAt:settings.source==='public'?p.priceCheckedAt:valid?df.checkedAt:null};
}
