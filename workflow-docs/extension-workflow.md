# VS Code Extension Workflow

## Overview
This document explains how the main VS Code extension operates, from activation to user interaction.

---

## Activation
- The extension entry point is `src/extension.ts`.
- Registers commands, sets up the webview, and initializes services.

---

## Command Registration
- Commands are defined in `package.json` under `contributes.commands`.
- Each command is linked to a handler in `extension.ts`.

---

## Webview Panel
- The extension creates a webview panel using HTML/JS from `webview-ui/build/`.
- Communication between the webview and extension backend is handled via message passing.
- UI logic for the sidebar and panels is in `src/extentionView/extensionView.ts`.

---

## Core Agent Logic
- The main agent logic is in `src/core/Autogen.ts`.
- Handles user tasks, tool usage, and LLM API calls.
- Integrates with services in `src/services/` and `src/integrations/`.

---

## File Operations
- Uses utility functions from `src/utils/` and `src/services/` for file, git, and shell operations.

---

## Testing
- Test files are in `src/test/` and can be run with `npm test`.

---

## Build & Watch
- Use `npm run watch:esbuild` to watch and rebuild the extension backend.
- Use `npm run build:webview` to build the webview UI.
