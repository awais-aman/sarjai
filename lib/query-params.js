// Returns { value } or { error } so handlers can answer 400 themselves.
export function readIntParam(raw, { name, min, max, fallback }) {
  if (raw === undefined) return { value: fallback };
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    return { error: `${name} must be a whole number` };
  }
  const value = Number(raw);
  if (value < min || value > max) {
    return { error: `${name} must be between ${min} and ${max}` };
  }
  return { value };
}
