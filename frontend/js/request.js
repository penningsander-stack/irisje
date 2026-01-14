// frontend/js/request.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");
  const submitBtn = document.getElementById("submitBtn");
  const statusEl = document.getElementById("formStatus");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const sector = document.getElementById("sector").value.trim();
    const city = document.getElementById("city").value.trim();
    const description = document.getElementById("description").value.trim();

    let hasError = false;

    if (!sector) {
      showError("sector", "Kies een categorie.");
      hasError = true;
    }

    if (!city) {
      showError("city", "Vul een plaats of postcode in.");
      hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled = true;
    statusEl.textContent = "Aanvraag wordt gestart…";

    try {
      const response = await fetch(
        "https://irisje-backend.onrender.com/api/publicRequests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sector,
            city,
            description
          })
        }
      );

      if (!response.ok) {
        throw new Error("Aanvraag mislukt");
      }

      const data = await response.json();

      if (!data || !data._id) {
        throw new Error("Ongeldige serverrespons");
      }

      sessionStorage.setItem("requestId", data._id);
      window.location.href = `results.html?requestId=${data._id}`;

    } catch (err) {
      statusEl.textContent = "Er ging iets mis. Probeer het opnieuw.";
      submitBtn.disabled = false;
    }
  });

  function showError(field, message) {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = message;
  }

  function clearErrors() {
    document.querySelectorAll(".error").forEach(e => e.textContent = "");
    statusEl.textContent = "";
  }
});
