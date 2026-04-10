import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

export default [
    js.configs.recommended,
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
            globals: {
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                history: 'readonly',
                FileReader: 'readonly',
                getComputedStyle: 'readonly',
                route: 'readonly',
                HTMLElement: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLTextAreaElement: 'readonly',
                JSX: 'readonly',
                AudioContext: 'readonly',
                OscillatorType: 'readonly',
                IntersectionObserver: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            react: reactPlugin,
            'react-hooks': reactHooks,
            import: importPlugin,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-hooks/exhaustive-deps': 'error',
            'react/react-in-jsx-scope': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-undef': 'off',
            'import/order': ['warn', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
            'import/no-restricted-paths': [
                'warn',
                {
                    zones: [
                        {
                            target: './resources/js/features',
                            from: './resources/js/pages',
                            message: 'Feature layer cannot import from pages layer. Move shared code into components/* or core.',
                        },
                    ],
                },
            ],
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        files: ['resources/js/features/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'warn',
                {
                    patterns: ['**/pages/**', '@/pages/**'],
                },
            ],
        },
    },
    {
        files: ['tests/e2e/**/*.ts', 'playwright.config.ts', 'scripts/**/*.mjs'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                process: 'readonly',
                console: 'readonly',
                window: 'readonly',
            },
        },
    },
];
