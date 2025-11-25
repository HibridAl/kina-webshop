
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";

const eslintConfig = [
  {
    ignores: ["node_modules/", ".next/"],
  },
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
];

export default eslintConfig;
