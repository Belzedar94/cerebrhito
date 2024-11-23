#!/bin/bash

# Format all files using Prettier
echo "Formatting files with Prettier..."
npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,scss,md,yaml,yml}"

# Run ESLint with --fix option
echo "Running ESLint with auto-fix..."
npx eslint --fix "**/*.{ts,tsx,js,jsx}"

# Format SQL files
echo "Formatting SQL files..."
find . -name "*.sql" -exec npx sql-formatter -o {} {} \;

# Format shell scripts
echo "Formatting shell scripts..."
find . -name "*.sh" -exec shfmt -w {} \;

echo "All files formatted successfully!"