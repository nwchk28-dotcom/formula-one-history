import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const audit = JSON.parse(await readFile("THIRD_PARTY_IMAGE_AUDIT.json","utf8"));
const allCandidates = JSON.parse(await readFile("/tmp/f1-face-candidates.json","utf8"));
const candidates1953 = JSON.parse(await readFile("/tmp/f1-1953-candidates.json","utf8"));

const hamilton = allCandidates.find((item) => item.year===2015 && item.file==="2015-05.jpg");
await sharp("/tmp/f1-face-candidates/2015-05.jpg")
  .webp({quality:88})
  .toFile("/tmp/f1-fixed-2015.webp");
await sharp("/tmp/f1-fixed-2015.webp")
  .toFile("public/seasons-unique/2015-lewis-hamilton.webp");

const ascari = candidates1953.find((item) => item.file==="1953-04.jpg");
await sharp("/tmp/f1-1953-candidates/1953-04.jpg")
  .extract({left:164,top:0,width:800,height:800})
  .resize(1200,1200)
  .webp({quality:88})
  .toFile("/tmp/f1-fixed-1953.webp");
await sharp("/tmp/f1-fixed-1953.webp")
  .toFile("public/seasons-unique/1953-alberto-ascari.webp");

for (const [year,candidate] of [[2015,hamilton],[1953,ascari]]) {
  const index=audit.findIndex((item)=>item.year===year);
  audit[index]={...audit[index],source:candidate.source,imageSource:candidate.imageSource,title:candidate.title};
}
await writeFile("THIRD_PARTY_IMAGE_AUDIT.json",JSON.stringify(audit,null,2));
console.log("Updated 2015 and 1953 photographs.");
