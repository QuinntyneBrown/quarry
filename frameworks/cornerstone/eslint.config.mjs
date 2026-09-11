import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'out-tsc/**',
      'coverage/**',
      'src/docs-app/generated/**',
      'src/e2e-app/generated/**',
      // The brochure pages are static HTML, not Angular templates, so the
      // Angular parser below cannot read them. The WebGPU module remains linted.
      'src/marketing/**/*.html',
    ],
  },
  {
    ...eslint.configs.recommended,
    files: ['src/marketing/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        cancelAnimationFrame: 'readonly',
        document: 'readonly',
        GPUBufferUsage: 'readonly',
        IntersectionObserver: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        ResizeObserver: 'readonly',
        window: 'readonly',
      },
    },
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
    },
  },
  {
    files: ['src/cornerstone/core/forms/cs-select.directive.ts'],
    rules: {
      // Preserve the inherited writable disabled signal while exposing native [disabled].
      '@angular-eslint/no-input-rename': ['error', { allowedNames: ['disabled'] }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
);
