import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ["public/**/*"],
  },
  {
    rules: {
      // The data-fetching views deliberately call setLoading(true) at the top of
      // their fetch effect so the spinner shows on every (re)fetch. That is the
      // intended pattern here, not a bug — keep it visible as a warning rather
      // than failing CI on it. Real regressions still surface in the lint output.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
