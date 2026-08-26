import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const output = "out";
const pageSource = await readFile("app/page.tsx", "utf8");
const imageSource = await readFile("app/season-images.generated.ts", "utf8");
const cssSource = await readFile("app/globals.css", "utf8");

const rawSeasons = [...pageSource.matchAll(/\[(\d{4}),"([^"]+)","([^"]+)"\]/g)].map((match) => ({
  year: Number(match[1]),
  name: match[2],
  team: match[3],
}));
const imageMapText = imageSource.match(/=\s*({[\s\S]*?});/)?.[1];
if (rawSeasons.length !== 76 || !imageMapText) {
  throw new Error("Season data could not be generated for GitHub Pages.");
}
const imageMap = JSON.parse(imageMapText);
const teamColors = {
  "McLaren":"#ff8700", "Red Bull Racing":"#3157ff", "Mercedes":"#00d2be",
  "Ferrari":"#e80020", "Brawn GP":"#d8ff35", "Renault":"#ffd800",
  "Williams":"#1676ff", "Benetton":"#27b977", "Brabham":"#66b4df",
  "Lotus":"#f3c900", "Tyrrell":"#4b73d1", "Matra":"#3a64cc",
  "BRM":"#8e9b9f", "Cooper":"#265946", "Maserati":"#aab4b9",
  "Maserati · Mercedes":"#aab4b9", "Alfa Romeo":"#9d1732",
};
const seasons = rawSeasons.map((season) => ({
  ...season,
  color: teamColors[season.team] || "#ece7dc",
  image: `.${imageMap[season.year]}`,
}));
const initial = seasons[0];
const initialName = initial.name.split(" ");
const initialLast = initialName.pop();

await rm(output, { recursive:true, force:true });
await mkdir(output, { recursive:true });
await cp("public/seasons-unique", `${output}/seasons-unique`, { recursive:true });
await cp("public/favicon.svg", `${output}/favicon.svg`);

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>F1 Champions — 1950 to 2025</title>
  <meta name="description" content="Scroll backwards through the history of Formula 1 World Drivers’ Champions.">
  <link rel="icon" href="./favicon.svg">
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
<main style="--accent:${initial.color}">
  <div class="progress"><span></span></div>
  <header><a class="brand" href="#top"><i></i>CHAMPIONS</a><div class="index"><span>${initial.year}</span> / 1950</div></header>
  <div class="stage">
    <div class="year">${initial.year}</div><div class="year-rule"></div>
    <div class="team"><small>CONSTRUCTOR</small>${initial.team}</div>
    <div class="portrait-shell"><img class="portrait active" src="${initial.image}" alt="${initial.name}, ${initial.year} Formula 1 World Champion"><div class="portrait-fade"></div></div>
    <div class="champion-name"><span>${initialName.join(" ")}</span><strong>${initialLast}</strong></div>
    <div class="season-label">WORLD DRIVERS’ CHAMPION <b>01 / ${seasons.length}</b></div>
    <div class="scroll-cue"><span></span>SCROLL TO REWIND</div>
  </div>
  <div class="scroll-track" id="top">${seasons.map((season) => `<section aria-label="${season.year}年 ${season.name} ${season.team}"></section>`).join("")}</div>
  <footer>1950 <span>THE BEGINNING</span></footer>
</main>
<script>window.F1_SEASONS=${JSON.stringify(seasons).replaceAll("<","\\u003c")}</script>
<script src="./app.js"></script>
</body>
</html>`;

const script = `(() => {
  const seasons = window.F1_SEASONS;
  const main = document.querySelector("main");
  const progress = document.querySelector(".progress span");
  const indexYear = document.querySelector(".index span");
  const year = document.querySelector(".year");
  const team = document.querySelector(".team");
  const portrait = document.querySelector(".portrait");
  const championName = document.querySelector(".champion-name");
  const seasonCount = document.querySelector(".season-label b");
  let active = -1;
  function update() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const next = Math.min(seasons.length - 1, Math.max(0, Math.floor((scrollY + innerHeight * .48) / innerHeight)));
    progress.style.transform = \`scaleX(\${scrollY / Math.max(1,max)})\`;
    if (next === active) return;
    active = next;
    const season = seasons[active];
    const parts = season.name.split(" ");
    const last = parts.pop();
    main.style.setProperty("--accent", season.color);
    indexYear.textContent = season.year;
    year.textContent = season.year;
    team.innerHTML = \`<small>CONSTRUCTOR</small>\${season.team}\`;
    portrait.src = season.image;
    portrait.alt = \`\${season.name}, \${season.year} Formula 1 World Champion\`;
    championName.innerHTML = \`<span>\${parts.join(" ")}</span><strong>\${last}</strong>\`;
    seasonCount.textContent = \`\${String(active+1).padStart(2,"0")} / \${seasons.length}\`;
    for (const element of [year,team,championName]) {
      element.style.animation = "none";
      void element.offsetWidth;
      element.style.animation = "";
    }
  }
  update();
  addEventListener("scroll", update, {passive:true});
})();`;

await writeFile(`${output}/index.html`, html);
await writeFile(`${output}/404.html`, html);
await writeFile(`${output}/styles.css`, cssSource.replace('@import "tailwindcss";',''));
await writeFile(`${output}/app.js`, script);
await writeFile(`${output}/.nojekyll`, "");
console.log(`GitHub Pages output created: ${seasons.length} seasons.`);
