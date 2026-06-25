"use strict";

const collectionToArray = (collection) => {
  if (!collection) {
    return [];
  }

  if (typeof collection.toArray === "function") {
    return collection.toArray();
  }

  return Array.from(collection);
};

const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");

const normalizeRoot = (root) => {
  if (!root || root === "/") {
    return "/";
  }

  return `/${root.replace(/^\/+|\/+$/g, "")}/`;
};

const routePathToUrlPath = (routePath) => {
  if (!routePath || routePath === "index.html") {
    return "/";
  }

  return `/${routePath}`
    .replace(/\/index\.html$/, "/")
    .replace(/\.html$/, "/")
    .replace(/\/{2,}/g, "/");
};

const canonicalUrl = (baseUrl, root, routePath) => {
  const rootPath = normalizeRoot(root);
  const urlPath = routePathToUrlPath(routePath).replace(/^\//, "");

  return `${normalizeBaseUrl(baseUrl)}${rootPath}${urlPath}`.replace(/([^:]\/)\/+/g, "$1");
};

const publicPost = (item) => item && item.published !== false && item.path;
const englishPost = (item) => !item.lang || item.lang === "en";
const chinesePost = (item) => item.lang === "zh-Hans";

hexo.extend.generator.register("llms-txt", function generateLlmsTxt(locals) {
  const { title, description, url, root } = this.config;
  const baseUrl = normalizeBaseUrl(url);

  const pages = collectionToArray(locals.pages);
  const posts = collectionToArray(locals.posts)
    .filter(publicPost)
    .filter(englishPost)
    .sort((a, b) => b.date - a.date);

  const zhPosts = collectionToArray(locals.posts)
    .filter(publicPost)
    .filter(chinesePost)
    .sort((a, b) => b.date - a.date);

  const corePages = [
    { label: "About", path: "about/index.html", desc: "Bio, work, and background." },
    { label: "Writing", path: "writing/index.html", desc: "Articles and notes on internationalization, the Web platform, and AI." },
    { label: "Projects", path: "projects/index.html", desc: "Selected work and projects, including W3C Internationalization Activity and Language Enablement." },
    { label: "Talks", path: "talks/index.html", desc: "Talks and presentations." }
  ];

  const lines = [
    `# ${title}`,
    "",
    `> ${description}`,
    "",
    "## Core Pages"
  ];

  for (const page of corePages) {
    const pageUrl = canonicalUrl(baseUrl, root, page.path);
    lines.push(`- [${page.label}](${pageUrl}): ${page.desc}`);
  }

  if (posts.length > 0) {
    lines.push("", "## Writing");

    for (const post of posts) {
      const postUrl = canonicalUrl(baseUrl, root, post.path);
      const summary = post.summary || "";
      lines.push(`- [${post.title}](${postUrl}): ${summary}`);
    }
  }

  lines.push(
    "",
    "## Chinese",
    `- [中文首页](${canonicalUrl(baseUrl, root, "zh-Hans/index.html")}): Chinese-language content entry point.`,
    `- [文章](${canonicalUrl(baseUrl, root, "zh-Hans/writing/index.html")}): Articles and notes in Chinese.`
  );

  if (zhPosts.length > 0) {
    for (const post of zhPosts) {
      const postUrl = canonicalUrl(baseUrl, root, post.path);
      const summary = post.summary || "";
      lines.push(`- [${post.title}](${postUrl}): ${summary}`);
    }
  }

  lines.push("");

  return {
    path: "llms.txt",
    data: lines.join("\n")
  };
});
