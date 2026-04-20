const js = require('@eslint/js');
const pluginN = require('eslint-plugin-n');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // ── Ignored paths ───────────────────────────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'backups/**',
      'release/**',
      // Zoho-provided minified boilerplate — vendor code, not ours
      'src/renderer/scripts/modules/zoho-form-helpers.js',
      // JSON files are formatted by Prettier, not linted by ESLint
      'config/**',
    ],
  },

  // ── Main process — CommonJS (Node.js / Electron main) ───────────────────────
  {
    files: ['src/main/**/*.js'],
    plugins: { n: pluginN },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginN.configs['flat/recommended-script'].rules,
      ...prettierConfig.rules,
      // Electron packages are devDependencies — don't flag them as missing
      'n/no-unpublished-require': 'off',
      'n/no-missing-require': 'off',
      // Allow unused catch params (catch (error) {} is intentional silent handling)
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },

  // ── Preload — CommonJS but runs in renderer context (has window) ─────────────
  {
    files: ['src/main/preload.js'],
    plugins: { n: pluginN },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        // Preload runs in renderer context — window and document are accessible
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'n/no-unpublished-require': 'off',
      'n/no-missing-require': 'off',
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },

  // ── Renderer — ES modules (browser + Electron renderer) ─────────────────────
  {
    files: ['src/renderer/scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        // Web APIs used in ticket-form.js
        FormData: 'readonly',
        DataTransfer: 'readonly',
        File: 'readonly',
        Event: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        alert: 'readonly',
        // Electron preload bridge
        electronAPI: 'readonly',
        // Zoho SDK globals injected by their hosted scripts at runtime
        jQuery: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
];
