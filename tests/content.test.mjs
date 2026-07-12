import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { test } from "node:test";
import frontMatter from "hexo-front-matter";
import yaml from "js-yaml";

const read = (path) => readFileSync(path, "utf8");
const parseMarkdown = (path) => frontMatter.parse(read(path));
const postFiles = () => readdirSync("source/_posts")
  .filter(file => file.endsWith(".md"))
  .sort()
  .map(file => join("source/_posts", file));

const assertNonEmptyString = (value, message) => {
  assert.equal(typeof value, "string", message);
  assert.notEqual(value.trim(), "", message);
};

test("primary content routes exist", () => {
  for (const path of [
    "source/writing/index.md",
    "source/projects/index.md",
    "source/talks/index.md",
    "source/about/index.md",
    "source/zh-Hans/index.md",
    "source/zh-Hans/writing/index.md"
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

test('"The Work That Remains Human" article is published', () => {
  const article = read("source/_posts/the-work-that-remains-human.md");

  assert.match(article, /^title: The Work That Remains Human$/m);
  assert.match(article, /^lang: en$/m);
  assert.match(article, /^published: true$/m);
  assert.match(article, /- ai/);
});

test("LLM article is published", () => {
  const article = read("source/_posts/llm-or-not.md");

  assert.match(article, /^title: 什么项目适合用大模型？$/m);
  assert.match(article, /^lang: zh-Hans$/m);
  assert.match(article, /^published: true$/m);
  assert.match(article, /- ai/);
});

test("clreq skill article is published", () => {
  const article = read("source/_posts/clreq-skills.md");

  assert.match(article, /^title: 《中文排版需求》 Skill$/m);
  assert.match(article, /^lang: zh-Hans$/m);
  assert.match(article, /^published: true$/m);
  assert.match(article, /- i18n/);
  assert.match(article, /- ai/);
});

test("post filenames use slug-only names for article URLs", () => {
  for (const path of postFiles()) {
    const filename = basename(path);

    assert.doesNotMatch(
      filename,
      /^\d{4}-\d{2}-\d{2}-/,
      `${filename} should not include a date prefix`
    );
    assert.match(
      filename,
      /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/,
      `${filename} should be a lowercase URL slug`
    );
  }
});

test("post front matter provides complete listing metadata", () => {
  const posts = postFiles().map(path => [path, parseMarkdown(path)]);
  const slugs = new Set();

  assert.ok(posts.length > 0, "expected at least one post");

  for (const [path, post] of posts) {
    const slug = basename(path, ".md");

    assert.equal(slugs.has(slug), false, `${slug} should be unique`);
    slugs.add(slug);

    assertNonEmptyString(post.title, `${path} should have a title`);
    assert.ok(post.date instanceof Date, `${path} should have a parsed date`);
    assert.equal(Number.isNaN(post.date.valueOf()), false, `${path} should have a valid date`);
    assertNonEmptyString(post.summary, `${path} should have a summary`);
    assert.match(post.lang, /^(en|zh-Hans)$/, `${path} should declare a supported language (en or zh-Hans)`);
    assert.equal(typeof post.featured, "boolean", `${path} should set featured explicitly`);
    assert.equal(typeof post.published, "boolean", `${path} should set published explicitly`);
    assertNonEmptyString(post._content, `${path} should have body content`);

    assert.ok(Array.isArray(post.tags), `${path} should have tags`);
    assert.ok(post.tags.length > 0, `${path} should have at least one tag`);
    for (const tag of post.tags) {
      assert.match(tag, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${path} has invalid tag ${tag}`);
    }
  }
});

test("section pages declare the layout and language used by the theme", () => {
  const pages = [
    ["source/writing/index.md", "writing", "en"],
    ["source/projects/index.md", "projects", "en"],
    ["source/talks/index.md", "talks", "en"],
    ["source/about/index.md", "page", "en"],
    ["source/zh-Hans/index.md", "page", "zh-Hans"],
    ["source/zh-Hans/writing/index.md", "writing", "zh-Hans"]
  ];

  for (const [path, layout, lang] of pages) {
    const page = parseMarkdown(path);

    assertNonEmptyString(page.title, `${path} should have a title`);
    assert.equal(page.layout, layout, `${path} should use the ${layout} layout`);
    assert.equal(page.lang, lang, `${path} should declare ${lang}`);
  }
});

test("theme stylesheet scopes Chinese typography to the document root", () => {
  const css = read("themes/fuqiao-xue/source/css/style.css");

  assert.match(css, /html:lang\(zh-Hans\)\s*{\s*text-autospace: normal;/);
  assert.doesNotMatch(css, /(?:^|\n):lang\(zh-Hans\)\s*{/);
});

test("projects and talks data files support data-driven pages", () => {
  const projects = read("source/_data/projects.yml");
  const talks = read("source/_data/talks.yml");

  assert.match(projects, /name: W3C Internationalization Activity/);
  assert.match(projects, /featured: true/);
  assert.match(projects, /name: Language Enablement/);
  assert.match(talks, /^# Talks are listed here when public talk metadata is available\.$/m);
});

test("project data entries match the project-list partial contract", () => {
  const projects = yaml.load(read("source/_data/projects.yml"));
  const names = new Set();

  assert.ok(Array.isArray(projects), "projects data should be an array");
  assert.ok(projects.length > 0, "projects data should not be empty");

  for (const project of projects) {
    assertNonEmptyString(project.name, "project should have a name");
    assert.equal(names.has(project.name), false, `${project.name} should be unique`);
    names.add(project.name);

    assertNonEmptyString(project.description, `${project.name} should have a description`);
    assertNonEmptyString(project.url, `${project.name} should have a URL`);
    assert.match(project.url, /^https:\/\//, `${project.name} should use an HTTPS URL`);
    assertNonEmptyString(project.role, `${project.name} should have a role`);
    assert.equal(typeof project.featured, "boolean", `${project.name} should set featured explicitly`);
    assert.ok(Array.isArray(project.tags), `${project.name} should have tags`);
    assert.ok(project.tags.length > 0, `${project.name} should have at least one tag`);
    for (const tag of project.tags) {
      assert.match(tag, /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/, `${project.name} has invalid tag ${tag}`);
    }
  }
});

test("talk data entries match the talk-list partial contract when present", () => {
  const talks = yaml.load(read("source/_data/talks.yml"));

  assert.ok(Array.isArray(talks), "talks data should be an array");

  for (const talk of talks) {
    assertNonEmptyString(talk.title, "talk should have a title");
    assertNonEmptyString(talk.event, `${talk.title} should have an event`);

    if (talk.url) {
      assert.match(talk.url, /^https:\/\//, `${talk.title} should use an HTTPS URL`);
    }

    for (const optionalField of ["date", "location", "summary"]) {
      if (talk[optionalField]) {
        assertNonEmptyString(talk[optionalField], `${talk.title} should have ${optionalField}`);
      }
    }
  }
});

test("English writing surfaces filter posts by language", () => {
  const homeTemplate = read("themes/fuqiao-xue/layout/index.ejs");
  const writingTemplate = read("themes/fuqiao-xue/layout/writing.ejs");

  assert.match(homeTemplate, /const isEnglishPost = post => !post\.lang \|\| post\.lang === 'en';/);
  assert.match(homeTemplate, /site\.posts\.filter\(isEnglishPost\)\.sort\('date', -1\)\.limit\(3\)/);
  assert.doesNotMatch(homeTemplate, /post\.featured/);
  assert.match(writingTemplate, /const targetLang = isZh \? 'zh-Hans' : 'en';/);
  assert.match(writingTemplate, /site\.posts\.filter\(post => post\.lang === targetLang\)\.sort\('date', -1\)/);
});
