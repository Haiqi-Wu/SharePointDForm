# GitHub Pages (Single-Page) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a professional, Fluent-style bilingual (ZH/EN) single-page GitHub Pages site in `/docs` that introduces the project clearly for SharePoint developers.

**Architecture:** Pure static HTML/CSS with a minimal, deterministic “smoke test” Node script to validate required sections/assets. No build pipeline.

**Tech Stack:** HTML, CSS, tiny Node script (no deps).

---

### Task 1: Add a baseline smoke test for the page skeleton

**Files:**
- Create: `/Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`
- Modify: `/Users/amos/dev/Docker/SharePointDForm/package.json`

**Step 1: Write the failing test**

```js
// /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "docs", "index.html");

assert.ok(fs.existsSync(indexPath), "docs/index.html must exist");

const html = fs.readFileSync(indexPath, "utf8");

const requiredIds = ["hero", "features", "quick-start", "tech", "faq", "cta"]; // core sections
for (const id of requiredIds) {
  assert.ok(html.includes(`id=\"${id}\"`), `Missing section id: ${id}`);
}

console.log("gh-pages smoke test: PASS");
```

Update scripts:

```json
// /Users/amos/dev/Docker/SharePointDForm/package.json (scripts)
"scripts": {
  "build": "heft test --clean --production && heft package-solution --production",
  "start": "heft start --clean",
  "clean": "heft clean",
  "eject-webpack": "heft eject-webpack",
  "test:config-io": "ts-node --project scripts/tsconfig.test.json scripts/config-io.test.ts",
  "test:gh-pages": "node scripts/gh-pages-smoke.test.js"
}
```

**Step 2: Run test to verify it fails**

Run: `node /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`
Expected: FAIL with “docs/index.html must exist”.

**Step 3: Write minimal implementation to satisfy the test**

```html
<!-- /Users/amos/dev/Docker/SharePointDForm/docs/index.html -->
<!doctype html>
<html lang="zh-Hans">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SharePoint Dynamic Form (SPFx 1.22)</title>
  </head>
  <body>
    <main>
      <section id="hero"></section>
      <section id="features"></section>
      <section id="quick-start"></section>
      <section id="tech"></section>
      <section id="faq"></section>
      <section id="cta"></section>
    </main>
  </body>
</html>
```

**Step 4: Run test to verify it passes**

Run: `node /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js /Users/amos/dev/Docker/SharePointDForm/package.json /Users/amos/dev/Docker/SharePointDForm/docs/index.html
git commit -m "test: add gh-pages smoke test and skeleton page"
```

---

### Task 2: Add Fluent-style layout, CSS, and placeholder artwork

**Files:**
- Create: `/Users/amos/dev/Docker/SharePointDForm/docs/assets/styles.css`
- Create: `/Users/amos/dev/Docker/SharePointDForm/docs/assets/hero-placeholder.svg`
- Modify: `/Users/amos/dev/Docker/SharePointDForm/docs/index.html`
- Modify: `/Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`

**Step 1: Extend the test to require CSS and the hero placeholder**

```js
// /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js (append after requiredIds check)
const cssPath = path.join(root, "docs", "assets", "styles.css");
const heroPath = path.join(root, "docs", "assets", "hero-placeholder.svg");

assert.ok(fs.existsSync(cssPath), "docs/assets/styles.css must exist");
assert.ok(fs.existsSync(heroPath), "docs/assets/hero-placeholder.svg must exist");

assert.ok(
  html.includes("assets/styles.css"),
  "index.html must link assets/styles.css"
);
```

**Step 2: Run test to verify it fails**

Run: `node /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`
Expected: FAIL with missing CSS/hero.

**Step 3: Add CSS + placeholder artwork and wire into HTML**

```html
<!-- /Users/amos/dev/Docker/SharePointDForm/docs/index.html (head + hero block) -->
<link rel="stylesheet" href="assets/styles.css" />

<section id="hero" class="section hero">
  <div class="container hero-grid">
    <div class="hero-copy">
      <h1>SharePoint 动态表单引擎（SPFx 1.22）</h1>
      <p class="sub">SharePoint Dynamic Form Engine (SPFx 1.22)</p>
      <p class="lead">面向 SharePoint 列表的可视化表单设计器与运行时渲染器。</p>
      <p class="lead en">A visual form designer and runtime renderer for SharePoint lists.</p>
      <div class="actions">
        <a class="btn primary" href="#quick-start">Get Started</a>
        <a class="btn ghost" href="https://github.com/REPO_PLACEHOLDER">View on GitHub</a>
      </div>
    </div>
    <div class="hero-art">
      <img src="assets/hero-placeholder.svg" alt="Form builder preview" />
    </div>
  </div>
</section>
```

```css
/* /Users/amos/dev/Docker/SharePointDForm/docs/assets/styles.css */
:root {
  --bg: #f7f9fb;
  --text: #1f2933;
  --muted: #5b6770;
  --primary: #0f4c81;
  --card: #ffffff;
  --border: #e5e9ef;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
  color: var(--text);
  background: radial-gradient(1200px 600px at 20% -10%, #eef4fb, var(--bg));
}

.section { padding: 64px 0; }
.container { width: min(1120px, 92vw); margin: 0 auto; }
.hero-grid { display: grid; gap: 32px; grid-template-columns: 1.2fr 0.8fr; align-items: center; }

h1 { font-size: 40px; margin: 0 0 8px; }
.sub { margin: 0 0 12px; color: var(--muted); }
.lead { font-size: 16px; margin: 0 0 8px; }
.lead.en { font-size: 14px; color: var(--muted); }

.actions { display: flex; gap: 12px; margin-top: 16px; }
.btn { display: inline-block; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; }
.btn.primary { background: var(--primary); color: #fff; }
.btn.ghost { border: 1px solid var(--border); color: var(--text); background: #fff; }

.hero-art img { width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border); background: #fff; }

@media (max-width: 900px) {
  .hero-grid { grid-template-columns: 1fr; }
}
```

```svg
<!-- /Users/amos/dev/Docker/SharePointDForm/docs/assets/hero-placeholder.svg -->
<svg width="720" height="420" viewBox="0 0 720 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="680" height="380" rx="16" fill="#F8FAFC" stroke="#D9E2EC" />
  <rect x="60" y="70" width="280" height="24" rx="6" fill="#E2E8F0" />
  <rect x="60" y="110" width="420" height="14" rx="6" fill="#E2E8F0" />
  <rect x="60" y="150" width="520" height="14" rx="6" fill="#E2E8F0" />
  <rect x="60" y="200" width="240" height="24" rx="6" fill="#CFE1F7" />
  <rect x="320" y="200" width="240" height="24" rx="6" fill="#DCE7F5" />
  <rect x="60" y="250" width="520" height="90" rx="10" fill="#F1F5F9" stroke="#E2E8F0" />
</svg>
```

**Step 4: Run test to verify it passes**

Run: `node /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add /Users/amos/dev/Docker/SharePointDForm/docs/index.html /Users/amos/dev/Docker/SharePointDForm/docs/assets/styles.css /Users/amos/dev/Docker/SharePointDForm/docs/assets/hero-placeholder.svg /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js
git commit -m "feat: add gh-pages base styles and hero placeholder"
```

---

### Task 3: Fill in bilingual content blocks for all sections

**Files:**
- Modify: `/Users/amos/dev/Docker/SharePointDForm/docs/index.html`
- Modify: `/Users/amos/dev/Docker/SharePointDForm/docs/assets/styles.css`
- Modify: `/Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`

**Step 1: Extend the test to require bilingual blocks**

```js
// /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js (append)
const bilingualMarkers = ["lang-zh", "lang-en", "lang-pair"];
for (const cls of bilingualMarkers) {
  assert.ok(html.includes(cls), `Missing bilingual class: ${cls}`);
}
```

**Step 2: Run test to verify it fails**

Run: `node /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`
Expected: FAIL with missing bilingual class.

**Step 3: Populate content + bilingual layout**

```html
<!-- /Users/amos/dev/Docker/SharePointDForm/docs/index.html (features/quick-start/tech/faq/cta) -->
<section id="features" class="section">
  <div class="container">
    <div class="lang-pair">
      <div class="lang-zh">
        <h2>核心特性</h2>
      </div>
      <div class="lang-en">
        <h2>Key Features</h2>
      </div>
    </div>
    <div class="card-grid">
      <div class="card">
        <h3>可视化设计器</h3>
        <p class="en">Visual Designer</p>
      </div>
      <div class="card">
        <h3>条件显示与验证</h3>
        <p class="en">Conditional Rules & Validation</p>
      </div>
      <div class="card">
        <h3>多种字段类型</h3>
        <p class="en">Rich Field Types</p>
      </div>
      <div class="card">
        <h3>SharePoint 列表集成</h3>
        <p class="en">SharePoint List Integration</p>
      </div>
    </div>
  </div>
</section>

<section id="quick-start" class="section alt">
  <div class="container">
    <div class="lang-pair">
      <div class="lang-zh"><h2>快速开始</h2></div>
      <div class="lang-en"><h2>Quick Start</h2></div>
    </div>
    <ol class="steps">
      <li><span>1</span><div>安装依赖 <code>npm install</code><p class="en">Install dependencies</p></div></li>
      <li><span>2</span><div>启动开发 <code>heft start</code><p class="en">Start local dev</p></div></li>
      <li><span>3</span><div>将 Web Part 添加到页面<p class="en">Add the web part to a page</p></div></li>
      <li><span>4</span><div>选择列表并进入设计模式<p class="en">Pick a list and enter designer mode</p></div></li>
    </ol>
  </div>
</section>

<section id="tech" class="section">
  <div class="container">
    <div class="lang-pair">
      <div class="lang-zh"><h2>技术栈 / 兼容性</h2></div>
      <div class="lang-en"><h2>Tech Stack / Compatibility</h2></div>
    </div>
    <div class="tag-row">
      <span class="tag">SPFx 1.22</span>
      <span class="tag">React 17</span>
      <span class="tag">Fluent UI 8</span>
      <span class="tag">TypeScript 5.3</span>
      <span class="tag">Heft</span>
    </div>
  </div>
</section>

<section id="faq" class="section alt">
  <div class="container">
    <div class="lang-pair">
      <div class="lang-zh"><h2>FAQ</h2></div>
      <div class="lang-en"><h2>FAQ</h2></div>
    </div>
    <div class="faq">
      <div>
        <h4>设计器如何工作？</h4>
        <p class="en">How does the designer work?</p>
      </div>
      <div>
        <h4>是否支持附件与复杂字段？</h4>
        <p class="en">Does it support attachments and advanced fields?</p>
      </div>
      <div>
        <h4>PnP 控件样式异常怎么办？</h4>
        <p class="en">How to handle PnP control style issues?</p>
      </div>
    </div>
  </div>
</section>

<section id="cta" class="section">
  <div class="container cta">
    <div>
      <h2>开始使用</h2>
      <p class="en">Get started with the repo and docs.</p>
    </div>
    <div class="actions">
      <a class="btn primary" href="https://github.com/REPO_PLACEHOLDER">GitHub Repo</a>
      <a class="btn ghost" href="docs/DESIGN_SPEC.md">Design Spec</a>
      <a class="btn ghost" href="https://github.com/REPO_PLACEHOLDER/issues">Issues</a>
    </div>
  </div>
</section>
```

```css
/* /Users/amos/dev/Docker/SharePointDForm/docs/assets/styles.css (append) */
.lang-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
.lang-en h2 { font-weight: 500; color: var(--muted); }

.card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.card {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}
.card .en { color: var(--muted); margin: 6px 0 0; font-size: 14px; }

.section.alt { background: #f2f6fb; }

.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.steps li { display: grid; grid-template-columns: 32px 1fr; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; background: #fff; }
.steps li span { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; background: #e6effa; color: var(--primary); font-weight: 700; }
.steps .en { color: var(--muted); font-size: 13px; margin: 6px 0 0; }

.tag-row { display: flex; flex-wrap: wrap; gap: 10px; }
.tag { padding: 6px 10px; border-radius: 999px; background: #eaf2fb; color: #1f3b57; font-size: 13px; }

.faq { display: grid; gap: 14px; }
.faq .en { color: var(--muted); font-size: 13px; margin: 6px 0 0; }

.cta { display: flex; align-items: center; justify-content: space-between; gap: 16px; }

@media (max-width: 900px) {
  .lang-pair { grid-template-columns: 1fr; }
  .card-grid { grid-template-columns: 1fr 1fr; }
  .cta { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 640px) {
  .card-grid { grid-template-columns: 1fr; }
}
```

**Step 4: Run test to verify it passes**

Run: `node /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add /Users/amos/dev/Docker/SharePointDForm/docs/index.html /Users/amos/dev/Docker/SharePointDForm/docs/assets/styles.css /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js
git commit -m "feat: add bilingual content sections"
```

---

### Task 4: Replace repo placeholders and add GitHub Pages notes

**Files:**
- Modify: `/Users/amos/dev/Docker/SharePointDForm/docs/index.html`
- Modify (optional): `/Users/amos/dev/Docker/SharePointDForm/README.md`
- Modify: `/Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`

**Step 1: Extend the test to require real repo URLs**

```js
// /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js (append)
assert.ok(!html.includes("REPO_PLACEHOLDER"), "Replace REPO_PLACEHOLDER with the real GitHub URL");
```

**Step 2: Run test to verify it fails**

Run: `node /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`
Expected: FAIL until URLs are replaced.

**Step 3: Replace placeholder URLs**

- Determine repo URL: `git -C /Users/amos/dev/Docker/SharePointDForm remote get-url origin`
- Update all CTA links with the real URL, e.g.

```html
<a class="btn primary" href="https://github.com/<org>/<repo>">GitHub Repo</a>
<a class="btn ghost" href="https://github.com/<org>/<repo>/blob/main/docs/DESIGN_SPEC.md">Design Spec</a>
<a class="btn ghost" href="https://github.com/<org>/<repo>/issues">Issues</a>
```

(Optional) Add a short GitHub Pages note to `/Users/amos/dev/Docker/SharePointDForm/README.md`:
- Mention Pages is served from `/docs` and link to the site.

**Step 4: Run test to verify it passes**

Run: `node /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add /Users/amos/dev/Docker/SharePointDForm/docs/index.html /Users/amos/dev/Docker/SharePointDForm/scripts/gh-pages-smoke.test.js /Users/amos/dev/Docker/SharePointDForm/README.md
git commit -m "chore: finalize gh-pages links"
```

---

## Manual Verification
- Open `/Users/amos/dev/Docker/SharePointDForm/docs/index.html` in a browser.
- Confirm bilingual layout readability on desktop and mobile widths.
- Confirm CTA buttons and anchor links work.

## Deployment Note (GitHub Pages)
- In repo settings, set Pages source to `/docs` on `main` branch.

---

Plan complete and saved to `/Users/amos/dev/Docker/SharePointDForm/docs/plans/2026-03-11-github-pages-implementation-plan.md`.
Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
