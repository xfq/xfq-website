import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { before, test } from "node:test";

const html = (path) => readFileSync(path, "utf8");

const postPaths = [
  "public/writing/2026/06/18/i18n-notes/index.html",
  "public/writing/2026/06/18/working-with-multilingual-technical-knowledge/index.html"
];

const htmlFiles = (dir) => {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      files.push(...htmlFiles(path));
    } else if (path.endsWith(".html")) {
      files.push(path);
    }
  }

  return files;
};

const targetPathForHref = (href) => {
  const cleanHref = href.split(/[?#]/)[0];

  if (cleanHref === "/") {
    return "public/index.html";
  }

  if (cleanHref.endsWith(".html")) {
    return join("public", cleanHref.replace(/^\//, ""));
  }

  return join("public", cleanHref.replace(/^\//, ""), "index.html");
};

before(() => {
  execFileSync("npm", ["run", "clean"], { stdio: "pipe" });
  execFileSync("npm", ["run", "build"], { stdio: "pipe" });
});

test("generated routes include the primary site sections", () => {
  for (const path of [
    "public/index.html",
    "public/writing/index.html",
    "public/about/index.html",
    "public/zh/index.html"
  ]) {
    assert.equal(existsSync(path), true, `${path} should exist`);
  }
});

test("homepage renders the approved information architecture", () => {
  const home = html("public/index.html");
  assert.match(home, /Fuqiao Xue/);
  assert.match(home, /Skip to content/);
  assert.match(home, /css\/style\.css/);
  assert.match(home, /Web standards and internationalization/);
  assert.match(home, /Latest Writing/);
  assert.match(home, /Ask W3C i18n/);
  assert.doesNotMatch(home, /Internationalization Notes for the Web Platform/);
  assert.doesNotMatch(home, /Working With Multilingual Technical Knowledge/);
  assert.doesNotMatch(home, /Selected Work/);
  assert.doesNotMatch(home, /Projects/);
  assert.doesNotMatch(home, /Talks/);
  assert.doesNotMatch(home, /href="\/projects\/"/);
  assert.doesNotMatch(home, /href="\/talks\/"/);
});

test("secondary pages render expected content and empty states", () => {
  const writingIndex = html("public/writing/index.html");
  assert.match(writingIndex, /Ask W3C i18n/);
  assert.doesNotMatch(writingIndex, /Internationalization Notes for the Web Platform/);
  assert.doesNotMatch(writingIndex, /Working With Multilingual Technical Knowledge/);
  assert.match(writingIndex, /<a\b(?=[^>]*href="\/writing\/")(?=[^>]*class="is-active")(?=[^>]*aria-current="page")[^>]*>Writing<\/a>/);
  assert.match(html("public/about/index.html"), /leads the W3C Internationalization Activity/);
  assert.match(html("public/zh/index.html"), /中文内容入口/);
});

test("unpublished placeholder posts do not generate public detail pages", () => {
  for (const path of postPaths) {
    assert.equal(existsSync(path), false, `${path} should not exist`);
  }
});

test("styled list markup preserves list semantics", () => {
  const writingIndex = html("public/writing/index.html");
  assert.match(writingIndex, /<ol\b(?=[^>]*class="post-list")[^>]*role="list"/);
  assert.match(writingIndex, /<ul\b(?=[^>]*class="tag-list")[^>]*role="list"/);
  assert.doesNotMatch(writingIndex, /<p\b(?=[^>]*class="empty-state")[^>]*>No writing is listed here yet\.<\/p>/);
});

test("the published post generates a public detail page", () => {
  const path = "public/writing/2026/06/23/ask-w3c-i18n/index.html";
  assert.equal(existsSync(path), true, `${path} should exist`);

  const post = html(path);
  assert.match(post, /<h1>Ask W3C i18n<\/h1>/);
  assert.match(post, /The Problem/);
  assert.match(post, /The Tool/);
});

test("dark editorial stylesheet is generated with required tokens", () => {
  const css = html("public/css/style.css");
  assert.match(css, /--color-bg: #0d1117;/);
  assert.match(css, /--color-accent: #64d2c8;/);
  assert.match(css, /color-scheme: dark;/);
  assert.match(css, /\.skip-link:focus/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /overflow-wrap: break-word;/);
  assert.match(css, /h1\s*{\s*max-width: 47\.5rem;\s*font-size: 4rem;\s*text-wrap: balance;\s*}/);
  assert.match(css, /\.page-header h1\s*{\s*font-size: 3\.5rem;\s*}/);
  assert.doesNotMatch(css, /font-size:[^;]*vw/);
  assert.match(css, /overflow-wrap: anywhere;/);
  assert.match(css, /h1\s*{\s*font-size: 2\.25rem;\s*}/);
  assert.match(css, /h1\s*{\s*font-size: 1\.875rem;\s*}/);
  assert.doesNotMatch(css, /min-width:\s*20rem;/);
});

test("generated internal anchor links point to existing routes", () => {
  for (const file of htmlFiles("public")) {
    const content = html(file);
    const links = content.matchAll(/<a\b[^>]*\shref="([^"]*)"/g);

    for (const [, href] of links) {
      if (!href || href.startsWith("#") || /^(?:https?:|mailto:|tel:|\/\/)/i.test(href)) {
        continue;
      }

      assert.equal(
        href.startsWith("/"),
        true,
        `${file} has unsupported relative href "${href}"`
      );

      const target = targetPathForHref(href);
      assert.equal(existsSync(target), true, `${file} links to missing route ${href}`);
    }
  }
});
