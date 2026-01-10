// frontend/js/login.js
// v2026-01-17 — FIX: null classList crash, stabiele login

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const errorBox = document.getElementById("loginError");
  const submitBtn = document.getElementById("submitBtn");
  const spinner = document.getElementById("submitSpinner");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    hide(errorBox);
    setLoading(true);

    const email = form.email?.value?.trim();
    const password = form.password?.value;

    if (!email || !password) {
      show(errorBox, "Vul e-mail en wachtwoord in.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data?.error || "Inloggen mislukt.");
      }

      localStorage.setItem("token", data.token);
      location.href = "dashboard.html";
    } catch (err) {
      show(errorBox, err.message || "Netwerkfout.");
      setLoading(false);
    }
  });

  function setLoading(state) {
    if (submitBtn) submitBtn.disabled = state;
    if (spinner) spinner.classList.toggle("hidden", !state);
  }

  function show(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function hide(el) {
    if (!el) return;
    el.textContent = "";
    el.classList.add("hidden");
  }
});
