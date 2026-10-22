const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = process.cwd();
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ["assets/js/recipes.js", "assets/js/recipes-extra.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
}
const recipes = sandbox.window.COOKIPIE_RECIPES || {};
const template = fs.readFileSync(path.join(root, "recipe.html"), "utf8");
const origin = "https://cookipie.github.io";
const urls = new Set([origin + "/"]);
for (const file of fs.readdirSync(root)) {
  if (file.endsWith(".html") && !["recipe.html"].includes(file)) urls.add(origin + "/" + file);
}
for (const [id, r] of Object.entries(recipes)) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error("Unsafe recipe id: " + id);
  const dir = path.join(root, "recipes");
  fs.mkdirSync(dir, { recursive: true });
  const title = String(r.name || id).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const hindi = String(r.hi || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const desc = String(r.intro || r.name || id).replace(/\s+/g, " ").slice(0, 155).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  let html = template
    .replace(/href="\.\//g, 'href="../')
    .replace(/src="assets\//g, 'src="../assets/')
    .replace(/href="assets\//g, 'href="../assets/')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + desc + '">')
    .replace(/<title>[^<]*<\/title>/, '<title>' + title + (hindi ? " (" + hindi + ")" : "") + " — Cookipie</title>")
    .replace("<body>", '<body data-recipe-id="' + id + '">');
  const canonical = '<link rel="canonical" href="' + origin + "/recipes/" + id + '.html">';
  const og = '<meta property="og:type" content="article"><meta property="og:title" content="' + title + (hindi ? " (" + hindi + ")" : "") + ' — Cookipie"><meta property="og:description" content="' + desc + '">';
  html = html.replace("</head>", canonical + og + "</head>");
  fs.writeFileSync(path.join(dir, id + ".html"), html);
  urls.add(origin + "/recipes/" + id + ".html");
}
const entries = [...urls].sort().map((url) => "  <url><loc>" + url + "</loc><changefreq>monthly</changefreq><priority>" + (url === origin + "/" ? "1.0" : "0.7") + "</priority></url>").join("\n");
fs.writeFileSync(path.join(root, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries + "\n</urlset>\n");
console.log("Generated " + Object.keys(recipes).length + " recipe pages and sitemap URLs.");
