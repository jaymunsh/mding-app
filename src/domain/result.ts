export type Result<T, E> =
  | { readonly kind: "ok"; readonly value: T }
  | { readonly kind: "err"; readonly error: E }

export function ok<T, E>(value: T): Result<T, E> {
  return { kind: "ok", value }
}

export function err<T, E>(error: E): Result<T, E> {
  return { kind: "err", error }
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected variant: ${JSON.stringify(value)}`)
}
