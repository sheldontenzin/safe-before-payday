import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1240px"
      }
    },
    extend: {
      colors: {
        oat: "#f7f1e8",
        cream: "#fffaf4",
        beige: "#e9dccb",
        tan: "#d1b79f",
        caramel: "#8a6147",
        terracotta: "#b97252",
        ink: "#211c19",
        smoke: "#6b625b"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      boxShadow: {
        card: "0 20px 60px rgba(63, 42, 28, 0.10)",
        soft: "0 10px 30px rgba(63, 42, 28, 0.08)"
      },
      backgroundImage: {
        paper:
          "radial-gradient(circle at top left, rgba(185, 114, 82, 0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(138, 97, 71, 0.10), transparent 32%)"
      }
    }
  },
  plugins: []
};

export default config;
