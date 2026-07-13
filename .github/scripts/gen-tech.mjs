// 自托管技术栈徽章生成器（零外部依赖，替代 shields.io）
// 生成 dist/tech.svg，由 snake.yml 推送到 output 分支
import { writeFileSync } from "node:fs";

const items = [
  { name: "TypeScript", color: "#3178C6" },
  { name: "Python", color: "#3776AB" },
  { name: "Dart", color: "#0175C2" },
  { name: "HTML5", color: "#E34F26" },
  { name: "Flutter", color: "#02569B" },
  { name: "Netlify", color: "#00C7B7" },
];

const padX = 18;
const gap = 12;
const h = 40;
const font = 16;

// 估算每个徽章宽度
const widths = items.map((it) => it.name.length * font * 0.62 + padX * 2);
const totalW = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
let x = 0;
const tags = items
  .map((it, i) => {
    const w = widths[i];
    const rect = `<rect x="${x}" y="0" width="${w}" height="${h}" rx="8" fill="${it.color}" opacity="0.12" stroke="${it.color}" stroke-width="1.2"/>`;
    const text = `<text x="${x + w / 2}" y="${h / 2 + 5}" text-anchor="middle" font-family="Segoe UI, -apple-system, sans-serif" font-size="${font}" font-weight="600" fill="${it.color}">${it.name}</text>`;
    x += w + gap;
    return rect + text;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${h}" viewBox="0 0 ${totalW} ${h}">
${tags}
</svg>`;

writeFileSync("dist/tech.svg", svg);
console.log("tech.svg generated");
