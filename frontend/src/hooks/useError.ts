import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import type { ErrorResponse } from '@/lib/errors/types';
import { getErrorDetails } from '@/lib/errors/types';

export const useError = () => {
  const { toast } = useToast();
  const router = useRouter();

  const handleError = (error: any) => {
    // Extract error response from various error types
    let errorResponse: ErrorResponse;

    if (error.response?.data) {
      // Axios error
      errorResponse = error.response.data;
    } else if (error.code && error.message) {
      // AppError
      errorResponse = error;
    } else {
      // Unknown error
      errorResponse = {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
      };
    }

    // Get user-friendly error details
    const errorDetails = getErrorDetails(errorResponse);

    // Show toast notification
    toast({
      title: errorDetails.title,
      description: errorDetails.description,
      variant: errorDetails.variant,
      action: errorDetails.action
        ? {
            label: errorDetails.action,
            onClick: () => {
              switch (errorDetails.action) {
                case 'Sign In':
                  router.push('/login');
                  break;
                case 'Contact Support':
                  router.push('/support');
                  break;
                case 'Resend Verification':
                  // TODO: Implement resend verification
                  break;
                default:
                  break;
              }
            },
          }
        : undefined,
    });

    // Return error details for additional handling if needed
    return errorDetails;
  };

  return { handleError };
};
