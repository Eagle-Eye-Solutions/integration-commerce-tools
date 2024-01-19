export const removeDuplicatesFromMap = (
  productIdToCampaignNamesMap: Map<string, string[]>,
): Map<string, string[]> => {
  for (const [key, value] of productIdToCampaignNamesMap.entries()) {
    productIdToCampaignNamesMap.set(key, removeDuplicates(value));
  }
  return productIdToCampaignNamesMap;
};

export const removeDuplicates = (arr: string[]): string[] => {
  const uniqueSet: Set<string> = new Set(arr);
  return [...uniqueSet];
};
