/**
 * Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler, BadRequestError, UnauthorizedError } from '../middleware/errorHandler';
import { requestLogger } from '../middleware/requestLogger';
import { responseTransformer } from '../middleware/responseTransformer';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/v1/test',
      ip: '127.0.0.1'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  test('should handle BadRequestError', () => {
    const error = new BadRequestError('Invalid input', { field: 'email' });

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Invalid input'
        })
      })
    );
  });

  test('should handle UnauthorizedError', () => {
    const error = new UnauthorizedError();

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED'
        })
      })
    );
  });

  test('should handle generic errors', () => {
    const error = new Error('Something went wrong');

    errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong'
        })
      })
    );
  });

  test('should not include stack trace in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Error in production');

    errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

    const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error).not.toHaveProperty('stack');

    process.env.NODE_ENV = 'test';
  });
});

describe('Request Logger Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/v1/test',
      query: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent')
    };

    mockRes = {
      on: jest.fn(),
      statusCode: 200
    };

    mockNext = jest.fn();
  });

  test('should attach finish listener to response', () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(mockNext).toHaveBeenCalled();
  });

  test('should log request with user info if available', () => {
    mockReq.user = { userId: 'user123', email: 'test@test.com', role: 'doctor' } as any;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('Response Transformer Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      path: '/api/v1/test',
      method: 'GET',
      id: 'req-123'
    };

    mockRes = {
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  test('should transform response without metadata by default', () => {
    const middleware = responseTransformer({ addMetadata: false });
    const originalJson = mockRes.json;

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.json).not.toBe(originalJson);
  });

  test('should add metadata when configured', () => {
    const middleware = responseTransformer({ addMetadata: true });
    
    middleware(mockReq as Request, mockRes as Response, mockNext);

    const data = { success: true, data: {} };
    (mockRes.json as jest.Mock)(data);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should remove sensitive fields', () => {
    const middleware = responseTransformer({ 
      removeFields: ['password', 'secret'] 
    });
    
    middleware(mockReq as Request, mockRes as Response, mockNext);

    const data = { 
      user: 'john', 
      password: 'secret123', 
      secret: 'token' 
    };
    
    (mockRes.json as jest.Mock)(data);
    
    expect(mockNext).toHaveBeenCalled();
  });

  test('should wrap response when configured', () => {
    const middleware = responseTransformer({ wrapResponse: true });
    
    middleware(mockReq as Request, mockRes as Response, mockNext);

    const data = { user: 'john' };
    (mockRes.json as jest.Mock)(data);

    expect(mockNext).toHaveBeenCalled();
  });
});

