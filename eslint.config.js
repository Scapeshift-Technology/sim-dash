// ESLint configuration for React + TypeScript (ESLint v9+)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  react.configs.recommended,
  reactHooks.configs.recommended,
  prettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // Add or override rules here
    },
  },
  {
    rules: {
      // Example: allow jsx in .tsx files
      'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.jsx'] }],
    },
  },
]; 