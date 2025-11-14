// tailwind.config.js
module.exports = {
  content: [
    "./frontend/**/*.{html,js}",
    "./frontend/js/**/*.js",
    "./frontend/*.html",
    "./*.html"
  ],

  theme: {
    extend: {
      /* =====================================
         🎨 Irisje – kleurenset (paars/indigo)
      ====================================== */
      colors: {
        irisje: {
          DEFAULT: "#4F46E5",   // hoofd-indigo (Irisje)
          light: "#6366F1",
          dark: "#3730A3",
        },
      },

      /* =====================================
         🅰️ Typografie – consistent overal
      ====================================== */
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },

      /* =====================================
         ✨ Animaties & Keyframes
      ====================================== */
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: 0, transform: "translateX(-10px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.98)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },

      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "fade-up": "fadeUp 0.5s ease-out",
        "slide-in": "slideIn 0.4s ease-out",
        "scale-in": "scaleIn 0.35s ease-out",
      },

      /* =====================================
         📦 UI Presets (cards, badges, btns)
      ====================================== */
      borderRadius: {
        card: "0.75rem",
      },
    },
  },

  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
