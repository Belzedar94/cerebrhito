import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

// Default sanitization options
const defaultOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'b',
    'i',
    'em',
    'strong',
    'p',
    'br',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'a',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
  },
  textFilter: text => text.replace(/\s+/g, ' ').trim(),
  exclusiveFilter: frame => false,
  nonTextTags: ['script', 'style', 'textarea', 'option'],
  selfClosing: ['br', 'hr', 'img', 'input', 'meta', 'link'],
  enforceHtmlBoundary: true,
  parser: {
    lowerCaseTags: true,
    lowerCaseAttributeNames: true,
    decodeEntities: true,
  },
};

// Strict sanitization options (text only)
const strictOptions: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  textFilter: text => text.replace(/\s+/g, ' ').trim(),
  parser: {
    decodeEntities: true,
  },
};

/**
 * Sanitize HTML content with configurable options
 */
export function sanitizeContent(
  content: string,
  options: sanitizeHtml.IOptions = defaultOptions
): string {
  return sanitizeHtml(content, options);
}

/**
 * Sanitize text content (removes all HTML)
 */
export function sanitizeText(text: string): string {
  return sanitizeHtml(text, strictOptions);
}

/**
 * Create a Zod transformer that sanitizes string input
 */
export function createSanitizedString(
  options: sanitizeHtml.IOptions = defaultOptions
): z.ZodEffects<z.ZodString, string, string> {
  return z.string().transform(val => sanitizeContent(val, options));
}

/**
 * Create a Zod transformer that sanitizes text input (no HTML)
 */
export function createSanitizedText(): z.ZodEffects<z.ZodString, string, string> {
  return z.string().transform(sanitizeText);
}

/**
 * Sanitize an object's string properties recursively
 */
export function sanitizeObject<T extends object>(
  obj: T,
  options: sanitizeHtml.IOptions = defaultOptions
): T {
  const result = { ...obj };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      (result as any)[key] = sanitizeContent(value, options);
    } else if (Array.isArray(value)) {
      (result as any)[key] = value.map(item =>
        typeof item === 'string'
          ? sanitizeContent(item, options)
          : item instanceof Object
            ? sanitizeObject(item, options)
            : item
      );
    } else if (value instanceof Object) {
      (result as any)[key] = sanitizeObject(value, options);
    }
  }

  return result;
}

/**
 * Create a Zod transformer that sanitizes an object's string properties
 */
export function createSanitizedObject<T extends z.ZodTypeAny>(
  schema: T,
  options: sanitizeHtml.IOptions = defaultOptions
): z.ZodEffects<T, z.infer<T>, z.input<T>> {
  return schema.transform(obj => sanitizeObject(obj, options));
}

/**
 * Predefined sanitization options for different contexts
 */
export const sanitizeOptions = {
  // For user-generated content with basic formatting
  content: defaultOptions,

  // For plain text fields (no HTML)
  text: strictOptions,

  // For user profile fields (allow some formatting)
  profile: {
    ...defaultOptions,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'a'],
    allowedAttributes: {
      a: ['href', 'title', 'target'],
    },
  },

  // For activity descriptions (allow more formatting)
  activity: {
    ...defaultOptions,
    allowedTags: [
      'b',
      'i',
      'em',
      'strong',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'blockquote',
      'a',
      'img',
    ],
    allowedAttributes: {
      ...defaultOptions.allowedAttributes,
      img: ['src', 'alt', 'title'],
    },
  },

  // For professional notes (allow medical terminology)
  professional: {
    ...defaultOptions,
    allowedTags: [
      'b',
      'i',
      'em',
      'strong',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'sup',
      'sub',
      'abbr',
    ],
    allowedAttributes: {
      ...defaultOptions.allowedAttributes,
      abbr: ['title'],
    },
  },
};
