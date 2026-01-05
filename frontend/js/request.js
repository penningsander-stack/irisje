// frontend/js/request.js
// v2026-01-08 WIZARD-CATEGORY-FIRST

const API_BASE = "https://irisje-backend.onrender.com/api";

const form = document.getElementById("requestWizard");
const btnNext = document.getElementById("btnNext");
const btnPrev = document.getElementById("btnPrev");
const btnSubmit = document.getElementById("btnSubmit");
const progressText = document.getElementById("progressText");

let currentStep = 1;
const steps = Array.from(document.querySelectorAll(".wizard-step"));
const totalSteps = steps.length;

function showStep(step) {
  steps.forEach(s => {
    s.classList.toggle("hidden", Number(s.dataset.step) !== step);
  });

  btnPrev.style.display = step === 1 ? "none" : "inline-flex";
  btnNext.classList.toggle("hidden", step === totalSteps);
  btnSubmit.classList.toggle("hidden", step !== totalSteps);

  progressText.textContent = `Stap ${step}/${totalSteps}`;

  updateNextState();
  if (step === totalSteps) fillReview();
}

function isStepValid(step) {
  const section = steps.find(s => Number(s.dataset.step) === step);
  if (!section) return false;

  const required = section.querySelectorAll("[required]");
  for (const field of required) {
    if (!field.value || !field.checkValidity()) return false;
  }
  return true;
}

function updateNextState() {
  if (currentStep < totalSteps) {
    btnNext.disabled = !isStepValid(currentStep);
    btnNext.classList.toggle("opacity-50", btnNext.disabled);
    btnNext.classList.toggle("cursor-not-allowed", btnNext.disabled);
  }
}

/* Filter specialismen op categorie */
const categorySelect = form.querySelector('[name="category"]');
const specialtySelect = form.querySelector('[name="specialty"]');

function filterSpecialties() {
  const category = categorySelect.value;
  const groups = specialtySelect.querySelectorAll("optgroup");

  specialtySelect.value = "";
  groups.forEach(g => {
    g.disabled = g.dataset.category !== category;
  });
}

categorySelect.addEventListener("change", filterSpecialties);

function fillReview() {
  ["category", "specialty", "context", "message", "name", "email"].forEach(name => {
    const el = document.querySelector(`[data-review="${name}"]`);
    const field = form.querySelector(`[name="${name}"]`);
    if (el && field) el.textContent = field.value;
  });
}

btnNext.addEventListener("click", () => {
  if (currentStep < totalSteps && isStepValid(currentStep)) {
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

form.addEventListener("input", updateNextState);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    category: form.category.value,
    specialty: form.specialty.value,
    context: form.context.value,
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
    console.error("❌ submit error:", err);
    alert("Er ging iets mis bij het versturen.");
  }
});

showStep(currentStep);
