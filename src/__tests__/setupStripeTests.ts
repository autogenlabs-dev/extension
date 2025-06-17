// Jest setup file for Stripe integration tests
// This file enhances the Jest mocks for Axios to support the methods we need in our tests

// Extend Axios mocks with the required methods
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: { baseURL: '', headers: {} },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    post: jest.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    patch: jest.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    delete: jest.fn().mockImplementation(() => Promise.resolve({ data: {} })),
  })),
}));

// Add missing Jest mock methods to all Jest mock functions
const originalMockFn = jest.fn;
jest.fn = function mockedFn(...args: any[]) {
  const mockFn = originalMockFn(...args);
  if (!mockFn.mockResolvedValue) {
    mockFn.mockResolvedValue = function (value) {
      return this.mockImplementation(() => Promise.resolve(value));
    };
  }
  if (!mockFn.mockRejectedValue) {
    mockFn.mockRejectedValue = function (value) {
      return this.mockImplementation(() => Promise.reject(value));
    };
  }
  return mockFn;
};
