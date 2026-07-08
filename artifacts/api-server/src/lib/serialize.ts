export function serializeDates(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeDates);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serializeDates(v)]),
    );
  }
  return value;
}
