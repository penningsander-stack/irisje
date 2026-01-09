// frontend/js/onboarding-validation.js
// Centrale micro-validatie voor onboarding (register / login / reset / forgot)

function setHint(el, msg) {
  el.textContent = msg;
  el.className = "text-xs text-slate-400 mt-1";
}

function setError(el, msg) {
  el.textContent = msg;
  el.className = "text-xs text-red-600 mt-1";
}

function clearMsg(el) {
  el.textContent = "";
  el.className = "text-xs mt-1";
}

function wireField(input) {
  const type = input.dataset.validate;
  const msg = input.parentElement.querySelector(".field-msg");
  if (!msg) return;

  input.addEventListener("focus", () => {
    if (type === "email") setHint(msg, "Gebruik je geregistreerde e-mailadres.");
    if (type === "password") setHint(msg, "Minimaal 8 tekens.");
    if (type === "name") setHint(msg, "Bijv. je bedrijfsnaam of je eigen naam.");
  });

  input.addEventListener("blur", () => {
    if (!input.value) return clearMsg(msg);

    if (type === "email" && !input.checkValidity()) {
      return setError(msg, "Dit lijkt geen geldig e-mailadres.");
    }
    if (type === "password" && input.value.length < 8) {
      return setError(msg, "Wachtwoord moet minimaal 8 tekens zijn.");
    }
    if (type === "name" && input.value.trim().length < 2) {
      return setError(msg, "Vul minimaal 2 tekens in.");
    }
    clearMsg(msg);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-validate]").forEach(wireField);
});
