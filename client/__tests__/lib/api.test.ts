import api from '@/lib/api';
import axios, { InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  remove: jest.fn(),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
  })),
}));

const mockedCookies = Cookies as jest.Mocked<typeof Cookies>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('api (axios instance)', () => {
  let requestInterceptor: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  let responseInterceptor: (error: any) => any;

  beforeEach(() => {
    // Capture the interceptors
    const mockApiInstance = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockApiInstance);

    // We need to re-import the api module to get the mocked instance with our captured interceptors
    jest.isolateModules(() => {
      const module = require('@/lib/api');
      requestInterceptor = mockApiInstance.interceptors.request.use.mock.calls[0][0];
      responseInterceptor = mockApiInstance.interceptors.response.use.mock.calls[0][1];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('request interceptor', () => {
    it('should add Authorization header if token exists', () => {
      mockedCookies.get.mockReturnValue('test_token');
      const config: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const newConfig = requestInterceptor(config);

      expect(newConfig.headers.Authorization).toBe('Bearer test_token');
      expect(mockedCookies.get).toHaveBeenCalledWith('syncspace_token');
    });

    it('should not add Authorization header if token does not exist', () => {
      mockedCookies.get.mockReturnValue(undefined);
      const config: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const newConfig = requestInterceptor(config);

      expect(newConfig.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('should clear cookies on 401 error', () => {
      const error = {
        response: {
          status: 401,
        },
      };

      // We expect the promise to be rejected, but we also want to check the side effect.
      return responseInterceptor(error).catch(() => {
        expect(mockedCookies.remove).toHaveBeenCalledWith('syncspace_token');
        expect(mockedCookies.remove).toHaveBeenCalledWith('syncspace_user');
      });
    });

    it('should reject the promise for non-401 errors', () => {
      const error = {
        response: {
          status: 500,
        },
      };

      return expect(responseInterceptor(error)).rejects.toEqual(error);
    });
  });
});