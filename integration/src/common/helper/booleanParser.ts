export const parseBool = (
  value: string,
  defaultWhenUndefined = false,
): boolean => {
  if (value) {
    return value.toLowerCase() === 'true';
  }
  return defaultWhenUndefined;
};
