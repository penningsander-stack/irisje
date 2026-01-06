// frontend/js/request.js
// v2026-01-12 TRUSTOO-STYLE-2STEP-WIZARD

const API_BASE = "https://irisje-backend.onrender.com/api";

// vaste lijsten
const CATEGORIES = {
  advocaat: {
    label: "Advocaat",
    specialties: [
      { value: "arbeidsrecht", label: "Arbeidsrecht" },
      { value: "bestuursrecht", label: "Bestuursrecht" },
      { value: "familierecht", label: "Familierecht" }
    ]
  }
};

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step1Form = document.getElementById("step1Form");
const step2Form = document.getElementById("step2Form");
const categorySelect = document.getElementById("categorySelect");
const specialtySelect = document.getElementById("specialtySelect");
const summaryText = document.getElementById("summaryText");

let step1Data = {};

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

  const catLabel = CATEGORIES[step1Data.category].label;
  const specLabel =
    CATEGORIES[step1Data.category].specialties.find(s => s.value === step1Data.specialty)?.label || "";

  summaryText.textContent =
    `Je zoekt een ${catLabel.toLowerCase()} gespecialiseerd in ${specLabel.toLowerCase()}. ` +
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
