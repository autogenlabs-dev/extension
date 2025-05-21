import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// Function to create a basic React app structure with Bootstrap
export async function reactWithBootstrap(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const rootPath = workspaceFolders[0].uri.fsPath;
    console.log("🚀 ~ reactWithBootstrap ~ rootPath:", rootPath);

    function getFileContent(filePath: any) {
      try {
        return fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return "";
      }
    }
    const bootstrapStructure = [
      {
        folder: "public",
        files: [],
      },
      {
        folder: "src",
        files: [
          { name: "App.css", content: `
            #root {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
    
    .logo {
      height: 6em;
      padding: 1.5em;
      will-change: filter;
      transition: filter 300ms;
    }
    .logo:hover {
      filter: drop-shadow(0 0 2em #646cffaa);
    }
    .logo.react:hover {
      filter: drop-shadow(0 0 2em #61dafbaa);
    }
    
    @keyframes logo-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    
    @media (prefers-reduced-motion: no-preference) {
      a:nth-of-type(2) .logo {
        animation: logo-spin infinite 20s linear;
      }
    }
    
    .card {
      padding: 2em;
    }
    
    .read-the-docs {
      color: #888;
    }
    ` },
          { name: "App.jsx", content: `
            
    import React from 'react';
    import './App.css';
    import Welcome from './components/Welcome';
    
    function App() {
      return (
        <div className="App">
          <Welcome />
        </div>
      );
    }
    
    export default App;
    
    ` },
          { name: "index.css", content: `
    body {
      margin: 0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    code {
      font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
    }
    
    .bg-gradient {
      background: linear-gradient(135deg, #6f42c1 0%, #6610f2 100%);
    }
    
    a {
      font-weight: 500;
      color: #6610f2;
      text-decoration: inherit;
    }
    
    a:hover {
      color: #5a00e6;
    }
    
    button:focus,
    button:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
    }
    ` },
          { name: "main.jsx", content: `
    import { StrictMode } from 'react'
    import { createRoot } from 'react-dom/client'
    import 'bootstrap/dist/css/bootstrap.min.css'
    import 'bootstrap/dist/js/bootstrap.bundle.min.js'
    import './index.css'
    import App from './App.jsx'
    
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    ` },
        ],
      },
      {
        folder: "src/assets",
        files: [],
      },
      {
        folder: "src/components",
        files: [
          { name: "Welcome.jsx", content: `
    import {  Container,  Card } from 'react-bootstrap';
        
        function Welcome() {
          return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient">
              <Container className="py-5">
                <Card className="shadow-lg mx-auto" style={{ maxWidth: '550px' }}>
                  <Card.Body className="p-4 text-center">
                    <div className="bg-light p-4 rounded-circle d-inline-flex mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#6610f2" className="bi bi-lightning-charge" viewBox="0 0 16 16">
                        <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"/>
                      </svg>
                    </div>
                    
                    <h1 className="display-5 fw-bold mb-2">Welcome to Autogen Labs</h1>
                    <p className="fs-4 text-muted mb-4">Pioneering the future of automated intelligence</p>
                    
                    <div className="mx-auto bg-primary mb-4" style={{ height: '4px', width: '100px' }}></div>
                    
                    <p className="mb-4">
                      Discover how our cutting-edge AI systems are transforming industries and creating new possibilities for businesses worldwide.
                    </p>
                    
                    <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
                      <a 
                        href="https://autogenlabs.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-lg px-4"
                      >
                        Visit Our Website
                      </a>
                    </div>
                    
                    <div className="mt-3 text-muted small">
                      <a 
                        href="https://autogenlabs.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary text-decoration-none"
                      >
                        autogenlabs.com
                      </a>
                    </div>
                  </Card.Body>
                </Card>
              </Container>
            </div>
          );
        }
        
        export default Welcome;
    
    ` },
        ],
      },
      {
        folder: "src/config",
        files: [],
      },
      {
        folder: "src/context",
        files: [],
      },
      {
        folder: "src/hooks",
        files: [],
      },
      {
        folder: "src/services",
        files: [],
      },
      {
        folder: "src/styles",
        files: [
          { name: "custom.scss", content: `
    // Override Bootstrap variables here
    $primary: #6610f2;
    $secondary: #6c757d;
    $success: #198754;
    $info: #0dcaf0;
    $warning: #ffc107;
    $danger: #dc3545;
    $light: #f8f9fa;
    $dark: #212529;
    
    // Import Bootstrap
    @import "~bootstrap/scss/bootstrap";
    
    // Custom styles
    .bg-gradient-primary {
      background: linear-gradient(135deg, #6f42c1 0%, #6610f2 100%);
    }
    
    // Add your custom styles here
    ` }
        ],
      },
      {
        folder: "src/utils",
        files: [],
      },
      {
        folder: "",
        files: [
          { name: "index.html", content: `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>React Bootstrap App</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/main.jsx"></script>
      </body>
    </html>
    ` },
          { name: "eslint.config.js", content: `
    import js from '@eslint/js'
    import globals from 'globals'
    import reactHooks from 'eslint-plugin-react-hooks'
    import reactRefresh from 'eslint-plugin-react-refresh'
    
    export default [
      { ignores: ['dist'] },
      {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
          ecmaVersion: 2020,
          globals: globals.browser,
          parserOptions: {
            ecmaVersion: 'latest',
            ecmaFeatures: { jsx: true },
            sourceType: 'module',
          },
        },
        plugins: {
          'react-hooks': reactHooks,
          'react-refresh': reactRefresh,
        },
        rules: {
          ...js.configs.recommended.rules,
          ...reactHooks.configs.recommended.rules,
          'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
          'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
          ],
        },
      },
    ]
    ` },
          { name: ".env", content: `` },
          { name: ".gitignore", content: `
    # Logs
    logs
    *.log
    npm-debug.log*
    yarn-debug.log*
    yarn-error.log*
    pnpm-debug.log*
    lerna-debug.log*
    
    node_modules
    dist
    dist-ssr
    *.local
    
    # Editor directories and files
    .vscode/*
    !.vscode/extensions.json
    .idea
    .DS_Store
    *.suo
    *.ntvs*
    *.njsproj
    *.sln
    *.sw?
    ` },
          { name: "vite.config.js", content: `
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'
    
    // https://vitejs.dev/config/
    export default defineConfig({
      plugins: [react()],
    })
    ` },
          { name: "package.json", content: `
    {
      "name": "react-bootstrap-app",
      "private": true,
      "version": "0.0.0",
      "type": "module",
      "scripts": {
        "dev": "vite",
        "build": "vite build",
        "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
        "preview": "vite preview"
      },
      "dependencies": {
        "bootstrap": "^5.3.2",
        "react": "^18.2.0",
        "react-bootstrap": "^2.9.1",
        "react-dom": "^18.2.0"
      },
      "devDependencies": {
        "@eslint/js": "^8.54.0",
        "@types/react": "^18.2.37",
        "@types/react-dom": "^18.2.15",
        "@vitejs/plugin-react": "^4.2.0",
        "eslint": "^8.54.0",
        "eslint-plugin-react-hooks": "^4.6.0",
        "eslint-plugin-react-refresh": "^0.4.4",
        "globals": "^13.24.0",
        "sass": "^1.69.5",
        "vite": "^5.0.0"
      }
    }
    ` },
        ],
      },
    ];
    
    
        try {
      for (const { folder, files } of bootstrapStructure) {
        const newFolder = path.join(rootPath, folder);

        // Check if folder exists, if not, create it recursively
        if (!fs.existsSync(newFolder)) {
          fs.mkdirSync(newFolder, { recursive: true });
          console.log(`Created folder: ${newFolder}`);
        }

        // Create the files in the folder
        for (const file of files) {
          const newFile = path.join(newFolder, file.name);
          fs.writeFileSync(newFile, file.content);
          console.log(`Created file: ${newFile}`);
        }
      }      // Create index.html with Bootstrap CDN
   
      // Create package.json with watch script
      const packageJson = {
        name: "react-bootstrap-app",
        private: true,
        version: "0.1.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-bootstrap": "^2.9.0",
          "bootstrap": "^5.3.0",
          "react-icons": "^4.11.0",
          "react-router-dom": "^6.16.0"
        },        devDependencies: {
          "@types/react": "^18.2.21",
          "@types/react-dom": "^18.2.7",
          "@vitejs/plugin-react": "^4.0.4",
          "vite": "^4.4.9"
        },
      };

      const packageJsonPath = path.join(rootPath, "package.json");
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));      // Create vite.config.js
      const viteConfigContent = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
`;
      fs.writeFileSync(path.join(rootPath, "vite.config.js"), viteConfigContent);

      // Create .gitignore
      const gitignoreContent = `
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`;
      fs.writeFileSync(path.join(rootPath, ".gitignore"), gitignoreContent);

      // Make sure src directory exists
      const srcDir = path.join(rootPath, "src");
      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir, { recursive: true });
      }

      // Run npm install and npm run dev
      const terminal = vscode.window.createTerminal("React Bootstrap App Setup");
      terminal.sendText("npm install");
      terminal.sendText("npm run dev");
      terminal.show();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error creating file/folder: ${(error as Error).message}`
      );
    }
  } else {
    vscode.window.showErrorMessage("No workspace folder found!");
  }
}
