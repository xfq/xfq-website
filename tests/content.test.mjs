import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("primary content routes exist", () => {
  for (const path of [
    "source/writing/index.md",
    "source/projects/index.md",
    "source/talks/index.md",
    "source/about/index.md",
    "source/zh/index.md"
  ]) {
    assert.equal(existsSync(path), true, `${path} should exist`);
  }
});

test("placeholder posts are intentionally unpublished", () => {
  const first = read("source/_posts/i18n-notes.md");
  const second = read("source/_posts/working-with-multilingual-technical-knowledge.md");

  assert.match(first, /^title: Internationalization Notes for the Web Platform$/m);
  assert.match(first, /^lang: en$/m);
  assert.match(first, /^published: false$/m);
  assert.match(first, /^summary: "Short notes on making Web platform work usable across languages, scripts, and cultures."$/m);
  assert.match(first, /- i18n/);
  assert.match(first, /- web-platform/);

  assert.match(second, /^title: Working With Multilingual Technical Knowledge$/m);
  assert.match(second, /^lang: en$/m);
  assert.match(second, /^published: false$/m);
  assert.match(second, /- knowledge-systems/);
});

test("projects and talks data files support data-driven pages", () => {
  const projects = read("source/_data/projects.yml");
  const talks = read("source/_data/talks.yml");

  assert.match(projects, /name: W3C Internationalization Activity/);
  assert.match(projects, /featured: true/);
  assert.match(projects, /name: Language Enablement/);
  assert.match(talks, /^# Talks are listed here when public talk metadata is available\.$/m);
});

test("English writing surfaces filter posts by language", () => {
  const homeTemplate = read("themes/fuqiao-xue/layout/index.ejs");
  const writingTemplate = read("themes/fuqiao-xue/layout/writing.ejs");

  assert.match(homeTemplate, /const isEnglishPost = post => !post\.lang \|\| post\.lang === 'en';/);
  assert.match(homeTemplate, /site\.posts\.filter\(post => isEnglishPost\(post\) && post\.featured\)\.sort\('date', -1\)/);
  assert.match(writingTemplate, /const isEnglishPost = post => !post\.lang \|\| post\.lang === 'en';/);
  assert.match(writingTemplate, /site\.posts\.filter\(isEnglishPost\)\.sort\('date', -1\)/);
});
