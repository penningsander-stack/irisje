// frontend/js/results.js
console.log("RESULTS JS LOADED", new Date().toISOString());

const params = new URLSearchParams(window.location.search);
const requestId = params.get("requestId");

const companyBlock = document.getElementById("companyBlock");
const genericTitle = document.getElementById("genericTitle");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");

if (!requestId) {
  formError.textContent = "Geen aanvraag-ID gevonden.";
  submitBtn.disabled = true;
  throw new Error("Missing requestId");
}

fetch(`https://irisje-backend.onrender.com/api/publicRequests/${requestId}`)
  .then(r => r.json())
  .then(data => {
    const { request, companies } = data;

    if (!Array.isArray(companies) || companies.length === 0) {
      genericTitle.textContent = "Geen bedrijven beschikbaar voor deze aanvraag.";
      submitBtn.disabled = true;
      return;
    }

    // Titel aanpassen
    genericTitle.textContent = "Kies bedrijven voor je aanvraag";

    // Container leegmaken
    companyBlock.innerHTML = "";

    companies.forEach(company => {
      const label = document.createElement("label");
      label.className = "company-card";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "companyIds";
      checkbox.value = company._id;

      checkbox.addEventListener("change", () => {
        const checked = document.querySelectorAll(
          'input[name="companyIds"]:checked'
        );

        if (checked.length > 5) {
          checkbox.checked = false;
          alert("Je kunt maximaal 5 bedrijven selecteren.");
        }

        submitBtn.disabled = checked.length === 0;
      });

      const info = document.createElement("div");
      info.className = "company-info";
      info.innerHTML = `
        <strong>${company.name}</strong><br>
        <span>${company.city || ""}</span>
      `;

      label.appendChild(checkbox);
      label.appendChild(info);

      companyBlock.appendChild(label);
    });

    submitBtn.disabled = true;
  })
  .catch(err => {
    console.error(err);
    formError.textContent = "Kon bedrijven niet laden.";
    submitBtn.disabled = true;
  });

// Verzenden
document.getElementById("step1Form").addEventListener("submit", e => {
  e.preventDefault();

  const selected = Array.from(
    document.querySelectorAll('input[name="companyIds"]:checked')
  ).map(cb => cb.value);

  if (selected.length === 0) {
    alert("Selecteer minimaal één bedrijf.");
    return;
  }

  fetch(
    `https://irisje-backend.onrender.com/api/publicRequests/${requestId}/send`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyIds: selected })
    }
  )
    .then(r => r.json())
    .then(() => {
      window.location.href = `/success.html?requestId=${requestId}`;
    })
    .catch(() => {
      alert("Versturen mislukt. Probeer het opnieuw.");
    });
});
