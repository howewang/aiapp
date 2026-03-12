let listener: (() => void) | null = null;

export function setAuthInvalidListener(fn: (() => void) | null) {
  listener = fn;
}

export function notifyAuthInvalid() {
  listener?.();
}
