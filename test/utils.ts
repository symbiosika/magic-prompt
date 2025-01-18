export const isNumber = (value: unknown): number | null => {
  if (value && typeof value === "number" && !isNaN(value)) {
    return value;
  }
  return null;
};
