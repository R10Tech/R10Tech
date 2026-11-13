// Generates luka.svg: Luka the husky keeping watch in the snowy mountains, driven by your GitHub activity.
//  - One pine tree per day for the last 30 days. Busier days grow bigger trees.
//  - Luka sits on watch, wagging his fluffy tail. The more you committed this week, the faster it goes.
//  - No commits in the last 3 days? Luka curls up in the snow for a nap.
//
// Usage:
//   node generate.mjs --mock                       (fake data, for previewing)
//   node generate.mjs --mock --nap                 (also writes luka-nap.svg)
//   GH_TOKEN=... GH_USER=yourname node generate.mjs (real data, incl. private commits)

import { writeFileSync } from "node:fs";

// ---- Customize Luka here -------------------------------------------------
const LUKA = {
  coat: "#121419",     // black coat
  coatDark: "#08090c",
  white: "#eef1f5",    // mask, chest, legs, tail tip
  earInner: "#2b2f37",
  eyes: "#9fdcff",     // icy blue
  name: "Luka",
  pronoun: "him",
};
// ---------------------------------------------------------------------------

const W = 840, H = 240, TREE_LINE = 176, PAW = 206, DAYS = 30;

async function fetchDays() {
  if (process.argv.includes("--mock")) {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: DAYS }, (_, i) => ({
      date: `day-${i}`,
      count: rnd() < 0.25 ? 0 : Math.floor(rnd() * 14),
    }));
  }
  const { GH_TOKEN, GH_USER } = process.env;
  if (!GH_TOKEN || !GH_USER) throw new Error("Set GH_TOKEN and GH_USER (or pass --mock)");
  const query = `query($login:String!){user(login:$login){contributionsCollection{
    contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${GH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: GH_USER } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount }))
    .slice(-DAYS);
}

// Deterministic pseudo-random so the scene doesn't jump around between runs.
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

function tree(day, i, max) {
  const x = 20 + i * ((W - 40) / (DAYS - 1));
  const lvl = day.count === 0 ? 0 : Math.max(1, Math.ceil((4 * day.count) / max));
  const tip = `<title>${day.date}: ${day.count} contributions</title>`;
  if (lvl === 0) {
    // quiet day: a little snow drift
    return `<g transform="translate(${x.toFixed(1)},${TREE_LINE})">${tip}
      <ellipse cx="0" cy="0" rx="9" ry="4" fill="#e6eef7"/><ellipse cx="3" cy="-2" rx="5" ry="3" fill="#fff"/></g>`;
  }
  const h = [0, 26, 38, 50, 64][lvl];
  const w = h * 0.55;
  const tiers = 3;
  let body = `<rect x="-2.5" y="-5" width="5" height="7" fill="#5b3a24"/>`;
  for (let t = 0; t < tiers; t++) {
    const top = -h + t * (h * 0.26);
    const bottom = -4 - (tiers - 1 - t) * (h * 0.2);
    const half = (w / 2) * (0.6 + 0.2 * t);
    body += `<path d="M0 ${top.toFixed(1)} L${half.toFixed(1)} ${bottom.toFixed(1)} H${(-half).toFixed(1)}Z" fill="${t % 2 ? "#1f5e45" : "#24704f"}"/>`;
    // snow on each tier
    body += `<path d="M${(-half * 0.92).toFixed(1)} ${(bottom - 1).toFixed(1)} q${(half * 0.46).toFixed(1)} -4 ${(half * 0.92).toFixed(1)} -1 q${(half * 0.46).toFixed(1)} -3 ${(half * 0.92).toFixed(1)} 1" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
  }
  return `<g transform="translate(${x.toFixed(1)},${TREE_LINE})">${tip}${body}</g>`;
}

const sittingHusky = (x) => {
  const C = LUKA.coat, Wh = LUKA.white;
  // fluffy tail: overlapping tufts along a curve, white tip
  const tufts = [[29,-19,10],[37,-23,12],[46,-29,13],[53,-37,13],[58,-47,12],[60,-57,10],[44,-37,7],[63,-42,7],[52,-22,7],[64,-54,6]]
    .map(([cx,cy,r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C}"/>`).join("");
  // eye sits inside a dark "goggle" mask that joins the black cap
  const eye = (s) => `
      <ellipse cx="${s*12}" cy="0.5" rx="10.5" ry="8.2" fill="${C}" transform="rotate(${s*-14} ${s*12} 0.5)"/>
      <path d="M${s*18.5} 0 Q${s*11.5} -5.5 ${s*4.5} 1.5 Q${s*11.5} 5.5 ${s*18.5} 0Z" fill="${LUKA.eyes}"/>
      <circle cx="${s*11.3}" cy="0.6" r="2.1" fill="#05070a"/><circle cx="${s*12.2}" cy="-0.4" r="0.8" fill="#fff"/>`;
  const ear = (s) => `
      <path d="M${s*27} -12 L${s*25} -50 L${s*6} -25Z" fill="${C}"/>
      <path d="M${s*22} -18 L${s*21.5} -41 L${s*11} -25Z" fill="${LUKA.earInner}"/>`;
  return `
  <g transform="translate(${x},${PAW})">
    <ellipse cx="0" cy="0" rx="52" ry="6" fill="#9fb0c8" opacity=".55"/>
    <g class="tail">${tufts}
      <circle cx="60" cy="-64" r="8" fill="${Wh}"/><circle cx="55" cy="-62" r="5" fill="${Wh}"/><circle cx="65" cy="-60" r="4.5" fill="${Wh}"/></g>
    <ellipse cx="-28" cy="-13" rx="17" ry="14" fill="${C}"/>
    <ellipse cx="28" cy="-13" rx="17" ry="14" fill="${C}"/>
    <ellipse cx="-37" cy="-3" rx="9" ry="4" fill="${Wh}"/><ellipse cx="37" cy="-3" rx="9" ry="4" fill="${Wh}"/>
    <g class="breathe">
      <path d="M-24 -80 Q-36 -42 -33 -8 L33 -8 Q36 -42 24 -80Z" fill="${C}"/>
      <path d="M-15 -78 Q0 -62 15 -78 Q20 -52 12 -30 L-12 -30 Q-20 -52 -15 -78Z" fill="${Wh}"/>
      <path d="M-15 -78 l-4 6 4 1 -3 6 4 0" fill="${C}"/><path d="M15 -78 l4 6 -4 1 3 6 -4 0" fill="${C}"/>
    </g>
    <rect x="-15" y="-46" width="11" height="46" rx="5" fill="${Wh}"/>
    <rect x="4" y="-46" width="11" height="46" rx="5" fill="${Wh}"/>
    <path d="M-12 -2 v-3 M-8 -2 v-3 M8 -2 v-3 M12 -2 v-3" stroke="#aab4c2" stroke-width="1"/>
    <g class="head" transform="translate(0,-98)">
      <g class="earL">${ear(-1)}</g><g class="earR">${ear(1)}</g>
      <path d="M-30 -6 Q-27 -27 0 -29 Q27 -27 30 -6 L38 4 L31 7 L36 15 L27 18 Q22 31 0 35 Q-22 31 -27 18 L-36 15 L-31 7 L-38 4Z" fill="${C}"/>
      <path d="M-27 -1 Q-20 -10 -10 -6 L0 3 L10 -6 Q20 -10 27 -1 Q29 18 14 28 Q0 34 -14 28 Q-29 18 -27 -1Z" fill="${Wh}"/>
      <ellipse cx="-13" cy="-12" rx="5.5" ry="2.6" fill="${Wh}" transform="rotate(-10 -13 -12)"/>
      <ellipse cx="13" cy="-12" rx="5.5" ry="2.6" fill="${Wh}" transform="rotate(10 13 -12)"/>
      ${eye(-1)}${eye(1)}
      <path d="M-7 13 Q0 9.5 7 13 Q5 18.5 0 19.5 Q-5 18.5 -7 13Z" fill="#05070a"/>
      <path d="M0 19 V23.5" stroke="#05070a" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M-11 22 Q0 25.5 11 22 Q8 33 0 33.5 Q-8 33 -11 22Z" fill="#2a0d14"/>
      <path class="tongue" d="M-5 28 Q0 26.5 5 28 Q5.5 37 0 37.5 Q-5.5 37 -5 28Z" fill="#ff7a93"/>
      <path d="M0 29 V35" stroke="#e05a76" stroke-width="1" stroke-linecap="round"/>
    </g>
  </g>`;
};

const sleepingHusky = (x) => `
  <g transform="translate(${x},${PAW})">
    <ellipse cx="0" cy="-1" rx="50" ry="5" fill="#b9c7d8" opacity=".6"/>
    <g class="breathe">
      <ellipse cx="-2" cy="-14" rx="33" ry="13" fill="${LUKA.coat}"/>
      <path d="M-28 -8 Q0 2 26 -6 Q0 -4 -28 -8Z" fill="${LUKA.white}"/>
      <path d="M-30 -10 C-42 -2 -20 4 8 -2" stroke="${LUKA.coat}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M-6 -1 C2 0 8 -1 12 -3" stroke="${LUKA.white}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="24" cy="-4" rx="14" ry="4" fill="${LUKA.white}"/>
      <path d="M22 -22 L23 -35 L31 -24Z" fill="${LUKA.coatDark}"/>
      <circle cx="30" cy="-15" r="11.5" fill="${LUKA.coat}"/>
      <path d="M21 -12 Q26 -9 30 -14 Q34 -9 40 -13 L42 -6 Q32 -2 23 -6Z" fill="${LUKA.white}"/>
      <ellipse cx="41" cy="-9" rx="8" ry="5.5" fill="${LUKA.white}"/>
      <circle cx="48" cy="-11" r="2.5" fill="#22262c"/>
      <path d="M31 -17 q3 2.5 6 0" stroke="#22262c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    </g>
    <g font-family="ui-rounded, system-ui, sans-serif" font-weight="700" fill="#ffffff">
      <text class="z" x="46" y="-32" font-size="12">z</text>
      <text class="z" x="46" y="-32" font-size="15" style="animation-delay:1s">z</text>
      <text class="z" x="46" y="-32" font-size="18" style="animation-delay:2s">Z</text>
    </g>
  </g>`;

function snowflakes(n) {
  return Array.from({ length: n }, (_, k) => {
    const x = (hash(k + 1) * W).toFixed(0);
    const r = (0.8 + hash(k + 50) * 1.8).toFixed(1);
    const dur = (6 + hash(k + 99) * 8).toFixed(1);
    const delay = (-hash(k + 7) * 14).toFixed(1);
    return `<circle class="flake" style="animation-duration:${dur}s;animation-delay:${delay}s" cx="${x}" cy="-6" r="${r}" fill="#fff" opacity=".85"/>`;
  }).join("");
}

function build(days) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const week = days.slice(-7).reduce((s, d) => s + d.count, 0);
  const total = days.reduce((s, d) => s + d.count, 0);
  const napping = days.slice(-3).every((d) => d.count === 0);
  // Tail wag: busy week = fast happy wag (0.22s per swing), quiet week = slow sweep (0.7s).
  const wag = Math.max(0.22, 0.7 - week * 0.016).toFixed(2);
  const status = napping
    ? `${LUKA.name} is napping in the snow. Wake ${LUKA.pronoun} up with a commit!`
    : week >= 20 ? `${LUKA.name} is thrilled: ${week} commits this week!`
    : `${LUKA.name} is keeping watch: ${week} commits this week`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${status}">
<title>${status}</title>
<style>
  .flake{animation:fall linear infinite}
  @keyframes fall{from{translate:0 0}50%{translate:8px ${H / 2}px}to{translate:-4px ${H + 12}px}}
  .tail{transform-box:fill-box;transform-origin:0% 100%;animation:wag ${wag}s ease-in-out infinite alternate}
  @keyframes wag{from{rotate:-20deg}to{rotate:16deg}}
  .earL,.earR{transform-box:fill-box;transform-origin:50% 100%;animation:twitch 5s ease-in-out infinite}
  .earR{animation-delay:-2.3s}
  @keyframes twitch{0%,90%,100%{rotate:0deg}94%{rotate:-9deg}}
  .breathe{animation:breathe 3s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom center}
  @keyframes breathe{0%,100%{scale:1 1}50%{scale:1.02 1.06}}
  .z{opacity:0;animation:z 3s ease-out infinite}
  @keyframes z{0%{opacity:0;translate:0 0}20%{opacity:1}100%{opacity:0;translate:18px -34px}}
</style>
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a4e"/><stop offset=".65" stop-color="#4d5d94"/><stop offset="1" stop-color="#c79bc4"/></linearGradient>
  <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6e2f0"/></linearGradient>
  <radialGradient id="moonGlow"><stop offset="0" stop-color="#fff7d6" stop-opacity=".5"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="16"/></clipPath>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="${W - 90}" cy="58" r="46" fill="url(#moonGlow)"/>
  <circle cx="${W - 90}" cy="58" r="17" fill="#fff7d6"/>
  <!-- far mountains -->
  <path d="M0 150 L90 78 L150 118 L250 52 L360 130 L450 84 L560 140 L650 70 L760 128 L${W} 92 V${H} H0Z" fill="#6f7fb0"/>
  <path d="M90 78 L72 93 L84 90 L96 97 L108 88 Z M250 52 L226 72 L242 68 L254 78 L270 66 Z M450 84 L434 98 L448 95 L462 102 Z M650 70 L630 88 L646 84 L660 92 L674 82 Z" fill="#eef3fb"/>
  <!-- near hills -->
  <path d="M0 168 Q120 122 260 156 T540 150 T${W} 146 V${H} H0Z" fill="#c9d6ea"/>
  <rect y="${TREE_LINE - 4}" width="${W}" height="${H - TREE_LINE + 4}" fill="url(#snow)"/>
  ${days.map((d, i) => tree(d, i, max)).join("")}
  ${napping ? sleepingHusky(W / 2) : sittingHusky(W / 2)}
  ${snowflakes(45)}
  <text x="20" y="28" font-family="ui-rounded, system-ui, sans-serif" font-size="14" font-weight="700" fill="#ffffff">${status}</text>
  <text x="20" y="46" font-family="ui-rounded, system-ui, sans-serif" font-size="12" fill="#d7def0">${total} contributions in the last ${DAYS} days · one tree per day</text>
</g>
</svg>`;
}

const days = await fetchDays();
writeFileSync("luka.svg", build(days));
if (process.argv.includes("--nap")) {
  writeFileSync("luka-nap.svg", build(days.map((d, i) => (i >= DAYS - 3 ? { ...d, count: 0 } : d))));
}
console.log("Wrote luka.svg");
