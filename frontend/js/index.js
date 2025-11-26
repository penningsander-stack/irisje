// frontend/js/index.js

document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  const categoryInput = document.getElementById("categoryInput");
  const cityInput = document.getElementById("cityInput");
  const searchResult = document.getElementById("searchResult");

  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const category = categoryInput.value.trim();
    const city = cityInput.value.trim();

    if (!category && !city) {
      searchResult.textContent = "Vul minimaal één veld in.";
      return;
    }

    searchResult.textContent = "⏳ Zoeken…";

    const url = `results.html?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`;
    window.location.href = url;
  });
});
