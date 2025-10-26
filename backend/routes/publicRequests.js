<!-- frontend/request.html -->
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Offerte aanvragen – Irisje.nl</title>
  <meta name="theme-color" content="#4F46E5" />
  <link rel="icon" type="image/x-icon" href="favicon.ico" />

  <!-- ✅ Lokale Tailwind build -->
  <link rel="stylesheet" href="style.css" />
</head>

<body class="bg-gray-50 text-gray-800 flex flex-col min-h-screen">
  <header class="bg-indigo-600 text-white py-5 shadow-md">
    <div class="max-w-6xl mx-auto flex justify-between items-center px-4">
      <a href="index.html" class="text-2xl font-semibold tracking-tight">Irisje.nl</a>
      <a href="results.html" class="text-sm underline hover:text-gray-100">Terug naar bedrijven</a>
    </div>
  </header>

  <main class="flex-1 max-w-3xl mx-auto px-4 py-10">
    <section class="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
      <h1 class="text-2xl font-bold text-indigo-700 mb-6 text-center">Vraag een vrijblijvende offerte aan</h1>

      <form id="requestForm" class="space-y-4">
        <input id="name" type="text" placeholder="Naam" required
          class="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        <input id="email" type="email" placeholder="E-mailadres" required
          class="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        <input id="city" type="text" placeholder="Plaats"
          class="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        <textarea id="message" placeholder="Beschrijf je klus of vraag" required
          class="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>

        <button type="submit"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3 transition">
          Verstuur aanvraag
        </button>
        <p id="statusMsg" class="text-center text-sm"></p>
      </form>
    </section>
  </main>

  <footer class="text-center text-sm text-gray-500 py-6 border-t bg-gray-100">
    © 2025 Irisje.nl – Alle rechten voorbehouden
  </footer>

  <script>
    const API_BASE = "https://irisje-backend.onrender.com/api";

    document.getElementById("requestForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("statusMsg");
      msg.textContent = "Bezig met verzenden...";
      msg.className = "text-gray-500 text-center text-sm";

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const city = document.getElementById("city").value.trim();
      const message = document.getElementById("message").value.trim();

      try {
        const res = await fetch(`${API_BASE}/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, city, message }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Kon aanvraag niet versturen.");

        msg.textContent = "✅ Aanvraag succesvol verzonden!";
        msg.className = "text-green-600 text-center text-sm";
        document.getElementById("requestForm").reset();
      } catch (err) {
        msg.textContent = "❌ Er ging iets mis bij het verzenden.";
        msg.className = "text-red-600 text-center text-sm";
      }
    });
  </script>
</body>
</html>
