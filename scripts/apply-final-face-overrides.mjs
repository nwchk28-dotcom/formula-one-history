import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const candidates = JSON.parse(await readFile("/tmp/f1-face-candidates.json", "utf8"));
const detections = JSON.parse(await readFile("/tmp/f1-candidate-faces.json", "utf8"));
const audit = JSON.parse(await readFile("THIRD_PARTY_IMAGE_AUDIT.json", "utf8"));
const choices = new Map([
  [1951, {file:"1951-03.jpg", crop:800}],
  [1959, {file:"1959-00.jpg", crop:900}],
  [1962, {file:"1962-00.jpg", crop:873}],
  [1969, {file:"1969-00.jpg", crop:650}],
  [1985, {file:"1985-00.jpg", crop:650}],
]);
const slugs = new Map([
  [1951,"juan-manuel-fangio"], [1959,"jack-brabham"], [1962,"graham-hill"],
  [1969,"jackie-stewart"], [1985,"alain-prost"],
]);

for (const [year, choice] of choices) {
  const candidate = candidates.find((item) => item.year===year && item.file===choice.file);
  const face = [...detections[choice.file]].sort((a,b) => b.width*b.height-a.width*a.height)[0];
  const centerX = (face.x+face.width/2)*1200;
  const centerTop = (1-face.y-face.height/2)*1200;
  const left = Math.round(Math.max(0,Math.min(1200-choice.crop,centerX-choice.crop/2)));
  const top = Math.round(Math.max(0,Math.min(1200-choice.crop,centerTop-choice.crop*.34)));
  const temporary = `/tmp/f1-final-${year}.webp`;
  const destination = `public/seasons-unique/${year}-${slugs.get(year)}.webp`;
  await sharp(`/tmp/f1-face-candidates/${choice.file}`).extract({left,top,width:choice.crop,height:choice.crop}).resize(1200,1200).webp({quality:88}).toFile(temporary);
  await sharp(temporary).toFile(destination);
  const index = audit.findIndex((item) => item.year===year);
  audit[index] = {...audit[index],source:candidate.source,imageSource:candidate.imageSource,title:candidate.title};
}

await writeFile("THIRD_PARTY_IMAGE_AUDIT.json",JSON.stringify(audit,null,2));
console.log("Applied 5 final face-centering overrides.");
