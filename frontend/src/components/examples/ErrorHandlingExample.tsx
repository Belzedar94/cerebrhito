'use client';

import { useState } from 'react';
import { useError } from '@/hooks/useError';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { ErrorCode } from '@/lib/errors/types';

export function ErrorHandlingExample() {
  const { handleError } = useError();
  const [loading, setLoading] = useState(false);

  const simulateErrors = async () => {
    setLoading(true);
    try {
      // Simulate a network error
      await apiClient.get('/api/non-existent-endpoint');
    } catch (error) {
      handleError(error);
    }
    setLoading(false);
  };

  const simulateAuthError = async () => {
    setLoading(true);
    try {
      // Simulate an auth error
      handleError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'You must be logged in to access this resource'
      });
    } catch (error) {
      handleError(error);
    }
    setLoading(false);
  };

  const simulateValidationError = async () => {
    setLoading(true);
    try {
      // Simulate a validation error
      handleError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid input data',
        details: {
          fields: {
            email: 'Invalid email format',
            password: 'Password must be at least 8 characters'
          }
        }
      });
    } catch (error) {
      handleError(error);
    }
    setLoading(false);
  };

  const simulateAIError = async () => {
    setLoading(true);
    try {
      // Simulate an AI service error
      handleError({
        code: ErrorCode.AI_SERVICE_ERROR,
        message: 'Failed to generate AI response',
        details: {
          service: 'Groq',
          error: 'Model not available'
        }
      });
    } catch (error) {
      handleError(error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Error Handling Examples</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={simulateErrors}
          disabled={loading}
        >
          Simulate Network Error
        </Button>
        <Button
          variant="outline"
          onClick={simulateAuthError}
          disabled={loading}
        >
          Simulate Auth Error
        </Button>
        <Button
          variant="outline"
          onClick={simulateValidationError}
          disabled={loading}
        >
          Simulate Validation Error
        </Button>
        <Button
          variant="outline"
          onClick={simulateAIError}
          disabled={loading}
        >
          Simulate AI Error
        </Button>
      </div>
    </div>
  );
}