// frontend/js/request.js
// v2026-01-06 RESTORED-WIZARD

const API_BASE = "https://irisje-backend.onrender.com/api";

let currentStep = 1;
const steps = Array.from(document.querySelectorAll(".wizard-step"));

const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnSubmit = document.getElementById("btnSubmit");
const errorBox = document.getElementById("wizardError");

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
  currentStep++;
  showStep(currentStep);
};

document.getElementById("requestWizard").onsubmit = async (e) => {
  e.preventDefault();

  const payload = {
    category: category.value.trim(),
    specialty: specialty.value.trim(),
    context: context.value.trim(),
    message: message.value.trim(),
    name: name.value.trim(),
    email: email.value.trim(),
  };

  try {
    const res = await fetch(`${API_BASE}/publicRequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Fout");

    window.location.href = `results.html?requestId=${data.requestId}`;
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
};

showStep(currentStep);
