import { NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { getSession, Session } from './auth';

/** Standard JSON + error envelope for every /api/v1 endpoint. */
export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function fail(status: number, code: string, message: string): never {
  throw new ApiError(status, code, message);
}

/** Wrap a handler: auth (optional), uniform error envelope, no stack leaks. */
export function handler(
  fn: (req: Request, ctx: { params: Record<string, string>; session: Session }) => Promise<Response>,
  opts: { auth?: boolean } = { auth: true },
) {
  return async (req: Request, ctx: { params: Record<string, string> }) => {
    try {
      const session = await getSession();
      if (opts.auth !== false && !session) {
        return NextResponse.json(
          { error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } },
          { status: 401 },
        );
      }
      return await fn(req, { params: ctx.params ?? {}, session: session as Session });
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status });
      }
      console.error('[api]', e);
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: 'Something went wrong' } },
        { status: 500 },
      );
    }
  };
}

/** Parse a JSON body against a zod schema with a clean 400 on failure. */
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    fail(400, 'BAD_JSON', 'Request body must be JSON');
  }
  const r = schema.safeParse(raw);
  if (!r.success) fail(400, 'VALIDATION', r.error.issues[0]?.message ?? 'Invalid input');
  return r.data;
}
