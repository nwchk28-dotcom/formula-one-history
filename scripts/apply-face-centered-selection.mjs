import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const candidates = JSON.parse(await readFile("/tmp/f1-face-candidates.json", "utf8"));
const detections = JSON.parse(await readFile("/tmp/f1-candidate-faces.json", "utf8"));
const audit = JSON.parse(await readFile("THIRD_PARTY_IMAGE_AUDIT.json", "utf8"));
const keepReviewed = new Set([1997, 2018, 2020]);

const slug = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

function rankedFaces(file) {
  return [...(detections[file] || [])].sort((a,b) => b.width*b.height-a.width*a.height);
}

function score(candidate) {
  const faces = rankedFaces(candidate.file);
  const face = faces[0];
  if (!face) return -100;
  const cx = face.x + face.width/2;
  const cy = face.y + face.height/2;
  const rivals = faces.slice(1).filter((item) => item.width > face.width*0.58).length;
  const centered = Math.abs(cx-.5);
  const vertical = Math.abs(cy-.64);
  const tooSmall = Math.max(0,.16-face.width);
  const tooLarge = Math.max(0,face.width-.42);
  return face.width*5 - centered*4 - vertical*1.2 - rivals*2.5 - tooSmall*10 - tooLarge*3;
}

const selected = [];
for (const year of [...new Set(candidates.map((item) => item.year))]) {
  if (keepReviewed.has(year)) continue;
  const choice = candidates.filter((item) => item.year===year).sort((a,b) => score(b)-score(a))[0];
  const face = rankedFaces(choice.file)[0];
  if (!face || score(choice) < -.5) continue;

  const imageSize = 1200;
  const faceWidth = face.width * imageSize;
  const cropSize = Math.round(Math.min(imageSize, Math.max(650, faceWidth/.22)));
  const faceCenterX = (face.x + face.width/2) * imageSize;
  const faceCenterTop = (1 - face.y - face.height/2) * imageSize;
  const left = Math.round(Math.max(0, Math.min(imageSize-cropSize, faceCenterX-cropSize/2)));
  const top = Math.round(Math.max(0, Math.min(imageSize-cropSize, faceCenterTop-cropSize*.34)));
  const destination = `public/seasons-unique/${year}-${slug(choice.name)}.webp`;
  const temporary = `/tmp/f1-centered-${year}.webp`;
  await sharp(`/tmp/f1-face-candidates/${choice.file}`)
    .extract({left,top,width:cropSize,height:cropSize})
    .resize(1200,1200)
    .webp({quality:88})
    .toFile(temporary);
  await sharp(temporary).toFile(destination);
  selected.push({...choice,score:score(choice),faceWidth:face.width,faceCenterX:face.x+face.width/2});
  const auditIndex = audit.findIndex((item) => item.year===year);
  if (auditIndex >= 0) audit[auditIndex] = {...audit[auditIndex],source:choice.source,imageSource:choice.imageSource,title:choice.title};
}

await writeFile("THIRD_PARTY_IMAGE_AUDIT.json", JSON.stringify(audit,null,2));
await writeFile("FACE_CENTERING_SELECTION.json", JSON.stringify(selected,null,2));
console.log(`Applied ${selected.length} face-centered replacements.`);
