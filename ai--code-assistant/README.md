# AI Code Assistant VS Code Extension

AI Code Assistant is a Visual Studio Code extension that enables you to chat with powerful AI models (Cohere, OpenAI, Gemini) directly inside your editor. It helps you write, debug, and understand code, and can answer programming questions or provide code suggestions.

## Features

- Chat interface in a VS Code webview
- Supports Cohere API (default), with easy switching to OpenAI or Gemini
- Attach files or images for context
- Syntax-highlighted markdown responses
- Light and dark mode support

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- VS Code 1.70+
- A Cohere API key (get one at https://dashboard.cohere.com/api-keys)

### Installation

1. Clone this repository or download the source code.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to build the extension.
4. Press `F5` in VS Code to launch the extension in a new Extension Development Host window.
   - Or, package with `vsce package` and install the `.vsix` file in VS Code.

### Configuration

- Open VS Code settings and search for `AI Code Assistant`.
- Enter your Cohere API key in the `aiCodeAssistant.cohereApiKey` field.

## Usage

- Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
- Run `AI Code Assistant: Start`
- Chat with the AI in the webview panel
- Attach files for more context if needed

## Development

- Main extension code: `src/extension.ts`
- Webview React app: `src/webview/`
- Chat UI: `src/webview/components/ChatInterface.tsx`
- Styles: `src/webview/index.css`

## Build Scripts

- `npm run build` — Build the extension and webview
- `npm run watch` — Watch for changes and rebuild automatically

## License

MIT

---

For issues or feature requests, please open an issue on GitHub.
