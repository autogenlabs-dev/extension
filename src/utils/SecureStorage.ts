import * as vscode from 'vscode';
import { ISecureStorage } from '../types/secureStorage';

/**
 * A utility class for securely storing and retrieving sensitive data
 * using VSCode's built-in secrets storage API
 */
export class SecureStorage implements ISecureStorage {
  private static instance: SecureStorage | null = null;
  private secrets: vscode.SecretStorage;
  private extensionContext: vscode.ExtensionContext;

  // Change to public constructor to support both singleton and direct instance pattern
  constructor(context: vscode.ExtensionContext) {
    this.secrets = context.secrets;
    this.extensionContext = context;
  }

  /**
   * Initialize the SecureStorage singleton with the extension context
   */
  public static initialize(context: vscode.ExtensionContext): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage(context);
    }
    return SecureStorage.instance;
  }

  /**
   * Get the current SecureStorage instance
   * Throws an error if not initialized
   */
  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      throw new Error('SecureStorage not initialized. Call SecureStorage.initialize() first.');
    }
    return SecureStorage.instance;
  }

  /**
   * Store a secret value
   */
  public async store(key: string, value: string): Promise<void> {
    await this.secrets.store(key, value);
  }

  /**
   * Retrieve a secret value
   */
  public async get(key: string): Promise<string | undefined> {
    return await this.secrets.get(key);
  }

  /**
   * Delete a secret value
   */
  public async delete(key: string): Promise<void> {
    await this.secrets.delete(key);
  }

  /**
   * Check if a secret exists
   */
  public async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  /**
   * Clear all secrets (useful for logout)
   */
  public async clear(): Promise<void> {
    // Note: VSCode doesn't provide a direct way to list all keys,
    // so we need to track them manually or clear known keys
    // For now, we'll clear common auth-related keys
    const commonKeys = [
      'auth_access_token',
      'auth_refresh_token',
      'a4f_api_key',
      'user_data'
    ];

    for (const key of commonKeys) {
      try {
        await this.delete(key);
      } catch (error) {
        // Ignore errors when deleting non-existent keys
        console.warn(`Failed to delete key ${key}:`, error);
      }
    }
  }

  /**
   * Store authentication tokens (access and refresh)
   */
  public async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.store('auth_access_token', accessToken);
    await this.store('auth_refresh_token', refreshToken);
  }

  /**
   * Retrieve authentication tokens
   */
  public async getTokens(): Promise<{ accessToken: string | undefined; refreshToken: string | undefined }> {
    const accessToken = await this.get('auth_access_token');
    const refreshToken = await this.get('auth_refresh_token');
    return { accessToken, refreshToken };
  }

  /**
   * Clear authentication tokens
   */
  public async clearTokens(): Promise<void> {
    await this.delete('auth_access_token');
    await this.delete('auth_refresh_token');
  }
}
