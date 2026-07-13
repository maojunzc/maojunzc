// 自托管 WakaTime 开发时长卡生成器（零外部依赖，仅调用 WakaTime API）
// 生成 dist/wakatime.md（纯文本 Unicode 进度条，akum2 风格）
// 以及 dist/wakatime.svg（保留备用），由 snake.yml 推送到 output 分支
// API key 通过环境变量 WAKATIME_API_KEY 注入，切勿写入代码或提交
import { writeFileSync } from "node:fs";

const KEY = process.env.WAKATIME_API_KEY;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function bar(pct) {
  const f = Math.round(pct / 4);
  const e = 25 - f;
  return "█".repeat(f) + "░".repeat(e) + "  " + pct.toFixed(1) + "%";
}

const BG = "#f4f1ea";
const INK = "#2c2a27";
const SUB = "#5c574f";
const ACCENT = "#9a8f7a";
const SERIF = "Georgia, 'Times New Roman', serif";

let totalText = "No data yet";
let avgText = "—";
let editors = [];
let languages = [];
let operatingSystems = [];
let totalSeconds = 0;

if (KEY) {
  try {
    const res = await fetch(
      `https://wakatime.com/api/v1/users/current/stats/last_7_days?api_key=${KEY}`
    );
    const json = await res.json();
    const d = json.data || {};
    totalText = d.human_readable_total || "No data yet";
    avgText = d.human_readable_daily_average || "—";
    totalSeconds = d.total_seconds || 0;
    editors = (d.editors || []).map(e => ({ name: e.name, percent: e.percent }));
    languages = (d.languages || []).map(l => ({ name: l.name, percent: l.percent }));
    operatingSystems = (d.operating_systems || []).map(o => ({ name: o.name, percent: o.percent }));
  } catch (e) {
    console.error("WakaTime fetch failed:", e.message);
  }
} else {
  console.warn("WAKATIME_API_KEY not set, rendering placeholder");
}

// ---------- wakatime.md（纯文本 Unicode 进度条，akum2 风格）----------
const pad = (s, n) => String(s).padEnd(n, " ");
const row = (emoji, label, pct) =>
  `${emoji} ${pad(label, 16)} ${bar(pct)}`;

let md = "```text\n";
md += "📊 This Week I Spent My Time On\n\n";
md += `⏱️  Total Time  ${pad("", 16)} ${totalText}\n\n`;

if (languages.length > 0) {
  md += "💬 Programming Languages:\n";
  for (const l of languages) md += row("  ", l.name, l.percent) + "\n";
} else {
  md += "💬 Programming Languages:  No Activity Tracked This Week\n";
}

md += "\n";

if (editors.length > 0) {
  md += "🔥 Editors:\n";
  for (const e of editors) md += row("  ", e.name, e.percent) + "\n";
} else {
  md += "🔥 Editors:            No Activity Tracked This Week\n";
}

md += "\n";

if (operatingSystems.length > 0) {
  md += "💻 Operating System:\n";
  for (const o of operatingSystems) md += row("  ", o.name, o.percent) + "\n";
} else {
  md += "💻 Operating System:   No Activity Tracked This Week\n";
}

md += "```\n";

// ---------- wakatime.svg（保留 SVG 卡，备用）----------
const w = 360,
  h = 200;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="12" fill="${BG}" stroke="${ACCENT}" stroke-width="1" opacity="0.97"/>
  <line x1="22" y1="30" x2="58" y2="30" stroke="${ACCENT}" stroke-width="2"/>
  <text x="22" y="56" font-family="${SERIF}" font-size="19" font-style="italic" fill="${INK}">Coding Time · Last 7 Days</text>
  <text x="22" y="104" font-family="${SERIF}" font-size="14" fill="${SUB}">Total</text>
  <text x="22" y="134" font-family="${SERIF}" font-size="28" font-weight="bold" fill="${INK}">${esc(totalText)}</text>
  <text x="22" y="176" font-family="${SERIF}" font-size="14" fill="${SUB}">Daily average</text>
  <text x="338" y="134" text-anchor="end" font-family="${SERIF}" font-size="28" font-weight="bold" fill="${INK}">${esc(avgText)}</text>
</svg>`;

writeFileSync("dist/wakatime.md", md);
writeFileSync("dist/wakatime.svg", svg);
console.log("wakatime.md + wakatime.svg generated");
