/**
 * Minimal i18n helpers.
 * Reads translations from data.json (already loaded in memory).
 */

let currentLang = "cat";
let currentI18n = {};

/**
 * Pick the right localisation for a value. Accepts either:
 *   - a string: returned as-is (same text in every language)
 *   - an object { cat, es, en }: the entry for `lang`, falling back to cat
 *   - null/undefined: empty string
 */
export function pickLang(val, lang = currentLang) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  return val[lang] ?? val.cat ?? "";
}

export function setLang(lang, data) {
  currentLang = lang;
  currentI18n = data.i18n || {};
  applyTranslations();
  const label = document.querySelector(".lang__current");
  if (label) label.textContent = lang;
}

export function t(key) {
  return currentI18n[currentLang]?.[key] ?? key;
}

export function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const v = t(el.dataset.i18n);
    if (v) el.textContent = v;
  });
  root.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
    const v = t(el.dataset.i18nAriaLabel);
    if (v) el.setAttribute("aria-label", v);
  });
}

/* ---------- hash URL helpers ---------- */

export function homeHash(lang, slug, defaultLang = "cat") {
  let h = "#/";
  if (slug) h += slug + "/";
  if (lang && lang !== defaultLang) h += lang + "/";
  return h.replace(/\/\/$/, "/");
}

export function projectHash(lang, slug, defaultLang = "cat") {
  let h = "#/proyecto/" + slug + "/";
  if (lang && lang !== defaultLang) h += lang + "/";
  return h;
}

/* ---------- language menu ---------- */

export function initLangMenu({ onChangeHash } = {}) {
  const toggle = document.querySelector(".lang__toggle");
  const menu   = document.querySelector(".lang__menu");
  const lang   = document.querySelector(".lang");
  if (!toggle || !menu || !lang) return;

  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    setOpen(menu.hidden);
  });

  // close on outside click (clicks inside .lang are ignored)
  document.addEventListener("click", (e) => {
    if (menu.hidden) return;
    if (lang.contains(e.target)) return;
    setOpen(false);
  });

  // event delegation on the menu — survives any future re-render and doesn't
  // depend on listeners attached at init time
  menu.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-lang]");
    if (!a) return;
    e.preventDefault();
    const h = a.dataset.href;
    if (h) location.hash = h;
    setOpen(false);
  });
}

/** Called after each route change so the lang menu points to the same view in each lang. */
export function updateLangLinks(route) {
  const menu = document.querySelector(".lang__menu");
  if (menu) {
    menu.querySelectorAll("a[data-lang]").forEach(a => {
      const lang = a.dataset.lang;
      const hash = route.view === "project"
        ? projectHash(lang, route.slug)
        : homeHash(lang, route.slug);
      a.dataset.href = hash;
      a.setAttribute("aria-current", lang === currentLang ? "true" : "false");
    });
  }
  // logo always points to the bio slot in the current lang
  const logo = document.querySelector(".logo");
  if (logo) logo.href = homeHash(currentLang, "bio");
}
