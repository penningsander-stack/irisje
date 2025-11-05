// frontend/js/layout.js
document.addEventListener("DOMContentLoaded", () => {
  const headerHTML = `
  <header class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 backdrop-blur-sm">
    <div class="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
      <a href="index.html" class="flex items-center space-x-2 font-semibold text-indigo-700 text-lg">
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold leading-none">I</span>
        <span class="tracking-tight">Irisje.nl</span>
      </a>
      <nav class="hidden sm:flex items-center space-x-6 text-sm font-medium text-gray-600">
        <a href="results.html" class="hover:text-indigo-600 transition">Bedrijven</a>
        <a href="login.html" class="hover:text-indigo-600 transition">Inloggen</a>
      </nav>
      <a href="login.html" class="sm:hidden text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5">
        Inloggen
      </a>
    </div>
  </header>`;

  const footerHTML = `
  <footer class="text-center text-xs text-gray-500 py-6 border-t bg-gray-100 mt-auto">
    © ${new Date().getFullYear()} Irisje.nl – Alle rechten voorbehouden
  </footer>`;

  // Injecteer header bovenaan body (voor het eerste <main>-element)
  if (!document.querySelector("header")) {
    const main = document.querySelector("main") || document.body.firstChild;
    document.body.insertBefore(document.createRange().createContextualFragment(headerHTML), main);
  }

  // Voeg footer toe als die nog niet bestaat
  if (!document.querySelector("footer")) {
    document.body.appendChild(document.createRange().createContextualFragment(footerHTML));
  }

  // Voeg fade-in animatie toe aan belangrijke secties
  const blocks = document.querySelectorAll("header, main section, footer");
  blocks.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    setTimeout(() => {
      el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 150 * i);
  });
});
