import {normalize,type Product} from './model';
export const codeKey=(s:string)=>normalize(s).replaceAll(' ','');
export function exactOemMatches(products:Product[],query:string){const key=codeKey(query);return key?products.filter(p=>p.oem.some(o=>codeKey(o)===key)):[];}
export function commonOem(a:Product,b:Product){const keys=new Set(a.oem.map(codeKey).filter(Boolean));return b.oem.filter(o=>keys.has(codeKey(o)));}
export function relatedByOem(products:Product[],selected:Product){return products.filter(p=>p.id!==selected.id&&commonOem(selected,p).length>0);}
// Only an explicit, unqualified source field supports a trim filter.
// Mentions inside a description (including exclusions or year-specific combinations) do not.
export function sourceTrims(p:Product):string[]{
 const field=p.fitment.match(/Modelio detalės:\s*(.*?)(?:;| A pontos kivitel|$)/)?.[1]?.trim().toUpperCase();
 if(!field)return [];
 const tokens=field.split(/\s*[,/+]\s*/).map(t=>t.replace(/\s+/g,''));
 return tokens.length&&tokens.every(t=>['BASE','V6','ECOBOOST','GT','GT350','GT500','MACH1','DARKHORSE'].includes(t))?tokens:[];
}
export function matchesTrim(p:Product,trim:string,includeUnknown:boolean){if(!trim)return true;const tags=sourceTrims(p);return tags.length?tags.includes(trim):includeUnknown;}
export function fitmentSummary(p:Product){const tags=sourceTrims(p);return tags.length?`Forrás szerinti kivitel: ${tags.join(', ')}. A csomag és VIN szerinti illeszkedés külön ellenőrizendő.`:'A pontos kivitel és Performance Package kompatibilitása nincs igazolva.';}
