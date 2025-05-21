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
        folder: "src/assets",
        files: [],
      },
      {
        folder: "src/components",
        files: [
          {
            name: "Navbar.jsx",
            content: `
              import React from "react";
              
              const Navbar = () => {
                return (
                  <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container">
                      <a className="navbar-brand" href="#">React Bootstrap</a>
                      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                      </button>
                      <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                          <li className="nav-item">
                            <a className="nav-link active" aria-current="page" href="#">Home</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" href="#">Features</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" href="#">Pricing</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" href="#">About</a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </nav>
                );
              };
              
              export default Navbar;
            `,
          },
          {
            name: "Hero.jsx",
            content: `
              import React from "react";
              
              const Hero = () => {
                return (
                  <div className="container py-5 mt-5">
                    <div className="row align-items-center">
                      <div className="col-lg-6">
                        <h1 className="display-4 fw-bold">React with Bootstrap</h1>
                        <p className="lead">This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.</p>
                        <hr className="my-4" />
                        <p>It uses utility classes for typography and spacing to space content out within the larger container.</p>
                        <div className="d-grid gap-2 d-md-flex justify-content-md-start">
                          <button type="button" className="btn btn-primary btn-lg px-4 me-md-2">Primary action</button>
                          <button type="button" className="btn btn-outline-secondary btn-lg px-4">Secondary</button>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="bg-light p-5 rounded-3 shadow">
                          <h2 className="fs-4 fw-bold">Welcome to your new application</h2>
                          <p>Your React + Bootstrap project has been set up successfully!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };
              
              export default Hero;
            `,
          },
        ],
      },
     
    ];    try {
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
      const indexHtmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + Bootstrap App</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  </body>
</html>
`;
      
      // Create main.jsx
      const mainJsxContent = `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;

      // Create App.jsx
      const appJsxContent = `
import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Hero />
    </div>
  );
}

export default App;
`;

      // Create App.css
      const appCssContent = `
.App {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}
`;

      // Create index.css
      const indexCssContent = `
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
`;

      // Write the files to disk
      fs.writeFileSync(path.join(rootPath, "index.html"), indexHtmlContent);
      fs.writeFileSync(path.join(rootPath, "src/main.jsx"), mainJsxContent);
      fs.writeFileSync(path.join(rootPath, "src/App.jsx"), appJsxContent);
      fs.writeFileSync(path.join(rootPath, "src/App.css"), appCssContent);
      fs.writeFileSync(path.join(rootPath, "src/index.css"), indexCssContent);

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
