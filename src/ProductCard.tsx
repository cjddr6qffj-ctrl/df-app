import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Heart,ImageOff} from 'lucide-react';
import type {Product} from './model';
import {convertHuf,formatHuf,type Fx} from './fx';
export function CatalogImage({p,index=0}:{p:Product;index?:number}){const [failed,setFailed]=useState(false);const src=p.images[index];useEffect(()=>setFailed(false),[src]);return src&&!failed?<img src={src} alt={p.nameHu} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:<div className="missing-photo"><ImageOff size={32}/><span>{src?'A kép nem tölthető be':'Termékfotó még nincs letöltve'}</span></div>;}
export function ProductCard({p,fx,saved,onFavorite,onOpen}:{p:Product;fx:Fx|null;saved:boolean;onFavorite:()=>void;onOpen:()=>void}){
 const [active,setActive]=useState(false),[index,setIndex]=useState(0),[paused,setPaused]=useState(false);const wheelAt=useRef(0);
 useEffect(()=>{if(!active||paused||p.images.length<2||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const t=setInterval(()=>setIndex(i=>(i+1)%p.images.length),2000);return()=>clearInterval(t);},[active,paused,p.images.length]);
 const move=(delta:number)=>{setPaused(true);setIndex(i=>(i+delta+p.images.length)%p.images.length);};const huf=convertHuf(p.price,p.currency,fx);
 return <article className={`product ${active?'preview-active':''}`} onMouseEnter={()=>{setActive(true);setPaused(false);}} onMouseLeave={()=>{setActive(false);setIndex(0);}} onFocus={()=>setActive(true)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget)){setActive(false);setIndex(0);}}}>
 <div className="product-image" onWheel={e=>{if(p.images.length>1&&Math.abs(e.deltaX)>Math.abs(e.deltaY)&&Date.now()-wheelAt.current>250){move(e.deltaX>0?1:-1);wheelAt.current=Date.now();}}}>
 <button className="image-open" aria-label={`${p.nameHu} megnyitása`} onClick={onOpen}><CatalogImage p={p} index={index}/></button>
 <span className="generation">{p.generation}</span><button className={`heart ${saved?'saved':''}`} aria-label={saved?'Eltávolítás a kedvencekből':'Mentés a kedvencekhez'} aria-pressed={saved} onClick={onFavorite}><Heart size={17}/></button>
 <span className={`huf-corner ${huf===null?'unpriced':''}`} title={fx?`Árfolyam: ${fx.date} · 1 EUR = ${fx.rate} HUF · becsült ár`:'Még nincs használható ár vagy árfolyam'}>{huf!==null?`≈ ${formatHuf(huf)}`:p.price===null?'Ár feldolgozás alatt':'Árfolyamra vár'}</span>
 {p.images.length>1&&<div className="preview-controls"><button aria-label={`${p.sku} előző képe`} onClick={()=>move(-1)}><ChevronLeft size={15}/></button><span>{index+1}/{p.images.length}</span><button aria-label={`${p.sku} következő képe`} onClick={()=>move(1)}><ChevronRight size={15}/></button></div>}
 </div><div className="product-body"><div className="product-meta">{p.brand}<span>{p.yearFrom}–{p.yearTo??''}</span></div><button className="product-name" onClick={onOpen}>{p.nameHu}</button><p className="sku">{p.sku}</p>{p.oem.length>0&&<p className="oem">OEM: {p.oem.slice(0,3).join(' · ')}{p.oem.length>3?` +${p.oem.length-3}`:''}</p>}<div className="product-bottom"><strong>{p.price===null?'Ár még nincs betöltve':new Intl.NumberFormat('hu-HU',{style:'currency',currency:p.currency}).format(p.price)}</strong></div>{p.priceCheckedAt&&<small className="price-date">Ár ellenőrizve: {new Date(p.priceCheckedAt).toLocaleDateString('hu-HU')}</small>}</div></article>;
}
