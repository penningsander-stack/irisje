// frontend/js/request.js
// v2026-01-06 STEP5-COMPLETE-REDIRECT

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("submit", async (e) => {
  if (!e.target.matches("#requestWizard")) return;
  e.preventDefault();

  const form = e.target;

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    message: form.message.value.trim(),
    category: form.category?.value || "",
    specialty: form.specialty?.value || "",
  };

  try {
    const res = await fetch(`${API_BASE}/publicRequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = JSON.parse(text);

    if (!res.ok || !data.ok) {
      alert(data.error || "Versturen mislukt.");
      return;
    }

    // ✅ Redirect naar resultaten
    window.location.href = `/results.html?requestId=${data.requestId}`;
  } catch (err) {
    console.error("❌ Request submit error:", err);
    alert("Er ging iets mis bij het versturen.");
  }
});
