import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module", // You can leave as "module" even with CommonJS in Node.js
      globals: {
        ...globals.node, // Use Node.js global environment
      },
    },
    rules: {
      // Allow require() and module.exports
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "error", // Optional: downgrade severity
    },
  },
  ...tseslint.configs.recommended.filter(config => config.files?.includes("**/*.{ts,tsx}")),
];