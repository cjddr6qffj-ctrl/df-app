import fs from 'node:fs/promises';
const read=async name=>JSON.parse(await fs.readFile(name,'utf8'));
const feed=await read('public/catalog.json');
const source=await read('data/signeda/catalog-checkpoint.json');
const coverage=await read('data/signeda/coverage-checkpoint.json');
const details=await read('data/signeda/details-checkpoint.json');
const byUrl=new Map(feed.products.map(p=>[p.url,p]));
const sourceByUrl=new Map(Object.values(source.products).map(p=>[p.url,p]));
const listed=new Set(Object.values(coverage.pages).flatMap(p=>p.urls??[]));
const missingProducts=[...listed].filter(url=>!byUrl.has(url));
const missingImages=feed.products.filter(p=>!p.images.length).map(p=>{
 const r=sourceByUrl.get(p.url),d=details.records[p.url];
 const candidates=[...new Set([...(r?.images??[]),...(d?.gallery??[]),...Object.keys(d?.imageFiles??{})])].filter(u=>!u.includes('/catalog/'));
 return {sku:p.sku,url:p.url,category:p.category,candidates,status:candidates.length?'image-download-pending':'product-gallery-check-pending'};
});
const report={checkedAt:new Date().toISOString(),basis:'Saved source pages only; not live completeness verification',products:feed.products.length,savedPages:Object.keys(coverage.pages).length,uniqueListedUrls:listed.size,missingProducts,missingImages,coverageComplete:false};
await fs.writeFile('data/signeda/source-coverage-audit.json',JSON.stringify(report,null,2));
await fs.writeFile('data/signeda/image-recovery-queue.json',JSON.stringify({version:1,updatedAt:report.checkedAt,tasks:missingImages},null,2));
console.log(JSON.stringify({products:report.products,savedPages:report.savedPages,uniqueListedUrls:listed.size,missingProducts:missingProducts.length,missingImages:missingImages.length,missingImagesWithKnownUrls:missingImages.filter(p=>p.candidates.length).length},null,2));
