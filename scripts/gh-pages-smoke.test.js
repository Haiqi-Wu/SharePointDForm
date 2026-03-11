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

console.log("gh-pages smoke test: PASS");
