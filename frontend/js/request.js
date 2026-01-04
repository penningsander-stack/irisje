// frontend/js/request.js
// v2026-01-06 FIX-WIZARD

document.addEventListener("DOMContentLoaded", () => {
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  let current = 0;

  function showStep(i) {
    steps.forEach((s, idx) => {
      s.style.display = idx === i ? "block" : "none";
    });
  }

  showStep(current);

  document.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (current < steps.length - 1) {
        current++;
        showStep(current);
      }
    });
  });

  document.querySelectorAll("[data-prev]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (current > 0) {
        current--;
        showStep(current);
      }
    });
  });

  document.getElementById("requestWizard").addEventListener("submit", async e => {
    e.preventDefault();

    const payload = {
      category: document.getElementById("category").value,
      message: document.getElementById("message").value,
      name: document.getElementById("name").value,
      email: document.getElementById("email").value
    };

    const res = await fetch("https://irisje-backend.onrender.com/api/publicRequests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.ok) {
      alert("Fout bij versturen");
      return;
    }

    window.location.href = `/results.html?requestId=${data.requestId}`;
  });
});
