import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: ['dist/**', '.eslintrc.cjs'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: '18.2',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^React$',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'react/no-unescaped-entities': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['app.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        google: 'readonly',
        L: 'readonly',
        firebase: 'readonly',
        ADMIN_CONFIG: 'readonly',
        COUNTY_DATA: 'readonly',
        COUNTY_CITIES: 'readonly',
        CITY_DATA: 'readonly',
        BUSINESSES: 'readonly',
        DISCUSSION_POSTS: 'readonly',
        MEMBER_PROFILES: 'readonly',
        EVENTS_DATA: 'readonly',
        AWARDS: 'readonly',
        MARKETPLACE_LISTINGS: 'readonly',
      },
    },
  },
  {
    files: ['firebase-config.js', 'config.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        firebase: 'readonly',
        ADMIN_CONFIG: 'readonly',
        AWARDS: 'readonly',
      },
    },
  },
]