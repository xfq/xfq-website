import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

test("Hexo baseline files are configured for Fuqiao Xue", () => {
  assert.equal(existsSync("package.json"), true);
  assert.equal(existsSync("_config.yml"), true);
  assert.equal(existsSync("scaffolds/post.md"), true);

  const gitignore = readFileSync(".gitignore", "utf8");
  for (const entry of [
    ".superpowers/",
    ".worktrees/",
    "node_modules/",
    "public/",
    ".deploy_git/",
    "db.json",
    ".DS_Store",
    "npm-debug.log*",
  ]) {
    assert.equal(gitignore.includes(entry), true);
  }

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  assert.equal(packageJson.scripts.build, "hexo generate");
  assert.equal(packageJson.scripts.clean, "hexo clean");
  assert.equal(packageJson.scripts.server, "hexo server --port 4000");
  assert.equal(packageJson.scripts.test, "node --test tests/*.test.mjs");
  assert.equal(packageJson.dependencies.hexo, "^8.0.0");
  assert.equal(packageJson.dependencies["hexo-renderer-ejs"], "^2.0.0");
  assert.equal(packageJson.dependencies["hexo-renderer-marked"], "^7.0.1");
  assert.equal(packageJson.dependencies["hexo-server"], "^3.0.0");
  assert.equal(packageJson.hexo.version, packageLock.packages["node_modules/hexo"].version);

  const config = readFileSync("_config.yml", "utf8");
  assert.match(config, /^title: Fuqiao Xue$/m);
  assert.match(config, /^theme: fuqiao-xue$/m);
  assert.match(config, /^language: en$/m);
  assert.match(config, /^permalink: writing\/:year\/:month\/:day\/:title\/$/m);
  assert.match(config, /^timezone: Asia\/Shanghai$/m);
  assert.match(config, /^url: https:\/\/xuefuqiao\.com$/m);
  assert.match(config, /^root: \/$/m);
  assert.match(config, /^source_dir: source$/m);
  assert.match(config, /^public_dir: public$/m);
  assert.match(config, /^syntax_highlighter: highlight\.js$/m);
  assert.match(config, /^  line_number: false$/m);
  assert.match(config, /^  path: ""$/m);
  assert.match(config, /^per_page: 10$/m);
  assert.match(config, /^meta_generator: true$/m);
  assert.match(config, /^pagination_dir: page$/m);

  const scaffold = readFileSync("scaffolds/post.md", "utf8");
  assert.match(scaffold, /^title: {{ title }}$/m);
  assert.match(scaffold, /^date: {{ date }}$/m);
  assert.match(scaffold, /^summary: ""$/m);
  assert.match(scaffold, /^tags: \[\]$/m);
  assert.match(scaffold, /^lang: en$/m);
  assert.match(scaffold, /^featured: false$/m);
});
