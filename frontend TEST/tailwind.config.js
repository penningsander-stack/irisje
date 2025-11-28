// frontend/tailwind.config.js
module.exports = {
  darkMode: "media",

  content: [
    "./*.html",          // alle HTML-bestanden in frontend/
    "./**/*.html",       // HTML in submappen
    "./js/**/*.js"       // alle frontend scripts
  ],

  safelist: [
    "text-blue-600", "text-yellow-600", "text-red-600",
    "text-gray-700", "text-green-600", "text-yellow-500",
    "bg-green-600", "bg-yellow-500", "bg-red-600", "bg-indigo-600",
    "dark:bg-gray-800", "dark:text-gray-100", "dark:border-gray-700",
    "dark:bg-indigo-700", "dark:bg-green-700", "dark:bg-red-700",
    "dark:text-yellow-400"
  ],

  theme: {
    extend: {
      colors: {
        irisje: {
          primary: "#4F46E5",
          secondary: "#6366F1",
          light: "#E0E7FF",
          dark: "#312E81"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      },
      backgroundColor: (theme) => ({
        ...theme("colors"),
        "page-light": "#F9FAFB",
        "page-dark": "#1F2937"
      }),
      textColor: (theme) => ({
        ...theme("colors"),
        "muted-light": "#6B7280",
        "muted-dark": "#D1D5DB"
      })
    }
  },

  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography")
  ]
};
