import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// Function to create a basic React app structure
export async function reactWithtTailiwnd(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const rootPath = workspaceFolders[0].uri.fsPath;
    console.log("🚀 ~ createPortfolio ~ rootPath:", rootPath);

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
        name: "my-portfolio",
        private: true,
        version: "0.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          aos: "^3.0.0-beta.6",
          "emailjs-com": "^3.2.0",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "react-icons": "^4.7.1",
          "react-intersection-observer": "^9.5.3",
          "react-locomotive-scroll": "^0.2.2",
          "react-router-dom": "^6.8.1",
          "react-scroll": "^1.9.0",
          "react-slick": "^0.30.1",
          "react-spinners": "^0.13.8",
          "react-type-animation": "^2.1.2",
          "react-typewriter-effect": "^1.1.0",
          "react-useanimations": "^2.10.0",
          "slick-carousel": "^1.8.1",
          "styled-components": "^5.3.9",
          tslib: "^2.6.2",
          "typewriter-effect": "^2.19.0",
        },
        devDependencies: {
          "@types/react": "^18.0.27",
          "@types/react-dom": "^18.0.10",
          "@vitejs/plugin-react": "^3.1.0",
          autoprefixer: "^10.4.13",
          postcss: "^8.4.21",
          tailwindcss: "^3.2.7",
          vite: "^4.1.0",
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
