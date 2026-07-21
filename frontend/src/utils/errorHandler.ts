/**
 * Safely extract a human-readable error message from an API error response.
 * Backend errors can come in different shapes:
 * - { error: "string message" }
 * - { error: { message: "string", status: number } }
 */
export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (!error) return fallback;

  const anyError = error as any;
  const data = anyError?.response?.data;

  if (data) {
    if (typeof data.error === 'string') return data.error;
    if (data.error && typeof data.error === 'object' && typeof data.error.message === 'string') {
      return data.error.message;
    }
    if (typeof data.message === 'string') return data.message;
  }

  if (typeof anyError?.message === 'string') return anyError.message;

  return fallback;
}

