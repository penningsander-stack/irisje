// frontend/js/secure.js
//
// Doel:
// Beveiligde inlogcontrole + dynamische weergave van bedrijfsgegevens
// op het dashboard. Dit script zorgt dat "Demo Bedrijf" automatisch wordt
// vervangen door de echte bedrijfsnaam, e-mail en categorie van de ingelogde gebruiker.
//
// Werking:
// - Controleert JWT-token in localStorage.
// - Vraagt /api/auth/me op om het bedrijf te laden.
// - Toont de bedrijfsgegevens in de HTML (met data-attributes).
// - Stuurt automatisch door naar login.html als er geen geldige sessie is.
//
// Selectoren die automatisch worden gevuld (optioneel in HTML):
//   [data-company-name]
//   [data-company-email]
//   [data-company-category]
//   #logoutBtn
//
// Deze code is veilig, snel en vereist geen aanpassingen in styling.
//

(() => {
  "use strict";

  // ================= Configuratie =================
  const API_BASE =
    (window.ENV && typeof window.ENV.API_BASE === "string" && window.ENV.API_BASE) ||
    "";

  const ACCESS_TOKEN_KEY = "irisje_access_token";

  // ================= Hulpfuncties =================
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function getToken() {
    try {
      const t = localStorage.getItem(ACCESS_TOKEN_KEY);
      return typeof t === "string" && t.length > 0 ? t : null;
    } catch {
      return null;
    }
  }

  function setToken(token) {
    try {
      if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    } catch {
      /* negeren */
    }
  }

  function clearAuth() {
    setToken(null);
  }

  function decodeJwtPayload(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function isJwtExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== "number") return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now + 10; // kleine marge
  }

  async function fetchWithAuth(path, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");

    const init = {
      ...options,
      headers,
      credentials: options.credentials || "same-origin",
    };

    const res = await fetch(API_BASE + path, init);
    if (res.status === 401 || res.status === 403) {
      clearAuth();
      redirectToLogin();
      throw new Error("Unauthorized");
    }
    return res;
  }

  function redirectToLogin() {
    const loginUrl = "/login.html";
    if (location.pathname !== loginUrl) {
      location.replace(loginUrl);
    }
  }

  function requireAuth() {
    const token = getToken();
    if (!token || isJwtExpired(token)) {
      clearAuth();
      redirectToLogin();
      return false;
    }
    return true;
  }

  // ================= Profiel laden =================
  async function loadMyCompanyProfile() {
    const res = await fetchWithAuth("/api/auth/me", { method: "GET" });
    if (!res.ok) {
      throw new Error(`Failed to load profile: ${res.status}`);
    }
    const data = await res.json();

    // Verwacht object:
    // {
    //   _id: "...",
    //   name: "Bedrijfsnaam",
    //   email: "info@bedrijf.nl",
    //   category: "Categorie"
    // }
    if (!data || typeof data !== "object") {
      throw new Error("Invalid profile payload");
    }
    return data;
  }

  function injectCompanyIntoDom(profile) {
    const safe = (v) => (typeof v === "string" ? v : "");

    qsa("[data-company-name]").forEach((el) => (el.textContent = safe(profile.name)));
    qsa("[data-company-email]").forEach((el) => (el.textContent = safe(profile.email)));
    qsa("[data-company-category]").forEach(
      (el) => (el.textContent = safe(profile.category))
    );

    const headerName = qs("#companyHeaderName");
    if (headerName) headerName.textContent = safe(profile.name);

    if (document.title && /dashboard|bedrijfsdashboard/i.test(document.title)) {
      document.title = `${safe(profile.name)} – Dashboard`;
    }
  }

  // ================= Logout =================
  function installLogout() {
    const btn = qs("#logoutBtn");
    if (!btn) return;
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await fetch(API_BASE + "/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        }).catch(() => {});
      } finally {
        clearAuth();
        redirectToLogin();
      }
    });
  }

  // ================= Externe API (optioneel) =================
  const Secure = {
    requireAuth,
    getToken,
    setToken,
    clearAuth,
    fetchWithAuth,
    decodeJwtPayload,
    loadMyCompanyProfile,
  };

  Object.defineProperty(window, "Secure", {
    value: Secure,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  // ================= Startpunt =================
  window.addEventListener("DOMContentLoaded", async () => {
    installLogout();

    if (!requireAuth()) return;

    try {
      const profile = await loadMyCompanyProfile();
      injectCompanyIntoDom(profile);
    } catch (err) {
      console.error(err);
      clearAuth();
      redirectToLogin();
    }
  });
})();
