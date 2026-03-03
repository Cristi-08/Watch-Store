/**
 * wishlist.js — shared wishlist logic for the Watch Store.
 *
 * localStorage key: "wishlist"
 * Stored value: JSON array of objects:
 *   { id, brand, model, details, img }
 */

// ─── Core helpers ────────────────────────────────────────────────────────────

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem("wishlist")) || [];
  } catch {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem("wishlist", JSON.stringify(list));
}

function isWishlisted(id) {
  return getWishlist().some((item) => item.id === id);
}

/**
 * Toggle an item in the wishlist.
 * @param {{ id, brand, model, details, img }} item
 * @returns {boolean} true if now in wishlist, false if removed
 */
function toggleWishlist(item) {
  const list = getWishlist();
  const idx = list.findIndex((w) => w.id === item.id);
  if (idx === -1) {
    list.push(item);
    saveWishlist(list);
    return true;
  } else {
    list.splice(idx, 1);
    saveWishlist(list);
    return false;
  }
}

// ─── Heart button injection ───────────────────────────────────────────────────

/**
 * Call on pages with watch cards (shop, brand pages).
 * Injects a heart <button> into every .shop_watch-card and syncs state.
 */
function initHeartButtons() {
  const cards = document.querySelectorAll(".shop_watch-card");

  cards.forEach((card) => {
    // Gather item data from the card's children
    const img = card.querySelector("img");
    const brandEl = card.querySelector(".model, h2");
    const modelEl = card.querySelector(".description, p");
    const detailsEl = card.querySelector(".details");

    if (!img || !brandEl) return; // skip if card structure unrecognised

    // Build a stable ID from the image element id or fallback to src hash
    const id = img.id || img.src.split("/").pop().replace(/\.[^.]+$/, "");
    const brand = brandEl.textContent.trim();
    const model = modelEl ? modelEl.textContent.trim() : "";
    const details = detailsEl ? detailsEl.textContent.trim() : "";
    const imgSrc = img.src;

    const item = { id, brand, model, details, img: imgSrc };

    // Make card the anchor for absolute positioning
    card.style.position = "relative";

    // Create button
    const btn = document.createElement("button");
    btn.className = "wishlist-btn";
    btn.setAttribute("aria-label", isWishlisted(id) ? "Remove from wishlist" : "Add to wishlist");
    btn.innerHTML = isWishlisted(id) ? "❤" : "♡";
    btn.dataset.wishlisted = isWishlisted(id) ? "true" : "false";

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const added = toggleWishlist(item);
      btn.innerHTML = added ? "❤" : "♡";
      btn.dataset.wishlisted = added ? "true" : "false";
      btn.setAttribute("aria-label", added ? "Remove from wishlist" : "Add to wishlist");

      // Pop animation
      btn.classList.remove("wishlist-btn--pop");
      void btn.offsetWidth; // reflow
      btn.classList.add("wishlist-btn--pop");
    });

    card.appendChild(btn);
  });
}

// ─── Wishlist page renderer ───────────────────────────────────────────────────

/**
 * Call only on wishlist.html.
 * Renders wishlist items into #wishlist-grid,
 * or shows #wishlist-empty when the list is empty.
 */
function renderWishlistPage() {
  const grid = document.getElementById("wishlist-grid");
  const empty = document.getElementById("wishlist-empty");
  const count = document.getElementById("wishlist-count");

  if (!grid) return;

  function render() {
    const list = getWishlist();
    grid.innerHTML = "";

    if (count) count.textContent = list.length;

    if (list.length === 0) {
      if (empty) empty.style.display = "block";
      grid.style.display = "none";
      return;
    }

    if (empty) empty.style.display = "none";
    grid.style.display = "flex";

    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "shop_watch-card wishlist-page-card";

      card.innerHTML = `
        <img src="${item.img}" alt="${item.brand} ${item.model}" class="watch-img">
        <h2 class="model">${item.brand}</h2>
        ${item.model ? `<p class="description">${item.model}</p>` : ""}
        ${item.details ? `<p class="details">${item.details}</p>` : ""}
        <button class="wishlist-remove-btn" aria-label="Remove from wishlist">Remove ✕</button>
      `;

      card.querySelector(".wishlist-remove-btn").addEventListener("click", () => {
        toggleWishlist(item); // removes it
        render(); // re-render
      });

      grid.appendChild(card);
    });
  }

  render();
}

// ─── Auto-init ────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Inject hearts on shop / brand pages
  if (document.querySelector(".shop_watch-card")) {
    // Don't inject hearts on the wishlist page itself (it has remove buttons)
    if (!document.getElementById("wishlist-grid")) {
      initHeartButtons();
    }
  }

  // Render wishlist page
  if (document.getElementById("wishlist-grid")) {
    renderWishlistPage();
  }
});
