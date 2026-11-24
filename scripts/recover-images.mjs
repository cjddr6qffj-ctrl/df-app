import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import robotsParser from 'robots-parser';
const root='data/signeda/';
const queue=JSON.parse(await fs.readFile(root+'image-recovery-queue.json','utf8'));
const progressPath=root+'image-recovery-progress.json';
let progress={completed:{},errors:{},blocked:null};
try{progress=JSON.parse(await fs.readFile(progressPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
async function save(){progress.updatedAt=new Date().toISOString();await fs.writeFile(progressPath+'.tmp',JSON.stringify(progress,null,2));await fs.rename(progressPath+'.tmp',progressPath);}
const agent='DFTuningCatalog/0.1';
try{
 const response=await fetch('https://www.signeda.lt/robots.txt',{headers:{'User-Agent':agent},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error(`Robots HTTP ${response.status}; live recovery stopped`);
 const robots=robotsParser(response.url,await response.text());
 progress.blocked=null;
 let count=0;
 for(const task of queue.tasks){for(const url of task.candidates){
  const parsed=new URL(url);
  if(parsed.origin!=='https://www.signeda.lt'||!parsed.pathname.startsWith('/image/cache/')||parsed.pathname.includes('/catalog/'))continue;
  if(robots.isAllowed(url,agent)!==true)continue;
  const target='public/catalog-images/'+createHash('sha256').update(url).digest('hex')+'.webp';
  try{await fs.access(target);continue;}catch{}
  if(count++>=Number(process.env.DF_IMAGE_LIMIT??25)){await save();console.log('Batch limit reached; run again to resume.');process.exit(0);}
  await new Promise(r=>setTimeout(r,Math.max(5000,(robots.getCrawlDelay(agent)??0)*1000)));
  const r=await fetch(url,{headers:{'User-Agent':agent},signal:AbortSignal.timeout(20000)});
  if([401,403,429].includes(r.status))throw Error(`Image HTTP ${r.status}; stopped without retrying block`);
  if(!r.ok){progress.errors[url]=`HTTP ${r.status}`;await save();continue;}
  if(Number(r.headers.get('content-length')??0)>10000000)throw Error('Oversized image');
  const bytes=Buffer.from(await r.arrayBuffer());
  if(bytes.length>10000000||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP'){progress.errors[url]='Invalid WebP';await save();continue;}
  await fs.writeFile(target+'.tmp',bytes);await fs.rename(target+'.tmp',target);
  progress.completed[url]={sku:task.sku,path:target,at:new Date().toISOString()};delete progress.errors[url];await save();
 }}
 await save();console.log('Batch finished; run npm run catalog:build to import recovered images.');
}catch(e){progress.blocked=String(e);await save();console.log(progress.blocked);process.exitCode=2;}
