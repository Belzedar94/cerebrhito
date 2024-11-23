#!/bin/bash

# Check code style with Prettier
echo "Checking code style with Prettier..."
npx prettier --check "**/*.{ts,tsx,js,jsx,json,css,scss,md,yaml,yml}"

# Run ESLint
echo "Running ESLint..."
npx eslint "**/*.{ts,tsx,js,jsx}"

# Check SQL files
echo "Checking SQL files..."
find . -name "*.sql" -exec npx sql-formatter -c {} \;

# Check shell scripts
echo "Checking shell scripts..."
find . -name "*.sh" -exec shfmt -d {} \;

echo "All checks completed!"