export const TYPE_ICONS = {
  string: '📝',
  number: '🔢',
  boolean: '✓',
  date: '📅',
  object: '{}',
  array: '[]',
  null: '∅'
};

export function getFieldType(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

export function isDateString(value: string): boolean {
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    /^\d{2}\/\d{2}\/\d{4}$/,
  ];
  
  return datePatterns.some(pattern => pattern.test(value));
}

export function isEmailString(value: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value);
}

export function isNumericString(value: string): boolean {
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
}

export function detectStringSubtype(value: string): string {
  if (isDateString(value)) return 'date-string';
  if (isEmailString(value)) return 'email';
  if (isNumericString(value)) return 'numeric-string';
  return 'string';
}