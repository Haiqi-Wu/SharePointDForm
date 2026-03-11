const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "docs", "index.html");

assert.ok(fs.existsSync(indexPath), "docs/index.html must exist");

const html = fs.readFileSync(indexPath, "utf8");

const requiredIds = ["hero", "features", "quick-start", "tech", "faq", "cta"];
for (const id of requiredIds) {
  assert.ok(html.includes(`id=\"${id}\"`), `Missing section id: ${id}`);
}

const cssPath = path.join(root, "docs", "assets", "styles.css");
const heroPath = path.join(root, "docs", "assets", "hero-placeholder.svg");

assert.ok(fs.existsSync(cssPath), "docs/assets/styles.css must exist");
assert.ok(fs.existsSync(heroPath), "docs/assets/hero-placeholder.svg must exist");

assert.ok(
  html.includes("assets/styles.css"),
  "index.html must link assets/styles.css"
);

const bilingualMarkers = ["lang-zh", "lang-en", "lang-pair"];
for (const cls of bilingualMarkers) {
  assert.ok(html.includes(cls), `Missing bilingual class: ${cls}`);
}

assert.ok(
  !html.includes("REPO_PLACEHOLDER"),
  "Replace REPO_PLACEHOLDER with the real GitHub URL"
);

console.log("gh-pages smoke test: PASS");
