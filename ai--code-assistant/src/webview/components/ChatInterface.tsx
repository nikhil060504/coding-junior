import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface Attachment {
  type: 'file' | 'image';
  path: string;
  content?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  vscode: {
    postMessage: (message: { type: string; filePath?: string }) => void;
  };
}

interface VSCodeMessage {
  type: 'response' | 'error' | 'fileContent';
  content?: string;
  error?: string;
  filePath?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, vscode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<VSCodeMessage>) => {
      try {
        const message = event.data;
        
        switch (message.type) {
          case 'error':
            console.error('Error from VS Code:', message.error);
            setError(message.error || 'Unknown error occurred');
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Error: ${message.error || 'Unknown error occurred'}`,
              timestamp: new Date()
            }]);
            break;

          case 'response':
            if (!message.content) {
              throw new Error('Received empty response from VS Code');
            }
            setError(null);
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: message.content as string,
              timestamp: new Date()
            }]);
            break;

          case 'fileContent':
            if (!message.filePath || !message.content) {
              throw new Error('Invalid file content response');
            }
            handleFileContentReceived(message.filePath, message.content);
            break;

          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error handling VS Code message:', error);
        setError(error instanceof Error ? error.message : 'Failed to process VS Code message');
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
  marked.setOptions({
  highlight(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
} as any);    
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    try {
      setIsLoading(true);
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        attachments,
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      await onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileContentReceived = (filePath: string, content: string) => {
    try {
      const newAttachment: Attachment = {
        type: filePath.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 'file',
        path: filePath,
        content,
      };
      setAttachments(prev => [...prev, newAttachment]);
      setError(null);
    } catch (error) {
      console.error('Error processing file content:', error);
      setError(error instanceof Error ? error.message : 'Failed to process file content');
    }
  };

  const handleFileAttachment = async (filePath: string) => {
    if (!filePath) {
      setError('No file path provided');
      return;
    }

    try {
      setIsLoading(true);
      vscode.postMessage({
        type: 'getFileContent',
        filePath,
      });
    } catch (error) {
      console.error('Error requesting file content:', error);
      setError(error instanceof Error ? error.message : 'Failed to request file content');
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    try {
      const sanitizedContent = message.content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const htmlContent =  marked.parse(sanitizedContent) as string;
      return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    } catch (error) {
      console.error('Error rendering message:', error);
      return (
        <div className="text-red-500 p-2 bg-red-100 dark:bg-red-900 rounded">
          Error rendering message: {(error as Error).message}
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-2 text-sm">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 shadow-sm border ${message.role === 'user' ? 'ai-chat-bubble-user' : 'ai-chat-bubble-assistant'}`}
            >
              {renderMessage(message)}
              {message.attachments?.map((attachment, i) => (
                <div key={`${message.id}-${i}`} className="mt-2 text-sm border-t border-gray-200 dark:border-gray-600 pt-2">
                  <span className="font-semibold">Attached:</span>{' '}
                  <span className="font-mono text-xs">{attachment.path}</span>
                </div>
              ))}
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-pulse text-gray-500 dark:text-gray-400">
              Processing...
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
        <div className="flex flex-col space-y-2">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-xs flex items-center"
                >
                  <span className="truncate max-w-xs">{attachment.path}</span>
                  <button
                    type="button"
                    className="ml-2 text-gray-500 hover:text-red-500"
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 ai-chat-input"
              placeholder={isLoading ? 'Processing...' : 'Type a message...'}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`ai-chat-send-btn ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
            >
              {isLoading ? 'Processing...' : 'Send'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};