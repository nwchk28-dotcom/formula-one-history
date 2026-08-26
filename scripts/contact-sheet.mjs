import { readFile } from "node:fs/promises";
import sharp from "sharp";
const audit = JSON.parse(await readFile("THIRD_PARTY_IMAGE_AUDIT.json", "utf8"));
const size = 180, cols = 6, rows = Math.ceil(audit.length / cols);
const composites = [];
for (let i = 0; i < audit.length; i++) {
  const x = (i % cols) * size, y = Math.floor(i / cols) * size;
  const name = audit[i].name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const photo = await sharp(`public/seasons-unique/${audit[i].year}-${name}.webp`).resize(size,size).toBuffer();
  composites.push({ input: photo, left: x, top: y });
  composites.push({ input: Buffer.from(`<svg width="180" height="180"><rect y="148" width="180" height="32" fill="rgba(0,0,0,.72)"/><text x="9" y="171" fill="white" font-size="18" font-family="Arial" font-weight="700">${audit[i].year}</text></svg>`), left:x, top:y });
}
await sharp({ create:{ width:cols*size,height:rows*size,channels:3,background:"#111" } }).composite(composites).webp({quality:88}).toFile("/tmp/f1-season-contact.webp");
