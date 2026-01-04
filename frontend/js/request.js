// frontend/js/request.js
// v2026-01-06 FIX-NEXT-BUTTON

const API_BASE = "https://irisje-backend.onrender.com/api";

let step = 1;
const total = 5;

document.addEventListener("DOMContentLoaded", () => {
  render();

  document.getElementById("requestWizard").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    if (btn.dataset.action === "next") {
      if (!validate()) return;
      step++;
      render();
    }

    if (btn.dataset.action === "prev") {
      step--;
      render();
    }
  });

  document.getElementById("requestWizard").addEventListener("submit", submitForm);
});

function render() {
  document.querySelectorAll(".wizard-step").forEach(el => {
    el.classList.toggle("hidden", Number(el.dataset.step) !== step);
  });
  document.getElementById("wizardStepNow").textContent = step;
  document.getElementById("wizardStepTotal").textContent = total;
}

function validate() {
  if (step === 1 && !document.getElementById("categorySelect").value) {
    alert("Kies een categorie");
    return false;
  }
  if (step === 3 && !document.getElementById("messageInput").value.trim()) {
    alert("Vul een bericht in");
    return false;
  }
  return true;
}

async function submitForm(e) {
  e.preventDefault();

  const payload = {
    category: document.getElementById("categorySelect").value,
    specialty: document.getElementById("specialtyInput").value,
    message: document.getElementById("messageInput").value,
    name: document.getElementById("nameInput").value,
    email: document.getElementById("emailInput").value,
  };

  try {
    const res = await fetch(`${API_BASE}/publicRequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) throw new Error();

    window.location.href = `/results.html?requestId=${data.requestId}`;
  } catch {
    const el = document.getElementById("submitError");
    el.textContent = "Versturen mislukt";
    el.classList.remove("hidden");
  }
}
