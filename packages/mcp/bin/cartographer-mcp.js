#!/usr/bin/env node
import { startMcpServer } from "../dist/server.js";

startMcpServer().catch((err) => {
  console.error("cartographer-mcp failed:", err);
  process.exit(1);
});
