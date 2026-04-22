/**
 * Home view — mirilla on the left (2/3) + organic project-name cloud on the right (1/3).
 *
 * Mirilla swap: an iris fade — a black circle grows from the centre out
 * (covering the old image), the src is swapped at the midpoint, and the
 * black circle shrinks back to the centre revealing the new image.
 */

import { applyTranslations, projectHash, homeHash, pickLang } from "./i18n.js";

const carpetaOf = (p) => p.carpeta || p.slug;

const SWAP_TOTAL_MS = 700;

function placeWithoutOverlap(w, h, rects) {
  const maxTries = 40;
  for (let t = 0; t < maxTries; t++) {
    const x = Math.random() * Math.max(0.001, 1 - w);
    const y = Math.random() * Math.max(0.001, 1 - h);
    const collides = rects.some(r =>
      x < r.x + r.w &&
      x + w > r.x &&
      y < r.y + r.h &&
      y + h > r.y
    );
    if (!collides) return { x, y };
  }
  return { x: Math.random() * Math.max(0.001, 1 - w), y: Math.random() * Math.max(0.001, 1 - h) };
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function renderHome(data, { slug, lang }) {
  applyTranslations();

  const items = data.proyectos
    .filter(p => p.visible !== false)
    .map(p => ({
      slug: p.slug,
      label: pickLang(p.nombre, lang),
      mirilla: `data/${carpetaOf(p)}/mirilla.webp`,
      sinopsis: pickLang(p.sinopsis, lang),
      bio_fragmento: pickLang(p.bio_fragmento, lang)
    }));

  let activeIndex = items.findIndex(i => i.slug === slug);
  if (activeIndex < 0) activeIndex = 0;

  const cloudEl     = document.getElementById("cloud");
  const mirillaEl   = document.getElementById("mirilla-link");
  const mirillaImg  = mirillaEl.querySelector(".mirilla__img");
  const synopsisEl  = document.querySelector("#view-home .synopsis");
  const bioFragEl   = document.querySelector("#view-home .bio-frag");
  const projectInfo = document.querySelector("#view-home .project-info");
  const favicon     = document.getElementById("favicon");

  // build the cloud
  cloudEl.innerHTML = "";
  const order = shuffled(items.map((_, i) => i));
  const links = new Array(items.length);
  order.forEach(i => {
    const item = items[i];
    const a = document.createElement("a");
    a.className = "cloud__item";
    a.textContent = item.label;
    a.href = homeHash(lang, item.slug);
    a.dataset.slug = item.slug;
    a.dataset.index = String(i);
    cloudEl.appendChild(a);
    links[i] = a;
  });

  function measureMaxTextHeight() {
    if (!projectInfo) return 0;
    const ghost = projectInfo.cloneNode(true);
    ghost.style.cssText = "position:absolute;visibility:hidden;left:-99999px;top:0;";
    ghost.style.width = projectInfo.getBoundingClientRect().width + "px";
    document.body.appendChild(ghost);
    const gSyn = ghost.querySelector(".synopsis");
    const gBio = ghost.querySelector(".bio-frag");
    let max = 0;
    items.forEach(it => {
      gSyn.textContent = it.sinopsis;
      gBio.textContent = it.bio_fragmento;
      const h = ghost.getBoundingClientRect().height;
      if (h > max) max = h;
    });
    document.body.removeChild(ghost);
    return Math.ceil(max);
  }

  function applyTextReserve() {
    const max = measureMaxTextHeight();
    if (max > 0) projectInfo.style.minHeight = max + "px";
  }

  function layoutCloud() {
    const box = cloudEl.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const placed = [];
    order.forEach(i => {
      const a = links[i];
      a.style.left = "0"; a.style.top = "0";
      const r = a.getBoundingClientRect();
      const w = r.width / box.width;
      const h = r.height / box.height;
      const pos = placeWithoutOverlap(w, h, placed);
      placed.push({ x: pos.x, y: pos.y, w, h });
      a.style.left = (pos.x * 100) + "%";
      a.style.top  = (pos.y * 100) + "%";
    });
  }

  requestAnimationFrame(() => {
    applyTextReserve();
    layoutCloud();
  });

  cloudEl.addEventListener("click", (e) => {
    const a = e.target.closest(".cloud__item");
    if (!a) return;
    e.preventDefault();
    const i = Number(a.dataset.index);
    if (i === activeIndex) {
      location.hash = projectHash(lang, items[i].slug);
      return;
    }
    setActive(i);
    history.replaceState(null, "", homeHash(lang, items[i].slug));
  });

  let rto;
  const onResize = () => {
    clearTimeout(rto);
    rto = setTimeout(() => { applyTextReserve(); layoutCloud(); }, 180);
  };
  if (cloudEl.__resizeHandler) window.removeEventListener("resize", cloudEl.__resizeHandler);
  cloudEl.__resizeHandler = onResize;
  window.addEventListener("resize", onResize);

  let swapToken = 0;
  function swapMirilla(newSrc, animate) {
    if (!animate) {
      mirillaImg.src = newSrc;
      return;
    }
    const tok = ++swapToken;
    // expose the incoming image to the ::after reveal layer.
    // CSS url() resolves relative to the STYLESHEET (/css/...), not the
    // document, so we pass an absolute URL so the reveal layer actually
    // loads the image instead of 404-ing and staying black.
    const absSrc = new URL(newSrc, document.baseURI).href;
    mirillaEl.style.setProperty("--next-img", `url("${absSrc}")`);
    mirillaEl.classList.add("is-swapping");
    // at the end, adopt the new src on the main img and reset
    setTimeout(() => {
      if (tok !== swapToken) return;
      mirillaImg.src = newSrc;
      mirillaEl.classList.remove("is-swapping");
      mirillaEl.style.removeProperty("--next-img");
    }, SWAP_TOTAL_MS);
  }

  function setActive(i, { firstRun } = {}) {
    activeIndex = i;
    const p = items[i];
    if (!p) return;

    links.forEach((a, k) => {
      a.dataset.active = String(k === i);
    });

    const currentSrc = mirillaImg.getAttribute("src");
    if (currentSrc !== p.mirilla) {
      swapMirilla(p.mirilla, !firstRun);
    }

    synopsisEl.textContent = p.sinopsis;
    bioFragEl.textContent  = p.bio_fragmento;
    mirillaEl.href = projectHash(lang, p.slug);
    if (favicon) favicon.href = p.mirilla;

    document.title = `${p.label} · pol roig`;
  }

  setActive(activeIndex, { firstRun: true });
}
