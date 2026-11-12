import type { Request, Response } from 'express';
import { z } from 'zod';

import { failServerResponse } from '../helper/controllerHelper';

export function parseBody<S extends z.ZodType>(body: unknown, schema: S) {
  return schema.safeParse(body);
}

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

export async function validateBody<S extends z.ZodTypeAny>(
  request: Request,
  response: Response,
  schema: S,
): Promise<ParseResult<z.infer<S>>> {
  const parsed = parseBody(request.body, schema);
  if (!parsed.success) {
    return {
      ok: false,
      response: failServerResponse(
        response,
        parsed.error.flatten(),
        400,
        'Invalid request data.',
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
