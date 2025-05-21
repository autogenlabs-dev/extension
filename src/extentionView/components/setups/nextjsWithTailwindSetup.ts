import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// Function to create a basic Next.js app structure with Tailwind CSS
export async function nextjsWithTailwind(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const rootPath = workspaceFolders[0].uri.fsPath;
    console.log("🚀 ~ nextjsWithTailwind ~ rootPath:", rootPath);

    function getFileContent(filePath: any) {
      try {
        return fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return "";
      }
    }
    const nextjsStructure = [
      {
        folder: "src/assets",
        files: [],
      },
      {
        folder: "src/chip",
        files: [
          {
            name: "ProgressBar.jsx",
            content: `
              import React from "react";
              import styled from "styled-components";
    
              const ProgressBar = ({ logo, name, value, duration = 3 }) => {
                return (
                  <div className="flex flex-col gap-2 sm:gap-1 text-xl font-semibold ">
                    <div className="flex justify-between">
                      <p className="text-[1.15rem] flex items-center gap-3 sm:text-[1rem] exsm:text-sm exsm:gap-3">
                        {logo} {name}
                      </p>
                    </div>
                    <div className="h-[8px] w-[100%] relative rounded-3xl bg-gray-300">
                      <Progress
                        className="w-[0%] h-[8px] absolute rounded-3xl bg-yellow-500"
                        style={{
                          width: \`\${value}%\`,
                          animation: \`progress-animation \${duration}s linear\`,
                        }}
                      ></Progress>
                    </div>
                  </div>
                );
              };
    
              export default ProgressBar;
    
              const Progress = styled.div\`
                @keyframes progress-animation {
                  from {
                    width: 0%;
                  }
                  to {
                    width: \${(props) => props.width};
                  }
                }
              \`;
            `,
          },
        ],
      },
     
    ];    try {
      for (const { folder, files } of nextjsStructure) {
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

      // Create Next.js specific files
      const nextConfigContent = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
`;

      const tailwindConfigContent = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3490dc",
        secondary: "#ffed4a",
        danger: "#e3342f",
      },
    },
  },
  plugins: [],
}
`;

      const postcssConfigContent = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

      const globalCssContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
}
`;

      // Create initial Next.js pages
      const indexPageContent = `
import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="text-center text-white p-8 rounded-lg shadow-xl">
        <h1 className="text-5xl font-bold mb-8">Next.js + Tailwind CSS</h1>
        <p className="text-xl mb-8">Your project has been set up successfully!</p>
        <div className="flex justify-center space-x-4">
          <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer" className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            Next.js Docs
          </a>
          <a href="https://tailwindcss.com/docs" target="_blank" rel="noreferrer" className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            Tailwind Docs
          </a>
        </div>
      </div>
    </div>
  );
}
`;

      // Create necessary directories for Next.js
      const pagesDir = path.join(rootPath, "pages");
      if (!fs.existsSync(pagesDir)) {
        fs.mkdirSync(pagesDir, { recursive: true });
      }

      const stylesDir = path.join(rootPath, "styles");
      if (!fs.existsSync(stylesDir)) {
        fs.mkdirSync(stylesDir, { recursive: true });
      }

      // Write the config files
      fs.writeFileSync(path.join(rootPath, "next.config.js"), nextConfigContent);
      fs.writeFileSync(path.join(rootPath, "tailwind.config.js"), tailwindConfigContent);
      fs.writeFileSync(path.join(rootPath, "postcss.config.js"), postcssConfigContent);
      fs.writeFileSync(path.join(stylesDir, "globals.css"), globalCssContent);
      fs.writeFileSync(path.join(pagesDir, "index.js"), indexPageContent);

      // Create _app.js file for global styles
      const appJsContent = `
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
`;
      fs.writeFileSync(path.join(pagesDir, "_app.js"), appJsContent);

      // Create package.json with Next.js config
      const packageJson = {
        name: "nextjs-tailwind-project",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        },
        dependencies: {
          next: "^13.4.0",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "react-icons": "^4.7.1",
        },
        devDependencies: {
          "@types/node": "^18.15.11",
          "@types/react": "^18.0.35",
          "@types/react-dom": "^18.0.11",
          "autoprefixer": "^10.4.14",
          "postcss": "^8.4.21",
          "tailwindcss": "^3.3.1",
          "typescript": "^5.0.4"
        }
      };

      const packageJsonPath = path.join(rootPath, "package.json");
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Run npm install and start dev server
      const terminal = vscode.window.createTerminal("Next.js App Setup");
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
