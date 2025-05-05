# Webview UI Workflow

## Overview
This document describes how the webview UI is built and interacts with the extension backend.

---

## Source Code
- Located in `webview-ui/src/` (React + Vite app).
- Main entry: `webview-ui/src/App.tsx`.
- Built output goes to `webview-ui/build/`.

---

## Building
- Run `npm run build:webview` to build the UI for production.
- Run `npm run dev:webview` for development mode (hot reload).

---

## Communication
- The webview communicates with the extension backend via `window.acquireVsCodeApi()` and message passing.
- Handlers for UI events and messages are in `src/extentionView/extensionView.ts`.

---

## UI Components
- Components are organized in `webview-ui/src/components/`.
- Utilities and context in `webview-ui/src/context/` and `webview-ui/src/utilities/`.

---

## Customization
- Styles in `webview-ui/src/index.css` and `src/extentionView/styles.css`.

---

## Testing
- Test files in `webview-ui/src/setupTests.ts` and related folders.
