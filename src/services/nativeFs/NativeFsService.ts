import * as vscode from 'vscode';
import * as path from 'path'; // May still be useful for path joining with URIs

const textEncoder = new TextEncoder(); // utf-8 by default
const textDecoder = new TextDecoder(); // utf-8 by default

/**
 * Provides methods for interacting with the filesystem using the native
 * vscode.workspace.fs API, ensuring integration with the VS Code environment.
 */
export class NativeFsService {

    /**
     * Helper to get the URI of the first workspace folder.
     * Throws an error if no workspace folder is open.
     * Adapt if multi-root workspace support is needed.
     */
    private getWorkspaceRootUri(): vscode.Uri {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error("No workspace folder open. Cannot perform filesystem operations.");
        }
        // Using the first folder for simplicity.
        return workspaceFolders[0].uri;
    }

    /**
     * Resolves a relative path string into a full vscode.Uri
     * relative to the first workspace root.
     * @param relativePath Path relative to the workspace root.
     * @returns The full vscode.Uri for the path.
     */
    private resolveUri(relativePath: string): vscode.Uri {
        const rootUri = this.getWorkspaceRootUri();
        // Use vscode.Uri.joinPath for robust path joining across OSes
        return vscode.Uri.joinPath(rootUri, relativePath);
    }

    /**
     * Reads the content of a file.
     * @param relativePath Path relative to the workspace root.
     * @returns The file content as a string.
     */
    async readFile(relativePath: string): Promise<string> {
        const fileUri = this.resolveUri(relativePath);
        try {
            console.debug(`NativeFsService: Reading file ${fileUri.fsPath}`);
            const contentBytes = await vscode.workspace.fs.readFile(fileUri);
            return textDecoder.decode(contentBytes);
        } catch (error) {
            console.error(`NativeFsService: Error reading file ${fileUri.fsPath}:`, error);
            // Consider more specific error handling or wrapping
            throw error;
        }
    }

    /**
     * Writes content to a file, overwriting it if it exists.
     * @param relativePath Path relative to the workspace root.
     * @param content The string content to write.
     */
    async writeFile(relativePath: string, content: string): Promise<void> {
        const fileUri = this.resolveUri(relativePath);
        try {
            console.debug(`NativeFsService: Writing file ${fileUri.fsPath}`);
            await vscode.workspace.fs.writeFile(fileUri, textEncoder.encode(content));
        } catch (error) {
            console.error(`NativeFsService: Error writing file ${fileUri.fsPath}:`, error);
            throw error;
        }
    }

    /**
     * Lists the entries (files and directories) within a directory.
     * @param relativePath Path relative to the workspace root.
     * @returns An array of objects containing the name and type of each entry.
     */
    async listDirectory(relativePath: string): Promise<{ name: string; type: 'file' | 'directory' | 'unknown' }[]> {
        // Handle listing the root itself
        const dirUri = relativePath === '.' || relativePath === ''
            ? this.getWorkspaceRootUri()
            : this.resolveUri(relativePath);
        try {
            console.debug(`NativeFsService: Listing directory ${dirUri.fsPath}`);
            const entries = await vscode.workspace.fs.readDirectory(dirUri);
            // entries is [ [name, fileType], ... ]
            return entries.map(([name, type]) => ({
                name,
                type: type === vscode.FileType.Directory ? 'directory' :
                      type === vscode.FileType.File ? 'file' : 'unknown'
            }));
        } catch (error) {
            console.error(`NativeFsService: Error listing directory ${dirUri.fsPath}:`, error);
            throw error;
        }
    }

    /**
     * Creates a directory, including any necessary parent directories.
     * @param relativePath Path relative to the workspace root.
     */
    async createDirectory(relativePath: string): Promise<void> {
         const dirUri = this.resolveUri(relativePath);
         try {
            console.debug(`NativeFsService: Creating directory ${dirUri.fsPath}`);
            // createDirectory is recursive by default in VS Code API
            await vscode.workspace.fs.createDirectory(dirUri);
         } catch (error) {
             // Ignore error if directory already exists
            if (error instanceof vscode.FileSystemError && error.code === 'FileExists') {
                 console.debug(`NativeFsService: Directory already exists ${dirUri.fsPath}`);
                 return;
            }
            console.error(`NativeFsService: Error creating directory ${dirUri.fsPath}:`, error);
            throw error;
         }
    }

    /**
     * Gets file status information (metadata).
     * @param relativePath Path relative to the workspace root.
     * @returns A FileStat object containing metadata.
     */
    async getFileInfo(relativePath: string): Promise<vscode.FileStat> {
        const fileUri = this.resolveUri(relativePath);
        try {
            console.debug(`NativeFsService: Getting info for ${fileUri.fsPath}`);
            return await vscode.workspace.fs.stat(fileUri);
        } catch (error) {
            console.error(`NativeFsService: Error getting info for ${fileUri.fsPath}:`, error);
            throw error;
        }
    }

    /**
     * Renames or moves a file or directory.
     * @param oldRelativePath The current path relative to the workspace root.
     * @param newRelativePath The new path relative to the workspace root.
     * @param overwrite Whether to overwrite the destination if it exists. Defaults to false.
     */
    async rename(oldRelativePath: string, newRelativePath: string, overwrite: boolean = false): Promise<void> {
        const oldUri = this.resolveUri(oldRelativePath);
        const newUri = this.resolveUri(newRelativePath);
        try {
            console.debug(`NativeFsService: Renaming ${oldUri.fsPath} to ${newUri.fsPath}`);
            await vscode.workspace.fs.rename(oldUri, newUri, { overwrite });
        } catch (error) {
            console.error(`NativeFsService: Error renaming ${oldUri.fsPath} to ${newUri.fsPath}:`, error);
            throw error;
        }
    }

     /**
     * Deletes a file or directory.
     * @param relativePath Path relative to the workspace root.
     * @param recursive If true, deletes directories recursively. Defaults to false.
     * @param useTrash If true, moves to trash instead of permanently deleting. Defaults to true.
     */
    async delete(relativePath: string, recursive: boolean = false, useTrash: boolean = true): Promise<void> {
        const uri = this.resolveUri(relativePath);
        try {
            console.debug(`NativeFsService: Deleting ${uri.fsPath}`);
            await vscode.workspace.fs.delete(uri, { recursive, useTrash });
        } catch (error) {
            console.error(`NativeFsService: Error deleting ${uri.fsPath}:`, error);
            throw error;
        }
    }

    // --- More Complex Operations (Require Custom Logic) ---

    // TODO: Implement line-based editing (read, modify lines, write)
    // TODO: Implement recursive directory tree generation
    // TODO: Implement content searching (potentially using ripgrep or similar)
}

// Export a singleton instance for easy use across the extension
export const nativeFsService = new NativeFsService();
