// 自托管 WakaTime 开发时长卡生成器（零外部依赖，仅调用 WakaTime API）
// 生成 dist/wakatime.svg，由 snake.yml 推送到 output 分支
// API key 通过环境变量 WAKATIME_API_KEY 注入，切勿写入代码或提交
import { writeFileSync } from "node:fs";

const KEY = process.env.WAKATIME_API_KEY;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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

const accent = "#9a8f7a";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="156" viewBox="0 0 360 156">
  <rect width="360" height="156" rx="10" fill="#f4f1ea" stroke="${accent}" stroke-width="1" opacity="0.95"/>
  <text x="20" y="38" font-family="Georgia, serif" font-size="18" font-style="italic" fill="#2c2a27">Coding Time · 7d</text>
  <line x1="20" y1="50" x2="340" y2="50" stroke="${accent}" stroke-width="1" opacity="0.7"/>
  <text x="20" y="92" font-family="Georgia, serif" font-size="15" fill="#5c574f">Total</text>
  <text x="340" y="92" text-anchor="end" font-family="Georgia, serif" font-size="20" fill="#2c2a27">${esc(
    totalText
  )}</text>
  <text x="20" y="128" font-family="Georgia, serif" font-size="15" fill="#5c574f">Daily avg</text>
  <text x="340" y="128" text-anchor="end" font-family="Georgia, serif" font-size="20" fill="#2c2a27">${esc(
    avgText
  )}</text>
</svg>`;

writeFileSync("dist/wakatime.svg", svg);
console.log("wakatime.svg generated");
