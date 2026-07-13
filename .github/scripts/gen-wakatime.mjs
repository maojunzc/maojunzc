// 自托管 WakaTime 开发时长卡生成器（零外部依赖，仅调用 WakaTime API）
// 生成 dist/wakatime.svg，由 snake.yml 推送到 output 分支
// API key 通过环境变量 WAKATIME_API_KEY 注入，切勿写入代码或提交
import { writeFileSync } from "node:fs";

const KEY = process.env.WAKATIME_API_KEY;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const BG = "#f4f1ea";
const INK = "#2c2a27";
const SUB = "#5c574f";
const ACCENT = "#9a8f7a";
const SERIF = "Georgia, 'Times New Roman', serif";

let totalText = "No data yet";
let avgText = "—";

if (KEY) {
  try {
    const res = await fetch(
      `https://wakatime.com/api/v1/users/current/stats?api_key=${KEY}`
    );
    const json = await res.json();
    const d = json.data || {};
    totalText = d.human_readable_total || "No data yet";
    avgText = d.human_readable_daily_average || "—";
  } catch (e) {
    console.error("WakaTime fetch failed:", e.message);
  }
} else {
  console.warn("WAKATIME_API_KEY not set, rendering placeholder");
}

const w = 360,
  h = 320;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="12" fill="${BG}" stroke="${ACCENT}" stroke-width="1" opacity="0.97"/>
  <line x1="22" y1="30" x2="58" y2="30" stroke="${ACCENT}" stroke-width="2"/>
  <text x="22" y="56" font-family="${SERIF}" font-size="19" font-style="italic" fill="${INK}">Coding Time · 7d</text>
  <text x="22" y="118" font-family="${SERIF}" font-size="15" fill="${SUB}">Total</text>
  <text x="338" y="120" text-anchor="end" font-family="${SERIF}" font-size="34" font-weight="bold" fill="${INK}">${esc(
    totalText
  )}</text>
  <text x="22" y="208" font-family="${SERIF}" font-size="15" fill="${SUB}">Daily average</text>
  <text x="338" y="210" text-anchor="end" font-family="${SERIF}" font-size="34" font-weight="bold" fill="${INK}">${esc(
    avgText
  )}</text>
  <text x="22" y="290" font-family="${SERIF}" font-size="13" fill="${ACCENT}">tracked via WakaTime</text>
</svg>`;

writeFileSync("dist/wakatime.svg", svg);
console.log("wakatime.svg generated");
