// frontend/js/results.js
console.log("RESULTS JS LOADED", new Date().toISOString());

const params = new URLSearchParams(window.location.search);
const requestId = params.get("requestId");

// Bestaande elementen (defensief ophalen)
const companyBlock = document.getElementById("companyBlock");
const genericTitle = document.getElementById("genericTitle");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");
const step1Form = document.getElementById("step1Form");

function safeText(el, text) {
  if (el) el.textContent = text;
}

function disableSubmit() {
  if (submitBtn) submitBtn.disabled = true;
}

function enableSubmit() {
  if (submitBtn) submitBtn.disabled = false;
}

// Basiscontrole
if (!requestId) {
  safeText(formError, "Geen aanvraag-ID gevonden.");
  disableSubmit();
  throw new Error("Missing requestId");
}

fetch(`https://irisje-backend.onrender.com/api/publicRequests/${requestId}`)
  .then(r => r.json())
  .then(data => {
    const companies = Array.isArray(data.companies) ? data.companies : [];

    if (!companyBlock) {
      console.error("companyBlock ontbreekt in DOM");
      return;
    }

    if (companies.length === 0) {
      safeText(genericTitle, "Geen bedrijven beschikbaar voor deze aanvraag.");
      disableSubmit();
      return;
    }

    safeText(genericTitle, "Kies bedrijven voor je aanvraag");
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

        if (submitBtn) {
          submitBtn.disabled = checked.length === 0;
        }
      });

      const info = document.createElement("div");
      info.innerHTML = `
        <strong>${company.name}</strong><br>
        <span>${company.city || ""}</span>
      `;

      label.appendChild(checkbox);
      label.appendChild(info);
      companyBlock.appendChild(label);
    });

    disableSubmit();
  })
  .catch(err => {
    console.error(err);
    safeText(formError, "Kon bedrijven niet laden.");
    disableSubmit();
  });

// Verzenden (alleen als formulier bestaat)
if (step1Form) {
  step1Form.addEventListener("submit", e => {
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
      .then(() => {
        window.location.href = `/success.html?requestId=${requestId}`;
      })
      .catch(() => {
        alert("Versturen mislukt. Probeer het opnieuw.");
      });
  });
}
