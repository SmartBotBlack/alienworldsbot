module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    sourceType: "module",
    project: ["./tsconfig.json"],
    allowAutomaticSingleRunInference: true,
    tsconfigRootDir: __dirname,
    warnOnUnsupportedTypeScriptVersion: false,
    EXPERIMENTAL_useSourceOfProjectReferenceRedirect: false,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": 2,
  },
  ignorePatterns: [".eslintrc.js"],
  overrides: [
    {
      files: ["*.js.flow"],
      parser: "babel-eslint",
    },
  ],
};
