import {
  sanitizeContent,
  sanitizeText,
  sanitizeObject,
  createSanitizedString,
  createSanitizedText,
  createSanitizedObject,
  sanitizeOptions,
} from '../utils/sanitize';
import { z } from 'zod';

describe('Sanitization Utils', () => {
  describe('sanitizeContent', () => {
    it('should allow basic formatting', () => {
      const input = '<p>Hello <b>world</b>!</p><script>alert("xss")</script>';
      const output = sanitizeContent(input, sanitizeOptions.content);

      expect(output).toBe('<p>Hello <b>world</b>!</p>');
    });

    it('should strip all HTML with text option', () => {
      const input = '<p>Hello <b>world</b>!</p><script>alert("xss")</script>';
      const output = sanitizeContent(input, sanitizeOptions.text);

      expect(output).toBe('Hello world!');
    });

    it('should allow profile formatting', () => {
      const input =
        '<p>About me: <b>Developer</b> & <i>Designer</i></p><script>alert("xss")</script>';
      const output = sanitizeContent(input, sanitizeOptions.profile);

      expect(output).toBe('<p>About me: <b>Developer</b> &amp; <i>Designer</i></p>');
    });

    it('should handle empty input', () => {
      expect(sanitizeContent('')).toBe('');
    });

    it('should handle null/undefined input', () => {
      expect(sanitizeContent(null as any)).toBe('');
      expect(sanitizeContent(undefined as any)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should strip all HTML', () => {
      const input = '<p>Hello <b>world</b>!</p><script>alert("xss")</script>';
      const output = sanitizeText(input);

      expect(output).toBe('Hello world!');
    });

    it('should preserve whitespace', () => {
      const input = '  Hello   world  ';
      const output = sanitizeText(input);

      expect(output).toBe('Hello world');
    });

    it('should handle special characters', () => {
      const input = '&lt;script&gt; Hello & World &lt;/script&gt;';
      const output = sanitizeText(input);

      expect(output).toBe('<script> Hello & World </script>');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize nested object', () => {
      const input = {
        name: '<b>John</b><script>alert("xss")</script>',
        profile: {
          bio: '<p>Hello <b>world</b>!</p><script>alert("xss")</script>',
          links: ['<a href="http://example.com">Link</a><script>alert("xss")</script>'],
        },
      };

      const output = sanitizeObject(input, sanitizeOptions.profile);

      expect(output).toEqual({
        name: '<b>John</b>',
        profile: {
          bio: '<p>Hello <b>world</b>!</p>',
          links: [
            '<a href="http://example.com" target="_blank" rel="noopener noreferrer">Link</a>',
          ],
        },
      });
    });

    it('should handle arrays', () => {
      const input = {
        tags: ['<b>Tag1</b>', '<i>Tag2</i>', '<script>alert("xss")</script>'],
      };

      const output = sanitizeObject(input, sanitizeOptions.text);

      expect(output).toEqual({
        tags: ['Tag1', 'Tag2', 'alert("xss")'],
      });
    });

    it('should preserve non-string values', () => {
      const input = {
        name: '<b>John</b>',
        age: 30,
        active: true,
        score: 4.5,
        data: null,
      };

      const output = sanitizeObject(input);

      expect(output).toEqual({
        name: '<b>John</b>',
        age: 30,
        active: true,
        score: 4.5,
        data: null,
      });
    });
  });

  describe('Zod Transformers', () => {
    describe('createSanitizedString', () => {
      it('should create a string transformer', () => {
        const schema = z.object({
          content: createSanitizedString(sanitizeOptions.content),
        });

        const input = {
          content: '<p>Hello <b>world</b>!</p><script>alert("xss")</script>',
        };

        const output = schema.parse(input);

        expect(output.content).toBe('<p>Hello <b>world</b>!</p>');
      });
    });

    describe('createSanitizedText', () => {
      it('should create a text transformer', () => {
        const schema = z.object({
          text: createSanitizedText(),
        });

        const input = {
          text: '<p>Hello <b>world</b>!</p><script>alert("xss")</script>',
        };

        const output = schema.parse(input);

        expect(output.text).toBe('Hello world!');
      });
    });

    describe('createSanitizedObject', () => {
      it('should create an object transformer', () => {
        const schema = createSanitizedObject(
          z.object({
            name: z.string(),
            description: z.string(),
            profile: z.object({
              bio: z.string(),
              links: z.array(z.string()),
            }),
          }),
          sanitizeOptions.profile
        );

        const input = {
          name: '<b>John</b><script>alert("xss")</script>',
          description: '<p>About me</p><script>alert("xss")</script>',
          profile: {
            bio: '<p>Hello <b>world</b>!</p><script>alert("xss")</script>',
            links: ['<a href="http://example.com">Link</a><script>alert("xss")</script>'],
          },
        };

        const output = schema.parse(input);

        expect(output).toEqual({
          name: '<b>John</b>',
          description: '<p>About me</p>',
          profile: {
            bio: '<p>Hello <b>world</b>!</p>',
            links: [
              '<a href="http://example.com" target="_blank" rel="noopener noreferrer">Link</a>',
            ],
          },
        });
      });
    });
  });

  describe('Sanitization Options', () => {
    describe('content options', () => {
      it('should allow basic formatting tags', () => {
        const input = `
          <h1>Title</h1>
          <p><b>Bold</b> and <i>italic</i> text</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <blockquote>Quote</blockquote>
          <a href="http://example.com">Link</a>
        `;

        const output = sanitizeContent(input, sanitizeOptions.content);

        expect(output).toContain('<h1>');
        expect(output).toContain('<p>');
        expect(output).toContain('<b>');
        expect(output).toContain('<i>');
        expect(output).toContain('<ul>');
        expect(output).toContain('<li>');
        expect(output).toContain('<blockquote>');
        expect(output).toContain('<a href="http://example.com"');
      });

      it('should block unsafe tags and attributes', () => {
        const input = `
          <script>alert("xss")</script>
          <img src="x" onerror="alert('xss')">
          <a href="javascript:alert('xss')">Link</a>
          <iframe src="http://evil.com"></iframe>
          <style>body { display: none; }</style>
        `;

        const output = sanitizeContent(input, sanitizeOptions.content);

        expect(output).not.toContain('<script>');
        expect(output).not.toContain('onerror=');
        expect(output).not.toContain('javascript:');
        expect(output).not.toContain('<iframe');
        expect(output).not.toContain('<style>');
      });
    });

    describe('profile options', () => {
      it('should allow limited formatting', () => {
        const input = `
          <h1>Title</h1>
          <p><b>Bold</b> and <i>italic</i> text</p>
          <a href="http://example.com">Link</a>
          <ul><li>Item</li></ul>
        `;

        const output = sanitizeContent(input, sanitizeOptions.profile);

        expect(output).not.toContain('<h1>');
        expect(output).toContain('<p>');
        expect(output).toContain('<b>');
        expect(output).toContain('<i>');
        expect(output).toContain('<a href="http://example.com"');
        expect(output).not.toContain('<ul>');
      });
    });

    describe('activity options', () => {
      it('should allow activity-specific tags', () => {
        const input = `
          <h1>Activity Title</h1>
          <p><b>Instructions:</b></p>
          <ul>
            <li>Step 1</li>
            <li>Step 2</li>
          </ul>
          <img src="http://example.com/image.jpg" alt="Activity">
          <a href="http://example.com">Resource</a>
        `;

        const output = sanitizeContent(input, sanitizeOptions.activity);

        expect(output).toContain('<h1>');
        expect(output).toContain('<p>');
        expect(output).toContain('<ul>');
        expect(output).toContain('<li>');
        expect(output).toContain('<img src="http://example.com/image.jpg" alt="Activity"');
        expect(output).toContain('<a href="http://example.com"');
      });
    });

    describe('professional options', () => {
      it('should allow professional notation tags', () => {
        const input = `
          <p>Patient shows signs of <sup>1</sup>developmental progress</p>
          <p>Prescribed <sub>2</sub>therapy sessions</p>
          <p><abbr title="Attention Deficit Hyperactivity Disorder">ADHD</abbr></p>
        `;

        const output = sanitizeContent(input, sanitizeOptions.professional);

        expect(output).toContain('<sup>');
        expect(output).toContain('<sub>');
        expect(output).toContain('<abbr title="');
      });
    });
  });
});
