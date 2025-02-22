module.exports = {
  content: [
    "./src/admin/**/*.tsx",
    //"./src/**/*.{js,jsx,ts,tsx}", // Maybe use something like this later
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  // Prevent conflicts with WordPress admin style
  important: ".maki-geo",
  daisyui: {
    themeRoot: ".maki-geo",
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#7fd63b",
          "primary-content": "#061001",
          secondary: "#f34f14",
          "secondary-content": "#140200",
          accent: "#525f7f",
          "accent-content": "#dadde5",
          neutral: "#d4d1d0",
          "neutral-content": "#101010",
          "base-100": "#ffffff",
          success: "#7fd63b",

          "--rounded-box": "1rem", // border radius rounded-box utility class, used in card and other large boxes
          "--rounded-btn": "0.1rem", // border radius rounded-btn utility class, used in buttons and similar element
          "--rounded-badge": "1.9rem", // border radius rounded-badge utility class, used in badges and similar
          "--animation-btn": "0.25s", // duration of animation when you click on button
          "--animation-input": "0.2s", // duration of animation for inputs like checkbox, toggle, radio, etc
          "--btn-focus-scale": "0.95", // scale transform of button when you focus on it
          "--border-btn": "1px", // border width of buttons
          "--tab-border": "1px", // border width of tabs
          "--tab-radius": "0.5rem", // border radius of tabs
        },
      },
    ],
  },
};
