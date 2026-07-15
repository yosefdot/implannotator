const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/(api[_-]?key|access[_-]?token|auth[_-]?token|password|secret)(\s*[:=]\s*)(["']?)[^\s,"']{8,}\3/gi, "$1$2[REDACTED]"],
  [/\bsk-[a-zA-Z0-9_-]{16,}\b/g, "[REDACTED]"],
  [/\bgh[pousr]_[a-zA-Z0-9]{20,}\b/g, "[REDACTED]"],
  [/\b(Bearer\s+)[a-zA-Z0-9._~+/-]{16,}/gi, "$1[REDACTED]"],
];

export function redactText(value: string): string {
  return SECRET_PATTERNS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value);
}

export function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /password|secret|token|api.?key/i.test(key) ? "[REDACTED]" : redactValue(item)]));
  }
  return value;
}
