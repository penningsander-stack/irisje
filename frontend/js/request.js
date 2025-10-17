// frontend/js/request.js
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("sendBtn");
  const msgDiv = document.getElementById("msg");

  btn.addEventListener("click", async () => {
    msgDiv.textContent = "";
    const company = document.getElementById("company").value.trim();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!company || !name || !email || !message) {
      msgDiv.textContent = "Vul alle velden in.";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Verzenden...";

    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/requests/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, name, email, message }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        msgDiv.textContent = data.error || "Verzenden mislukt.";
      } else {
        msgDiv.style.color = "green";
        msgDiv.textContent = "Aanvraag succesvol verzonden!";
        document.querySelectorAll("input, textarea").forEach((el) => (el.value = ""));
      }
    } catch (err) {
      console.error("Fout bij verzenden:", err);
      msgDiv.textContent = "Serverfout of geen verbinding.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Verzenden";
    }
  });
});
