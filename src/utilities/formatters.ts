/**
 * Dayora Display and String Formatters
 */

export function capitalize(str: string): string {
  if (!str) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(name: string): string {
  if (!name) {
    return '';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1 && parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
}

export function truncate(str: string, maxLength: number = 30): string {
  if (!str || str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength)}...`;
}

export function formatDaysRemaining(days: number): string {
  if (days === 0) {
    return 'Today!';
  }
  if (days === 1) {
    return 'Tomorrow';
  }
  return `in ${days} days`;
}
