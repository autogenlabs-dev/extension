import type { AxiosResponse } from 'axios';

// Enhanced types for Jest mock functions to include common mock methods
export type JestMockAxiosFunction<T, R = Promise<AxiosResponse<T>>> = jest.Mock<R> & {
  mockResolvedValue: (value: { data: T }) => jest.Mock<R>;
  mockRejectedValue: (error: any) => jest.Mock<R>;
  mockImplementation: (fn: (...args: any[]) => R) => jest.Mock<R>;
};

// Type for a mocked Axios instance with proper Jest mock methods
export interface MockAxiosInstance {
  get: JestMockAxiosFunction<any>;
  post: JestMockAxiosFunction<any>;
  put: JestMockAxiosFunction<any>;
  patch: JestMockAxiosFunction<any>;
  delete: JestMockAxiosFunction<any>;
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
  defaults: {
    baseURL: string;
    headers: any; // Simplified to any to avoid complex Axios header types
  };
}

// Helper function to create a properly typed mock Axios instance
export function createMockAxiosInstance(): MockAxiosInstance {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { baseURL: 'https://api.example.com', headers: {} },
  } as unknown as MockAxiosInstance;
}
