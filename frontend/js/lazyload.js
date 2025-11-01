// frontend/js/lazyload.js
document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll("img");

  if (!("IntersectionObserver" in window)) {
    // Browser ondersteunt lazy loading niet → laad alle beelden direct
    images.forEach((img) => img.classList.add("loaded"));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute("data-src");
        if (src) {
          img.src = src;
          img.removeAttribute("data-src");
          img.setAttribute("loading", "lazy");
          img.onload = () => img.classList.add("loaded");
        }
        obs.unobserve(img);
      }
    });
  });

  images.forEach((img) => {
    // Alleen toepassen op afbeeldingen die nog geen lazy-loading hebben
    if (!img.hasAttribute("loading")) {
      const src = img.getAttribute("src");
      if (src) {
        img.setAttribute("data-src", src);
        img.removeAttribute("src");
      }
      observer.observe(img);
    }
  });
});
