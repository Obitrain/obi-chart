const reactNative = require('@react-native/eslint-config/flat');

module.exports = [
  { ignores: ['**/*.js', '**/node_modules/**', 'lib/**', 'coverage/**'] },
  ...reactNative,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { project: './tsconfig.json', tsconfigRootDir: __dirname },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-native/no-unused-styles': 'warn',
      'prettier/prettier': 'off',
      'semi': 'off',
      'comma-dangle': 'off',
      'react-native/no-inline-styles': 'off',
      'curly': 'off',
      'radix': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'jest/no-focused-tests': 'error',
      'require-await': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
];
