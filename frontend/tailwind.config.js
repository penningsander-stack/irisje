// frontend/tailwind.config.js
module.exports = {
  content: [
    "./**/*.{html,js}",          // zoekt in alle HTML/JS binnen frontend/
    "../frontend/**/*.{html,js}" // extra fallback
  ],
  theme: {
    extend: {
      colors: {
        indigo: '#4F46E5',   // Irisje hoofdkleur
        green: '#22C55E',    // Succes
        red: '#EF4444',      // Fout
        yellow: '#EAB308',   // Waarschuwing
        gray: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          500: '#6B7280',
          700: '#374151',
          800: '#1F2937'
        }
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
