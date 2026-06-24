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

const publicPage = (item) => item && item.published !== false && item.path && item.path.endsWith(".html");
const publicPost = (item) => item && item.published !== false && item.path;

hexo.extend.generator.register("sitemap", function generateSitemap(locals) {
  const { url, root } = this.config;
  const baseUrl = normalizeBaseUrl(url);
  const pages = collectionToArray(locals.pages).filter(publicPage);
  const posts = collectionToArray(locals.posts).filter(publicPost);
  const urls = [...pages, ...posts]
    .map((item) => canonicalUrl(baseUrl, root, item.path))
    .filter((item, index, list) => list.indexOf(item) === index)
    .sort();

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${XML_NAMESPACE}">`,
    ...urls.map((loc) => [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      "  </url>"
    ].join("\n")),
    "</urlset>",
    ""
  ].join("\n");

  const robots = [
    "User-agent: *",
    "Allow: /",
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
