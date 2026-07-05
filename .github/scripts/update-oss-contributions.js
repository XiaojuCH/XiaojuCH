const fs = require("fs");
const path = require("path");

const README_PATH = path.join(process.cwd(), "README.md");
const START_MARKER = "<!-- OSS_CONTRIBUTIONS:START -->";
const END_MARKER = "<!-- OSS_CONTRIBUTIONS:END -->";

const contributions = [
  {
    repo: "mem0ai/mem0",
    pr: 5524,
    scope: "Preserve empty Azure AI Search update values",
    highlight: true,
  },
  {
    repo: "ComposioHQ/composio",
    pr: 3563,
    scope: "Bound Python file transfer requests with timeouts",
    highlight: true,
  },
  {
    repo: "assafelovic/gpt-researcher",
    pr: 1802,
    scope: "Keep oversized deep-research context from collapsing to empty",
    highlight: true,
  },
  {
    repo: "Yuan1z0825/nature-skills",
    pr: 68,
    scope: "Add direct Claude Code plugin install path",
  },
  {
    repo: "wanshuiyin/Auto-claude-code-research-in-sleep",
    pr: 291,
    scope: "Improve Codex MCP large payload handling",
  },
  {
    repo: "vllm-project/vllm",
    pr: 45494,
    scope: "Clarify NIXL KV transfer stats semantics",
  },
  {
    repo: "lobehub/lobehub",
    pr: 15820,
    scope: "Infer custom embedding model types",
  },
  {
    repo: "Fission-AI/OpenSpec",
    pr: 1186,
    scope: "Support workspace planning homes and nested delta specs",
  },
];

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "XiaojuCH-profile-readme",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (token) {
  headers.Authorization = `Bearer ${token}`;
}

async function githubJson(endpoint) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${endpoint} failed: ${response.status} ${body}`);
  }
  return response.json();
}

function formatStars(count) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

async function getPrStatus(repo, prNumber, pr) {
  if (pr.merged_at) {
    return "Merged";
  }
  if (pr.state !== "open") {
    return "Closed";
  }

  const reviews = await githubJson(`/repos/${repo}/pulls/${prNumber}/reviews`);
  const hasApproval = reviews.some((review) => review.state === "APPROVED");
  return hasApproval ? "Approved" : "In review";
}

function badgeUrl(item) {
  const params = new URLSearchParams({
    label: item.status,
    message: `${item.repo} \u2b50 ${item.stars}`,
    color: item.status === "Merged" ? "2ea44f" : "6f42c1",
    style: "for-the-badge",
    logo: "github",
  });
  return `https://img.shields.io/static/v1?${params.toString()}`;
}

function render(items) {
  const highlighted = items.filter((item) => item.highlight);
  const badges = highlighted
    .map(
      (item) =>
        `  <a href="${item.prUrl}"><img alt="${item.repo} ${item.status} PR" src="${badgeUrl(item)}" /></a>`,
    )
    .join("\n");

  const rows = items
    .map(
      (item) =>
        `| ${item.status} | \`${item.repo}\` (${item.stars} stars) | [#${item.pr}](${item.prUrl}) | ${item.scope} |`,
    )
    .join("\n");

  return [
    START_MARKER,
    "",
    '<p align="center">',
    badges,
    "</p>",
    "",
    "| Status | Project | PR | Scope |",
    "| --- | --- | --- | --- |",
    rows,
    "",
    END_MARKER,
  ].join("\n");
}

async function main() {
  const items = [];

  for (const contribution of contributions) {
    const [repoInfo, prInfo] = await Promise.all([
      githubJson(`/repos/${contribution.repo}`),
      githubJson(`/repos/${contribution.repo}/pulls/${contribution.pr}`),
    ]);

    const status = await getPrStatus(
      contribution.repo,
      contribution.pr,
      prInfo,
    );

    items.push({
      ...contribution,
      status,
      stars: formatStars(repoInfo.stargazers_count),
      prUrl: prInfo.html_url,
    });
  }

  const readme = fs.readFileSync(README_PATH, "utf8");
  const start = readme.indexOf(START_MARKER);
  const end = readme.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end < start) {
    throw new Error("README contribution markers were not found.");
  }

  const before = readme.slice(0, start);
  const after = readme.slice(end + END_MARKER.length);
  fs.writeFileSync(README_PATH, `${before}${render(items)}${after}`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
