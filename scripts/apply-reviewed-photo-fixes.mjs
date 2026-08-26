import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const fixes = [
  [2017,"lewis-hamilton"],
  [1993,"alain-prost"],
  [1987,"nelson-piquet"],
  [1979,"jody-scheckter"],
  [1974,"emerson-fittipaldi"],
  [1969,"jackie-stewart"],
  [1966,"jack-brabham"],
  [1957,"juan-manuel-fangio"],
  [1952,"alberto-ascari"],
];
const audit = JSON.parse(await readFile("THIRD_PARTY_IMAGE_AUDIT.json","utf8"));
for(const [year,slug] of fixes){
  const item=audit.find(x=>x.year===year);
  await sharp(`public/champions/${slug}.webp`).resize(1200,1200,{fit:"cover",position:sharp.strategy.attention}).webp({quality:85}).toFile(`public/seasons-unique/${year}-${slug}.webp`);
  item.source="https://www.formula1.com/en/drivers/hall-of-fame";
  item.imageSource=`official-hall-of-fame:${slug}:${year}`;
  item.title=`Formula 1 Hall of Fame — ${item.name}`;
}
if(new Set(audit.map(x=>x.imageSource)).size!==audit.length)throw new Error("Duplicate image source remains");
await writeFile("THIRD_PARTY_IMAGE_AUDIT.json",JSON.stringify(audit,null,2));
console.log(`Applied ${fixes.length} reviewed replacements; ${audit.length} unique sources remain.`);
