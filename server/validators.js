// Small, dependency-free validation helpers.
// We validate on the server for real (never trust the client), and the
// frontend mirrors these rules so users get instant feedback.

export const isEmail = (v) =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Password rule: min 8 chars, at least one letter and one number.
export const isStrongPassword = (v) =>
  typeof v === 'string' && v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);

export const isDate = (v) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));

export const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

// Collects errors so we can return them all at once instead of one by one.
export function validate(rules) {
  const errors = {};
  for (const [field, [ok, message]] of Object.entries(rules)) {
    if (!ok) errors[field] = message;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// Inclusive number of days between two YYYY-MM-DD dates.
export function daysBetween(start, end) {
  const a = new Date(start);
  const b = new Date(end);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24)) + 1;
}
