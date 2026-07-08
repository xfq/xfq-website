import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { before, test } from "node:test";

const html = (path) => readFileSync(path, "utf8");

const postPaths = [
  "public/writing/i18n-notes/index.html",
  "public/writing/working-with-multilingual-technical-knowledge/index.html"
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

const expectedCanonicalUrlForFile = (file) => {
  const relativePath = file.replace(/^public\//, "");
  const expectedPath = relativePath === "index.html"
    ? ""
    : relativePath.replace(/(?:\/)?index\.html$/, "/").replace(/\.html$/, ".html");

  return `https://xuefuqiao.com/${expectedPath}`;
};

const jsonLdFor = (file) => {
  const content = html(file);
  const scripts = [...content.matchAll(/<script\b(?=[^>]*\btype="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)];

  assert.equal(scripts.length, 1, `${file} should have exactly one JSON-LD script`);
  return JSON.parse(scripts[0][1]);
};

const graphNode = (graph, id) => graph["@graph"].find(node => node["@id"] === id);

before(() => {
  execFileSync("npm", ["run", "clean"], { stdio: "pipe" });
  execFileSync("npm", ["run", "build"], { stdio: "pipe" });
});

test("generated routes include the primary site sections", () => {
  for (const path of [
    "public/index.html",
    "public/writing/index.html",
    "public/projects/index.html",
    "public/talks/index.html",
    "public/about/index.html",
    "public/zh-Hans/index.html",
    "public/robots.txt",
    "public/sitemap.xml",
    "public/llms.txt"
  ]) {
    assert.equal(existsSync(path), true, `${path} should exist`);
  }
});

test("robots.txt advertises the generated sitemap", () => {
  const robots = html("public/robots.txt");

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^User-agent: OAI-SearchBot$/m);
  assert.match(robots, /^Sitemap: https:\/\/xuefuqiao\.com\/sitemap\.xml$/m);
});

test("sitemap lists public pages and excludes unpublished posts", () => {
  const sitemap = html("public/sitemap.xml");

  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);

  for (const url of [
    "https://xuefuqiao.com/",
    "https://xuefuqiao.com/writing/",
    "https://xuefuqiao.com/projects/",
    "https://xuefuqiao.com/talks/",
    "https://xuefuqiao.com/about/",
    "https://xuefuqiao.com/zh-Hans/",
    "https://xuefuqiao.com/writing/ask-w3c-i18n/"
  ]) {
    assert.equal(sitemap.includes(`<loc>${url}</loc>`), true, `${url} should be listed`);
  }

  assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  assert.match(
    sitemap,
    /<url>\s*<loc>https:\/\/xuefuqiao\.com\/writing\/ask-w3c-i18n\/<\/loc>\s*<lastmod>2026-06-23<\/lastmod>\s*<\/url>/
  );

  assert.doesNotMatch(sitemap, /\/writing\/\d{4}\/\d{2}\/\d{2}\//);

  assert.doesNotMatch(sitemap, /i18n-notes/);
  assert.doesNotMatch(sitemap, /working-with-multilingual-technical-knowledge/);
});

test("llms.txt exposes a Markdown-formatted site guide for LLMs", () => {
  const llms = html("public/llms.txt");

  assert.match(llms, /^# Fuqiao Xue$/m);
  assert.match(llms, /> Personal website for Fuqiao Xue/);

  assert.match(llms, /^## Core Pages$/m);
  assert.match(llms, /^## Writing$/m);
  assert.match(llms, /^## Chinese$/m);

  for (const url of [
    "https://xuefuqiao.com/about/",
    "https://xuefuqiao.com/writing/",
    "https://xuefuqiao.com/projects/",
    "https://xuefuqiao.com/talks/",
    "https://xuefuqiao.com/zh-Hans/",
    "https://xuefuqiao.com/zh-Hans/writing/",
    "https://xuefuqiao.com/writing/ask-w3c-i18n/",
    "https://xuefuqiao.com/writing/w3c-i18n-intro/"
  ]) {
    assert.equal(llms.includes(url), true, `${url} should be listed`);
  }

  assert.doesNotMatch(llms, /i18n-notes/);
  assert.doesNotMatch(llms, /working-with-multilingual-technical-knowledge/);
});

test("homepage renders the approved information architecture", () => {
  const home = html("public/index.html");
  assert.match(home, /Fuqiao Xue/);
  assert.match(home, /Skip to content/);
  assert.match(home, /css\/style\.css/);
  assert.match(home, /Web standards and internationalization/);
  assert.match(home, /Latest Writing/);
  assert.match(home, /The Work That Remains Human/);
  assert.match(home, /Ask W3C i18n/);
  assert.equal(
    home.indexOf("The Work That Remains Human") < home.indexOf("Ask W3C i18n"),
    true,
    "homepage should list newer English writing before older English writing"
  );
  assert.doesNotMatch(home, /什么项目适合用大模型？/);
  assert.doesNotMatch(home, /Internationalization Notes for the Web Platform/);
  assert.doesNotMatch(home, /Working With Multilingual Technical Knowledge/);
  assert.doesNotMatch(home, /Selected Work/);
  assert.doesNotMatch(home, /Projects/);
  assert.doesNotMatch(home, /Talks/);
  assert.doesNotMatch(home, /href="\/projects\/"/);
  assert.doesNotMatch(home, /href="\/talks\/"/);
});

test("footer renders public profile links", () => {
  const home = html("public/index.html");

  assert.match(home, /<footer class="site-footer">[\s\S]*<a\b(?=[^>]*href="https:\/\/github\.com\/xfq")[^>]*>GitHub<\/a>[\s\S]*<\/footer>/);
  assert.match(home, /<footer class="site-footer">[\s\S]*<a\b(?=[^>]*href="https:\/\/www\.linkedin\.com\/in\/xfq\/")[^>]*>LinkedIn<\/a>[\s\S]*<\/footer>/);
});

test("generated pages include favicon metadata and assets", () => {
  const home = html("public/index.html");

  assert.match(home, /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png">/);
  assert.match(home, /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32x32\.png">/);
  assert.match(home, /<link rel="icon" type="image\/png" sizes="16x16" href="\/favicon-16x16\.png">/);
  assert.match(home, /<link rel="manifest" href="\/site\.webmanifest">/);
  assert.match(home, /<link rel="shortcut icon" href="\/favicon\.ico">/);

  for (const path of [
    "public/apple-touch-icon.png",
    "public/favicon-32x32.png",
    "public/favicon-16x16.png",
    "public/favicon.ico",
    "public/android-chrome-192x192.png",
    "public/android-chrome-512x512.png",
    "public/site.webmanifest"
  ]) {
    assert.equal(existsSync(path), true, `${path} should exist`);
  }

  const manifest = JSON.parse(html("public/site.webmanifest"));
  assert.equal(manifest.name, "Fuqiao Xue");
  assert.equal(manifest.short_name, "Fuqiao Xue");
  assert.deepEqual(
    manifest.icons.map(icon => icon.src),
    ["/android-chrome-192x192.png", "/android-chrome-512x512.png"]
  );
});

test("generated HTML pages expose canonical URLs", () => {
  for (const file of htmlFiles("public")) {
    const content = html(file);
    const canonicalLinks = [...content.matchAll(/<link\b(?=[^>]*\brel="canonical")(?=[^>]*\bhref="([^"]+)")[^>]*>/g)];
    const expectedUrl = expectedCanonicalUrlForFile(file);

    assert.equal(canonicalLinks.length, 1, `${file} should have exactly one canonical URL`);
    assert.equal(canonicalLinks[0][1], expectedUrl, `${file} should canonicalize to ${expectedUrl}`);
  }
});

test("generated HTML pages expose JSON-LD website and webpage metadata", () => {
  for (const file of htmlFiles("public")) {
    const expectedUrl = expectedCanonicalUrlForFile(file);
    const jsonLd = jsonLdFor(file);

    assert.equal(jsonLd["@context"], "https://schema.org", `${file} should use the Schema.org context`);
    assert.ok(Array.isArray(jsonLd["@graph"]), `${file} should expose an @graph`);

    const person = graphNode(jsonLd, "https://xuefuqiao.com/#person");
    const website = graphNode(jsonLd, "https://xuefuqiao.com/#website");
    const webpage = graphNode(jsonLd, `${expectedUrl}#webpage`);

    assert.equal(person["@type"], "Person", `${file} should describe the site owner`);
    assert.equal(person.name, "Fuqiao Xue", `${file} should name the site owner`);
    assert.equal(person.url, "https://xuefuqiao.com/", `${file} should link the site owner to the canonical home URL`);
    assert.deepEqual(person.sameAs, [
      "https://github.com/xfq",
      "https://www.linkedin.com/in/xfq/"
    ]);

    assert.equal(website["@type"], "WebSite", `${file} should describe the website`);
    assert.equal(website.name, "Fuqiao Xue", `${file} should name the website`);
    assert.equal(website.url, "https://xuefuqiao.com/", `${file} should use the configured site URL`);
    assert.equal(website.publisher["@id"], "https://xuefuqiao.com/#person");

    assert.equal(webpage["@type"], "WebPage", `${file} should describe the current page`);
    assert.equal(webpage.url, expectedUrl, `${file} should use the canonical URL`);
    assert.equal(typeof webpage.name, "string", `${file} should name the current page`);
    assert.match(webpage.dateModified, /^\d{4}-\d{2}-\d{2}T/, `${file} should expose a modified date`);
    assert.equal(webpage.isPartOf["@id"], "https://xuefuqiao.com/#website");
  }
});

test("published posts expose JSON-LD BlogPosting metadata", () => {
  const postUrl = "https://xuefuqiao.com/writing/ask-w3c-i18n/";
  const jsonLd = jsonLdFor("public/writing/ask-w3c-i18n/index.html");
  const blogPosting = graphNode(jsonLd, `${postUrl}#blogposting`);

  assert.equal(blogPosting["@type"], "BlogPosting");
  assert.equal(blogPosting.url, postUrl);
  assert.equal(blogPosting.name, "Ask W3C i18n");
  assert.equal(blogPosting.headline, "Ask W3C i18n");
  assert.equal(
    blogPosting.description,
    "An experiment in using an AI-assisted, citation-grounded interface to make W3C Internationalization guidance easier to find."
  );
  assert.match(blogPosting.datePublished, /^2026-06-23T/);
  assert.deepEqual(blogPosting.keywords, ["i18n", "w3c", "ai"]);
  assert.equal(blogPosting.author["@id"], "https://xuefuqiao.com/#person");
  assert.equal(blogPosting.publisher["@id"], "https://xuefuqiao.com/#person");
  assert.equal(blogPosting.mainEntityOfPage["@id"], `${postUrl}#webpage`);
});

test("secondary pages render expected content and empty states", () => {
  const writingIndex = html("public/writing/index.html");
  assert.match(writingIndex, /Ask W3C i18n/);
  assert.doesNotMatch(writingIndex, /Internationalization Notes for the Web Platform/);
  assert.doesNotMatch(writingIndex, /Working With Multilingual Technical Knowledge/);
  assert.match(writingIndex, /<a\b(?=[^>]*href="\/writing\/")(?=[^>]*class="is-active")(?=[^>]*aria-current="page")[^>]*>Writing<\/a>/);

  const projectsIndex = html("public/projects/index.html");
  assert.match(projectsIndex, /W3C Internationalization Activity/);
  assert.match(projectsIndex, /Language Enablement/);
  assert.match(projectsIndex, /<ol\b(?=[^>]*class="item-list")[^>]*role="list"/);
  assert.match(projectsIndex, /<ul\b(?=[^>]*class="tag-list")[^>]*role="list"[^>]*aria-label="Project tags"/);

  const talksIndex = html("public/talks/index.html");
  assert.match(talksIndex, /<p\b(?=[^>]*class="empty-state")[^>]*>No public talks are listed on this site yet\.<\/p>/);

  assert.match(html("public/about/index.html"), /leads the W3C Internationalization Activity/);
  assert.match(html("public/zh-Hans/index.html"), /中文内容入口/);
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

test("article lists do not show language labels", () => {
  for (const path of ["public/writing/index.html", "public/zh-Hans/writing/index.html"]) {
    const listMeta = [...html(path).matchAll(/<div class="post-list__meta">([\s\S]*?)<\/div>/g)]
      .map(match => match[1])
      .join("\n");

    assert.doesNotMatch(listMeta, /<span>en<\/span>|<span>zh-Hans<\/span>/, `${path} should hide language labels`);
  }
});

test("the published post generates a public detail page", () => {
  const path = "public/writing/ask-w3c-i18n/index.html";
  assert.equal(existsSync(path), true, `${path} should exist`);
  assert.equal(
    existsSync("public/writing/2026/06/23/ask-w3c-i18n/index.html"),
    false,
    "dated article URLs should not be generated"
  );

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
