// frontend/js/index_search.js
// v20251213-SEARCH-FIX

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const category = document.getElementById("searchCategory")?.value.trim() || "";
    const city = document.getElementById("searchCity")?.value.trim() || "";

    const params = new URLSearchParams();

    if (category) params.set("category", category);
    if (city) params.set("city", city);

    window.location.href = "results.html?" + params.toString();
  });
});
