import {useEffect,useState} from 'react';
import {Plus,X} from 'lucide-react';
import {read,write} from './store';
import {periods,periodForYear} from './vehicles';
export type Vehicle={id:string;gen:string;year:string;trim:string};
export function CarThumb({gen,year}:{gen:string;year?:string}){const period=periods.find(p=>p.id===gen)??(year?periodForYear(+year):undefined)??periods.find(p=>p.generation===gen)??periods[0];return <img className="car-thumb" src={period.image} alt={`Ford Mustang ${period.label} – modellillusztráció`} loading="lazy"/>;}
export function VehiclePicker({gen,year,trim,onChange,dashboard}:{gen:string;year:string;trim:string;onChange:(g:string,y:string,t:string)=>void;dashboard:boolean}){
 const [cars,setCars]=useState<Vehicle[]>([]),[error,setError]=useState('');useEffect(()=>{void read<Vehicle[]>('vehicles',[]).then(setCars).catch(()=>setError('A mentett autók nem tölthetők be.'));},[]);
 const selected=periods.find(g=>g.id===gen);const years=Array.from({length:Math.min(selected?.to??new Date().getFullYear(),new Date().getFullYear())-(selected?.from??2005)+1},(_,i)=>(selected?.from??2005)+i);
 async function add(){if(!gen||!year){setError('Válassz generációt és évjáratot az autó mentéséhez.');return;}const id=`${gen}-${year}-${trim}`;if(cars.some(c=>c.id===id))return;const next=[...cars,{id,gen,year,trim}];try{await write('vehicles',next);setCars(next);setError('');}catch{setError('Az autó mentése sikertelen.');}}
 async function remove(id:string){const next=cars.filter(c=>c.id!==id);try{await write('vehicles',next);setCars(next);}catch{setError('A módosítás mentése sikertelen.');}}
 return <section className={`vehicle-picker ${dashboard?'dashboard-picker':''}`} aria-label="Autóválasztó"><div className="section-title"><h2>{dashboard?'Melyik Mustanghoz keresel?':'Kiválasztott autó'}</h2><button onClick={()=>void add()}><Plus size={15}/>Autó mentése</button></div>
 {dashboard&&<div className="generation-cards">{periods.map(g=><button key={g.id} className={gen===g.id?'chosen':''} onClick={()=>onChange(g.id,'','')}><CarThumb gen={g.id}/><strong>Mustang {g.label}</strong><span>{g.generation}</span></button>)}</div>}
 {trim&&<small className="muted">A kivitel szerint nem besorolt tételek is látszanak. A pontos illeszkedés az OEM-szám alapján ellenőrizhető.</small>}
 {cars.length>0&&<div className="saved-cars">{cars.map(c=><div key={c.id}><button onClick={()=>onChange(periodForYear(+c.year)?.id??c.gen,c.year,c.trim)}><CarThumb gen={c.gen} year={c.year}/><span>Mustang · {c.year}<small>{c.trim||'Minden kivitel'}</small></span></button><button aria-label={`${c.gen} ${c.year} mentett autó eltávolítása`} onClick={()=>void remove(c.id)}><X size={13}/></button></div>)}</div>}{error&&<p role="status">{error}</p>}</section>;
}
