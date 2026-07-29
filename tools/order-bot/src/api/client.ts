export interface ClientOptions {
  /** e.g. http://localhost:5000/api */
  baseUrl: string;
  storeSlug: string;
  userAgent: string;
  timeoutMs: number;
}

export interface RequestOptions {
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  guestId?: string;
}

export interface StepTiming {
  step: string;
  method: string;
  path: string;
  status: number;
  ms: number;
}

/**
 * A non-2xx response. The API reports business failures as `{ error, message }` (ApiController
 * .HandleResult) and FluentValidation failures as a ProblemDetails with an `errors` extension, so
 * both shapes are unpacked here rather than left as an opaque body.
 */
export class ApiError extends Error {
  step: string;
  method: string;
  path: string;
  status: number;
  code: string;
  body: unknown;

  constructor(args: {
    step: string;
    method: string;
    path: string;
    status: number;
    code: string;
    detail: string;
    body: unknown;
  }) {
    super(`${args.step}: ${args.status} ${args.code} — ${args.detail}`);
    this.name = 'ApiError';
    this.step = args.step;
    this.method = args.method;
    this.path = args.path;
    this.status = args.status;
    this.code = args.code;
    this.body = args.body;
  }
}

interface ErrorBody {
  error?: string;
  message?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

function describeError(status: number, body: unknown): { code: string; detail: string } {
  if (typeof body === 'string') return { code: `Http${status}`, detail: body.slice(0, 300) };
  if (body == null || typeof body !== 'object') return { code: `Http${status}`, detail: '(no body)' };

  const parsed = body as ErrorBody;

  if (parsed.errors) {
    const fields = Object.entries(parsed.errors)
      .map(([field, messages]) => `${field}: ${messages.join('; ')}`)
      .join(' | ');
    return { code: parsed.title ?? 'ValidationFailure', detail: fields };
  }

  return {
    code: parsed.error ?? parsed.title ?? `Http${status}`,
    detail: parsed.message ?? parsed.detail ?? '(no message)',
  };
}

/**
 * Talks to /api/storefront/* exactly as the store SPA does: every request carries the tenant
 * header TenantMiddleware requires, and cart/order requests carry the caller's guest id.
 */
export class StorefrontClient {
  private options: ClientOptions;
  readonly steps: StepTiming[] = [];

  constructor(options: ClientOptions) {
    this.options = options;
  }

  async get<T>(step: string, path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(step, 'GET', path, options);
  }

  async post<T>(step: string, path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(step, 'POST', path, options);
  }

  private async request<T>(
    step: string,
    method: string,
    path: string,
    options: RequestOptions,
  ): Promise<T> {
    const url = new URL(this.options.baseUrl.replace(/\/$/, '') + path);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.options.userAgent,
      'X-Store-Slug': this.options.storeSlug,
    };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.guestId) headers['X-Guest-Id'] = options.guestId;

    const startedAt = performance.now();
    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      this.steps.push({ step, method, path, status: 0, ms: round(performance.now() - startedAt) });
      throw new ApiError({
        step,
        method,
        path,
        status: 0,
        code: 'NetworkError',
        detail: reason,
        body: null,
      });
    }

    const ms = round(performance.now() - startedAt);
    this.steps.push({ step, method, path, status: response.status, ms });

    const payload = await readBody(response);

    if (!response.ok) {
      const { code, detail } = describeError(response.status, payload);
      throw new ApiError({ step, method, path, status: response.status, code, detail, body: payload });
    }

    return payload as T;
  }
}

function round(ms: number): number {
  return Math.round(ms * 100) / 100;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const text = await response.text();
  if (text.length === 0) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
