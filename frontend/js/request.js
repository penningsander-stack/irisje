document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "https://irisje-backend.onrender.com";
  const form = document.getElementById("requestForm");
  const msg = document.getElementById("requestMessage");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const message = e.target.message.value.trim();

    msg.textContent = "Versturen...";
    try {
      await axios.post(`${apiBase}/api/requests`, { name, email, message });
      msg.textContent = "✅ Je aanvraag is succesvol verzonden!";
      e.target.reset();
    } catch (err) {
      console.error(err);
      msg.textContent = "❌ Er ging iets mis bij het verzenden.";
    }
  });
});
