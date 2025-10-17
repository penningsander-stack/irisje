// frontend/js/secure.js
(() => {
  "use strict";

  const API_BASE =
    (window.ENV && typeof window.ENV.API_BASE === "string" && window.ENV.API_BASE) || "";
  const ACCESS_TOKEN_KEY = "irisje_access_token";
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
      token
        ? localStorage.setItem(ACCESS_TOKEN_KEY, token)
        : localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {}
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
    if (!payload) return false;
    if (typeof payload.exp !== "number") return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now + 10;
  }

  async function fetchWithAuth(path, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");

    const init = { ...options, headers, credentials: options.credentials || "same-origin" };

    const res = await fetch(API_BASE + path, init);
    if (res.status === 401 || res.status === 403) {
      clearAuth();
      redirectToLogin();
      throw new Error("Unauthorized");
    }
    return res;
  }

  function redirectToLogin() {
    if (location.pathname !== "/login.html") location.replace("/login.html");
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

  async function loadMyCompanyProfile() {
    const res = await fetchWithAuth("/api/auth/me", { method: "GET" });
    if (!res.ok) throw new Error("Fout bij profiel laden");
    const data = await res.json();
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
    if (document.title.match(/dashboard|bedrijfsdashboard/i))
      document.title = `${safe(profile.name)} – Dashboard`;
  }

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

  const Secure = {
    requireAuth,
    getToken,
    setToken,
    clearAuth,
    fetchWithAuth,
    decodeJwtPayload,
    loadMyCompanyProfile,
  };
  Object.defineProperty(window, "Secure", { value: Secure });

  window.addEventListener("DOMContentLoaded", async () => {
    installLogout();
    if (!requireAuth()) return;
    try {
      const profile = await loadMyCompanyProfile();
      injectCompanyIntoDom(profile);
    } catch (err) {
      console.error("Fout bij profiel laden:", err);
    }
  });
})();
