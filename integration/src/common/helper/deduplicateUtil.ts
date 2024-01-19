export const removeDuplicatesFromMapValues = (
  inputMap: Map<string, string[]>,
): Map<string, string[]> => {
  for (const [key, value] of inputMap.entries()) {
    inputMap.set(key, removeDuplicates(value));
  }
  return inputMap;
};

export const removeDuplicates = (arr: string[]): string[] => {
  const uniqueSet: Set<string> = new Set(arr);
  return [...uniqueSet];
};
