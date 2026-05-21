// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const importX = require('eslint-plugin-import-x');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    plugins: {
      'import-x': importX,
    },
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            // disables cross-feature imports:
            // if you tamper with this file then you are a fucking pussy
            {
              target: './features/auth',
              from: './features',
              except: ['./auth'],
            },
            {
              target: './features/users',
              from: './features',
              except: ['./users'],
            },
            {
              target: './features/community',
              from: './features',
              except: ['./community'],
            },
            {
              target: './features/communication',
              from: './features',
              except: ['./communication'],
            },
            {
              target: './features/finance',
              from: './features',
              except: ['./finance'],
            },
            {
              target: './features/maps',
              from: './features',
              except: ['./maps'],
            },
            {
              target: './features/support',
              from: './features',
              except: ['./support'],
            },
            // Enforce unidirectional codebase: app/ can import from features/, but features/ CANNOT import from app/
            {
              target: './features',
              from: './app',
            },
            // Shared modules (components, hooks, lib, etc.) shouldn't depend on features or app
            {
              target: [
                './components',
                './hooks',
                './lib',
                './types',
                './utils',
              ],
              from: ['./features', './app'],
            },
          ]
        }
      ]
    }
  }
]);
