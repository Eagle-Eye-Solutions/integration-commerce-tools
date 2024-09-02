export const getEesCalledUniqueIdHeader = (res: any): string | null => {
  const header = 'x-ees-called-unique-id';
  return res.headers
    ? res.headers[header] || res.headers[header.toUpperCase()] || null
    : null;
};
