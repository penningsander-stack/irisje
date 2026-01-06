// frontend/js/request.js
// v2026-01-13 C2-DYNAMIC-CATEGORIES

const API_BASE = "https://irisje-backend.onrender.com/api";

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step1Form = document.getElementById("step1Form");
const step2Form = document.getElementById("step2Form");
const categorySelect = document.getElementById("categorySelect");
const specialtySelect = document.getElementById("specialtySelect");
const summaryText = document.getElementById("summaryText");

let CATEGORIES = {};
let step1Data = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadCategories();
}

async function loadCategories() {
  const res = await fetch(`${API_BASE}/publicCategories`);
  const data = await res.json();
  if (!res.ok || !data.ok) {
    alert("Categorieën laden mislukt");
    return;
  }

  CATEGORIES = {};
  categorySelect.innerHTML = `<option value="">Kies een categorie</option>`;
  specialtySelect.innerHTML = `<option value="">Kies eerst een categorie</option>`;
  specialtySelect.disabled = true;

  data.categories.forEach(c => {
    CATEGORIES[c.value] = c;
    categorySelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${c.value}">${c.label}</option>`
    );
  });
}

categorySelect.addEventListener("change", () => {
  const key = categorySelect.value;
  specialtySelect.innerHTML = "";
  specialtySelect.disabled = true;

  if (!key || !CATEGORIES[key]) {
    specialtySelect.innerHTML = `<option value="">Kies eerst een categorie</option>`;
    return;
  }

  const opts = CATEGORIES[key].specialties
    .map(s => `<option value="${s.value}">${s.label}</option>`)
    .join("");

  specialtySelect.innerHTML = `<option value="">Kies een specialisme</option>${opts}`;
  specialtySelect.disabled = false;
});

step1Form.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(step1Form);
  step1Data = Object.fromEntries(fd.entries());

  const cat = CATEGORIES[step1Data.category];
  const spec = cat.specialties.find(s => s.value === step1Data.specialty);

  summaryText.textContent =
    `Je zoekt een ${cat.label.toLowerCase()} gespecialiseerd in ${spec.label.toLowerCase()}. ` +
    `Met de vragen hieronder vinden we sneller de juiste match.`;

  step1.classList.add("hidden");
  step2.classList.remove("hidden");
});

step2Form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd2 = new FormData(step2Form);
  const step2Data = Object.fromEntries(fd2.entries());

  const payload = { ...step1Data, ...step2Data };

  const res = await fetch(`${API_BASE}/publicRequests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    alert(data.error || "Verzenden mislukt");
    return;
  }

  window.location.href = `/results.html?requestId=${data.requestId}`;
});
