import { z } from 'zod';
export const categories = ['Karosszéria', 'Világítás', 'Futómű', 'Motor és hűtés', 'Kiegészítők','Szűrők','Üvegek','Tükrök','Utastér','Elektromosság','Hajtáslánc','Üzemanyagrendszer'] as const;
const safeImage = z.string().refine(s => /^\/catalog-images\/[a-f0-9]{64}\.webp$/.test(s) || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length < 2_800_000, 'Csak helyileg tárolt PNG/JPEG/WebP kép engedélyezett.');
export const productSchema = z.object({
 id:z.string().min(1).max(100), sku:z.string().min(1).max(100), oem:z.array(z.string().max(100)).max(1000),
 name:z.string().min(1).max(300), nameHu:z.string().min(1).max(300), aliases:z.array(z.string().max(200)).max(30),
 category:z.enum(categories), generation:z.enum(['S197','S550','S650']), yearFrom:z.number().int().min(2005).max(2100), yearTo:z.number().int().min(2005).max(2100).nullable(),
 variantTags:z.array(z.string()).optional(),
 fitments:z.array(z.object({sourceModel:z.string(),generation:z.enum(['S197','S550','S650']),yearFrom:z.number(),yearTo:z.number().nullable()})).optional(),
 model:z.literal('Ford Mustang'), fitment:z.string().max(1000), brand:z.string().max(100), price:z.number().nonnegative().max(1e8).nullable(), currency:z.enum(['EUR','HUF','USD']),
 galleryCheckedAt:z.string().datetime().nullable().optional(), galleryStatus:z.enum(['pending','complete','source-empty']).optional(),
 availability:z.enum(['available','unavailable','unknown']), images:z.array(safeImage).max(100),
 url:z.string().url().refine(s=>{const u=new URL(s);return u.protocol==='https:' && ['signeda.lt','www.signeda.lt','signeda.com','www.signeda.com'].includes(u.hostname)&&!u.username&&!u.password;}),
 priceCheckedAt:z.string().datetime().nullable().optional(), detailCheckedAt:z.string().datetime().nullable().optional(), priceIncludesVat:z.number().nullable().optional(), fitmentVerified:z.boolean().optional(),
 source:z.enum(['demo','signeda']), checkedAt:z.string().datetime().nullable()
}).superRefine((p,ctx)=>{if(p.yearTo!==null&&p.yearTo<p.yearFrom)ctx.addIssue({code:'custom',message:'Hibás évjárat.'});if(/mach[\s-]*e\b/i.test([p.name,p.nameHu,p.fitment,...p.aliases].join(' ')))ctx.addIssue({code:'custom',message:'Mach-E nem importálható.'});const bounds={S197:[2005,2014],S550:[2015,2023],S650:[2024,2100]}[p.generation];if(p.yearFrom<bounds[0]||(p.yearTo??2100)>bounds[1])ctx.addIssue({code:'custom',message:'A generáció és az évjárat eltér.'});});
export type Product=z.infer<typeof productSchema>;
export const feedSchema=z.object({version:z.literal(1),products:z.array(productSchema).max(20000)}).superRefine((f,ctx)=>{if(new Set(f.products.map(p=>p.id)).size!==f.products.length)ctx.addIssue({code:'custom',message:'Ismétlődő termékazonosító.'});});
export function normalize(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
const synonyms = [
 ['lokharito','bumper','bumpers','bamperis','stossstange'],
 ['lengokar','control arm','control arms','wishbone','svirtis','querlenker'],
 ['sarvedo','fender','fenders','wing','sparnas','kotflugel'],
 ['motorhazteto','hood','bonnet','kapotas','motorhaube'],
 ['lampa','lamp','lamps','light','lights','fenyszoro','headlamp','headlight','head lamp','head light','zibintas','scheinwerfer'],
 ['huto','vizhuto','radiator','radiatorius','kuhler'],
 ['elso','front','priekinis','vorne'],['hatso','rear','back','galinis','hinten'],
 ['bal','left','lh','links','kairys'],['jobb','right','rh','rechts','desinys'],
 ['spoiler','szarny'],['tukor','mirror','spiegel','veidrodis'],
 ['hutoracs','grille','grill','groteles'],['lokharito tarto','bumper bracket'],
 ['motorburkolat','engine cover','variklio apdaila']
];
const entries=synonyms.flatMap((group,index)=>group.map(word=>({word:normalize(word),key:`syn${index}token` }))).sort((a,b)=>b.word.length-a.word.length);
// Normalize both sides, including multiword phrases, so translation works in either direction.
function canonical(text:string){let value=normalize(text);for(const {word,key} of entries)value=value.replace(new RegExp(`(^| )${word}(?= |$)`,'g'),`$1${key}`);return value;}
export function matches(p:Product,query:string){
 if(!query.trim())return true;
 const q=normalize(query);if(!q)return false;
 const compact=q.replaceAll(' ','');
 if([p.sku,...p.oem].some(code=>normalize(code).replaceAll(' ','').includes(compact)))return true;
 const hay=canonical([p.name,p.nameHu,...p.aliases,p.brand,p.fitment,p.generation].join(' '));
 return canonical(query).split(' ').every(token=>hay.includes(token));
}
