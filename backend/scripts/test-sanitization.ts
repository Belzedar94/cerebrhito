import { z } from 'zod';
import type { IOptions } from 'sanitize-html';
import {
  sanitizeContent,
  sanitizeText,
  sanitizeObject,
  createSanitizedString,
  createSanitizedText,
  createSanitizedObject,
  sanitizeOptions
} from '../src/utils/sanitize';

interface SanitizeContentTest {
  name: string;
  input: string;
  options: IOptions;
  expected: string;
  shouldPass: boolean;
}

interface SanitizeObjectTest {
  name: string;
  input: object;
  options: IOptions;
  expected: object;
  shouldPass: boolean;
}

interface ZodSanitizationTest {
  name: string;
  schema: z.ZodType<any>;
  input: object;
  expected: object;
  shouldPass: boolean;
}

// Test cases
const testCases: {
  sanitizeContent: SanitizeContentTest[];
  sanitizeObject: SanitizeObjectTest[];
  zodSanitization: ZodSanitizationTest[];
} = {
  // Basic sanitization
  sanitizeContent: [
    {
      name: 'Allow basic formatting',
      input: '<p>Hello <b>world</b>!</p><script>alert("xss")</script>',
      options: sanitizeOptions.content,
      expected: '<p>Hello<b>world</b>!</p>',
      shouldPass: true
    },
    {
      name: 'Strip all HTML',
      input: '<p>Hello <b>world</b>!</p><script>alert("xss")</script>',
      options: sanitizeOptions.text,
      expected: 'Helloworld!',
      shouldPass: true
    },
    {
      name: 'Allow profile formatting',
      input: '<p>About me: <b>Developer</b> & <i>Designer</i></p><script>alert("xss")</script>',
      options: sanitizeOptions.profile,
      expected: '<p>About me:<b>Developer</b>&amp;<i>Designer</i></p>',
      shouldPass: true
    }
  ],

  // Object sanitization
  sanitizeObject: [
    {
      name: 'Sanitize nested object',
      input: {
        name: '<b>John</b><script>alert("xss")</script>',
        profile: {
          bio: '<p>Hello <b>world</b>!</p><script>alert("xss")</script>',
          links: ['<a href="http://example.com">Link</a><script>alert("xss")</script>']
        }
      },
      options: sanitizeOptions.profile,
      expected: {
        name: '<b>John</b>',
        profile: {
          bio: '<p>Hello<b>world</b>!</p>',
          links: ['<a href="http://example.com" target="_blank">Link</a>']
        }
      },
      shouldPass: true
    }
  ],

  // Zod schema sanitization
  zodSanitization: [
    {
      name: 'Sanitize schema',
      schema: z.object({
        name: createSanitizedText(),
        description: createSanitizedString(sanitizeOptions.content),
        profile: z.object({
          bio: createSanitizedString(sanitizeOptions.profile),
          links: z.array(createSanitizedString(sanitizeOptions.content))
        })
      }),
      input: {
        name: '<b>John</b><script>alert("xss")</script>',
        description: '<p>Hello <b>world</b>!</p><script>alert("xss")</script>',
        profile: {
          bio: '<p>About me: <b>Developer</b></p><script>alert("xss")</script>',
          links: ['<a href="http://example.com">Link</a><script>alert("xss")</script>']
        }
      },
      expected: {
        name: 'John',
        description: '<p>Hello<b>world</b>!</p>',
        profile: {
          bio: '<p>About me:<b>Developer</b></p>',
          links: ['<a href="http://example.com" target="_blank" rel="noopener noreferrer">Link</a>']
        }
      },
      shouldPass: true
    }
  ]
};

// Test runner
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    details: [] as any[]
  };

  for (const [category, cases] of Object.entries(testCases)) {
    console.log(`\nTesting ${category}:`);
    console.log('='.repeat(50));

    for (const testCase of cases) {
      try {
        let result: any;

        switch (category) {
          case 'sanitizeContent':
            result = sanitizeContent((testCase as SanitizeContentTest).input, (testCase as SanitizeContentTest).options);
            break;
          case 'sanitizeObject':
            result = sanitizeObject((testCase as SanitizeObjectTest).input, (testCase as SanitizeObjectTest).options);
            break;
          case 'zodSanitization':
            result = await (testCase as ZodSanitizationTest).schema.parseAsync((testCase as ZodSanitizationTest).input);
            break;
        }

        const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);

        if (passed && testCase.shouldPass) {
          console.log(`✅ PASS: ${testCase.name}`);
          results.passed++;
        } else if (!passed && !testCase.shouldPass) {
          console.log(`✅ PASS: ${testCase.name} (Failed as expected)`);
          results.passed++;
        } else {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log('Expected:', testCase.expected);
          console.log('Received:', result);
          results.failed++;
        }

        results.details.push({
          category,
          name: testCase.name,
          result: passed === testCase.shouldPass ? 'pass' : 'fail',
          expected: testCase.expected,
          received: result
        });
      } catch (error) {
        if (!testCase.shouldPass) {
          console.log(`✅ PASS: ${testCase.name} (Failed as expected)`);
          results.passed++;
        } else {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log('Error:', error instanceof Error ? error.message : error);
          results.failed++;
        }

        results.details.push({
          category,
          name: testCase.name,
          result: testCase.shouldPass ? 'fail' : 'expected fail',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  console.log('\nTest Summary:');
  console.log('='.repeat(50));
  console.log(`Total tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  return results;
}

// Run tests
runTests().catch(console.error);