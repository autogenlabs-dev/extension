# Browser Tools & MCP Workflow

## Overview
This document explains how browser tools and Model Context Protocol (MCP) integration work in the project.

---

## Key Folders
- `browser-tools/browser-tools-mcp/`: Main MCP server and integration code.
- `browser-tools/browser-tools-mcp/browser-tools-mcp/`: MCP server TypeScript code.
- `browser-tools/browser-tools-mcp/browser-tools-server/`: Node server for Chrome extension communication.
- `browser-tools/browser-tools-mcp/chrome-extension/`: Chrome extension for capturing browser data.
- `browser-tools/browser-tools-mcp/docs/`: Documentation for MCP and server usage.

---

## MCP Server
- Implements the Model Context Protocol for exposing tools and resources to LLM clients.
- Main entry: `mcp-server.ts`.
- Handles protocol compliance, tool/resource registration, and message routing.

---

## Node Server
- Acts as middleware between the Chrome extension and MCP server.
- Facilitates communication and data transfer.

---

## Chrome Extension
- Captures browser data (screenshots, logs, DOM, etc.).
- Sends data to the Node server for analysis and use by the MCP server.

---

## Usage
- Start the MCP server using npm scripts in `browser-tools-mcp/package.json`.
- Connects to compatible LLM clients (e.g., Claude Desktop, Cursor).

---

## Documentation
- See `browser-tools/browser-tools-mcp/docs/` for detailed protocol and usage docs.
