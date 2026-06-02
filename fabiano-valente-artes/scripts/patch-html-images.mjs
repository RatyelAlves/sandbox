import fs from "fs/promises";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const indexPath = path.join(ROOT, "index.html");
let html = await fs.readFile(indexPath, "utf8");

function pictureTag(src, attrs) {
  const ext = path.extname(src);
  const webp = `${src.slice(0, -ext.length)}.webp`;
  return `<picture>\n                    <source srcset="${webp}" type="image/webp">\n                    <img src="${src}" ${attrs}>\n                </picture>`;
}

html = html.replace(
  /<img src="(img\/[^"]+\.(?:jpg|jpeg|png))"([^>]*)\/>/gi,
  (_, src, attrs) => pictureTag(src, attrs.trim())
);

html = html.replace(
  /<img src="(img\/[^"]+\.(?:jpg|jpeg|png))"([^>]*)>/gi,
  (_, src, attrs) => pictureTag(src, attrs.trim())
);

html = html.replace(
  'src="img/cover.png"',
  'src="img/cover.webp"'
);
html = html.replace(
  /<picture>\s*<source srcset="img\/cover\.webp" type="image\/webp">\s*<img src="img\/cover\.webp"([^>]*)>\s*<\/picture>/,
  `<picture>
                    <source srcset="img/cover.webp" type="image/webp">
                    <img src="img/cover.png"$1>
                </picture>`
);

html = html.replace(
  '<img src="img/logo.png" alt="Fabiano Valente Artes & Molduras - logo da loja" width="200" height="80">',
  `<picture>
            <source srcset="img/logo.webp" type="image/webp">
            <img src="img/logo.png" alt="Fabiano Valente Artes & Molduras - logo da loja" width="200" height="80" fetchpriority="high" decoding="async">
        </picture>`
);

html = html.replace(
  'content="https://www.fabianovalente.com.br/img/banner.png"',
  'content="https://www.fabianovalente.com.br/img/banner.webp"'
);

html = html.replace(
  'width="300" height="300"',
  'width="200" height="200" decoding="async"'
);

html = html.replace(
  /(<div class="swiper-slide"><picture>[\s\S]*?<\/picture><\/div>)/g,
  (block) => block.replace('loading="lazy"', 'loading="lazy" width="130" height="130" decoding="async"')
);

if (!html.includes('rel="preload" as="image" href="img/banner.webp"')) {
  html = html.replace(
    '<link rel="stylesheet" href="css/style.css">',
    `<link rel="preload" as="image" href="img/banner.webp" type="image/webp">
    <link rel="stylesheet" href="css/style.css">`
  );
}

await fs.writeFile(indexPath, html);
console.log("index.html atualizado com elementos picture e WebP.");
