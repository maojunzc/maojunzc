// 自托管 GitHub 统计卡片生成器（零外部依赖，仅调用 GitHub API）
// 生成 dist/stats.svg 与 dist/langs.svg，由 generate-stats.yml 推送到 output 分支
import { writeFileSync, mkdirSync } from "node:fs";

const USER = process.env.GITHUB_REPOSITORY_OWNER;
const TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "profile-stats",
};

async function gh(query) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });
  return res.json();
}

const Q = `
{
  user(login: "${USER}") {
    name
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
      totalCount
      nodes {
        name
        stargazers { totalCount }
        languages(first: 10) { edges { size node { name color } } }
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
    }
    followers { totalCount }
  }
}`;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const BG = "#f4f1ea";
const INK = "#2c2a27";
const SUB = "#5c574f";
const ACCENT = "#9a8f7a";
const SERIF = "Georgia, 'Times New Roman', serif";

// 顶部装饰线 + 标题，统一卡头
function head(title, w) {
  return `
  <line x1="22" y1="30" x2="58" y2="30" stroke="${ACCENT}" stroke-width="2"/>
  <text x="22" y="56" font-family="${SERIF}" font-size="19" font-style="italic" fill="${INK}">${esc(
    title
  )}</text>`;
}

// GitHub Stats —— 2x3 大数字宫格
function statsCard(items) {
  const w = 360,
    cols = 2,
    cw = (w - 44) / cols,
    ch = 96,
    rows = Math.ceil(items.length / cols),
    h = 84 + rows * ch + 16;
  const cells = items
    .map((it, i) => {
      const cx = 22 + (i % cols) * cw;
      const cy = 84 + Math.floor(i / cols) * ch;
      return `
    <text x="${cx + 12}" y="${cy + 34}" font-family="${SERIF}" font-size="15" fill="${SUB}">${esc(
        it.label
      )}</text>
    <text x="${cx + 12}" y="${cy + 70}" font-family="${SERIF}" font-size="34" font-weight="bold" fill="${INK}">${esc(
        it.value
      )}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="12" fill="${BG}" stroke="${ACCENT}" stroke-width="1" opacity="0.97"/>
  ${head("GitHub Stats", w)}
  ${cells}
</svg>`;
}

// Top Languages —— 横向占比条
function langsCard(langs, total) {
  const w = 360,
    h = 320;
  const top = 84,
    rowH = 38,
    barX = 110,
    barW = 220,
    maxRows = langs.length;
  const rows = langs
    .map(([name, v], i) => {
      const y = top + i * rowH;
      const pct = ((v / total) * 100).toFixed(1);
      const fillW = (Math.max(v / total, 0.001) * barW).toFixed(1);
      const color = langColors[name] || "#b0a890";
      return `
    <text x="22" y="${y + 18}" font-family="${SERIF}" font-size="14" fill="${SUB}">${esc(
        name
      )}</text>
    <rect x="${barX}" y="${y + 4}" width="${barW}" height="16" rx="8" fill="#e3ded2"/>
    <rect x="${barX}" y="${y + 4}" width="${fillW}" height="16" rx="8" fill="${color}"/>
    <text x="${barX + barW}" y="${y + 18}" text-anchor="end" font-family="${SERIF}" font-size="14" fill="${INK}">${pct}%</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="12" fill="${BG}" stroke="${ACCENT}" stroke-width="1" opacity="0.97"/>
  ${head("Top Languages", w)}
  ${rows}
</svg>`;
}

// 语言默认色（GitHub 语言调色板子集，缺失时回退）
const langColors = {
  TypeScript: "#3178C6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  C: "#555555",
  "C++": "#f34b7d",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Ruby: "#701516",
  Vue: "#41b883",
  "C#": "#178600",
};

(async () => {
  mkdirSync("dist", { recursive: true });
  const res = await gh(Q);
  if (res.errors) {
    console.error("GraphQL errors:", JSON.stringify(res.errors));
    process.exit(1);
  }
  const data = res.data;
  const u = data.user;
  const repos = u.repositories.nodes;
  const stars = repos.reduce((s, r) => s + r.stargazers.totalCount, 0);
  const cc = u.contributionsCollection;

  // 语言统计
  const langMap = {};
  for (const r of repos)
    for (const l of r.languages.edges)
      langMap[l.node.name] = (langMap[l.node.name] || 0) + l.size;
  const langs = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const total = langs.reduce((s, [, v]) => s + v, 0) || 1;

  const statsSvg = statsCard([
    { label: "Repositories", value: u.repositories.totalCount },
    { label: "Total Stars", value: stars },
    { label: "Commits", value: cc.totalCommitContributions },
    { label: "Pull Requests", value: cc.totalPullRequestContributions },
    { label: "Issues", value: cc.totalIssueContributions },
    { label: "Followers", value: u.followers.totalCount },
  ]);

  const langsSvg = langsCard(langs, total);

  writeFileSync("dist/stats.svg", statsSvg);
  writeFileSync("dist/langs.svg", langsSvg);
  console.log("stats generated");
})();
