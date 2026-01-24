// frontend/js/request.js
// A2 – correcte aanvraag + redirect naar results.html met requestId

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sector =
      form.querySelector("[name='sector']")?.value ||
      form.querySelector("[name='category']")?.value;

    const specialty = form.querySelector("[name='specialty']")?.value;
    const city = form.querySelector("[name='city']")?.value;

    if (!sector || !specialty || !city) {
      alert("Vul sector, specialisme en plaats in.");
      return;
    }

    try {
      const res = await fetch(
        "https://irisje-backend.onrender.com/api/publicRequests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sector,
            specialty,
            city
          })
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok || !data?.request?._id) {
        throw new Error(data?.message || "Aanvraag mislukt");
      }

      // ✔️ JUISTE redirect
      window.location.href =
        `/results.html?requestId=${data.request._id}`;
    } catch (err) {
      console.error("request.js error:", err);
      alert("Aanvraag mislukt. Probeer het opnieuw.");
    }
  });
});
