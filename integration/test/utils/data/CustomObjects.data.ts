export const CIRCUIT_BREAKER_OPEN = () => ({
  id: 'ec57d78a-d9be-42e9-8fff-354ffb701cfb',
  version: 1,
  versionModifiedAt: '2023-11-10T10:37:47.749Z',
  createdAt: '2023-11-10T10:37:47.749Z',
  lastModifiedAt: '2023-11-10T10:37:47.749Z',
  lastModifiedBy: {
    clientId: 'Uy9RaeGH91kFO3und4o-K55R',
    isPlatformClient: false,
  },
  createdBy: { clientId: 'Uy9RaeGH91kFO3und4o-K55R', isPlatformClient: false },
  container: 'eagle-eye-plugin',
  key: 'ee-api-circuit-state',
  value: {
    state: {
      name: 'bound invoke',
      enabled: true,
      closed: false,
      open: true,
      halfOpen: false,
      warmUp: false,
      shutdown: false,
      lastTimerAt: Date.now(),
    },
  },
});

export const CUSTOM_OBJECT_NOT_FOUND = (container: string, key: string) => ({
  statusCode: 404,
  message: `The CustomObject with ID '(${container},${key})' was not found.`,
  errors: [
    {
      code: 'InvalidSubject',
      message: `The CustomObject with ID '(${container},${key})' was not found.`,
    },
  ],
});
