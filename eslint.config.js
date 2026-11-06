// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNativeA11y = require('eslint-plugin-react-native-a11y');

module.exports = defineConfig([
  expoConfig,
  {
    // Apply a11y rules to all TypeScript/TSX source files (NFR-005, REQ-007)
    plugins: {
      'react-native-a11y': reactNativeA11y,
    },
    rules: {
      // Warn when interactive elements are missing accessibility props
      'react-native-a11y/has-accessibility-props': 'warn',
      // Warn on invalid accessibilityRole values
      'react-native-a11y/has-valid-accessibility-role': 'warn',
      // Error on explicit `any` type usage (NFR-001 strict TypeScript)
      '@typescript-eslint/no-explicit-any': 'error',
      // Off — too noisy for a foundation shell
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    ignores: ['dist/*', 'web-build/*', 'node_modules/*'],
  },
]);
