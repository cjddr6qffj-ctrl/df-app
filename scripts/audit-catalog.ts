import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {feedSchema} from '../src/model';
const products=feedSchema.parse(JSON.parse(await readFile('public/catalog.json','utf8'))).products;
const missingFiles:string[]=[];
for(const path of new Set(products.flatMap(p=>p.images))){
 if(!path.startsWith('/catalog-images/'))continue;
 try{const bytes=await readFile('public'+path);if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')missingFiles.push(path);}catch{missingFiles.push(path);}
}
const task=(p:typeof products[number])=>({sku:p.sku,url:p.url,category:p.category,images:p.images.length,priceCheckedAt:p.priceCheckedAt??null});
const now=Date.now();
const report={checkedAt:new Date(now).toISOString(),products:products.length,images:products.reduce((n,p)=>n+p.images.length,0),productsWithImages:products.filter(p=>p.images.length).length,missingFiles,missingPrices:products.filter(p=>p.price===null).map(task),missingImages:products.filter(p=>!p.images.length).map(task),pendingGalleries:products.filter(p=>p.galleryStatus!=='complete'&&p.galleryStatus!=='source-empty').map(task),missingOem:products.filter(p=>!p.oem.length).map(task),pricesOlderThan24Hours:products.filter(p=>!p.priceCheckedAt||now-Date.parse(p.priceCheckedAt)>86400000).map(task),coverageComplete:false};
await mkdir('data/signeda',{recursive:true});
await writeFile('data/signeda/catalog-audit.json',JSON.stringify(report,null,2));
// Rebuildable priority list; source-empty requires explicit confirmation, not an empty initial DOM.
await writeFile('data/signeda/repair-queue.json',JSON.stringify(products.filter(p=>p.galleryStatus!=='complete'&&p.galleryStatus!=='source-empty').sort((a,b)=>a.images.length-b.images.length).map(p=>({...task(p),missingImage:!p.images.length})),null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([k,v])=>[k,Array.isArray(v)?v.length:v])),null,2));
if(missingFiles.length)process.exitCode=1;
