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

function card(title, lines, accent = "#9a8f7a") {
  const h = 50 + lines.length * 26;
  const rows = lines
    .map(
      (l, i) =>
        `<text x="20" y="${78 + i * 26}" font-family="Georgia, serif" font-size="16" fill="#5c574f">${esc(
          l
        )}</text>`
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="${h}" viewBox="0 0 360 ${h}">
  <rect width="360" height="${h}" rx="10" fill="#f4f1ea" stroke="${accent}" stroke-width="1" opacity="0.95"/>
  <text x="20" y="38" font-family="Georgia, serif" font-size="18" font-style="italic" fill="#2c2a27">${esc(
    title
  )}</text>
  <line x1="20" y1="50" x2="340" y2="50" stroke="${accent}" stroke-width="1" opacity="0.7"/>
  ${rows}
</svg>`;
}

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

  // 语言统计
  const langMap = {};
  for (const r of repos)
    for (const l of r.languages.edges)
      langMap[l.node.name] = (langMap[l.node.name] || 0) + l.size;
  const langs = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const total = langs.reduce((s, [, v]) => s + v, 0) || 1;

  const statsSvg = card("GitHub Stats", [
    `Repositories : ${u.repositories.totalCount}`,
    `Total Stars  : ${stars}`,
    `Commits      : ${u.contributionsCollection.totalCommitContributions}`,
    `PRs          : ${u.contributionsCollection.totalPullRequestContributions}`,
    `Issues       : ${u.contributionsCollection.totalIssueContributions}`,
    `Followers    : ${u.followers.totalCount}`,
  ]);

  const langRows = langs.map(
    ([name, v]) => `${name}  ${((v / total) * 100).toFixed(1)}%`
  );
  const langsSvg = card("Top Languages", langRows);

  writeFileSync("dist/stats.svg", statsSvg);
  writeFileSync("dist/langs.svg", langsSvg);
  console.log("stats generated");
})();
