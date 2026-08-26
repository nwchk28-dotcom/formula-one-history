"use client";

import { useEffect, useState } from "react";
import { seasonImages } from "./season-images.generated";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

type Season = { year: number; name: string; team: string; color: string; image: string; pos: string };

const raw: [number, string, string][] = [
  [2025,"Lando Norris","McLaren"],[2024,"Max Verstappen","Red Bull Racing"],[2023,"Max Verstappen","Red Bull Racing"],[2022,"Max Verstappen","Red Bull Racing"],[2021,"Max Verstappen","Red Bull Racing"],
  [2020,"Lewis Hamilton","Mercedes"],[2019,"Lewis Hamilton","Mercedes"],[2018,"Lewis Hamilton","Mercedes"],[2017,"Lewis Hamilton","Mercedes"],[2016,"Nico Rosberg","Mercedes"],[2015,"Lewis Hamilton","Mercedes"],[2014,"Lewis Hamilton","Mercedes"],
  [2013,"Sebastian Vettel","Red Bull Racing"],[2012,"Sebastian Vettel","Red Bull Racing"],[2011,"Sebastian Vettel","Red Bull Racing"],[2010,"Sebastian Vettel","Red Bull Racing"],[2009,"Jenson Button","Brawn GP"],[2008,"Lewis Hamilton","McLaren"],[2007,"Kimi Räikkönen","Ferrari"],[2006,"Fernando Alonso","Renault"],[2005,"Fernando Alonso","Renault"],
  [2004,"Michael Schumacher","Ferrari"],[2003,"Michael Schumacher","Ferrari"],[2002,"Michael Schumacher","Ferrari"],[2001,"Michael Schumacher","Ferrari"],[2000,"Michael Schumacher","Ferrari"],[1999,"Mika Häkkinen","McLaren"],[1998,"Mika Häkkinen","McLaren"],[1997,"Jacques Villeneuve","Williams"],[1996,"Damon Hill","Williams"],[1995,"Michael Schumacher","Benetton"],[1994,"Michael Schumacher","Benetton"],[1993,"Alain Prost","Williams"],[1992,"Nigel Mansell","Williams"],[1991,"Ayrton Senna","McLaren"],[1990,"Ayrton Senna","McLaren"],
  [1989,"Alain Prost","McLaren"],[1988,"Ayrton Senna","McLaren"],[1987,"Nelson Piquet","Williams"],[1986,"Alain Prost","McLaren"],[1985,"Alain Prost","McLaren"],[1984,"Niki Lauda","McLaren"],[1983,"Nelson Piquet","Brabham"],[1982,"Keke Rosberg","Williams"],[1981,"Nelson Piquet","Brabham"],[1980,"Alan Jones","Williams"],[1979,"Jody Scheckter","Ferrari"],[1978,"Mario Andretti","Lotus"],[1977,"Niki Lauda","Ferrari"],[1976,"James Hunt","McLaren"],[1975,"Niki Lauda","Ferrari"],[1974,"Emerson Fittipaldi","McLaren"],[1973,"Jackie Stewart","Tyrrell"],[1972,"Emerson Fittipaldi","Lotus"],[1971,"Jackie Stewart","Tyrrell"],[1970,"Jochen Rindt","Lotus"],
  [1969,"Jackie Stewart","Matra"],[1968,"Graham Hill","Lotus"],[1967,"Denny Hulme","Brabham"],[1966,"Jack Brabham","Brabham"],[1965,"Jim Clark","Lotus"],[1964,"John Surtees","Ferrari"],[1963,"Jim Clark","Lotus"],[1962,"Graham Hill","BRM"],[1961,"Phil Hill","Ferrari"],[1960,"Jack Brabham","Cooper"],[1959,"Jack Brabham","Cooper"],[1958,"Mike Hawthorn","Ferrari"],[1957,"Juan Manuel Fangio","Maserati"],[1956,"Juan Manuel Fangio","Ferrari"],[1955,"Juan Manuel Fangio","Mercedes"],[1954,"Juan Manuel Fangio","Maserati · Mercedes"],[1953,"Alberto Ascari","Ferrari"],[1952,"Alberto Ascari","Ferrari"],[1951,"Juan Manuel Fangio","Alfa Romeo"],[1950,"Nino Farina","Alfa Romeo"],
];

const teamColors: Record<string,string> = { "McLaren":"#ff8700", "Red Bull Racing":"#3157ff", "Mercedes":"#00d2be", "Ferrari":"#e80020", "Brawn GP":"#d8ff35", "Renault":"#ffd800", "Williams":"#1676ff", "Benetton":"#27b977", "Brabham":"#66b4df", "Lotus":"#f3c900", "Tyrrell":"#4b73d1", "Matra":"#3a64cc", "BRM":"#8e9b9f", "Cooper":"#265946", "Maserati":"#aab4b9", "Maserati · Mercedes":"#aab4b9", "Alfa Romeo":"#9d1732" };

function portrait(name: string) {
  const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return { image: `${publicBasePath}/champions/${slug}.webp`, pos: "center center" };
}

const seasons: Season[] = raw.map(([year,name,team]) => {
  const base = portrait(name);
  const seasonImage = seasonImages[year];
  return { year,name,team,color:teamColors[team] || "#ece7dc",...base,image:seasonImage ? `${publicBasePath}${seasonImage}` : base.image };
});

export default function Home() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setProgress(scrollY / Math.max(1, max));
      setActive(Math.min(seasons.length - 1, Math.max(0, Math.floor((scrollY + innerHeight * .48) / innerHeight))));
    };
    update(); addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, []);

  const s = seasons[active];
  const parts = s.name.split(" ");
  const first = parts.slice(0,-1).join(" ");
  const last = parts.at(-1);
  return <main style={{ "--accent": s.color } as React.CSSProperties}>
    <div className="progress"><span style={{ transform:`scaleX(${progress})` }} /></div>
    <header><a className="brand" href="#top"><i />CHAMPIONS</a><div className="index"><span>{s.year}</span> / 1950</div></header>
    <div className="stage">
      <div className="year" key={s.year}>{s.year}</div>
      <div className="year-rule" />
      <div className="team" key={`t${s.year}`}><small>CONSTRUCTOR</small>{s.team}</div>
      <div className="portrait-shell">
        <img key={s.year} className="portrait active" src={s.image} alt={`${s.name}, ${s.year} Formula 1 World Champion`} />
        <div className="portrait-fade" />
      </div>
      <div className="champion-name" key={s.name + s.year}><span>{first}</span><strong>{last}</strong></div>
      <div className="season-label">WORLD DRIVERS’ CHAMPION <b>{String(active+1).padStart(2,"0")} / {seasons.length}</b></div>
      <div className="scroll-cue"><span />SCROLL TO REWIND</div>
    </div>
    <div className="scroll-track" id="top">{seasons.map(s => <section key={s.year} aria-label={`${s.year}年 ${s.name} ${s.team}`} />)}</div>
    <footer>1950 <span>THE BEGINNING</span></footer>
  </main>;
}
