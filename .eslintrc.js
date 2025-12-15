module.exports = {
    root: true,
    extends: '@react-native',
    parser: '@typescript-eslint/parser',
    parserOptions: {
        // Needed for deprecation plugin
        project: './tsconfig.json'
    },
    plugins: [
        'react',
        'react-native',
        '@typescript-eslint',
        // remove deprecation in favor of @typescript-eslint/no-deprecated when
        // eslint version is updated to >= 6
        'deprecation'
    ],
    ignorePatterns: ['*.js', 'coverage/**/*'],
    env: {
        jest: true
    },
    rules: {
        'react-native/no-unused-styles': 'warn',
        'prettier/prettier': 'off',
        semi: 'off',
        'comma-dangle': 'off',
        'react-native/no-inline-styles': 'off',
        curly: 'off',
        radix: 'off',
        '@typescript-eslint/no-unused-vars': ['warn'],
        'no-spaced-func': 'off',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['error'],
        'jest/no-focused-tests': 'error',
        // 'no-console': ['warn', { allow: ['debug', 'info', 'error', 'warn'] }],
        'require-await': 'warn',
        '@typescript-eslint/consistent-type-imports': [
            'warn',
            { fixStyle: 'inline-type-imports' }
        ],
        'deprecation/deprecation': 'warn'
        // '@typescript-eslint/no-deprecated': 'warn'
    }
}
