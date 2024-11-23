import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';

interface FormValidationOptions<T extends FieldValues> extends UseFormProps<T> {
  schema: z.ZodType<T>;
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: z.ZodError) => void;
}

export function useFormValidation<T extends FieldValues>({
  schema,
  onSuccess,
  onError,
  ...formOptions
}: FormValidationOptions<T>) {
  const { toast } = useToast();

  const form = useForm<T>({
    ...formOptions,
    resolver: zodResolver(schema),
  });

  const handleSubmit = form.handleSubmit(
    // Success handler
    async (data) => {
      try {
        await onSuccess?.(data);
      } catch (error) {
        console.error('Form submission error:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive'
        });
      }
    },
    // Error handler
    (errors) => {
      const zodError = new z.ZodError(
        Object.entries(errors).map(([path, error]) => ({
          code: 'custom',
          path: path.split('.'),
          message: error?.message || 'Invalid field',
        }))
      );

      onError?.(zodError);

      // Show toast with first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive'
        });
      }
    }
  );

  return {
    form,
    handleSubmit,
    formState: form.formState,
    register: form.register,
    control: form.control,
    watch: form.watch,
    setValue: form.setValue,
    getValues: form.getValues,
    reset: form.reset,
    trigger: form.trigger,
    clearErrors: form.clearErrors,
    setError: form.setError,
  };
}