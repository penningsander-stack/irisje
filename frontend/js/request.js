// frontend/js/request.js
// v2026-01-06 FIX-WIZARD-SUBMIT-ID-MATCH

const API_BASE = "https://irisje-backend.onrender.com/api";

async function submitRequest(payload) {
  const res = await fetch(`${API_BASE}/publicRequests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok || !data || data.ok !== true) {
    throw new Error((data && data.error) || "Server error");
  }

  return data;
}

// ✅ JUISTE form-ID
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
    const out = await submitRequest(payload);
    console.log("✅ Aanvraag opgeslagen:", out);

    // optioneel: redirect of succesmelding
    window.location.href = "/request-success.html";
  } catch (err) {
    console.error("❌ Submit error:", err.message);
    alert("Aanvraag mislukt. Probeer opnieuw.");
  }
});
