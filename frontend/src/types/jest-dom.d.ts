import type { TestingLibraryMatchers } from '@types/testing-library__jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> extends TestingLibraryMatchers<R, HTMLElement> {}
  }
}
