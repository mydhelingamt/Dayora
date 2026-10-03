/**
 * Dayora Input Validation Helpers
 */

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidIsoDate(dateString: string): boolean {
  if (!isNonEmptyString(dateString)) {
    return false;
  }
  const timestamp = Date.parse(dateString);
  return !isNaN(timestamp);
}

export function isValidEmail(email: string): boolean {
  if (!isNonEmptyString(email)) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
