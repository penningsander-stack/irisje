// frontend/js/app.js
document.getElementById("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = encodeURIComponent(document.getElementById("q").value);
  const city = encodeURIComponent(document.getElementById("city").value);
  window.location.href = `results.html?q=${q}&city=${city}`;
});
