# Fabiano Valente Artes & Molduras

Site institucional da loja **Fabiano Valente Artes & Molduras**, em Belo Horizonte. Apresenta produtos, serviços, galeria de coleções, avaliações de clientes e informações de contato.

**Site em produção:** [fabianovalente.com.br](https://www.fabianovalente.com.br/)

## Tecnologias

- HTML5 semântico
- CSS3
- JavaScript (vanilla)
- [Swiper](https://swiperjs.com/) — carrossel de coleções
- [Font Awesome](https://fontawesome.com/) — ícone do WhatsApp
- [Google Fonts](https://fonts.google.com/) — Bona Nova SC e Manrope
- [Sharp](https://sharp.pixelplumbing.com/) — otimização de imagens (desenvolvimento)

## Estrutura do projeto

```
fabiano-valente-artes/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos
├── img/                # Imagens (originais + versões .webp)
├── scripts/
│   ├── optimize-images.mjs   # Comprime e gera WebP
│   └── patch-html-images.mjs # Atualiza HTML com <picture>
├── robots.txt
├── sitemap.xml
└── package.json
```

## Como executar localmente

Como é um site estático, basta abrir o `index.html` no navegador ou usar um servidor local:

```bash
# Com Node.js (npx serve)
npx serve .

# Ou com Python
python -m http.server 8080
```

Acesse `http://localhost:8080` (ou a porta indicada).

## Otimização de imagens

Novas imagens em `img/` devem ser otimizadas antes do deploy:

```bash
npm install
npm run optimize-images
```

O script:
- redimensiona conforme o uso (produtos, carrossel, banner, etc.);
- comprime JPG/PNG;
- gera versões `.webp` ao lado dos originais.

O HTML usa `<picture>` com WebP e fallback para JPG/PNG. Os backgrounds do banner e da localização preferem WebP via `image-set()` no CSS.

## SEO

O site inclui:

- meta tags (description, robots, Open Graph, Twitter Cards);
- URL canônica;
- dados estruturados JSON-LD (`Store`, `WebSite`);
- `robots.txt` e `sitemap.xml`;
- textos alternativos descritivos nas imagens;
- HTML semântico (`main`, `section`, `address`, etc.).

## Deploy

Envie todos os arquivos do projeto para a raiz do domínio, incluindo:

- `index.html`, `css/`, `img/` (originais **e** `.webp`);
- `robots.txt` e `sitemap.xml`.

Não é necessário enviar `node_modules/` — use `npm run optimize-images` localmente antes de publicar.

## Subir ao GitHub

```powershell
cd "F:\Documentos\Portifólio\fabiano-valente-artes"
git init
git add .
git status
git commit -m "Site Fabiano Valente Artes & Molduras"
git branch -M main
git remote add origin https://github.com/RatyelAlves/fabiano-valente-artes.git
git push -u origin main
```

## Contato da loja

- **Endereço:** Rua Cláudio Manoel, 713 – Funcionários, Belo Horizonte, MG
- **Telefones:** (31) 3261-9434 / (31) 2535-9434
- **Loja online:** [quadrosdecoronline.com.br](https://www.quadrosdecoronline.com.br/)
