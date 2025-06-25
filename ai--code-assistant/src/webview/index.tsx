import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element. Make sure the HTML contains an element with id "root".');
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render React application:', error);
  const errorMessage = document.createElement('div');
  errorMessage.style.cssText = 'color: red; padding: 20px; text-align: center;';
  errorMessage.textContent = 'Failed to initialize the application. Please reload the page.';
  rootElement.appendChild(errorMessage);
}