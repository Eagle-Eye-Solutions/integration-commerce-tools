import { getEesCalledUniqueIdHeader } from './axios-payload-utils';

describe('getEesCalledUniqueIdHeader', () => {
  it('should return the unique ID from the response headers', () => {
    const mockResponse = {
      headers: {
        'x-ees-called-unique-id': 'unique123',
      },
    };

    const result = getEesCalledUniqueIdHeader(mockResponse);
    expect(result).toBe('unique123');
  });

  it('should return null if the unique ID header is not present', () => {
    const mockResponse = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const result = getEesCalledUniqueIdHeader(mockResponse);
    expect(result).toBeNull();
  });

  it('should handle case-insensitive header names', () => {
    const mockResponse = {
      headers: {
        'X-EES-CALLED-UNIQUE-ID': 'unique456',
      },
    };

    const result = getEesCalledUniqueIdHeader(mockResponse);
    expect(result).toBe('unique456');
  });
});
