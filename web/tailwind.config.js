const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./public/**/*.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: "media", // 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "Arial", "Segoe UI", "sans-serif"],
        mono: [
          "Roboto Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },

      colors: {
        // primary/accent colors
        primaryColor: colors.blue,
        accentColor: colors.teal,

        primaryColorDark: colors.violet,
        accentColorDark: colors.fuchsia,

        primaryColorSolarized: colors.orange,
        accentColorSolarized: colors.yellow,

        primaryColorJoker: colors.lime,
        accentColorJoker: colors.orange,

        primaryColorMatrix: {
          50: "#CEEECC",
          100: "#9BE795",
          200: "#78E96F",
          300: "#60ED54",
          400: "#26F813",
          500: "#15FF00",
          600: "#13E500",
          700: "#16D205",
          800: "#13A507",
          900: "#0D7304",
        },
        accentColorMatrix: colors.lime,

        primaryColorStrawberry: colors.pink,
        accentColorStrawberry: colors.rose,

        primaryColorCupcake: colors.rose,
        accentColorCupcake: colors.cyan,

        primaryColorNord: {
          50: "#CADBF7",
          100: "#C1D4F4",
          200: "#B6CCF1",
          300: "#ACC5EE",
          400: "#A7C0E9",
          500: "#A2BCE5",
          600: "#9EB9E4",
          700: "#91AEDD",
          800: "#87A4D4",
          900: "#7C99C8",
        },
        accentColorNord: colors.sky,

        primary: {
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
        },
        accent: {
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
        },

        transparent: "transparent",
        danger: colors.red,
        success: colors.green,

        // background colors
        coolGray: colors.gray,
        gray: colors.neutral,
        warmGray: colors.stone,
        black: {
          50: "#F4F4F4",
          100: "#DBDBDB",
          200: "#BFBFBF",
          300: "#9F9F9F",
          400: "#8A8A8A",
          500: "#737373",
          600: "#575757",
          700: "#3C3C3C",
          800: "#171717",
          900: "#000000",
        },
        jokerPurple: {
          50: "#EBE5F0",
          100: "#BA9FD3",
          200: "#9271B2",
          300: "#735193",
          400: "#4E306B",
          500: "#3F2558",
          600: "#2D1940",
          700: "#21122F",
          800: "#1A0E25",
          900: "#0E0815",
        },
        strawberry: {
          50: "#ECC4D4",
          100: "#E8BACC",
          200: "#E5ABC2",
          300: "#D38DA8",
          400: "#BD6A8A",
          500: "#9D4F6D",
          600: "#71364D",
          700: "#61243C",
          800: "#4B172C",
          900: "#2B0816",
        },
        nord: {
          50: "#CAD0DC",
          100: "#B8C0CF",
          200: "#929CAF",
          300: "#737C8F",
          400: "#4D5564",
          500: "#323844",
          600: "#2B303B",
          700: "#242933",
          800: "#20242E",
          900: "#1A1D25",
        },

        "bg-dark": "var(--bg-dark)",
        "bg-light": "var(--bg-light)",
        "t-main": "var(--t-main)",
        "t-sub": "var(--t-sub)",
        "b-light": "var(--b-light)",
        "b-dark": "var(--b-dark)",
        "b-highlight": "var(--b-highlight)",
        "b-light-dark": "var(--b-light-dark)",
        "b-dark-dark": "var(--b-dark-dark)",
        "b-highlight-dark": "var(--b-highlight-dark)",
        "input-focus": "var(--input-focus)",
        "input-blur": "var(--input-blur)",
        "input-light": "var(--input-light)",
        "input-focus-dark": "var(--input-focus-dark)",
        "input-blur-dark": "var(--input-blur-dark)",
        "input-light-dark": "var(--input-light-dark)",
      },

      borderWidth: ["hover", "focus"],

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },

      boxShadow: {
        highlight: `0px 0px 0px .3rem inset var(--bg-dark)`,
      },

      width: {
        18: "4.5rem",
        "1/8": `${100 / 8}%`,
      },
      height: {
        "1/8": `${100 / 8}%`,
      },

      translate: ["group-hover"],

      opacity: {
        15: "0.15",
      },
    },
  },
  plugins: [],
};
