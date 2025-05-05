#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { promises as fs } from "fs";
import { join } from "path";

// Create server instance
const server = new McpServer({
  name: "filesystem",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Add filesystem tools
server.tool(
  "list-directory",
  "List contents of a directory",
  {
    dirPath: z.string().describe("Directory path to list"),
  },
  async ({ dirPath }) => {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      const contents = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? "directory" : "file"
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(contents, null, 2)
          }
        ]
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error listing directory: ${message}`
          }
        ]
      };
    }
  }
);

server.tool(
  "read-file",
  "Read contents of a file",
  {
    filePath: z.string().describe("Path to the file to read")
  },
  async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        content: [
          {
            type: "text",
            text: content
          }
        ]
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error reading file: ${message}`
          }
        ]
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Filesystem MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});