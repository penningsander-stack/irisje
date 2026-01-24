// frontend/js/request.js
// A2 – ROBUUST: specialisme + plaats altijd correct uitlezen

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) return;

  function getValue(selectors) {
    for (const sel of selectors) {
      const el = form.querySelector(sel);
      if (el && typeof el.value === "string" && el.value.trim() !== "") {
        return el.value.trim();
      }
    }
    return "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ✔ sector / categorie
    const sector = getValue([
      "[name='sector']",
      "[name='category']",
      "#sector",
      "#category"
    ]);

    // ✔ specialisme (DIT WAS KAPOT)
    const specialty = getValue([
      "[name='specialty']",
      "[name='specialisme']",
      "#specialty",
      "#specialisme"
    ]);

    // ✔ plaats (DIT WAS KAPOT)
    const city = getValue([
      "[name='city']",
      "[name='place']",
      "[name='plaats']",
      "#city",
      "#place",
      "#plaats"
    ]);

    if (!sector || !specialty || !city) {
      alert("Sector, specialisme en plaats zijn verplicht.");
      console.error("❌ Missing values:", { sector, specialty, city });
      return;
    }

    try {
      const res = await fetch(
        "https://irisje-backend.onrender.com/api/publicRequests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sector, specialty, city })
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok || !data?.request?._id) {
        throw new Error(data?.message || "Aanvraag mislukt");
      }

      // ✔ juiste redirect
      window.location.href =
        `/results.html?requestId=${encodeURIComponent(data.request._id)}`;
    } catch (err) {
      console.error("❌ request.js error:", err);
      alert("Aanvraag mislukt. Probeer het opnieuw.");
    }
  });
});
