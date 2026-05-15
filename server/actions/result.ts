export type ErrorCode =
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "UNIQUE_CONFLICT"
  | "INTERNAL";

export type ActionError = {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function err(
  code: ErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): ActionResult<never> {
  return fieldErrors
    ? { ok: false, error: { code, message, fieldErrors } }
    : { ok: false, error: { code, message } };
}
