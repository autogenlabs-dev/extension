import React, { useState, useEffect, useCallback } from 'react';
import { VSCodeButton, VSCodeTextField, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';
import styled from 'styled-components';
import { vscode } from '../../utils/vscode';
import { useEvent } from 'react-use';
import { ExtensionMessage } from '../../../../src/shared/ExtensionMessage'; // Assuming correct path

const Container = styled.div`
  padding: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;

  & > vscode-text-field {
    flex-grow: 1;
    margin-right: 0.5rem;
  }
`;

const ResultArea = styled.pre`
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-widget-border);
  padding: 0.5rem;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-editor-font-size);
`;

const ErrorText = styled.div`
  color: var(--vscode-errorForeground);
  margin-top: 0.5rem;
`;

const FilesystemView: React.FC = () => {
  const [dirPath, setDirPath] = useState<string>('.'); // Default to current workspace root
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [listResult, setListResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleListDirectory = () => {
    setError('');
    setListResult('');
    setIsLoading(true);
    vscode.postMessage({
      type: 'nativeFsListDirectory',
      path: dirPath,
    });
  };

  const handleMessage = useCallback((event: MessageEvent) => {
    const message = event.data as ExtensionMessage;

    switch (message.type) {
      case 'nativeFsListDirectoryResult':
        if (message.path === dirPath) { // Ensure result matches current request
          setIsLoading(false);
          setListResult(JSON.stringify(message.entries, null, 2));
        }
        break;
      case 'nativeFsError':
        if (message.operation === 'listDirectory' && message.path === dirPath) {
          setIsLoading(false);
          setError(`Error listing directory: ${message.error}`);
        }
        // Add handling for other operations if needed
        break;
    }
  }, [dirPath]); // Re-create handler if dirPath changes

  useEvent('message', handleMessage);

  return (
    <Container>
      <h4>List Directory Contents</h4>
      <InputGroup>
        <VSCodeTextField
          placeholder="Path relative to workspace root (e.g., ., src, webview-ui/src)"
          value={dirPath}
          onInput={(e: any) => setDirPath(e.target.value)}
        />
        <VSCodeButton onClick={handleListDirectory} disabled={isLoading}>
          {isLoading ? <VSCodeProgressRing style={{ height: '1rem', width: '1rem' }} /> : 'List'}
        </VSCodeButton>
      </InputGroup>
      {error && <ErrorText>{error}</ErrorText>}
      <ResultArea>{listResult || (isLoading ? 'Loading...' : 'Result will appear here...')}</ResultArea>

      {/* TODO: Add UI for other operations (readFile, writeFile, etc.) */}
    </Container>
  );
};

export default FilesystemView;
