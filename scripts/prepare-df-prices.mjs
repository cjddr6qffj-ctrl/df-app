import fs from 'node:fs';
const products=JSON.parse(fs.readFileSync('public/catalog.json')).products;
const raw=JSON.parse(fs.readFileSync('data/signeda/df-private-checkpoint.json'));
const prices={},missing=[];
for(const p of products){
 const r=raw.records[p.sku];if(!r){missing.push(p.sku);continue;}
 const check=raw.identityChecks?.[p.sku];
 const verified=check?.oldId===p.id&&check.newId===r.id&&check.verifiedSku===p.sku&&check.verifiedBrand===p.brand;
 if(r.id!==p.id.replace('signeda-','product-card-')&&!verified)throw Error('Product identity mismatch: '+p.sku);
 if(!Number.isFinite(r.price)||r.price<0||!r.priceText||!Number.isFinite(Date.parse(r.checkedAt)))throw Error('Invalid price: '+p.sku);
 prices[p.id]={sku:p.sku,url:p.url,price:r.price,currency:'EUR',checkedAt:r.checkedAt};
}
fs.writeFileSync('data/signeda/df-private-prices.json',JSON.stringify(prices));
console.log({matched:Object.keys(prices).length,total:products.length,missing});
