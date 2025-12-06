import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'azure/**',
      '**/*.traineddata',
      'vector_db/**',
      '*.js',
      '*.js.map',
      '*.d.ts',
      '*.d.ts.map',
    ],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off', // Muito restritivo para callbacks
      'prefer-const': 'warn', // Permitir let quando variável pode ser reatribuída no loop
      'no-case-declarations': 'off', // TypeScript já garante escopo
      'no-control-regex': 'off', // Necessário para limpar caracteres de controle do texto
    },
  }
);

