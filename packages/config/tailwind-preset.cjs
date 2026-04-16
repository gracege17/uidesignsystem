module.exports = {
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#020617"
        },
        brand: {
          50: "#f3f8ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8"
        },
        notion: {
          bg: "#FFFFFF",
          surface: "#F7F7F5",
          border: "#E9E9E7",
          muted: "#91918E",
          text: "#37352F",
          "text-secondary": "#787774",
          ink: "#37352F",
          "ink-hover": "#1a1917"
        }
      },
      boxShadow: {
        panel: "0 24px 60px rgba(15, 23, 42, 0.18)"
      },
      backgroundImage: {
        "panel-grid":
          "linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)"
      }
    }
  }
};
