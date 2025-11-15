// frontend/tailwind.config.js
module.exports = {
  darkMode: "media", // 🌙 automatische dark mode via systeeminstelling

  content: [
    "./*.html",      // HTML-bestanden in de frontend-root
    "./**/*.html",   // HTML-bestanden in alle submappen
    "./js/**/*.js",  // alle frontend scripts
  ],

  safelist: [
    // 🎨 Dynamisch gebruikte kleurklassen (statuspagina, logs, alerts)
    "text-blue-600",
    "text-yellow-600",
    "text-red-600",
    "text-gray-700",
    "text-green-600",
    "text-yellow-500",
    "bg-green-600",
    "bg-yellow-500",
    "bg-red-600",
    "bg-indigo-600",

    // 🌙 Dark-mode varianten
    "dark:bg-gray-800",
    "dark:text-gray-100",
    "dark:border-gray-700",
    "dark:bg-indigo-700",
    "dark:bg-green-700",
    "dark:bg-red-700",
    "dark:text-yellow-400",
  ],

  theme: {
    extend: {
      colors: {
        irisje: {
          primary: "#4F46E5",   // 🌸 Indigo — hoofdkleur
          secondary: "#6366F1", // lichtere tint
          light: "#E0E7FF",     // zachte achtergrondkleur
          dark: "#312E81",      // diepe indigo voor dark mode
        },
      },

      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },

      // 🌗 Basis kleurenaanpassing voor dark mode
      backgroundColor: (theme) => ({
        ...theme("colors"),
        "page-light": "#F9FAFB",
        "page-dark": "#1F2937",
      }),

      textColor: (theme) => ({
        ...theme("colors"),
        "muted-light": "#6B7280",
        "muted-dark": "#D1D5DB",
      }),
    },
  },

  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
