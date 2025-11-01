// frontend/tailwind.config.js
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js",
    "./components/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        irisje: {
          primary: "#4F46E5", // indigo-tint
          secondary: "#6366F1",
          light: "#E0E7FF"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography")
  ]
};
