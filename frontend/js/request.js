// frontend/js/request.js
// v2026-01-07 FIX-WIZARD-SUBMIT

const API_BASE = "https://irisje-backend.onrender.com/api";

const form = document.getElementById("requestWizard");
const btnNext = document.getElementById("btnNext");
const btnPrev = document.getElementById("btnPrev");
const btnSubmit = document.getElementById("btnSubmit");

let currentStep = 1;
const steps = Array.from(document.querySelectorAll(".wizard-step"));

function showStep(step) {
  steps.forEach(s => {
    s.classList.toggle("hidden", Number(s.dataset.step) !== step);
  });

  btnPrev.style.display = step === 1 ? "none" : "inline-flex";
  btnNext.classList.toggle("hidden", step === steps.length);
  btnSubmit.classList.toggle("hidden", step !== steps.length);
}

btnNext.addEventListener("click", () => {
  if (currentStep < steps.length) {
    currentStep++;
    showStep(currentStep);
  }
});

btnPrev.addEventListener("click", () => {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    category: form.category.value,              // ✅ altijd "Advocaat"
    specialty: form.specialty?.value || "",
    context: form.context?.value || "",
    message: form.message.value.trim(),
    name: form.name.value.trim(),
    email: form.email.value.trim(),
  };

  try {
    const res = await fetch(`${API_BASE}/publicRequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.ok !== true) {
      alert(data.error || "Versturen mislukt");
      return;
    }

    window.location.href = `/results.html?requestId=${data.requestId}`;
  } catch (err) {
    console.error("❌ Submit error:", err);
    alert("Er ging iets mis bij het versturen.");
  }
});

showStep(currentStep);

