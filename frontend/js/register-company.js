// frontend/js/register-company.js
// v2026-01-17 — READ-ONLY: bedrijven worden door admin aangemaakt

document.addEventListener("DOMContentLoaded", init);

function init() {
  const form = document.getElementById("companyForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    showNotice();
  });
}

function showNotice() {
  const box = document.getElementById("formError");
  if (!box) return;

  box.textContent =
    "Bedankt voor je aanmelding. Je gegevens zijn ontvangen en worden door een beheerder beoordeeld. " +
    "Na goedkeuring wordt je bedrijf toegevoegd en ontvang je bericht.";

  box.classList.remove("hidden");
  box.classList.remove("text-red-600");
  box.classList.add("text-green-700");
}
