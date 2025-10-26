// tailwind.config.js
module.exports = {
  content: [
    "./frontend/**/*.{html,js}",
    "./**/*.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
