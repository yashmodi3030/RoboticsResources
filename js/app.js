/**
 * Robotics Resources Showcase Application Logic
 * Minimalist & Editorial UI (Claude Light / Monochrome Dark)
 * Includes Cursor Spotlight Illumination & Theme Switching
 */

(function () {
  // State
  const state = {
    theme: localStorage.getItem("robotics_theme") || "dark",
    searchQuery: "",
    selectedCategory: "all",
    selectedType: "all",
    selectedPhase: "all",
    favoritesOnly: false,
    viewMode: localStorage.getItem("robotics_view_mode") || "grid", // "grid" or "list"
    favorites: JSON.parse(localStorage.getItem("robotics_favorites") || "[]")
  };

  // DOM Elements
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const searchInput = document.getElementById("searchInput");
  const searchClearBtn = document.getElementById("searchClearBtn");
  const categoriesContainer = document.getElementById("categoriesContainer");
  const formatChipsContainer = document.getElementById("formatChipsContainer");
  const roadmapContainer = document.getElementById("roadmapContainer");
  const resourcesGrid = document.getElementById("resourcesGrid");
  const resultsCountEl = document.getElementById("resultsCount");
  const activeFiltersContainer = document.getElementById("activeFiltersContainer");
  const favFilterBtn = document.getElementById("favFilterBtn");
  const favCountBadge = document.getElementById("favCountBadge");
  const viewGridBtn = document.getElementById("viewGridBtn");
  const viewListBtn = document.getElementById("viewListBtn");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalContainer = document.getElementById("modalContainer");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const toastContainer = document.getElementById("toastContainer");
  const backToTopBtn = document.getElementById("backToTopBtn");

  // Format Types Definition
  const FORMAT_TYPES = [
    { id: "all", name: "All Types" },
    { id: "playlist", name: "Playlists" },
    { id: "video", name: "Videos" },
    { id: "github", name: "GitHub Repos" },
    { id: "course", name: "Courses" },
    { id: "paper", name: "Papers" },
    { id: "book", name: "Books" }
  ];

  // Initialize
  function init() {
    initTheme();
    initCursorSpotlight();
    renderCategories();
    renderFormatChips();
    renderRoadmap();
    renderResources();
    updateFavoriteCountBadge();
    initCounters();
    attachEventListeners();
    updateViewModeUI();
  }

  // Theme Management
  function initTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
  }

  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", state.theme);
    localStorage.setItem("robotics_theme", state.theme);
    window.dispatchEvent(new CustomEvent("themechanged", { detail: { theme: state.theme } }));
    showToast(`Switched to ${state.theme === "dark" ? "Dark (Black & White)" : "Light (Claude Warm Orange)"} mode`);
  }

  // Hovering Cursor Spotlight Illumination
  function initCursorSpotlight() {
    window.addEventListener("pointermove", (e) => {
      document.documentElement.style.setProperty("--cursor-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${e.clientY}px`);
    });
  }

  // Render Category Filter Pills
  function renderCategories() {
    if (!categoriesContainer) return;
    categoriesContainer.innerHTML = CATEGORIES.map((cat) => {
      const count = cat.id === "all" ? RESOURCES.length : RESOURCES.filter((r) => r.category === cat.id).length;
      const isActive = state.selectedCategory === cat.id;
      return `
        <button class="category-pill ${isActive ? "active" : ""}" data-category="${cat.id}">
          <span>${cat.name}</span>
          <span class="pill-count">${count}</span>
        </button>
      `;
    }).join("");

    categoriesContainer.querySelectorAll(".category-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        const catId = btn.dataset.category;
        state.selectedCategory = catId;
        state.selectedPhase = "all";
        updateActiveCategoryUI();
        updateActiveRoadmapUI();
        renderResources();
      });
    });
  }

  // Render Format Type Chips
  function renderFormatChips() {
    if (!formatChipsContainer) return;
    formatChipsContainer.innerHTML = `
      <span class="format-label">Type:</span>
      ${FORMAT_TYPES.map((type) => {
        const isActive = state.selectedType === type.id;
        return `
          <button class="format-chip ${isActive ? "active" : ""}" data-type="${type.id}">
            ${type.name}
          </button>
        `;
      }).join("")}
    `;

    formatChipsContainer.querySelectorAll(".format-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.selectedType = chip.dataset.type;
        updateActiveFormatUI();
        renderResources();
      });
    });
  }

  // Render Interactive Learning Roadmap
  function renderRoadmap() {
    if (!roadmapContainer) return;
    roadmapContainer.innerHTML = ROADMAP_STEPS.map((step) => {
      const isActive = state.selectedPhase === step.phase;
      return `
        <div class="roadmap-card ${isActive ? "active" : ""}" data-phase="${step.phase}">
          <div class="roadmap-card-header">
            <span class="roadmap-step-pill">Step 0${step.step}</span>
            <span class="roadmap-dot"></span>
          </div>
          <h3 class="roadmap-title">${step.title}</h3>
          <div class="roadmap-subtitle">${step.subtitle}</div>
          <p class="roadmap-desc">${step.description}</p>
          <div class="roadmap-footer">
            <span>${step.tags.join(" • ")}</span>
            <span class="roadmap-action-hint">Explore &rarr;</span>
          </div>
        </div>
      `;
    }).join("");

    roadmapContainer.querySelectorAll(".roadmap-card").forEach((card) => {
      card.addEventListener("click", () => {
        const phase = card.dataset.phase;
        if (state.selectedPhase === phase) {
          state.selectedPhase = "all";
        } else {
          state.selectedPhase = phase;
          state.selectedCategory = "all";
        }
        updateActiveRoadmapUI();
        updateActiveCategoryUI();
        renderResources();

        document.getElementById("explorer")?.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  // Filter Resources Logic
  function getFilteredResources() {
    return RESOURCES.filter((res) => {
      if (state.selectedCategory !== "all" && res.category !== state.selectedCategory) {
        return false;
      }

      if (state.selectedType !== "all") {
        if (state.selectedType === "playlist" && res.type !== "playlist") return false;
        if (state.selectedType === "video" && res.type !== "video" && res.type !== "youtube") return false;
        if (state.selectedType === "github" && res.type !== "github") return false;
        if (state.selectedType === "course" && res.type !== "course") return false;
        if (state.selectedType === "paper" && res.type !== "paper") return false;
        if (state.selectedType === "book" && res.type !== "book") return false;
      }

      if (state.selectedPhase !== "all" && res.phase !== state.selectedPhase) {
        return false;
      }

      if (state.favoritesOnly && !state.favorites.includes(res.id)) {
        return false;
      }

      if (state.searchQuery.trim() !== "") {
        const q = state.searchQuery.toLowerCase().trim();
        const inTitle = res.title.toLowerCase().includes(q);
        const inDesc = res.description.toLowerCase().includes(q);
        const inTip = res.proTip ? res.proTip.toLowerCase().includes(q) : false;
        const inCat = res.categoryName.toLowerCase().includes(q);
        const inTags = res.tags.some((t) => t.toLowerCase().includes(q));
        const inAuthor = res.author ? res.author.toLowerCase().includes(q) : false;

        if (!inTitle && !inDesc && !inTip && !inCat && !inTags && !inAuthor) {
          return false;
        }
      }

      return true;
    });
  }

  // Render Resources (Grid or List View)
  function renderResources() {
    const filtered = getFilteredResources();

    if (resultsCountEl) {
      resultsCountEl.innerHTML = `Showing <strong>${filtered.length}</strong> of ${RESOURCES.length} resources`;
    }

    renderActiveFilters();

    if (filtered.length === 0) {
      resourcesGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3 class="empty-title">No matching resources found</h3>
          <p class="empty-desc">Try resetting your search query or removing filters.</p>
          <button class="nav-btn nav-btn-primary" id="resetAllBtn">Reset All Filters</button>
        </div>
      `;
      document.getElementById("resetAllBtn")?.addEventListener("click", resetAllFilters);
      return;
    }

    if (state.viewMode === "grid") {
      resourcesGrid.className = "resources-grid";
      resourcesGrid.innerHTML = filtered.map((res) => renderCardHTML(res)).join("");
    } else {
      resourcesGrid.className = "resources-list";
      resourcesGrid.innerHTML = filtered.map((res) => renderListItemHTML(res)).join("");
    }

    attachCardInteractions();
  }

  // Search Match Highlighter
  function highlightText(text, query) {
    if (!query || !query.trim()) return text;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, '<mark style="background: var(--accent-subtle); color: var(--accent-primary); padding: 0 2px; border-radius: 2px; font-weight: 600;">$1</mark>');
  }

  // Card HTML Template
  function renderCardHTML(res) {
    const isFav = state.favorites.includes(res.id);
    const highlightedTitle = highlightText(res.title, state.searchQuery);
    const highlightedDesc = highlightText(res.description, state.searchQuery);
    const highlightedTip = res.proTip ? highlightText(res.proTip, state.searchQuery) : null;

    return `
      <article class="resource-card" data-id="${res.id}">
        <div class="card-top-meta">
          <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
            <span class="domain-badge">${res.categoryName}</span>
            ${res.recommended || res.isNew ? `<span class="domain-badge" style="background: var(--accent-subtle); color: var(--accent-primary); border-color: var(--border-active);">⭐ Recommended</span>` : ""}
          </div>
          <span class="type-badge">${res.typeName}</span>
        </div>

        <h3 class="card-title">
          <a href="${res.url}" target="_blank" rel="noopener noreferrer">${highlightedTitle}</a>
        </h3>

        <p class="card-description">${highlightedDesc}</p>

        ${highlightedTip ? `
          <div class="pro-tip-box">
            <svg class="pro-tip-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18h6"></path>
              <path d="M10 22h4"></path>
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
            </svg>
            <div class="pro-tip-text">
              <strong>Tinkerers Note</strong>
              ${highlightedTip}
            </div>
          </div>
        ` : ""}

        <div class="card-tags">
          ${res.tags.map((t) => `<span class="card-tag">#${t}</span>`).join("")}
        </div>

        <div class="card-actions">
          <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="btn-open-resource">
            <span>Open Link</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M7 17l9.2-9.2M17 17V8H8"></path>
            </svg>
          </a>

          <div class="card-icon-actions">
            <button class="btn-icon-action btn-copy-link" data-url="${res.url}" title="Copy Link" aria-label="Copy Link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="btn-icon-action btn-quick-view" data-id="${res.id}" title="Quick Details" aria-label="Quick Details">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
            <button class="btn-icon-action btn-fav ${isFav ? "starred" : ""}" data-id="${res.id}" title="${isFav ? "Remove Favorite" : "Save Favorite"}" aria-label="Favorite">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // Compact List Item HTML Template
  function renderListItemHTML(res) {
    const isFav = state.favorites.includes(res.id);
    return `
      <div class="resource-list-item" data-id="${res.id}">
        <div class="list-item-left">
          <span class="type-badge">${res.typeName}</span>
          <div class="list-item-content">
            <h4 class="list-item-title">
              <a href="${res.url}" target="_blank" rel="noopener noreferrer">${res.title}</a>
            </h4>
            ${res.proTip ? `
              <div class="list-item-tip">
                <span>💡</span> <span>${res.proTip}</span>
              </div>
            ` : `<span style="font-size: 0.78rem; color: var(--text-muted);">${res.categoryName} • ${res.tags.slice(0, 3).join(", ")}</span>`}
          </div>
        </div>

        <div class="list-item-actions">
          <button class="btn-icon-action btn-copy-link" data-url="${res.url}" title="Copy Link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="btn-icon-action btn-fav ${isFav ? "starred" : ""}" data-id="${res.id}" title="Favorite">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
          <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="nav-btn nav-btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">
            Visit &rarr;
          </a>
        </div>
      </div>
    `;
  }

  // Active Filter Chips
  function renderActiveFilters() {
    if (!activeFiltersContainer) return;
    const chips = [];

    if (state.selectedCategory !== "all") {
      const cat = CATEGORIES.find((c) => c.id === state.selectedCategory);
      if (cat) chips.push({ label: `Domain: ${cat.name}`, key: "category" });
    }

    if (state.selectedType !== "all") {
      const type = FORMAT_TYPES.find((t) => t.id === state.selectedType);
      if (type) chips.push({ label: `Type: ${type.name}`, key: "type" });
    }

    if (state.selectedPhase !== "all") {
      const step = ROADMAP_STEPS.find((s) => s.phase === state.selectedPhase);
      if (step) chips.push({ label: `Step ${step.step}: ${step.title}`, key: "phase" });
    }

    if (state.favoritesOnly) {
      chips.push({ label: "⭐ Starred", key: "favorites" });
    }

    if (state.searchQuery.trim()) {
      chips.push({ label: `"${state.searchQuery}"`, key: "query" });
    }

    if (chips.length > 0) {
      activeFiltersContainer.innerHTML = `
        <div class="active-filters-chips">
          ${chips.map((c) => `
            <span class="category-pill active" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;">
              ${c.label}
            </span>
          `).join("")}
          <button class="reset-filters-btn" id="clearAllFiltersBtn">Reset</button>
        </div>
      `;
      document.getElementById("clearAllFiltersBtn")?.addEventListener("click", resetAllFilters);
    } else {
      activeFiltersContainer.innerHTML = "";
    }
  }

  // Reset All Filters
  function resetAllFilters() {
    state.searchQuery = "";
    state.selectedCategory = "all";
    state.selectedType = "all";
    state.selectedPhase = "all";
    state.favoritesOnly = false;
    if (searchInput) searchInput.value = "";
    if (searchClearBtn) searchClearBtn.style.display = "none";
    if (favFilterBtn) favFilterBtn.classList.remove("active");
    updateActiveCategoryUI();
    updateActiveFormatUI();
    updateActiveRoadmapUI();
    renderResources();
  }

  // Card Interactions & Cursor Spotlight Illumination on cards
  function attachCardInteractions() {
    // Spotlight Illumination tracking on interactive cards
    document.querySelectorAll(".resource-card, .roadmap-card, .metric-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
    });

    // Copy Link Buttons
    document.querySelectorAll(".btn-copy-link").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const url = btn.dataset.url;
        navigator.clipboard.writeText(url).then(() => {
          showToast("Link copied to clipboard!");
        }).catch(() => {
          showToast("Failed to copy link.");
        });
      });
    });

    // Favorite Buttons
    document.querySelectorAll(".btn-fav").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        toggleFavorite(id);
      });
    });

    // Quick View Buttons
    document.querySelectorAll(".btn-quick-view").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        openModal(id);
      });
    });
  }

  // Toggle Favorite
  function toggleFavorite(id) {
    const idx = state.favorites.indexOf(id);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
      showToast("Removed from Starred list");
    } else {
      state.favorites.push(id);
      showToast("Saved to Starred list! ⭐");
    }
    localStorage.setItem("robotics_favorites", JSON.stringify(state.favorites));
    updateFavoriteCountBadge();
    renderResources();
  }

  function updateFavoriteCountBadge() {
    if (favCountBadge) {
      favCountBadge.textContent = state.favorites.length;
    }
  }

  // Toast Notification
  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("toast-out");
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  }

  // Quick View Modal
  function openModal(id) {
    const res = RESOURCES.find((r) => r.id === id);
    if (!res || !modalContainer || !modalOverlay) return;

    const isFav = state.favorites.includes(res.id);

    modalContainer.innerHTML = `
      <div class="modal-header">
        <div>
          <span class="domain-badge" style="margin-bottom: 0.4rem;">${res.categoryName}</span>
          <h2 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">
            ${res.title}
          </h2>
        </div>
        <button class="modal-close-btn" id="modalCloseInnerBtn" aria-label="Close modal">✕</button>
      </div>

      <div class="modal-body">
        <p style="color: var(--text-secondary); line-height: 1.6;">${res.description}</p>

        ${res.proTip ? `
          <div class="pro-tip-box" style="margin: 0;">
            <svg class="pro-tip-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18h6"></path>
              <path d="M10 22h4"></path>
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
            </svg>
            <div class="pro-tip-text">
              <strong>Tinkerers Lab Pro-Tip</strong>
              ${res.proTip}
            </div>
          </div>
        ` : ""}

        <div>
          <h4 style="font-family: var(--font-mono); font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.45rem;">
            Details & Keywords
          </h4>
          <div class="card-tags">
            <span class="card-tag">Format: ${res.typeName}</span>
            <span class="card-tag">Curated by: ${res.author || "Tinkerers Lab"}</span>
            ${res.tags.map((t) => `<span class="card-tag">#${t}</span>`).join("")}
          </div>
        </div>

        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.65rem 0.85rem; display: flex; align-items: center; justify-content: space-between;">
          <code style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
            ${res.url}
          </code>
          <button class="btn-icon-action btn-copy-link" data-url="${res.url}" title="Copy Link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button class="nav-btn btn-fav ${isFav ? "starred" : ""}" data-id="${res.id}">
          <span>${isFav ? "⭐ Starred" : "☆ Save to Starred"}</span>
        </button>
        <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="nav-btn nav-btn-primary">
          <span>Open in New Tab</span> &rarr;
        </a>
      </div>
    `;

    modalOverlay.classList.add("open");
    document.body.style.overflow = "hidden";

    document.getElementById("modalCloseInnerBtn")?.addEventListener("click", closeModal);
    modalContainer.querySelector(".btn-copy-link")?.addEventListener("click", () => {
      navigator.clipboard.writeText(res.url).then(() => showToast("Link copied!"));
    });
    modalContainer.querySelector(".btn-fav")?.addEventListener("click", () => {
      toggleFavorite(res.id);
      openModal(res.id);
    });
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  // Update UI helpers
  function updateActiveCategoryUI() {
    categoriesContainer?.querySelectorAll(".category-pill").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.category === state.selectedCategory);
    });
  }

  function updateActiveFormatUI() {
    formatChipsContainer?.querySelectorAll(".format-chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.type === state.selectedType);
    });
  }

  function updateActiveRoadmapUI() {
    roadmapContainer?.querySelectorAll(".roadmap-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.phase === state.selectedPhase);
    });
  }

  function updateViewModeUI() {
    if (viewGridBtn && viewListBtn) {
      viewGridBtn.classList.toggle("active", state.viewMode === "grid");
      viewListBtn.classList.toggle("active", state.viewMode === "list");
    }
  }

  // Metric Counters
  function initCounters() {
    const counterElements = document.querySelectorAll("[data-counter-target]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.counterTarget, 10);
          animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counterElements.forEach((el) => observer.observe(el));
  }

  function animateCounter(el, target) {
    let current = 0;
    const duration = 1000;
    const stepTime = 25;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        el.textContent = target + (el.dataset.counterSuffix || "");
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current) + (el.dataset.counterSuffix || "");
      }
    }, stepTime);
  }

  // Event Listeners
  function attachEventListeners() {
    // Theme Toggle
    themeToggleBtn?.addEventListener("click", toggleTheme);

    // Real-time Search
    let debounceTimer;
    searchInput?.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.style.display = val ? "flex" : "none";
      }
      debounceTimer = setTimeout(() => {
        state.searchQuery = val;
        renderResources();
      }, 120);
    });

    searchClearBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      state.searchQuery = "";
      searchClearBtn.style.display = "none";
      renderResources();
      searchInput?.focus();
    });

    // Favorites Filter
    favFilterBtn?.addEventListener("click", () => {
      state.favoritesOnly = !state.favoritesOnly;
      favFilterBtn.classList.toggle("active", state.favoritesOnly);
      renderResources();
    });

    // View Mode Toggles
    viewGridBtn?.addEventListener("click", () => {
      state.viewMode = "grid";
      localStorage.setItem("robotics_view_mode", "grid");
      updateViewModeUI();
      renderResources();
    });

    viewListBtn?.addEventListener("click", () => {
      state.viewMode = "list";
      localStorage.setItem("robotics_view_mode", "list");
      updateViewModeUI();
      renderResources();
    });

    // Modal Close
    modalCloseBtn?.addEventListener("click", closeModal);
    modalOverlay?.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    // Scroll To Top
    window.addEventListener("scroll", () => {
      if (window.scrollY > 350) {
        backToTopBtn?.classList.add("visible");
      } else {
        backToTopBtn?.classList.remove("visible");
      }
    });

    backToTopBtn?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput?.focus();
      }

      if (e.key === "Escape") {
        if (modalOverlay?.classList.contains("open")) {
          closeModal();
        } else if (searchInput && document.activeElement === searchInput) {
          searchInput.value = "";
          state.searchQuery = "";
          searchClearBtn.style.display = "none";
          renderResources();
          searchInput.blur();
        }
      }

      if ((e.key === "b" || e.key === "B") && document.activeElement !== searchInput) {
        state.favoritesOnly = !state.favoritesOnly;
        favFilterBtn?.classList.toggle("active", state.favoritesOnly);
        renderResources();
      }

      // 'T' or 't' to toggle theme when not in search input
      if ((e.key === "t" || e.key === "T") && document.activeElement !== searchInput) {
        toggleTheme();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
