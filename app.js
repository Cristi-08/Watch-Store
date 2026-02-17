/**
 * Basic "content from JSON" loader.
 * - Client edits content.json (text/images).
 * - This script fetches it and updates elements by id.
 *
 * Note: this is for convenience, not security.
 */
async function loadContent() {
  try {
    // Cache-bust so you see changes immediately while developing
    const res = await fetch(`content.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load content.json (${res.status})`);

    const content = await res.json();

    // Backwards compatible:
    // - old format: { text: {...}, images: {...} }
    // - new format: { global: {text, images}, pages: { pageKey: {text, images} } }
    const pageKey = getPageKey();

    const mergedText = {
      ...(content?.global?.text || {}),
      ...(content?.pages?.[pageKey]?.text || {}),
      ...(content?.text || {}) // keep old format working
    };

    const mergedImages = {
      ...(content?.global?.images || {}),
      ...(content?.pages?.[pageKey]?.images || {}),
      ...(content?.images || {}) // keep old format working
    };

    const mergedPlaceholders = {
      ...(content?.global?.placeholders || {}),
      ...(content?.pages?.[pageKey]?.placeholders || {}),
      ...(content?.placeholders || {}) // keep old format working
    };

    applyText(mergedText);
    applyImages(mergedImages);
    applyPlaceholders(mergedPlaceholders);
  } catch (err) {
    console.warn("Content JSON not applied:", err);
  }
}

function getPageKey() {
  // Examples:
  // /index.html -> index
  // /shop.html -> shop
  // /about_us.html -> about_us
  // / -> index (common on servers)
  const path = (window.location.pathname || "").toLowerCase();
  const file = path.split("/").pop() || "";
  if (!file || file === "/") return "index";
  if (file.endsWith(".html")) return file.slice(0, -5);
  return "index";
}

function applyText(textMap) {
  if (!textMap || typeof textMap !== "object") return;

  for (const [id, value] of Object.entries(textMap)) {
    const el = document.getElementById(id);
    if (!el) continue;

    // Allow basic HTML inside strings (e.g., <b>, &copy;).
    // If you want ONLY plain text, replace innerHTML with textContent.
    el.innerHTML = String(value);
  }
}

function applyImages(imageMap) {
  if (!imageMap || typeof imageMap !== "object") return;

  for (const [id, cfg] of Object.entries(imageMap)) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (!(el instanceof HTMLImageElement)) continue;

    if (cfg && typeof cfg === "object") {
      if (typeof cfg.src === "string") el.src = cfg.src;
      if (typeof cfg.alt === "string") el.alt = cfg.alt;
    }
  }
}

function applyPlaceholders(placeholderMap) {
  if (!placeholderMap || typeof placeholderMap !== "object") return;

  for (const [id, value] of Object.entries(placeholderMap)) {
    const el = document.getElementById(id);
    if (!el) continue;
    // Support input and textarea elements
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.placeholder = String(value);
    }
  }
}

// Run after HTML is parsed (script is loaded with defer, but safe anyway).
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadContent);
} else {
  loadContent();
}

