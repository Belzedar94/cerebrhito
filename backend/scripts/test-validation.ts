import {
  activitySchema,
  activityLogSchema,
  milestoneSchema,
  milestoneTrackingSchema,
  aiMessageSchema,
  aiResponseSchema,
  signUpSchema,
  signInSchema,
  updatePasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  childSchema,
} from '../src/validation/schemas';

// Test data
const testCases = {
  // Auth test cases
  signUp: [
    {
      name: 'Valid parent signup',
      data: {
        email: 'parent@example.com',
        password: 'Test123!@#',
        name: 'John Smith',
        role: 'parent',
      },
      shouldPass: true,
    },
    {
      name: 'Valid professional signup',
      data: {
        email: 'doctor@example.com',
        password: 'Test123!@#',
        name: 'Jane Smith',
        role: 'professional',
        specialization: 'Pediatrician',
        license_number: 'MED-12345',
      },
      shouldPass: true,
    },
    {
      name: 'Invalid email',
      data: {
        email: 'invalid-email',
        password: 'Test123!@#',
        name: 'John Smith',
        role: 'parent',
      },
      shouldPass: false,
    },
    {
      name: 'Weak password',
      data: {
        email: 'parent@example.com',
        password: 'weak',
        name: 'John Smith',
        role: 'parent',
      },
      shouldPass: false,
    },
  ],

  // Child test cases
  child: [
    {
      name: 'Valid child profile',
      data: {
        name: 'Alice Smith',
        birth_date: new Date().toISOString(),
        gender: 'female',
        notes: 'Some notes about Alice',
        medical_conditions: ['Asthma'],
        allergies: ['Peanuts'],
        primary_language: 'English',
        additional_languages: ['Spanish'],
      },
      shouldPass: true,
    },
    {
      name: 'Invalid birth date (future)',
      data: {
        name: 'Bob Smith',
        birth_date: new Date(Date.now() + 86400000).toISOString(),
        gender: 'male',
      },
      shouldPass: false,
    },
  ],

  // Activity test cases
  activity: [
    {
      name: 'Valid activity',
      data: {
        name: 'Building Blocks Play',
        description: 'Stack and arrange blocks to develop motor skills',
        category: 'Motor Skills',
        min_age_months: 12,
        max_age_months: 36,
        duration_minutes: 30,
        materials_needed: ['Wooden blocks', 'Play mat'],
        skills_developed: ['Fine motor skills', 'Spatial awareness'],
        difficulty_level: 'easy',
        indoor: true,
        supervision_required: true,
        created_by: '123e4567-e89b-12d3-a456-426614174000',
        last_modified_by: '123e4567-e89b-12d3-a456-426614174000',
        status: 'draft',
      },
      shouldPass: true,
    },
    {
      name: 'Invalid duration',
      data: {
        name: 'Long Activity',
        description: 'Too long activity',
        category: 'Motor Skills',
        min_age_months: 12,
        max_age_months: 36,
        duration_minutes: 1000,
        skills_developed: ['Skill'],
        difficulty_level: 'easy',
        indoor: true,
        supervision_required: true,
        created_by: '123e4567-e89b-12d3-a456-426614174000',
      },
      shouldPass: false,
    },
  ],

  // Milestone test cases
  milestone: [
    {
      name: 'Valid milestone',
      data: {
        name: 'First Steps',
        description: 'Child takes their first independent steps',
        development_area_id: '123e4567-e89b-12d3-a456-426614174000',
        category: 'Motor Development',
        min_age_months: 9,
        max_age_months: 18,
        indicators: [
          'Stands independently',
          'Takes steps while holding furniture',
          'Takes independent steps',
        ],
        typical_age_range: {
          min_months: 9,
          max_months: 18,
        },
        status: 'published',
        created_by: '123e4567-e89b-12d3-a456-426614174000',
        last_modified_by: '123e4567-e89b-12d3-a456-426614174000',
      },
      shouldPass: true,
    },
    {
      name: 'Invalid age range',
      data: {
        name: 'Invalid Milestone',
        description: 'Invalid age range',
        development_area_id: '123e4567-e89b-12d3-a456-426614174000',
        category: 'Motor Development',
        min_age_months: 24,
        max_age_months: 12,
        indicators: ['Test indicator'],
        created_by: '123e4567-e89b-12d3-a456-426614174000',
      },
      shouldPass: false,
    },
  ],

  // AI message test cases
  aiMessage: [
    {
      name: 'Valid AI message',
      data: {
        message: 'What activities are good for a 2-year-old?',
        child_id: '123e4567-e89b-12d3-a456-426614174000',
        context: {
          child_age_months: 24,
          language: 'en-US',
          response_format: 'text',
        },
      },
      shouldPass: true,
    },
    {
      name: 'Message too long',
      data: {
        message: 'a'.repeat(1001),
        child_id: '123e4567-e89b-12d3-a456-426614174000',
      },
      shouldPass: false,
    },
  ],
};

// Test runner
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    details: [] as any[],
  };

  for (const [schemaName, cases] of Object.entries(testCases)) {
    console.log(`\nTesting ${schemaName} schema:`);
    console.log('='.repeat(50));

    for (const testCase of cases) {
      try {
        const schemas: { [key: string]: any } = {
          signUp: signUpSchema,
          child: childSchema,
          activity: activitySchema,
          milestone: milestoneSchema,
          aiMessage: aiMessageSchema,
        };
        const schema = schemas[schemaName];

        if (!schema) {
          throw new Error(`Schema ${schemaName} not found`);
        }

        await schema.parseAsync(testCase.data);

        if (testCase.shouldPass) {
          console.log(`✅ PASS: ${testCase.name}`);
          results.passed++;
        } else {
          console.log(`❌ FAIL: ${testCase.name} (Expected to fail but passed)`);
          results.failed++;
        }

        results.details.push({
          schema: schemaName,
          name: testCase.name,
          result: testCase.shouldPass ? 'pass' : 'unexpected pass',
          error: null,
        });
      } catch (error) {
        if (!testCase.shouldPass) {
          console.log(`✅ PASS: ${testCase.name} (Failed as expected)`);
          results.passed++;
        } else {
          console.log(`❌ FAIL: ${testCase.name}`);

          if (error instanceof Error) {
            console.log('Error:', error.message);
          } else {
            console.log('Error:', error);
          }

          results.failed++;
        }

        results.details.push({
          schema: schemaName,
          name: testCase.name,
          result: testCase.shouldPass ? 'fail' : 'expected fail',
          error: error instanceof Error ? error.message : String(error),
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
