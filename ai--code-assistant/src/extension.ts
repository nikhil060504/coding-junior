import * as vscode from 'vscode';
import * as path from 'path';
import fetch from 'node-fetch';

interface WebviewMessage {
  type: string;
  message?: string;
  filePath?: string;
  attachments?: Array<{
    type: 'file' | 'image';
    path: string;
    content?: string;
  }>;
}

export function activate(context: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let cohereApiKey: string | undefined = undefined;

  const initializeCohere = (): void => {
    try {
      cohereApiKey = vscode.workspace.getConfiguration('aiCodeAssistant').get<string>('cohereApiKey');
      console.log('Cohere API key loaded:', cohereApiKey); // Debug log
      if (!cohereApiKey) {
        throw new Error('Cohere API key not configured');
      }
    } catch (error) {
      vscode.window.showErrorMessage('Failed to initialize Cohere client. Please check your API key.');
      console.error('Cohere initialization error:', error);
    }
  };

  // Always initialize Cohere API key at activation
  initializeCohere();

  const createWebviewPanel = (): void => {
    try {
      currentPanel = vscode.window.createWebviewPanel(
        'aiCodeAssistant',
        'AI Code Assistant',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))],
          retainContextWhenHidden: true,
        }
      );

      currentPanel.webview.html = getWebviewContent(context, currentPanel.webview);

      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        null,
        context.subscriptions
      );

      setupMessageHandlers();
    } catch (error) {
      vscode.window.showErrorMessage('Failed to create webview panel');
      console.error('Webview creation error:', error);
    }
  };

  const setupMessageHandlers = (): void => {
    if (!currentPanel) return;

    currentPanel.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        try {
          switch (message.type) {
            case 'sendMessage':
              await handleChatMessage(message);
              break;
            case 'getFileContent':
              await handleFileContent(message);
              break;
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Message handler error:', error);
          currentPanel?.webview.postMessage({
            type: 'error',
            message: 'Failed to process your request',
          });
        }
      },
      undefined,
      context.subscriptions
    );
  };

  const handleChatMessage = async (message: WebviewMessage): Promise<void> => {
    if (!cohereApiKey || !currentPanel) {
      currentPanel?.webview.postMessage({ type: 'error', error: 'Cohere API key or webview panel not initialized' });
      return;
    }

    if (!message.message?.trim()) {
      currentPanel.webview.postMessage({ type: 'error', error: 'Empty message' });
      return;
    }

    try {
      let prompt = message.message.trim();
      if (message.attachments?.length) {
        const files = message.attachments
          .map(a => `File ${a.path}:\n${a.content ?? ''}`)
          .join('\n\n');
        prompt += `\n\nContext from attached files:\n${files}`;
      }

      // Call Cohere Generate endpoint
      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-r-plus',
          message: prompt,
        }),
      });
      const data = await response.json();
      if (data.message) {
        currentPanel.webview.postMessage({ type: 'response', content: data.message });
      } else if (data.text) {
        currentPanel.webview.postMessage({ type: 'response', content: data.text });
      } else {
        throw new Error(data.message || 'Cohere returned an empty response');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Cohere API error:', msg);
      vscode.window.showErrorMessage(`AI Code Assistant: ${msg}`);
      currentPanel.webview.postMessage({ type: 'error', error: msg });
    }
  };

  const handleFileContent = async (message: WebviewMessage): Promise<void> => {
    if (!currentPanel) {
      console.error('Webview panel not initialized');
      return;
    }

    if (!message.filePath) {
      const error = 'No file path provided';
      console.error(error);
      currentPanel.webview.postMessage({
        type: 'error',
        error,
      });
      return;
    }

    try {
      const fileUri = vscode.Uri.file(message.filePath);
      const document = await vscode.workspace.openTextDocument(fileUri);
      const content = document.getText();

      if (!content.trim()) {
        throw new Error('File is empty');
      }

      currentPanel.webview.postMessage({
        type: 'fileContent',
        filePath: message.filePath,
        content,
      });
    } catch (error) {
      console.error('File handling error:', error);
      currentPanel.webview.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : `Failed to read file: ${message.filePath}`,
      });
    }
  };

  const getWebviewContent = (context: vscode.ExtensionContext, webview: vscode.Webview): string => {
    try {
      const scriptUri = webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.js'))
      );
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AI Code Assistant</title>
        </head>
        <body>
          <div id="root"></div>
          <script src="${scriptUri}"></script>
        </body>
        </html>
      `;
    } catch (error) {
      console.error('Error generating webview content:', error);
      throw new Error('Failed to generate webview content');
    }
  };

  const disposable = vscode.commands.registerCommand('ai-code-assistant.start', () => {
    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Two);
    } else {
      createWebviewPanel();
    }
  });

  context.subscriptions.push(disposable);

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('aiCodeAssistant.cohereApiKey')) {
        initializeCohere();
      }
    })
  );
}

export function deactivate() {
  // Clean up resources if needed
}
