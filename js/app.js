/**
 * pol roig · SPA entry point
 *
 * Single data source: data/data.json.
 * Hash-based routing. Two views: home (mirilla + project cloud) and proyecto.
 *
 * Routes
 *   #/                          → home, default lang, first visible project
 *   #/<lang>                    → home, lang, first visible project
 *   #/<slug>                    → home, default lang, slug
 *   #/<slug>/<lang>             → home, lang, slug
 *   #/proyecto/<slug>           → project, default lang
 *   #/proyecto/<slug>/<lang>    → project, lang
 */

import { renderHome } from "./home.js";
import { renderProject } from "./project.js";
import { initLangMenu, setLang, updateLangLinks } from "./i18n.js";

const DATA_URL = "data/data.json";

const state = {
  data: null,
  currentView: null
};

async function boot() {
  state.data = await fetch(DATA_URL).then(r => r.json());
  initLangMenu({ onChangeHash: route });
  window.addEventListener("hashchange", route);
  route();
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "").replace(/\/$/, "");
  const parts = raw ? raw.split("/").filter(Boolean) : [];
  const langs = state.data.idiomas;
  const visibleSlugs = state.data.proyectos
    .filter(p => p.visible !== false)
    .map(p => p.slug);
  const isLang = s => langs.includes(s);
  const isSlug = s => visibleSlugs.includes(s);

  if (parts[0] === "proyecto" && isSlug(parts[1])) {
    return {
      view: "project",
      slug: parts[1],
      lang: isLang(parts[2]) ? parts[2] : state.data.idioma_defecto
    };
  }

  const defaultSlug = state.data.proyectos.find(p => p.visible !== false)?.slug || null;
  if (parts.length === 0) {
    return { view: "home", slug: defaultSlug, lang: state.data.idioma_defecto };
  }
  if (parts.length === 1 && isLang(parts[0])) {
    return { view: "home", slug: defaultSlug, lang: parts[0] };
  }
  if (parts.length === 1 && isSlug(parts[0])) {
    return { view: "home", slug: parts[0], lang: state.data.idioma_defecto };
  }
  if (parts.length === 2 && isSlug(parts[0]) && isLang(parts[1])) {
    return { view: "home", slug: parts[0], lang: parts[1] };
  }

  return { view: "home", slug: null, lang: state.data.idioma_defecto };
}

function showView(name) {
  document.getElementById("view-home").hidden    = name !== "home";
  document.getElementById("view-project").hidden = name !== "project";
}

function route() {
  const r = parseHash();
  const viewChanged = state.currentView && state.currentView !== r.view;
  state.currentView = r.view;

  const proj = state.data.proyectos.find(p => p.slug === r.slug);
  if (proj) {
    const name = typeof proj.nombre === "string"
      ? proj.nombre
      : (proj.nombre[r.lang] || proj.nombre.cat);
    document.title = `${name} · pol roig`;
  }

  const apply = () => {
    setLang(r.lang, state.data);
    document.documentElement.lang = r.lang === "cat" ? "ca" : r.lang;
    showView(r.view);

    if (r.view === "home") {
      renderHome(state.data, { slug: r.slug, lang: r.lang });
    } else {
      renderProject(state.data, { slug: r.slug, lang: r.lang });
    }

    updateLangLinks(r);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  if (viewChanged && document.startViewTransition) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
}

boot();
