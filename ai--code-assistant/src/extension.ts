import * as vscode from 'vscode';
import * as path from 'path';
import { OpenAI } from 'openai';

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
  let openai: OpenAI | undefined = undefined;

  const initializeOpenAI = (): void => {
    try {
      const apiKey = vscode.workspace.getConfiguration('aiCodeAssistant').get<string>('openaiApiKey');
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      openai = new OpenAI({ apiKey });
    } catch (error) {
      vscode.window.showErrorMessage('Failed to initialize OpenAI client. Please check your API key.');
      console.error('OpenAI initialization error:', error);
    }
  };

  const createWebviewPanel = (): void => {
    try {
      currentPanel = vscode.window.createWebviewPanel(
        'aiCodeAssistant',
        'AI Code Assistant',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'build'))],
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
    if (!openai || !currentPanel) {
      const error = 'OpenAI client or webview panel not initialized';
      console.error(error);
      currentPanel?.webview.postMessage({
        type: 'error',
        error,
      });
      return;
    }

    if (!message.message?.trim()) {
      const error = 'Empty message received';
      console.error(error);
      currentPanel.webview.postMessage({
        type: 'error',
        error,
      });
      return;
    }

    try {
      let context = message.message;
      
      // Add file context if attachments are present
      if (message.attachments?.length) {
        const fileContexts = message.attachments
          .map(attachment => `File ${attachment.path}:\n${attachment.content || ''}`)
          .join('\n\n');
        context = `${context}\n\nContext from attached files:\n${fileContexts}`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI code assistant.' },
          { role: 'user', content: context },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      if (!response.choices[0]?.message?.content) {
        throw new Error('Empty response from OpenAI');
      }

      currentPanel.webview.postMessage({
        type: 'response',
        content: response.choices[0].message.content,
      });
    } catch (error) {
      console.error('OpenAI API error:', error);
      currentPanel.webview.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to get response from OpenAI',
      });
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
        vscode.Uri.file(path.join(context.extensionPath, 'build', 'static', 'js', 'main.js'))
      );
      const styleUri = webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, 'build', 'static', 'css', 'main.css'))
      );

      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AI Code Assistant</title>
          <link href="${styleUri}" rel="stylesheet">
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

  // Initialize OpenAI client
  initializeOpenAI();

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('aiCodeAssistant.openaiApiKey')) {
        initializeOpenAI();
      }
    })
  );
}

export function deactivate() {
  // Clean up resources if needed
}
