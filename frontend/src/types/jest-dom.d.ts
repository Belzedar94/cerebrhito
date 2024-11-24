/// <reference types="@testing-library/jest-dom" />

declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string | RegExp): R;
    toBeDisabled(): R;
    toHaveValue(value: string | string[] | number | null): R;
  }
}