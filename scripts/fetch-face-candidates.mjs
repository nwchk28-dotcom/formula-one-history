import { readFile, mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const source = await readFile("app/page.tsx", "utf8");
const seasons = [...source.matchAll(/\[(\d{4}),"([^"]+)","[^"]+"\]/g)].map((m) => ({ year:Number(m[1]), name:m[2] }));
const currentFaces = JSON.parse(await readFile("/tmp/f1-faces.json", "utf8"));
const audit = JSON.parse(await readFile("THIRD_PARTY_IMAGE_AUDIT.json", "utf8"));
const used = new Set(audit.map((item) => item.imageSource));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const blocked = /(alamy|pinterest|gettyimages|ebay|amazon|topps|tradingcard|wallpapercave|wallpapers\.com)/i;
const outDir = "/tmp/f1-face-candidates";
await mkdir(outDir, { recursive:true });

function largest(faces) {
  return [...faces].sort((a,b) => b.width*b.height-a.width*a.height)[0];
}

function needsReplacement(season) {
  const faces = currentFaces[`${season.year}-${season.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}.webp`] || [];
  const face = largest(faces);
  if (!face) return true;
  const centerX = face.x + face.width / 2;
  const otherLarge = faces.filter((item) => item !== face && item.width > face.width * 0.58).length;
  return face.width < 0.12 || centerX < 0.25 || centerX > 0.75 || otherLarge > 0;
}

async function fetchTimeout(url, options={}, timeout=14000) {
  return fetch(url, {...options, signal:AbortSignal.timeout(timeout)});
}

async function searchImages(query) {
  for (let attempt=0; attempt<5; attempt++) {
    try {
      const html = await (await fetchTimeout(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {headers:{"User-Agent":"Mozilla/5.0"}})).text();
      const vqd = html.match(/vqd=([\d-]+)/)?.[1];
      if (!vqd) throw new Error("missing token");
      const response = await fetchTimeout(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`, {headers:{"User-Agent":"Mozilla/5.0","Referer":"https://duckduckgo.com/"}});
      if (!response.ok) throw new Error(`search ${response.status}`);
      return (await response.json()).results || [];
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(2500 * (attempt + 1));
    }
  }
}

const manifest = [];
const targets = seasons.filter(needsReplacement);
for (let index=0; index<targets.length; index++) {
  const season = targets[index];
  const results = await searchImages(`${season.name} ${season.year} Formula 1 champion close up portrait podium`);
  let saved = 0;
  for (const candidate of results) {
    if (saved >= 8) break;
    if (!candidate.image || used.has(candidate.image) || blocked.test(`${candidate.image} ${candidate.url}`) || (candidate.width||0)<700 || (candidate.height||0)<500) continue;
    try {
      const response = await fetchTimeout(candidate.image, {headers:{"User-Agent":"Mozilla/5.0","Referer":candidate.url||"https://duckduckgo.com/"}});
      if (!response.ok || !(response.headers.get("content-type")||"").startsWith("image/")) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 30000) continue;
      const file = `${season.year}-${String(saved).padStart(2,"0")}.jpg`;
      await sharp(bytes).rotate().resize(1200,1200,{fit:"cover",position:sharp.strategy.attention}).jpeg({quality:88}).toFile(`${outDir}/${file}`);
      manifest.push({year:season.year,name:season.name,file,source:candidate.url,imageSource:candidate.image,title:candidate.title});
      used.add(candidate.image);
      saved++;
    } catch {}
  }
  console.log(`${index+1}/${targets.length} ${season.year}: ${saved} candidates`);
  await sleep(700);
}

await writeFile("/tmp/f1-face-candidates.json", JSON.stringify(manifest,null,2));
console.log(`Downloaded ${manifest.length} candidates for ${targets.length} seasons.`);
