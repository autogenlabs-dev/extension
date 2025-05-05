# Project Structure

```
chatIde/
├── assets/                # Images, icons, and documentation assets
├── browser-tools/         # Browser integration tools (MCP, Chrome extension, server)
├── src/                   # Main extension and backend source code
├── test/                  # Test files for extension logic
├── utils/                 # Utility functions (fs, path, shell, etc.)
├── viewHandlers/          # Logic for handling UI view events and actions
├── webview-ui/            # Frontend UI for the extension (React/Vite app)
├── dev.ps1                # PowerShell script for development
├── esbuild.js             # Build script for bundling extension code
├── package.json           # Project manifest, scripts, dependencies, VS Code config
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

See each workflow file for details on the main folders and their responsibilities.