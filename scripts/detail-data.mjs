// Only the selected product price is used, never a related product or warehouse offer.
export function parsePrice(text) {
 if (typeof text !== 'string') return null;
 const m=text.match(/^\s*((?:\d{1,3}(?:,\d{3})+\.\d{2})|(?:\d{1,3}(?:\.\d{3})+,\d{2})|(?:[\d\s\u00a0]+(?:[.,]\d{1,2})?))\s*€/);
 if(!m)return null;
 let number=m[1].replace(/[\s\u00a0]/g,'');
 if(number.includes(',')&&number.includes('.'))number=number.lastIndexOf('.')>number.lastIndexOf(',')?number.replaceAll(',',''):number.replaceAll('.','').replace(',','.');
 else number=number.replace(',','.');
 const value=Number(number);
 return Number.isFinite(value)&&value>=0?value:null;
}
export function cleanOem(values){const seen=new Set();return values.filter(Boolean).map(String).map(s=>s.trim()).filter(s=>{const key=s.replace(/[^a-z0-9]/gi,'').toUpperCase();if(!key||seen.has(key))return false;seen.add(key);return true;});}
export function detailIsValid(detail,sku,url){return !!detail&&detail.sku===sku&&detail.url===url&&detail.title?.includes(sku)&&Number.isFinite(Date.parse(detail.checkedAt));}
