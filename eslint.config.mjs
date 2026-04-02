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
      'no-restricted-properties': [
        'error',
        {
          property: 'toLocaleString',
          message:
            'Use shared timezone/time-format helpers (for dates) or Intl.NumberFormat (for numbers) instead of direct toLocaleString.',
        },
        {
          property: 'toLocaleDateString',
          message:
            'Use shared timezone/time-format helpers instead of direct toLocaleDateString.',
        },
        {
          property: 'toLocaleTimeString',
          message:
            'Use shared timezone/time-format helpers instead of direct toLocaleTimeString.',
        },
      ],
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
