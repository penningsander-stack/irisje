// frontend/js/request.js
// v2026-01-06 FIX-TRIM-CRASH-DEFINITIVE

const API_BASE = "https://irisje-backend.onrender.com/api";

let currentStep = 1;
const steps = Array.from(document.querySelectorAll(".wizard-step"));

const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnSubmit = document.getElementById("btnSubmit");
const errorBox = document.getElementById("wizardError");

function safeValue(id) {
  const el = document.getElementById(id);
  if (!el) return "";
  if (typeof el.value !== "string") return "";
  return el.value.trim();
}

function showStep(n) {
  steps.forEach(s => {
    s.classList.toggle("hidden", Number(s.dataset.step) !== n);
  });

  btnPrev.disabled = n === 1;
  btnNext.classList.toggle("hidden", n === steps.length);
  btnSubmit.classList.toggle("hidden", n !== steps.length);

  errorBox.classList.add("hidden");
}

btnPrev.onclick = () => {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
};

btnNext.onclick = () => {
  if (currentStep < steps.length) {
    currentStep++;
    showStep(currentStep);
  }
};

document.getElementById("requestWizard").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    category: safeValue("category"),
    specialty: safeValue("specialty"),
    context: safeValue("context"),
    message: safeValue("message"),
    name: safeValue("name"),
    email: safeValue("email"),
  };

  try {
    const res = await fetch(`${API_BASE}/publicRequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data?.error || "Aanvraag mislukt");
    }

    window.location.href = `results.html?requestId=${data.requestId}`;
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
});

showStep(currentStep);
