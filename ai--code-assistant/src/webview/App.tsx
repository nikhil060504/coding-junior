import React, { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { ErrorBoundary } from './components/ErrorBoundary';

type VSCodeAPI = {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

declare global {
  interface Window {
    acquireVsCodeApi: () => VSCodeAPI;
  }
}

interface ChatMessage {
  type: 'sendMessage' | 'getFileContent';
  message?: string;
  attachments?: Array<{
    type: 'file' | 'image';
    path: string;
    content?: string;
  }>;
  filePath?: string;
}

export const App: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const vscode = React.useMemo(() => {
    try {
      return window.acquireVsCodeApi();
    } catch (err) {
      setError('Failed to initialize VS Code API');
      console.error('Failed to initialize VS Code API:', err);
      return null;
    }
  }, []);

  const handleSendMessage = (message: string, attachments: any[]) => {
    if (!vscode) {
      setError('VS Code API not initialized');
      return;
    }

    try {
      const chatMessage: ChatMessage = {
        type: 'sendMessage',
        message,
        attachments,
      };
      vscode.postMessage(chatMessage);
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    }
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-50 dark:bg-red-900">
        <div className="text-red-600 dark:text-red-200 text-center p-4">
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-white dark:bg-gray-800">
        {vscode ? (
          <ChatInterface onSendMessage={handleSendMessage} vscode={vscode} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600 dark:text-gray-300">Loading...</div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;