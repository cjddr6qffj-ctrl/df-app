import type {Product} from './model';
export const periods=[
 {id:'2005-2009',generation:'S197',from:2005,to:2009,label:'2005–2009',image:'/vehicles/mustang-2005-2009.png'},
 {id:'2010-2014',generation:'S197',from:2010,to:2014,label:'2010–2014',image:'/vehicles/mustang-2010-2014.png'},
 {id:'2015-2017',generation:'S550',from:2015,to:2017,label:'2015–2017',image:'/vehicles/mustang-2015-2017.png'},
 {id:'2018-2023',generation:'S550',from:2018,to:2023,label:'2018–2023',image:'/vehicles/mustang-2018-2023.png'},
 {id:'2024-plus',generation:'S650',from:2024,to:2100,label:'2024+',image:'/vehicles/mustang-2024-plus.png'}
] as const;
export function periodForYear(year:number){return periods.find(p=>year>=p.from&&year<=p.to);}
export function matchesVehicle(p:Pick<Product,'generation'|'yearFrom'|'yearTo'|'fitments'>,selection:string,year:string){
 const period=periods.find(x=>x.id===selection);const generation=period?.generation??selection;
 if(year&&period&&(+year<period.from||+year>period.to))return false;
 return (p.fitments??[p]).some(f=>(!generation||f.generation===generation)&&(!period||(f.yearTo??2100)>=period.from&&f.yearFrom<=period.to)&&(!year||f.yearFrom<=+year&&(f.yearTo??2100)>=+year));
}
