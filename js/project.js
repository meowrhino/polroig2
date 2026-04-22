/**
 * Full project page.
 *
 * Images are auto-discovered: we probe data/<carpeta>/img/<n>.webp for
 * n = 1, 2, 3…, in batches of 10 in parallel, and stop at the first gap.
 * No `imagenes` field needed in data.json.
 */

import { applyTranslations, pickLang } from "./i18n.js";

const carpetaOf = (p) => p.carpeta || p.slug;

export async function renderProject(data, { slug, lang }) {
  const proj = data.proyectos.find(p => p.slug === slug);
  if (!proj) {
    // slug not found — bounce to home
    location.hash = "#/";
    return;
  }

  applyTranslations();

  const root     = document.getElementById("view-project");
  const title    = root.querySelector(".proyecto__title");
  const sub      = root.querySelector(".proyecto__sub");
  const synopsis = root.querySelector(".proyecto__synopsis");
  const text     = root.querySelector(".proyecto__text");
  const credits  = root.querySelector(".proyecto__creditos");
  const gallery  = root.querySelector(".proyecto__gallery");
  const mirilla  = root.querySelector(".proyecto__mirilla .mirilla__img");
  const favicon  = document.getElementById("favicon");

  const name = pickLang(proj.nombre, lang);
  const carpeta = carpetaOf(proj);
  title.textContent = name;
  sub.textContent   = [pickLang(proj.ubicacion, lang), proj.año]
    .filter(Boolean).join(" · ");
  synopsis.textContent = pickLang(proj.sinopsis, lang);
  text.textContent     = pickLang(proj.texto, lang);

  mirilla.src = `data/${carpeta}/mirilla.webp`;
  if (favicon) favicon.href = mirilla.src;

  credits.innerHTML = "";
  (proj.creditos || []).forEach(c => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${pickLang(c.rol, lang)}</span> <span>${c.nombre}</span>`;
    credits.appendChild(li);
  });

  document.title = `${name} · pol roig`;

  // auto-discover and render the gallery (don't await — let it fill in progressively)
  loadGallery(gallery, carpeta, name).catch(err => console.warn("gallery:", err));
}

async function loadGallery(gallery, carpeta, name) {
  // tear down any observer left from the previous gallery on this element
  gallery.__io?.disconnect();
  gallery.innerHTML = "";

  const BATCH = 10;
  let start = 1;
  const seen = new Set();

  const token = (gallery.__token = Symbol("gallery"));

  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: "0px 0px -10% 0px" });
  gallery.__io = io;

  while (gallery.__token === token) {
    const probes = [];
    for (let k = 0; k < BATCH; k++) {
      const n = start + k;
      const url = `data/${carpeta}/img/${n}.webp`;
      probes.push(probe(url).then(ok => ({ n, url, ok })));
    }
    const results = await Promise.all(probes);
    if (gallery.__token !== token) return;

    let firstMiss = results.findIndex(r => !r.ok);
    const keep = firstMiss === -1 ? results : results.slice(0, firstMiss);
    for (const r of keep) {
      if (seen.has(r.n)) continue;
      seen.add(r.n);
      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = r.url;
      img.alt = `${name} — ${r.n}`;
      gallery.appendChild(img);
      io.observe(img);
    }
    if (firstMiss !== -1) return;
    start += BATCH;
    if (start > 5000) return; // safety cap
  }
}

function probe(url) {
  return fetch(url, { method: "HEAD" }).then(r => r.ok).catch(() => false);
}
