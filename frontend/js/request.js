// frontend/js/request.js
// v2026-01-06 FIX-POST-PUBLICREQUESTS

const API_BASE = "https://irisje-backend.onrender.com/api";

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
});
