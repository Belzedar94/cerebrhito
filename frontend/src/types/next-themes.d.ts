declare module 'next-themes/dist/types' {
  export interface UseThemeProps {
    /** List of all available theme names */
    themes: string[];
    /** Forced theme name for the current page */
    forcedTheme?: string;
    /** Update the theme */
    setTheme: (theme: string) => void;
    /** Active theme name */
    theme?: string;
    /** If `enableSystem` is true and the active theme is "system", this returns whether the system preference resolved to "dark" or "light". Otherwise, returns undefined */
    resolvedTheme?: string;
    /** If enableSystem is true, returns the System theme preference ("dark" or "light"), regardless what the active theme is */
    systemTheme?: 'dark' | 'light';
  }

  export interface ThemeProviderProps {
    /** List of all available theme names */
    themes?: string[];
    /** Forced theme name for the current page */
    forcedTheme?: string;
    /** Whether to enable system theme preference */
    enableSystem?: boolean;
    /** Whether to switch between dark and light themes */
    enableColorScheme?: boolean;
    /** Disable all CSS transitions when switching themes */
    disableTransitionOnChange?: boolean;
    /** Whether to indicate to browsers which color scheme is used (dark or light) for built-in UI like inputs and buttons */
    attribute?: string | 'class' | 'data-theme';
    /** HTML attribute modified based on the active theme. Accepts `class` and `data-*` (meaning any data attribute, `data-mode`, `data-color`, etc.) */
    value?: Record<string, string>;
    /** Mapping of theme name to theme className */
    nonce?: string;
    /** Default theme name (for v0.0.12 and lower the default was light). If `enableSystem` is false, the default theme is light */
    defaultTheme?: string;
    /** Update the theme */
    storageKey?: string;
    /** Key used to store theme setting in localStorage */
    children?: React.ReactNode;
  }
}
