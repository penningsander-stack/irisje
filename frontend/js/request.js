// frontend/js/request.js
<<<<<<< HEAD
// v2026-01-06 FIX-WIZARD
=======
// v2026-01-06 FIX-POST-PUBLICREQUESTS
>>>>>>> parent of de64fcc (Diversen)

document.addEventListener("DOMContentLoaded", () => {
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  let current = 0;

<<<<<<< HEAD
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
=======
async function submitRequest(payload) {
  const res = await fetch(`${API_BASE}/publicRequests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok || !data || data.ok !== true) {
    throw new Error((data && data.error) || "Not Found");
  }
  return data;
}

// Voorbeeld aanroep (laat jouw bestaande UI dit gebruiken)
document.addEventListener("submit", async (e) => {
  if (!e.target.matches("#requestForm")) return;
  e.preventDefault();

  const payload = {
    name: document.querySelector("[name='name']")?.value || "",
    email: document.querySelector("[name='email']")?.value || "",
    message: document.querySelector("[name='message']")?.value || "",
    category: document.querySelector("[name='category']")?.value || "",
    specialty: document.querySelector("[name='specialty']")?.value || "",
  };

  try {
    const out = await submitRequest(payload);
    console.log("OK", out);
  } catch (err) {
    console.error("❌ Submit error:", err.message);
    alert("Aanvraag mislukt.");
  }
>>>>>>> parent of de64fcc (Diversen)
});
