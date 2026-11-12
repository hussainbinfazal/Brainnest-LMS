import axios from 'axios';

export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const responseMessage = err.response?.data?.message;
    return typeof responseMessage === 'string' ? responseMessage : err.message;
  }
  return err instanceof Error ? err.message : fallback;
}
