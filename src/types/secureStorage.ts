import * as vscode from 'vscode';

export interface ISecureStorage {
  store(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  
  // Authentication token methods
  storeTokens(accessToken: string, refreshToken: string): Promise<void>;
  getTokens(): Promise<{ accessToken: string | undefined; refreshToken: string | undefined }>;
  clearTokens(): Promise<void>;
}
