// frontend/js/secure.js
(() => {
  "use strict";

  // ====== CONFIGURATIE ======
  // Zet dit in je HTML <head>:
  // <script>window.ENV = { API_BASE: "https://irisje.onrender.com" };</script>
  const API_BASE =
    (window.ENV && typeof window.ENV.API_BASE === "string" && window.ENV.API_BASE) || "";

  const ACCESS_TOKEN_KEY = "irisje_access_token";

  // ====== HULPFUNCTIES ======
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
    } catch {}
  }

  function clearAuth() {
    setToken(null);
  }

  // Decode JWT payload (zonder te crashen)
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

  // Tokencontrole: tolerant als er geen exp in zit
  function isJwtExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload) return false; // onbekend, beschouw als geldig
    if (typeof payload.exp !== "number") return false; // geen exp → niet verlopen
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now + 10; // 10s marge
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

    try {
      const res = await fetch(API_BASE + path, init);
      if (res.status === 401 || res.status === 403) {
        console.warn("Auth-verzoek mislukt → redirect naar login");
        clearAuth();
        redirectToLogin();
        throw new Error("Unauthorized");
      }
      return res;
    } catch (err) {
      console.error("fetchWithAuth fout:", err);
      throw err;
    }
  }

  function redirectToLogin() {
    const loginUrl = "/login.html";
    if (location.pathname !== loginUrl) {
      location.replace(loginUrl);
    }
  }

  function requireAuth() {
    const token = getToken();
    if (!token) {
      clearAuth();
      redirectToLogin();
      return false;
    }
    if (isJwtExpired(token)) {
      console.warn("JWT verlopen of ongeldig, terug naar login");
      clearAuth();
      redirectToLogin();
      return false;
    }
    return true;
  }

  // ====== PROFIEL LADEN ======
  async function loadMyCompanyProfile() {
    const res = await fetchWithAuth("/api/auth/me", { method: "GET" });
    if (!res.ok) throw new Error(`Fout bij profiel laden: ${res.status}`);
    const data = await res.json();
    if (!data || typeof data !== "object") throw new Error("Ongeldige profieldata");
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

  // ====== LOGOUT KNOP ======
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

  // ====== PUBLIEKE API ======
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

  // ====== STARTUP ======
  window.addEventListener("DOMContentLoaded", async () => {
    installLogout();

    if (!requireAuth()) return;

    try {
      const profile = await loadMyCompanyProfile();
      injectCompanyIntoDom(profile);
    } catch (err) {
      console.error("Fout bij laden profiel:", err);
      // Geen auto-logout meer bij tijdelijke netwerkfout
      const nameEl = qs("[data-company-name]");
      if (nameEl) nameEl.textContent = "Onbekend bedrijf";
    }
  });
})();
