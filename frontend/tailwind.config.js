// frontend/tailwind.config.js
module.exports = {
  content: [
    "./*.html",
    "./frontend/**/*.html",
    "./js/**/*.js",
    "./frontend/js/**/*.js",
    "./components/**/*.js"
  ],
  safelist: [
    // 🎨 Kleurklassen die dynamisch via JS worden toegevoegd
    "text-blue-600",
    "text-yellow-600",
    "text-red-600",
    "text-gray-700",
    "bg-green-600",
    "bg-yellow-500",
    "bg-red-600",
    "bg-indigo-600",
    "text-green-600",
    "text-yellow-500"
  ],
  theme: {
    extend: {
      colors: {
        irisje: {
          primary: "#4F46E5",   // indigo-tint
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
