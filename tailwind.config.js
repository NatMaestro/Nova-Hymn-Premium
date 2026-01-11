/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        onest: ['Onest-Regular', 'Onest-Bold', 'Onest-Medium', 'Onest-Light'],
      },
      colors: {
        navy: "#071c49",
      },
    },
  },
};


