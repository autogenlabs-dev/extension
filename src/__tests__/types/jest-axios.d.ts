// This file adds type definitions for Jest mocks of Axios functions
// to allow TypeScript to recognize methods like mockResolvedValue and mockRejectedValue

import 'jest';
import { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any[]> {
      mockResolvedValue(value: T): this;
      mockRejectedValue(value: any): this;
    }
  }
}

// Extend Axios types to support Jest mocking functions
declare module 'axios' {
  interface AxiosInstance {
    get: jest.Mock & {
      mockResolvedValue(value: { data: any }): jest.Mock;
      mockRejectedValue(error: any): jest.Mock;
    };
    post: jest.Mock & {
      mockResolvedValue(value: { data: any }): jest.Mock;
      mockRejectedValue(error: any): jest.Mock;
    };
    put: jest.Mock & {
      mockResolvedValue(value: { data: any }): jest.Mock;
      mockRejectedValue(error: any): jest.Mock;
    };
    patch: jest.Mock & {
      mockResolvedValue(value: { data: any }): jest.Mock;
      mockRejectedValue(error: any): jest.Mock;
    };
    delete: jest.Mock & {
      mockResolvedValue(value: { data: any }): jest.Mock;
      mockRejectedValue(error: any): jest.Mock;
    };
  }
}
