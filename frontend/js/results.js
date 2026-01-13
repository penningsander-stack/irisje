// frontend/js/results.js
/* v2026-01-13 RESULTS-STABLE-INIT-NO-FALLBACK */

(() => {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com";

  // ----------------------------
  // Small helpers
  // ----------------------------
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function safeText(el, value) {
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
  }

  function getRequestIdFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get("requestId") || url.searchParams.get("id") || "";
  }

  function normalizeStr(v) {
    return String(v ?? "").trim().toLowerCase();
  }

  function digitsOnly(v) {
    return String(v ?? "").replace(/\D/g, "");
  }

  function isPostcodeNL(v) {
    // basic NL postcode check (e.g. 1234AB / 1234 AB)
    const s = normalizeStr(v).replace(/\s+/g, "");
    return /^[1-9]\d{3}[a-z]{2}$/.test(s);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getCompanyId(c) {
    return String(c?._id || c?.id || c?.companyId || c?.slug || c?.companySlug || "");
  }

  function getCompanySlug(c) {
    return String(c?.slug || c?.companySlug || "");
  }

  function getCompanyName(c) {
    return String(c?.name || c?.companyName || c?.title || c?.slug || "Bedrijf");
  }

  function getCompanyCity(c) {
    return String(c?.city || c?.place || c?.locationCity || "");
  }

  function getCompanyPostcode(c) {
    return String(c?.postcode || c?.postalCode || "");
  }

  function getCompanyScore(c) {
    const raw = c?.score ?? c?.rating ?? c?.avgRating ?? c?.avgScore;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function getCompanyVerified(c) {
    const v = c?.verified ?? c?.isVerified ?? c?.verification ?? c?.isApproved;
    return Boolean(v);
  }

  function getCompanySource(c) {
    // e.g. "irisje", "google"
    return String(c?.source || c?.reviewSource || c?.origin || "").toLowerCase();
  }

  function ensureEl(selector, createFn) {
    const found = qs(selector);
    if (found) return found;
    return createFn ? createFn() : null;
  }

  function ensureMainContainer() {
    // Try common containers first; create a minimal one if missing
    let root =
      qs("#resultsRoot") ||
      qs("[data-results-root]") ||
      qs("main") ||
      qs(".results") ||
      qs("#content") ||
      document.body;

    // Ensure list container
    let list =
      qs("#companiesList", root) ||
      qs("[data-companies-list]", root) ||
      qs(".companies-list", root) ||
      qs("#resultsList", root);

    if (!list) {
      const wrap = document.createElement("section");
      wrap.id = "resultsRoot";
      wrap.setAttribute("data-results-root", "1");
      wrap.style.maxWidth = "1100px";
      wrap.style.margin = "0 auto";
      wrap.style.padding = "16px";

      const top = document.createElement("div");
      top.id = "resultsTopBar";
      top.style.display = "flex";
      top.style.justifyContent = "space-between";
      top.style.alignItems = "center";
      top.style.gap = "12px";
      top.style.flexWrap = "wrap";

      const h = document.createElement("h1");
      h.textContent = "Bedrijven voor jouw aanvraag";
      h.style.margin = "0";
      h.style.fontSize = "20px";
      h.style.fontWeight = "700";

      const counter = document.createElement("div");
      counter.id = "selectedCount";
      counter.setAttribute("data-selected-count", "1");
      counter.textContent = "0 geselecteerd";
      counter.style.fontWeight = "600";

      top.appendChild(h);
      top.appendChild(counter);

      list = document.createElement("div");
      list.id = "companiesList";
      list.setAttribute("data-companies-list", "1");
      list.style.display = "grid";
      list.style.gridTemplateColumns = "repeat(auto-fill, minmax(280px, 1fr))";
      list.style.gap = "12px";
      list.style.marginTop = "12px";

      const actions = document.createElement("div");
      actions.id = "resultsActions";
      actions.style.marginTop = "14px";
      actions.style.display = "flex";
      actions.style.justifyContent = "flex-end";

      const btn = document.createElement("button");
      btn.id = "submitSelectionBtn";
      btn.type = "button";
      btn.textContent = "Verstuur aanvragen";
      btn.style.padding = "10px 14px";
      btn.style.borderRadius = "10px";
      btn.style.border = "1px solid #ddd";
      btn.style.background = "#fff";
      btn.style.cursor = "pointer";

      actions.appendChild(btn);

      wrap.appendChild(top);
      wrap.appendChild(list);
      wrap.appendChild(actions);

      // Put it at top of main/body
      if (root === document.body) {
        document.body.insertBefore(wrap, document.body.firstChild);
      } else {
        root.appendChild(wrap);
      }

      root = wrap;
    }

    return { root, list };
  }

  function findCounterEl() {
    return (
      qs("#selectedCount") ||
      qs("[data-selected-count]") ||
      qs(".selected-count") ||
      qs("#counter") ||
      null
    );
  }

  function findMessageEl() {
    return (
      qs("#resultsMessage") ||
      qs("[data-results-message]") ||
      qs(".results-message") ||
      qs("#noCompanies") ||
      null
    );
  }

  function findSubmitBtn() {
    return (
      qs("#submitSelectionBtn") ||
      qs("[data-submit-selection]") ||
      qs("#submitRequestsBtn") ||
      qs("#sendSelectionBtn") ||
      null
    );
  }

  function findFilterEls() {
    // We try to support various ids/names without crashing if missing.
    const cityInput =
      qs("#filterCity") ||
      qs("#cityFilter") ||
      qs('input[name="city"]') ||
      qs('input[name="place"]') ||
      qs('input[data-filter="city"]') ||
      null;

    const postcodeInput =
      qs("#filterPostcode") ||
      qs("#postcodeFilter") ||
      qs('input[name="postcode"]') ||
      qs('input[name="postalCode"]') ||
      qs('input[data-filter="postcode"]') ||
      null;

    const minScoreSelect =
      qs("#filterMinScore") ||
      qs("#minScore") ||
      qs('select[name="minScore"]') ||
      qs('select[data-filter="minScore"]') ||
      null;

    const verificationSelect =
      qs("#filterVerification") ||
      qs("#verification") ||
      qs('select[name="verification"]') ||
      qs('select[data-filter="verification"]') ||
      null;

    const sourceSelect =
      qs("#filterSource") ||
      qs("#source") ||
      qs('select[name="source"]') ||
      qs('select[data-filter="source"]') ||
      null;

    const sortSelect =
      qs("#filterSort") ||
      qs("#sort") ||
      qs('select[name="sort"]') ||
      qs('select[data-filter="sort"]') ||
      null;

    return { cityInput, postcodeInput, minScoreSelect, verificationSelect, sourceSelect, sortSelect };
  }

  // ----------------------------
  // State
  // ----------------------------
  const state = {
    requestId: "",
    request: null,
    allCompanies: [],
    viewCompanies: [],
    selectedIds: new Set(),
    initialized: false,
  };

  // ----------------------------
  // Rendering
  // ----------------------------
  function renderMessage(text, type = "info") {
    const msgEl = findMessageEl();
    if (!msgEl) return;

    msgEl.style.display = text ? "" : "none";
    msgEl.setAttribute("data-type", type);
    safeText(msgEl, text);
  }

  function updateCounter() {
    const el = findCounterEl();
    if (!el) return;
    safeText(el, `${state.selectedIds.size} geselecteerd`);
  }

  function updateSubmitBtnState() {
    const btn = findSubmitBtn();
    if (!btn) return;

    const n = state.selectedIds.size;
    const disabled = n === 0;
    btn.disabled = disabled;
    btn.setAttribute("aria-disabled", disabled ? "true" : "false");

    // If user already has styling, we won't fight it; just add a small class hook.
    btn.classList.toggle("is-disabled", disabled);
  }

  function setCardButtonState(cardBtn, companyId) {
    const selected = state.selectedIds.has(companyId);
    if (!cardBtn) return;

    cardBtn.setAttribute("data-selected", selected ? "1" : "0");
    cardBtn.textContent = selected ? "Geselecteerd" : "Selecteer";
    cardBtn.disabled = !selected && state.selectedIds.size >= 5;
    cardBtn.setAttribute("aria-pressed", selected ? "true" : "false");
  }

  function renderCompanies(listEl, companies) {
    if (!listEl) return;

    // Always clear and re-render; no fallback that hides companies.
    listEl.innerHTML = "";

    if (!Array.isArray(companies) || companies.length === 0) {
      // Only show "none" if truly none AFTER filtering
      renderMessage("Geen bedrijven gevonden voor deze aanvraag.", "empty");
      return;
    }

    renderMessage("", "info");

    const frag = document.createDocumentFragment();

    for (const c of companies) {
      const id = getCompanyId(c);
      const slug = getCompanySlug(c);
      const name = getCompanyName(c);
      const city = getCompanyCity(c);
      const pc = getCompanyPostcode(c);
      const score = getCompanyScore(c);
      const verified = getCompanyVerified(c);
      const source = getCompanySource(c);

      const card = document.createElement("article");
      card.className = "company-card";
      card.setAttribute("data-company-id", id);
      if (slug) card.setAttribute("data-company-slug", slug);

      const safeName = escapeHtml(name);
      const safeCity = escapeHtml(city);
      const safePc = escapeHtml(pc);

      // Basic markup; should work with your existing CSS, but also readable without it.
      card.innerHTML = `
        <div class="company-card__body">
          <div class="company-card__header">
            <div class="company-card__title">${safeName}</div>
            <div class="company-card__meta">
              ${safeCity ? `<span class="company-card__city">${safeCity}</span>` : ""}
              ${safePc ? `<span class="company-card__pc">${safePc}</span>` : ""}
            </div>
          </div>
          <div class="company-card__badges">
            ${score != null ? `<span class="badge badge--score">Score: ${escapeHtml(score.toFixed(1))}</span>` : ""}
            ${verified ? `<span class="badge badge--verified">Geverifieerd</span>` : ""}
            ${source ? `<span class="badge badge--source">${escapeHtml(source)}</span>` : ""}
          </div>
        </div>
        <div class="company-card__actions">
          <button type="button" class="btn-select" data-action="toggle-select">Selecteer</button>
          ${slug ? `<a class="btn-view" href="/company.html?slug=${encodeURIComponent(slug)}">Bekijk</a>` : ""}
        </div>
      `;

      const btn = qs('[data-action="toggle-select"]', card);
      setCardButtonState(btn, id);

      // Event: toggle select
      btn?.addEventListener("click", () => {
        toggleSelect(id, btn);
      });

      frag.appendChild(card);
    }

    listEl.appendChild(frag);

    // After render: enforce "max 5" disabling across all buttons
    refreshAllCardButtons();
  }

  function refreshAllCardButtons() {
    const list = qs("#companiesList") || qs("[data-companies-list]");
    if (!list) return;

    const cards = qsa(".company-card", list);
    for (const card of cards) {
      const id = card.getAttribute("data-company-id") || "";
      const btn = qs('[data-action="toggle-select"]', card);
      setCardButtonState(btn, id);
    }
  }

  function toggleSelect(companyId, btnEl) {
    if (!companyId) return;

    const selected = state.selectedIds.has(companyId);

    if (selected) {
      state.selectedIds.delete(companyId);
    } else {
      if (state.selectedIds.size >= 5) {
        // Hard stop at 5
        return;
      }
      state.selectedIds.add(companyId);
    }

    setCardButtonState(btnEl, companyId);
    updateCounter();
    updateSubmitBtnState();
    refreshAllCardButtons();
  }

  // ----------------------------
  // Filtering + sorting (applied AFTER init)
  // ----------------------------
  function getFilterState() {
    const { cityInput, postcodeInput, minScoreSelect, verificationSelect, sourceSelect, sortSelect } =
      findFilterEls();

    const city = normalizeStr(cityInput?.value || "");
    const postcode = normalizeStr(postcodeInput?.value || "");
    const minScoreRaw = String(minScoreSelect?.value ?? "").trim();
    const minScore = minScoreRaw === "" ? null : Number(minScoreRaw);

    const verification = normalizeStr(verificationSelect?.value || ""); // "", "all", "verified", "notverified"
    const source = normalizeStr(sourceSelect?.value || ""); // "", "all", "google", "irisje"
    const sort = normalizeStr(sortSelect?.value || "relevantie"); // relevatie/score-asc/score-desc/naam-asc/naam-desc

    return { city, postcode, minScore, verification, source, sort };
  }

  function applyFiltersAndSort() {
    // Requirement: filtering (plaats/postcode) pas toepassen NA init.
    if (!state.initialized) return;

    const f = getFilterState();
    let list = Array.isArray(state.allCompanies) ? [...state.allCompanies] : [];

    // City/postcode filter
    if (f.city) {
      list = list.filter((c) => normalizeStr(getCompanyCity(c)).includes(f.city));
    }

    if (f.postcode) {
      // allow partial match digits or full postcode
      const p = f.postcode.replace(/\s+/g, "");
      if (isPostcodeNL(p)) {
        list = list.filter((c) => normalizeStr(getCompanyPostcode(c)).replace(/\s+/g, "") === p);
      } else {
        const dp = digitsOnly(p);
        list = list.filter((c) => {
          const cpc = normalizeStr(getCompanyPostcode(c));
          return cpc.includes(p) || (dp && digitsOnly(cpc).includes(dp));
        });
      }
    }

    // Min score
    if (Number.isFinite(f.minScore)) {
      list = list.filter((c) => {
        const s = getCompanyScore(c);
        return s != null && s >= f.minScore;
      });
    }

    // Verification
    if (f.verification && f.verification !== "all") {
      if (f.verification === "verified") list = list.filter((c) => getCompanyVerified(c));
      if (f.verification === "notverified") list = list.filter((c) => !getCompanyVerified(c));
    }

    // Source
    if (f.source && f.source !== "all") {
      list = list.filter((c) => getCompanySource(c) === f.source);
    }

    // Sorting
    switch (f.sort) {
      case "score-desc":
      case "score":
      case "hoogste-score":
        list.sort((a, b) => (getCompanyScore(b) ?? -Infinity) - (getCompanyScore(a) ?? -Infinity));
        break;
      case "score-asc":
      case "laagste-score":
        list.sort((a, b) => (getCompanyScore(a) ?? Infinity) - (getCompanyScore(b) ?? Infinity));
        break;
      case "naam-asc":
      case "name-asc":
        list.sort((a, b) => getCompanyName(a).localeCompare(getCompanyName(b), "nl"));
        break;
      case "naam-desc":
      case "name-desc":
        list.sort((a, b) => getCompanyName(b).localeCompare(getCompanyName(a), "nl"));
        break;
      default:
        // "relevantie" -> keep backend order
        break;
    }

    state.viewCompanies = list;

    const { list: listEl } = ensureMainContainer();
    renderCompanies(listEl, state.viewCompanies);
    updateCounter();
    updateSubmitBtnState();
  }

  function bindFilterEvents() {
    const { cityInput, postcodeInput, minScoreSelect, verificationSelect, sourceSelect, sortSelect } =
      findFilterEls();

    const onChange = () => applyFiltersAndSort();
    const onInput = () => applyFiltersAndSort();

    // input events
    cityInput?.addEventListener("input", onInput);
    postcodeInput?.addEventListener("input", onInput);

    // change events
    minScoreSelect?.addEventListener("change", onChange);
    verificationSelect?.addEventListener("change", onChange);
    sourceSelect?.addEventListener("change", onChange);
    sortSelect?.addEventListener("change", onChange);
  }

  // ----------------------------
  // Submit selection (frontend-only; no backend changes here)
  // ----------------------------
  function bindSubmit() {
    const btn = findSubmitBtn();
    if (!btn) return;

    btn.addEventListener("click", () => {
      // This step is only stabilization; keep behaviour minimal and safe.
      // If you already have existing submit flow elsewhere, we do not override it here.
      // We only expose selected ids in a predictable place and emit an event.

      const selected = Array.from(state.selectedIds);

      // Store selection for next page/flow if you already use it:
      try {
        localStorage.setItem("irisje_selectedCompanies", JSON.stringify(selected));
        localStorage.setItem("irisje_selectedCompanies_requestId", state.requestId);
      } catch (e) {
        // ignore
      }

      window.dispatchEvent(
        new CustomEvent("irisje:resultsSelection", {
          detail: { requestId: state.requestId, selectedCompanyIds: selected },
        })
      );

      // If your results.html already has navigation/submit flow, it will handle it.
      // Otherwise: show a tiny message to confirm selection saved.
      if (selected.length > 0) {
        renderMessage(`Selectie opgeslagen (${selected.length}/5).`, "success");
      } else {
        renderMessage("Selecteer minimaal 1 bedrijf.", "warning");
      }
    });
  }

  // ----------------------------
  // Data loading
  // ----------------------------
  async function fetchPublicRequest(requestId) {
    const url = `${API_BASE}/api/publicRequests/${encodeURIComponent(requestId)}`;
    const r = await fetch(url, { method: "GET" });

    // Always try JSON; if not JSON, throw meaningful error.
    const text = await r.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = null;
    }

    if (!r.ok) {
      const msg =
        (data && (data.message || data.error)) ||
        `HTTP ${r.status} (${r.statusText || "error"})`;
      throw new Error(msg);
    }

    return data || {};
  }

  function extractCompanies(payload) {
    // Support multiple possible shapes without null errors
    if (Array.isArray(payload?.companies)) return payload.companies;
    if (Array.isArray(payload?.data?.companies)) return payload.data.companies;
    if (Array.isArray(payload?.request?.companies)) return payload.request.companies;
    return [];
  }

  // ----------------------------
  // Init
  // ----------------------------
  async function init() {
    state.requestId = getRequestIdFromUrl();

    const { list: listEl } = ensureMainContainer();
    updateCounter();
    updateSubmitBtnState();

    // No requestId: show message but don't crash
    if (!state.requestId) {
      renderMessage("Aanvraag-ID ontbreekt in de URL (requestId).", "error");
      renderCompanies(listEl, []);
      return;
    }

    renderMessage("Bedrijven laden…", "info");

    try {
      const payload = await fetchPublicRequest(state.requestId);

      state.request = payload?.request || payload?.data?.request || null;
      state.allCompanies = extractCompanies(payload);

      // Hard rule: bij paginalaad altijd renderen als er bedrijven zijn
      // (dus GEEN fallback die ze verbergt).
      state.initialized = true;

      // First render WITHOUT applying any filters before init completes
      state.viewCompanies = Array.isArray(state.allCompanies) ? [...state.allCompanies] : [];
      renderCompanies(listEl, state.viewCompanies);
      updateCounter();
      updateSubmitBtnState();

      // Now bind filters + apply current UI filters AFTER init
      bindFilterEvents();
      bindSubmit();

      // Apply once after init to respect requirement "filtering pas na init"
      applyFiltersAndSort();

      // Debug line (helps you confirm correct file is deployed)
      console.log("RESULTS JS STABLE INIT OK", {
        requestId: state.requestId,
        companies: state.allCompanies.length,
      });
    } catch (err) {
      state.initialized = true; // allow filter UI without blocking
      state.allCompanies = [];
      state.viewCompanies = [];

      renderMessage(`Bedrijven laden mislukt: ${err?.message || err}`, "error");
      renderCompanies(listEl, []);

      bindFilterEvents();
      bindSubmit();

      console.error("RESULTS INIT ERROR", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
