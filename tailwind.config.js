// tailwind.config.js
module.exports = {
  content: [
    "./**/*.html",
    "./frontend/**/*.html",
    "./frontend/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
