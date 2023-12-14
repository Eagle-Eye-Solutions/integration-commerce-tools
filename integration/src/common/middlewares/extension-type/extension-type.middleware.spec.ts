import { Test } from '@nestjs/testing';
import { CTActionsBuilder } from '../../../providers/commercetools/actions/ActionsBuilder';
import { ExtensionTypeMiddleware } from './extension-type.middleware';

describe('ExtensionTypeMiddleware', () => {
  let middleware: ExtensionTypeMiddleware;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ExtensionTypeMiddleware],
    }).compile();

    middleware = moduleRef.get<ExtensionTypeMiddleware>(
      ExtensionTypeMiddleware,
    );
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('should call next if the resource type is supported', () => {
      req.body = { resource: { typeId: 'cart' } };

      middleware.use(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should respond with status 200 and empty actions result if the resource type is not supported', () => {
      const mockCTActionsBuilder = new CTActionsBuilder().build();
      jest
        .spyOn(CTActionsBuilder.prototype, 'build')
        .mockReturnValue(mockCTActionsBuilder);

      req.body = { resource: { typeId: 'unsupportedType' } };

      middleware.use(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCTActionsBuilder);
    });

    it('should respond with status 200 and empty actions result if the resource is an order without valid settle information', () => {
      const mockCTActionsBuilder = new CTActionsBuilder().build();
      jest
        .spyOn(CTActionsBuilder.prototype, 'build')
        .mockReturnValue(mockCTActionsBuilder);

      req.body = {
        resource: {
          typeId: 'order',
          obj: {
            custom: {
              fields: {
                'eagleeye-action': 'RANDOM',
                'eagleye-settledStatus': 'SETTLED',
              },
            },
          },
        },
      };

      middleware.use(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCTActionsBuilder);
    });
  });
});
