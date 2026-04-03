const preset = require("@extractor/config/tailwind-preset");

module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  presets: [preset]
};
