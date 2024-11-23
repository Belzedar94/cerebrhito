import { useState } from 'react';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';

interface ValidationOptions<T> {
  schema: z.ZodType<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: z.ZodError) => void;
}

interface ValidationResult<T> {
  validate: (data: unknown) => Promise<T | undefined>;
  errors: z.ZodError | null;
  isValidating: boolean;
}

export function useValidation<T>({
  schema,
  onSuccess,
  onError
}: ValidationOptions<T>): ValidationResult<T> {
  const [errors, setErrors] = useState<z.ZodError | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validate = async (data: unknown): Promise<T | undefined> => {
    setIsValidating(true);
    setErrors(null);

    try {
      const validData = await schema.parseAsync(data);
      onSuccess?.(validData);
      return validData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(error);
        onError?.(error);

        // Show toast with first error
        const firstError = error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive'
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validate,
    errors,
    isValidating
  };
}