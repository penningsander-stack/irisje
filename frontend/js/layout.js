// frontend/js/layout.js

document.addEventListener("DOMContentLoaded", () => {
  // 🌈 Fade-in animatie voor alle secties
  const sections = document.querySelectorAll("header, main section, footer");
  sections.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add("fade-visible");
    }, 150 * i);
  });

  // 💡 Service worker update-banner
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "NEW_VERSION") {
        const banner = document.createElement("div");
        banner.textContent = "💡 Nieuwe versie geladen – klik om te vernieuwen";
        banner.className = "fixed bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg cursor-pointer z-[9999]";
        banner.onclick = () => location.reload();
        document.body.appendChild(banner);
      }
    });
  }

  // 🔝 Sticky header schaduw bij scroll
  const header = document.querySelector("header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 10) {
        header.classList.add("shadow-md");
      } else {
        header.classList.remove("shadow-md");
      }
    });
  }
});
