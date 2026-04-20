module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json", "./tsconfig.test.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-unused-vars": "off",
  },
  env: {
    node: true,
    es2020: true,
  },
  overrides: [
    {
      files: ["**/__tests__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
      parserOptions: {
        project: null,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};
