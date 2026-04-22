# pol roig valldosera · portfolio (polroig2)

Minimal portfolio for Pol Roig Valldosera. Mobile-first, single-page app
with hash routing, no build step. Vanilla HTML/CSS/JS.

The home shows a circular "mirilla" (peephole) on the bigger side and an
organically-scattered cloud of project names on the smaller side. The
active project is underlined in the cloud; clicking another name swaps
the mirilla via an iris-pulse animation; clicking the mirilla opens the
full project page.

## Run locally

Any static server works:

- **VS Code Live Server** — right-click `index.html` → "Open with Live Server".
- **Node** — `node scripts/serve.mjs` serves the root at http://localhost:8080.
- **Python** — `python3 -m http.server 8080`.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` uploads the repo root to
GitHub Pages — no build. In **Settings → Pages**, set *Source* to *GitHub
Actions*. Works at root domain or project subpath since all asset URLs
are relative.

## Layout

- **Mobile / portrait**: stage on top (~2/3 height), cloud + texts below.
- **Desktop / landscape**: stage on the left (2/3 width), cloud + texts
  on the right (1/3 width). The cloud sits above; the texts stick to the
  bottom and reserve the height of the longest synopsis+bio so the cloud
  doesn't jump when the active project changes.
- A `--max-w: 1600px` keeps content from stretching on ultra-wide screens.
- A `--pad-x: clamp(1.25rem, 4vw, 6rem)` makes side padding scale with
  viewport width; on desktop the central gap mirrors `--pad-x` so the
  rhythm `pad | stage | gap | side | pad` stays balanced.

## Routes

Hash-based. Language falls back to the default (`cat`) when omitted.

| Hash                             | View                              |
| -------------------------------- | --------------------------------- |
| `#/`                             | home, default lang, first project |
| `#/<lang>`                       | home, lang (`cat` / `es` / `en`)  |
| `#/<slug>`                       | home with `<slug>` active         |
| `#/<slug>/<lang>`                | same, in `<lang>`                 |
| `#/proyecto/<slug>`              | full project page                 |
| `#/proyecto/<slug>/<lang>`       | project page in `<lang>`          |

Only `visible` projects can be reached via hash; hidden ones (`visible: false`)
are filtered out of the cloud and not navigable.

## Adding or editing a project

Everything lives in `data/data.json`. Each entry in `proyectos[]` needs:

- `slug` — used in URLs
- `visible: true` — set to `false` to hide from the cloud
- `año`
- `nombre`, `sinopsis`, `texto`, `bio_fragmento`, `ubicacion` — each as
  `{ cat, es, en }` or a plain string when the three languages match
- optional `carpeta` — folder under `data/` holding the assets; defaults
  to `slug`
- optional `creditos[]` — each with `rol` (string or `{cat,es,en}`) and `nombre`

Steps:

1. Drop images as `data/<carpeta>/img/1.webp`, `2.webp`, … (numbered
   sequentially — discovery stops at the first gap).
2. Generate the mirilla: open `tools/mirillaGen.html`, drop the first
   image, save the resulting webp as `data/<carpeta>/mirilla.webp`.
3. Add the entry in `data/data.json` `proyectos[]`.

The default home slug is the **first visible project** in `proyectos[]`.

## Project layout

```
index.html                single SPA entry point
css/style.css             site styles
js/
  app.js                  router, loads data/data.json
  home.js                 mirilla + cloud + iris swap
  project.js              full project page
  i18n.js                 translations + lang menu
data/
  data.json               i18n + proyectos[]
  <carpeta>/              one folder per project (defaults to slug)
    mirilla.webp          peephole image for the home
    img/                  numbered project images (1.webp, 2.webp, …)
tools/
  mirillaGen.html         standalone mirilla generator (open in browser)
scripts/
  serve.mjs               optional tiny dev server (Node, zero deps)
```
