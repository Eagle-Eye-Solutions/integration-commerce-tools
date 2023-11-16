import { TestBed } from '@automock/jest';
import { CommercetoolsCircuitBreakerStateService } from './commercetools-circuit-breaker-state.service';
import { CustomObjectService } from '../commercetools/custom-object/custom-object.service';
import {
  CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
  CUSTOM_OBJECT_CONTAINER,
} from '../../common/constants/constants';

describe('Commercetools Circuit Breaker State Service', () => {
  let service: CommercetoolsCircuitBreakerStateService;
  let customObjectService: jest.Mocked<CustomObjectService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(
      CommercetoolsCircuitBreakerStateService,
    ).compile();
    service = unit;
    customObjectService = unitRef.get(CustomObjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load state if it exists', async () => {
    const mockCircuitBreakerInfo = { state: { open: true } };
    customObjectService.getCustomObject.mockResolvedValue({
      body: {
        value: mockCircuitBreakerInfo,
        id: '',
        version: 0,
        createdAt: '',
        lastModifiedAt: '',
        container: '',
        key: '',
      },
    });

    const result = await service.loadState();

    expect(customObjectService.getCustomObject).toHaveBeenCalledWith(
      CUSTOM_OBJECT_CONTAINER,
      CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
    );
    expect(result).toEqual(mockCircuitBreakerInfo);
  });

  it('should return `undefined` if state does not exist (404 error)', async () => {
    customObjectService.getCustomObject.mockRejectedValue({ code: 404 });

    const result = await service.loadState();

    expect(result).toBeUndefined();
  });

  it('should log error when getCustomObject fails with an error different from 404', async () => {
    customObjectService.getCustomObject.mockRejectedValue({ code: 500 });

    const result = await service.loadState();

    expect(result).toBeUndefined();
  });

  it('should save state', async () => {
    const mockCircuitBreakerInfo = { state: { open: true } };
    customObjectService.saveCustomObject.mockResolvedValue(undefined);

    await service.saveState(mockCircuitBreakerInfo);

    expect(customObjectService.saveCustomObject).toHaveBeenCalledWith(
      CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
      CUSTOM_OBJECT_CONTAINER,
      mockCircuitBreakerInfo,
    );
  });

  it('should delete state', async () => {
    customObjectService.deleteCustomObject.mockResolvedValue(undefined);

    await service.deleteState();

    expect(customObjectService.deleteCustomObject).toHaveBeenCalledWith(
      CUSTOM_OBJECT_CONTAINER,
      CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
    );
  });
  it('should throw an errors when fails to delete state', async () => {
    const error = new Error('Test error');
    jest
      .spyOn(customObjectService, 'deleteCustomObject')
      .mockRejectedValueOnce(error);

    await service.deleteState();

    expect(customObjectService.deleteCustomObject).toHaveBeenCalled();
  });

  it('should throw an errors when fails to save state', async () => {
    const error = new Error('Test error');
    jest
      .spyOn(customObjectService, 'saveCustomObject')
      .mockRejectedValueOnce(error);

    await service.saveState(undefined);

    expect(customObjectService.saveCustomObject).toHaveBeenCalled();
  });
});
