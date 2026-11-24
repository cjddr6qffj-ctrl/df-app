import {applyPrice,type PriceUpdate} from './price-sync';
import type { Product } from './model';
import { feedSchema } from './model';

export const native=!!(window as unknown as {__TAURI_INTERNALS__?:unknown}).__TAURI_INTERNALS__;
let db: import('@tauri-apps/plugin-sql').default | undefined;
export async function initStore(){if(native){const Database=(await import('@tauri-apps/plugin-sql')).default;db=await Database.load('sqlite:df-tuning.db');await db.execute('CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL)');}}
export async function read<T>(key:string,fallback:T):Promise<T>{let raw:string|undefined|null;if(db){const rows=await db.select<{value:string}[]>('SELECT value FROM state WHERE key=$1',[key]);raw=rows[0]?.value;}else raw=localStorage.getItem(`df:${key}`);return raw?JSON.parse(raw):fallback;}
export async function write(key:string,value:unknown){const raw=JSON.stringify(value);if(db)await db.execute('INSERT INTO state(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value',[key,raw]);else localStorage.setItem(`df:${key}`,raw);}
async function baseProducts(){const response=await fetch('/catalog.json',{cache:'no-store'});if(!response.ok)throw new Error('A helyi katalógus nem tölthető be.');const bundled=feedSchema.parse(await response.json()).products;const stored=await read('catalog',null);if(!stored)return bundled;const map=new Map(bundled.map(p=>[p.id,p]));for(const p of feedSchema.parse(stored).products){if(p.source!=='demo'){const current=map.get(p.id);if(!current||Date.parse(p.checkedAt??'')>Date.parse(current.checkedAt??''))map.set(p.id,p);}}return [...map.values()];}
export async function mergeProducts(incoming:Product[]){const current=await getProducts();const map=new Map(current.filter(p=>p.source!=='demo').map(p=>[p.id,p]));for(const p of incoming)map.set(p.id,p);const products=[...map.values()];await write('catalog',{version:1,products});return products;}
export async function startupSync(){if(!native)return null;const {invoke}=await import('@tauri-apps/api/core');const raw=await invoke<string|null>('read_feed');if(!raw)return null;return feedSchema.parse(JSON.parse(raw));}

export async function getProducts(){const products=await baseProducts();const updates=await read<Record<string,PriceUpdate>>('priceUpdates',{});return products.map(p=>applyPrice(p,updates[p.id]));}
