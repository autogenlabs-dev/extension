import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// Function to create a basic React app structure with Tailwind CSS
export async function reactWithTailwind(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const rootPath = workspaceFolders[0].uri.fsPath;
    console.log("🚀 ~ reactWithTailwind ~ rootPath:", rootPath);

    function getFileContent(filePath: any) {
      try {
        return fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return "";
      }
    }
   const reactStructure = [
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
        import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <div className="bg-indigo-100 p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Welcome to Autogen Labs</h1>
          <p className="text-lg text-gray-600 mb-6">Pioneering the future of automated intelligence</p>
          
          <div className="w-24 h-1 bg-indigo-600 mb-6"></div>
          
          <p className="text-gray-700 mb-8">
            Discover how our cutting-edge AI systems are transforming industries and creating new possibilities for businesses worldwide.
          </p>
          
          <div className="space-y-4">
            <a 
              href="https://autogenlabs.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition duration-300"
            >
              Visit Our Website
            </a>
            
            <p className="text-sm text-gray-500">
              <a 
                href="https://autogenlabs.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-indigo-600 hover:underline"
              >
                autogenlabs.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
` },
      { name: "index.css", content: `
        @import "tailwindcss";
:root {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}


` },
      { name: "main.jsx", content: `
        import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
    files: [],
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
    files: [],
  },
  {
    folder: "src/utils",
    files: [],
  },
  {
    folder: "",
    files: [
      { name: "index.html", content: `
        <!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
` },
{ name: "index.html", content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React</title>
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
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})

        ` },
    ],
  },
];


    try {
      for (const { folder, files } of reactStructure) {
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
      }

      // Create package.json with watch script
      const packageJson = {
        name: "react-tailwind",
        private: true,
        version: "0.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          lint: "eslint .",
          preview: "vite preview",
        },
        dependencies: {
          "@tailwindcss/vite": "^4.1.7",
          "react": "^19.1.0",
          "react-dom": "^19.1.0",
          "tailwindcss": "^4.1.7"
        },
        devDependencies: {
          "@eslint/js": "^9.25.0",
          "@types/react": "^19.1.2",
          "@types/react-dom": "^19.1.2",
          "@vitejs/plugin-react": "^4.4.1",
          "eslint": "^9.25.0",
          "eslint-plugin-react-hooks": "^5.2.0",
          "eslint-plugin-react-refresh": "^0.4.19",
          "globals": "^16.0.0",
          "vite": "^6.3.5"
        },
      };

      const packageJsonPath = path.join(rootPath, "package.json");
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Run npm install and npm run watch:tsc
      const terminal = vscode.window.createTerminal("React App Setup");
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
