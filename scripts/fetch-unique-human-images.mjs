import { readFile, writeFile } from "node:fs/promises";

const source = await readFile("app/page.tsx", "utf8");
const seasons = [...source.matchAll(/\[(\d{4}),"([^"]+)","[^"]+"\]/g)].map((m) => ({ year:Number(m[1]), name:m[2] }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const used = new Set();
const results = [];
const bad = /(integralhelm|halbschale|jethelm|helmet|stamp|museum|model|replica|statue|memorial|grave|car\b|cars\b|fw\d|mp4|f1-\d|exits|testing|tests|on screen)/i;
const human = /(podium|portrait|celebrat|champion|driver|interview|paddock|press|grid|with trophy|wins|winner)/i;

async function request(query) {
  const p = new URLSearchParams({action:"query",generator:"search",gsrsearch:query,gsrnamespace:"6",gsrlimit:"20",prop:"imageinfo",iiprop:"url|size|mime",iiurlwidth:"1600",format:"json",origin:"*"});
  for(let n=0;n<6;n++){
    const res=await fetch(`https://commons.wikimedia.org/w/api.php?${p}`,{headers:{"User-Agent":"F1ChampionsHistoryPrototype/1.0"}});
    if(res.ok)return Object.values((await res.json()).query?.pages||{});
    await sleep(5000*(n+1));
  }
  return [];
}

for(let i=0;i<seasons.length;i++){
  const s=seasons[i];
  let pages=[];
  for(const suffix of ["podium portrait", "driver paddock", "celebrating"]){
    pages.push(...await request(`${s.name} ${s.year} ${suffix}`));
    await sleep(1100);
  }
  const surname=s.name.split(" ").at(-1).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const candidates=pages.map(p=>({p,info:p.imageinfo?.[0]})).filter(x=>x.info?.thumburl&&!used.has(x.p.title)&&!bad.test(x.p.title)&&x.p.title.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(surname)).map(x=>{
    let score=0; const t=x.p.title;
    if(t.includes(String(s.year)))score+=12;if(human.test(t))score+=8;if((x.info.width||0)>800)score+=2;score-=(x.p.index||10)*.05;
    return {...x,score};
  }).sort((a,b)=>b.score-a.score);
  const pick=candidates[0];
  if(pick){used.add(pick.p.title);results.push({...s,file:pick.info.thumburl,source:pick.info.descriptionurl,title:pick.p.title,score:pick.score});}
  else results.push({...s,missing:true});
  console.log(`${i+1}/${seasons.length} ${s.year} ${pick?.p.title||"MISSING"}`);
  await sleep(1200);
}
await writeFile("UNIQUE_SEASON_CANDIDATES.json",JSON.stringify(results,null,2));
console.log(`Complete: ${results.filter(x=>x.file).length} unique, ${results.filter(x=>x.missing).length} missing`);
