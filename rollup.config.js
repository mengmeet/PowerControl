import deckyPlugin from "@decky/rollup";
import { mergeAndConcat } from "merge-anything";

const userOptions = {
  // Add your extra Rollup options here
  treeshake: {
    preset: "recommended",
  },
};

// must be merged in the order of default options first, then user options
export default mergeAndConcat(deckyPlugin(), userOptions);
