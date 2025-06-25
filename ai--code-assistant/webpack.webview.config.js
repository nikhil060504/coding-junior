// webpack.webview.config.js
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',           // or 'development' for debugging
  target: 'web',                // bundle for the browser (VS Code WebView)
  entry: path.resolve(__dirname, 'src', 'webview', 'index.tsx'),
  output: {
    // → build/static/js/main.js   (exactly what extension.ts looks for)
    path: path.resolve(__dirname, 'build', 'static', 'js'),
    filename: 'main.js',
    publicPath: '',             // keep relative paths
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',    // tailwind + autoprefixer
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      // → build/static/css/main.css
      filename: '../css/main.css',
    }),
  ],
  devtool: false,               // omit source‑maps to keep bundle small
};
