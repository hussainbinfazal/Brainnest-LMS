import type { Response } from 'express';

export function failServerResponse(
  res: Response,
  error: unknown,
  status: number,
  message?: string,
  headers?: Record<string, string>,
  preserveShape = false,
) {
  if (headers) res.set(headers);

  return preserveShape
    ? res.status(status).json(error)
    : res.status(status).json({ error, message });
}

export function successServerResponse<T>(
  res: Response,
  data: T,
  status: number,
  message?: string,
  headers?: Record<string, string>,
  preserveShape = false,
) {
  if (headers) res.set(headers);

  return preserveShape
    ? res.status(status).json(data)
    : res.status(status).json({ data, message });
}
