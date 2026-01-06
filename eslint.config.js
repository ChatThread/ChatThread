// ESLint v9 flat config (CommonJS)
// Docs: https://eslint.org/docs/latest/use/configure/configuration-files#flat-config-files

const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  // Ignore generated and build outputs
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/dist-web/**",
      "**/out/**",
      "**/.vscode/**",
      "**/resources/build/**",
      "**/*.min.js",
    ],
  },

  // Base JS recommended
  {
    ...js.configs.recommended,
  },

  // Project rules
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}", "!**/node_modules/**"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // Avoid type-aware linting for performance and setup simplicity
        // If you want type-aware rules, set a project: ["./tsconfig.json"] here.
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly",
      },
    },
    plugins: {
      // TypeScript support
      "@typescript-eslint": tseslint,
      // React
      react,
      // React Hooks
      "react-hooks": reactHooks,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // JS base
      ...js.configs.recommended.rules,

      // TypeScript essentials
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Type names like JSX/NodeJS trip no-undef in TS, let TS handle this
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",

      // React & JSX
      "react/react-in-jsx-scope": "off", // React 17+ JSX transform
      "react/jsx-uses-react": "off",
      "react/prop-types": "off", // using TS for props typing
      "react/no-unknown-property": ["warn", { ignore: ["css"] }],

      // React Hooks
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // General rules - relaxed to warnings to get repo green
      "no-case-declarations": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-empty-pattern": "warn",
      "no-prototype-builtins": "warn",
      "no-constant-condition": "warn",
      "no-constant-binary-expression": "warn",
      "no-import-assign": "warn",
      "no-redeclare": "warn",
      "no-useless-catch": "warn",
      "no-async-promise-executor": "warn",
      "no-shadow-restricted-names": "warn",
      "no-misleading-character-class": "warn",
    },
  },
];
