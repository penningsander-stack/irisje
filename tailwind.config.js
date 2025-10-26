// tailwind.config.js
module.exports = {
  content: [
    "./frontend/**/*.{html,js}",   // zoekt in alle HTML en JS binnen frontend/
    "../frontend/**/*.{html,js}",  // zoekt ook als build in /frontend zelf draait
    "./*.html"                     // zoekt naar losse HTML-bestanden in root
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
