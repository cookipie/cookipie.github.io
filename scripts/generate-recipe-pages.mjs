import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const window = { COOKIPIE_RECIPES: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/recipes.js"), "utf8"), { window });
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/recipes-extra.js"), "utf8"), { window });
const recipes = window.COOKIPIE_RECIPES;
const template = fs.readFileSync(path.join(root, "recipes/poha.html"), "utf8");
const ids = Object.keys(recipes).sort();
fs.mkdirSync(path.join(root, "recipes"), { recursive: true });

for (const id of ids) {
  const r = recipes[id];
  const title = r.name + " (" + (r.hi || r.name) + ") — Cookipie";
  const description = String(r.intro || r.name).replace(/\s+/g, " ").slice(0, 155);
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>" + escapeHtml(title) + "</title>");
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + escapeHtml(description) + '">');
  html = html.replace(/<link rel="canonical" href="[^"]*">/g, "");
  html = html.replace(/<meta property="og:type"[^>]*>/g, "");
  html = html.replace(/<meta property="og:title"[^>]*>/g, "");
  html = html.replace(/<meta property="og:description"[^>]*>/g, "");
  html = html.replace("</head>", '<link rel="canonical" href="https://cookipie.github.io/recipes/' + id + '.html"><meta property="og:type" content="article"><meta property="og:title" content="' + escapeHtml(title) + '"><meta property="og:description" content="' + escapeHtml(description) + '"></head>');
  html = html.replace(/<body data-recipe-id="[^"]*">/, '<body data-recipe-id="' + id + '">');
  html = html.replace(/recipe-detail\.js\?v=\d+/, "recipe-detail.js?v=22");
  fs.writeFileSync(path.join(root, "recipes", id + ".html"), html);
}

let sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/cookipie\.github\.io\/recipe\.html\?id=[^<]*<\/loc>[\s\S]*?<\/url>/g, "");
sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/cookipie\.github\.io\/recipes\/[^<]*<\/loc>[\s\S]*?<\/url>/g, "");
const recipeUrls = ids.map(id => '  <url>\n    <loc>https://cookipie.github.io/recipes/' + id + '.html</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>').join("\n");
sitemap = sitemap.replace("</urlset>", recipeUrls + "\n</urlset>");
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
