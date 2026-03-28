import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

export default [
  ...nextCoreWebVitals,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
  {
    ignores: [
      '**/*-broken.*',
      '**/*-backup*.*',
      '**/page-backup-animation.tsx',
      '**/page-with-beautiful-enhancements.tsx',
      '**/NotificationSystem_broken.tsx',
      '.next/**',
      'node_modules/**',
    ],
  },
]
