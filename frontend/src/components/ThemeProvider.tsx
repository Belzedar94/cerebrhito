'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type Attribute = 'class' | 'data-theme';

interface ThemeProviderProps {
  children: React.ReactNode;
  themes?: string[];
  forcedTheme?: string;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  disableTransitionOnChange?: boolean;
  attribute?: Attribute | Attribute[];
  value?: Record<string, string>;
  nonce?: string;
  defaultTheme?: string;
  storageKey?: string;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
