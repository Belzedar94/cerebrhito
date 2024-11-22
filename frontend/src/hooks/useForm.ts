import { useState, useCallback, useRef, useEffect } from 'react';
import isEqual from 'lodash/isEqual';
import { useEventCallback } from './useEventCallback';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (name: keyof T) => (event: any) => void;
  handleBlur: (name: keyof T) => () => void;
  handleSubmit: (event: React.FormEvent) => void;
  setFieldValue: (name: keyof T, value: any) => void;
  resetForm: () => void;
  isDirty: boolean;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValuesRef = useRef(initialValues);

  const validateForm = useCallback(
    (formValues: T) => {
      if (validate) {
        const validationErrors = validate(formValues);
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
      }
      return true;
    },
    [validate]
  );

  const handleSubmit = useEventCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm(values)) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleChange = useCallback(
    (name: keyof T) => (event: any) => {
      const value = event.target?.type === 'checkbox'
        ? event.target.checked
        : event.target?.value;

      setValues(prev => ({
        ...prev,
        [name]: value,
      }));

      if (touched[name]) {
        validateForm({
          ...values,
          [name]: value,
        });
      }
    },
    [touched, validateForm, values]
  );

  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouched(prev => ({
        ...prev,
        [name]: true,
      }));
      validateForm(values);
    },
    [validateForm, values]
  );

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
  }, []);

  const isDirty = !isEqual(values, initialValuesRef.current);

  // Validate on mount and when initialValues change
  useEffect(() => {
    validateForm(values);
  }, [validateForm, values]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
    isDirty,
  };
}