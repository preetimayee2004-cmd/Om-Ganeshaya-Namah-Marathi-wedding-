import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import screenUnits from "./postcss-screen-units.js";

export default {
  plugins: [
    tailwindcss(),
    // after tailwind: make every px/rem/vw/vh proportional to the phone screen
    screenUnits(),
    autoprefixer(),
  ],
};
