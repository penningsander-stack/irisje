document.addEventListener("DOMContentLoaded", async () => {
  const apiBase = "https://irisje-backend.onrender.com";
  const table = document.getElementById("reported-reviews");

  async function loadReported() {
    try {
      const res = await axios.get(`${apiBase}/api/admin/reported`, { withCredentials: true });
      const reviews = res.data || [];
      renderTable(reviews);
    } catch (err) {
      console.error(err);
      table.innerHTML = "<tr><td colspan='5' class='text-red-600'>Fout bij laden van gemelde reviews.</td></tr>";
    }
  }

  function renderTable(list) {
    table.innerHTML = "";
    if (!list.length) {
      table.innerHTML = "<tr><td colspan='5' class='text-gray-500'>Geen gemelde reviews gevonden.</td></tr>";
      return;
    }
    list.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="border px-2 py-1">${r.name}</td>
        <td class="border px-2 py-1">${"⭐".repeat(r.rating)}</td>
        <td class="border px-2 py-1">${r.message}</td>
        <td class="border px-2 py-1">${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        <td class="border px-2 py-1">
          <button data-id="${r._id}" class="bg-green-600 text-white px-2 py-1 rounded mark-safe">Beoordeeld</button>
        </td>`;
      table.appendChild(tr);
    });
  }

  table.addEventListener("click", async e => {
    if (e.target.classList.contains("mark-safe")) {
      const id = e.target.dataset.id;
      try {
        await axios.post(`${apiBase}/api/admin/reported/${id}/resolve`, {}, { withCredentials: true });
        await loadReported();
      } catch {
        alert("Fout bij bijwerken reviewstatus");
      }
    }
  });

  await loadReported();
});
