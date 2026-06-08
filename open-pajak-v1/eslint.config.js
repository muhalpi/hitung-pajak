//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      'dist/**',
      'eslint.config.js',
      'prettier.config.js',
      'src/routeTree.gen.ts',
      'worker/_worker.js',
    ],
  },
]
