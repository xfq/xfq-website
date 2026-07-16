"use strict";

const XML_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";

const collectionToArray = (collection) => {
  if (!collection) {
    return [];
  }

  if (typeof collection.toArray === "function") {
    return collection.toArray();
  }

  return Array.from(collection);
};

const escapeXml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

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

const isoDate = (value) => {
  if (!value) {
    return undefined;
  }

  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return undefined;
  }

  return date.toISOString().slice(0, 10);
};

const publicPage = (item) => item
  && item.published !== false
  && item.sitemap !== false
  && item.path
  && item.path.endsWith(".html");
const publicPost = (item) => item && item.published !== false && item.path;

hexo.extend.generator.register("sitemap", function generateSitemap(locals) {
  const { url, root } = this.config;
  const baseUrl = normalizeBaseUrl(url);
  const pages = collectionToArray(locals.pages).filter(publicPage);
  const posts = collectionToArray(locals.posts).filter(publicPost);
  const urlsByLoc = new Map();

  for (const item of [...pages, ...posts]) {
    const loc = canonicalUrl(baseUrl, root, item.path);
    const isPost = (item.source || "").startsWith("_posts/");

    if (!urlsByLoc.has(loc)) {
      urlsByLoc.set(loc, {
        loc,
        lastmod: isoDate(isPost ? item.date : item.updated || item.date)
      });
    }
  }

  const urls = [...urlsByLoc.values()].sort((a, b) => a.loc.localeCompare(b.loc));

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${XML_NAMESPACE}">`,
    ...urls.map(({ loc, lastmod }) => [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      ...(lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : []),
      "  </url>"
    ].join("\n")),
    "</urlset>",
    ""
  ].join("\n");

  const robots = [
    "User-agent: *",
    "Allow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    `Sitemap: ${canonicalUrl(baseUrl, root, "sitemap.xml")}`,
    ""
  ].join("\n");

  return [
    {
      path: "sitemap.xml",
      data: sitemap
    },
    {
      path: "robots.txt",
      data: robots
    }
  ];
});
