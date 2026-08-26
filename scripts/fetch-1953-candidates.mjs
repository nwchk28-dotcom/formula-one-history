import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const query = "Alberto Ascari 1953 driver photograph podium portrait -model -replica";
const headers = {"User-Agent":"Mozilla/5.0"};
const html = await (await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {headers})).text();
const vqd = html.match(/vqd=([\d-]+)/)?.[1];
if (!vqd) throw new Error("Image search token unavailable");
const response = await fetch(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`, {headers:{...headers,Referer:"https://duckduckgo.com/"}});
const results = (await response.json()).results || [];
const blocked = /(alamy|pinterest|gettyimages|ebay|amazon|topps|tradingcard|wallpaper)/i;
const folder = "/tmp/f1-1953-candidates";
await mkdir(folder,{recursive:true});
const manifest=[];

for (const candidate of results) {
  if (manifest.length>=10) break;
  if (!candidate.image || blocked.test(`${candidate.image} ${candidate.url}`) || (candidate.width||0)<700 || (candidate.height||0)<500) continue;
  try {
    const imageResponse = await fetch(candidate.image,{headers:{...headers,Referer:candidate.url||"https://duckduckgo.com/"},signal:AbortSignal.timeout(14000)});
    if (!imageResponse.ok || !(imageResponse.headers.get("content-type")||"").startsWith("image/")) continue;
    const bytes=Buffer.from(await imageResponse.arrayBuffer());
    if(bytes.length<30000)continue;
    const file=`1953-${String(manifest.length).padStart(2,"0")}.jpg`;
    await sharp(bytes).rotate().resize(1200,1200,{fit:"cover",position:sharp.strategy.attention}).jpeg({quality:88}).toFile(`${folder}/${file}`);
    manifest.push({file,source:candidate.url,imageSource:candidate.image,title:candidate.title});
  } catch {}
}

await writeFile("/tmp/f1-1953-candidates.json",JSON.stringify(manifest,null,2));
console.log(`Downloaded ${manifest.length} candidates.`);
