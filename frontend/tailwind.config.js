// frontend/tailwind.config.js
module.exports = {
  content: [
    "./**/*.{html,js}",     // zoekt in alle HTML/JS binnen frontend/
    "../frontend/**/*.{html,js}" // extra fallback voor zekerheid
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
