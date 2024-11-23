module.exports = {
  // Line length
  printWidth: 80,

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Quotes
  singleQuote: true,
  jsxSingleQuote: false,

  // Semicolons
  semi: true,

  // Trailing commas
  trailingComma: 'none',

  // Brackets
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Whitespace
  endOfLine: 'lf',

  // JSX
  jsxBracketSameLine: false,

  // Import sorting
  importOrder: [
    '^react$',
    '^next',
    '^@/components/(.*)$',
    '^@/hooks/(.*)$',
    '^@/lib/(.*)$',
    '^@/utils/(.*)$',
    '^@/styles/(.*)$',
    '^[./]'
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,

  // Plugins
  plugins: [
    'prettier-plugin-tailwindcss',
    '@trivago/prettier-plugin-sort-imports'
  ],

  // Override settings for specific file types
  overrides: [
    {
      files: '*.{ts,tsx}',
      options: {
        parser: 'typescript'
      }
    },
    {
      files: '*.{css,scss}',
      options: {
        singleQuote: false
      }
    },
    {
      files: '*.{json,yml,yaml}',
      options: {
        singleQuote: false
      }
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always'
      }
    }
  ]
};