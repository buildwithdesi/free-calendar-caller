const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REPO = "https://github.com/buildwithdesi/free-calendar-caller";
const LIVE = "https://free-calendar-caller.vercel.app";

const CLAUDE_PROMPT = `Build me the Free Calendar Caller from this open-source repo:

${REPO}

Do this in THIS clean folder only. Do not touch other projects.

Follow the README + starter/ files exactly:
1. Wire CallMeBot voice (soft-fail, check response BODY not just HTTP status)
2. Poll Google Calendar (support 1-2 Gmails with prompt=select_account)
3. Rules + optional overrides for which events ring and minutes-before
4. Idempotent call log so I never get double-called
5. GitHub Actions cron every 5 minutes (starter/.github/workflows/remind.yml)
6. Spoken times must use America/Chicago (or ask me my timezone)
7. Telegram text should include Meet link + location when present

Explain every step I (the human) must do myself: CallMeBot one-time auth, Google Cloud OAuth, GitHub Secrets, enabling Actions.

Do NOT use Supabase, Clerk, or a full Next.js app unless I ask. This is the free GitHub Actions recipe, not a Percolator/SaaS build.`;

const files = {
  "env.example": "starter/env.example",
  "callmebot.js": "starter/callmebot.js",
  "poll-calendar.js": "starter/poll-calendar.js",
  "run-once.js": "starter/run-once.js",
  "remind.yml": "starter/.github/workflows/remind.yml",
};
const bundle = {};
for (const [k, p] of Object.entries(files)) {
  bundle[k] = fs.readFileSync(path.join(ROOT, p), "utf8");
}
const safeBundle = JSON.stringify(bundle).replace(/</g, "\\u003c");

let tpl = fs.readFileSync(path.join(__dirname, "edu-template.html"), "utf8");
tpl = tpl
  .replaceAll("{{REPO}}", REPO)
  .replaceAll("{{LIVE}}", LIVE)
  .replaceAll("{{LIVE_HOST}}", LIVE.replace("https://", ""))
  .replaceAll("{{BUNDLE}}", safeBundle)
  .replaceAll("{{CLAUDE_PROMPT}}", CLAUDE_PROMPT.replace(/</g, "&lt;"));

fs.writeFileSync(path.join(ROOT, "index.html"), tpl, "utf8");

const vercel = {
  cleanUrls: true,
  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "same-origin" },
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; img-src 'self' data:; connect-src 'self'; font-src https://fonts.gstatic.com",
        },
      ],
    },
  ],
};
fs.writeFileSync(path.join(ROOT, "vercel.json"), JSON.stringify(vercel, null, 2), "utf8");
console.log("Built index.html", fs.statSync(path.join(ROOT, "index.html")).size);
