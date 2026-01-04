// frontend/js/request.js
// v2026-01-06 FIX-WIZARD-NAVIGATION

const API_BASE = "https://irisje-backend.onrender.com/api";

let currentStep = 0;
const steps = Array.from(document.querySelectorAll(".wizard-step"));

function showStep(index) {
  steps.forEach((step, i) => {
    step.style.display = i === index ? "block" : "none";
  });
}

function nextStep() {
  if (currentStep < steps.length - 1) {
    currentStep++;
    showStep(currentStep);
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showStep(currentStep);

  document.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", nextStep);
  });

  document.querySelectorAll("[data-prev]").forEach(btn => {
    btn.addEventListener("click", prevStep);
  });
});

// =======================
// SUBMIT (laatste stap)
// =======================
document.addEventListener("submit", async (e) => {
  if (!e.target.matches("#requestWizard")) return;
  e.preventDefault();

  const payload = {
    name: document.querySelector("#name")?.value || "",
    email: document.querySelector("#email")?.value || "",
    message: document.querySelector("#message")?.value || "",
    category: document.querySelector("#category")?.value || "",
    specialty: document.querySelector("#specialty")?.value || "",
    context: document.querySelector("#context")?.value || "",
  };

  try {
    const res = await fetch(`${API_BASE}/publicRequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Server error");

    window.location.href = `/results.html?requestId=${data.requestId}`;
  } catch (err) {
    alert("Aanvraag mislukt. Probeer opnieuw.");
    console.error(err);
  }
});
