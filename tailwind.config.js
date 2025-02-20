module.exports = {
  content: [
    "./src/admin/**/*.tsx",
    //"./src/**/*.{js,jsx,ts,tsx}", // Maybe use something like this later
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Prevent conflicts with WordPress admin style
  important: ".maki-geo",
};
