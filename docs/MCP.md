# Cartographer MCP Server

Stdio MCP server exposing all Grid Ops tools from `@cartographer/core` via fixture data.

## Tools

| Tool | Description |
|------|-------------|
| `get_deployment` | Fetch a single deployment by ID |
| `list_exceptions` | List deployments with open exceptions or watch status |
| `get_contract_terms` | SLA and bridge-to-permanent terms for a customer |
| `get_runbook_snippet` | Runbook steps for an exception code |
| `get_fleet_summary` | MW contracted/available/gap rollups |
| `get_pipeline` | Bridge-to-permanent pipeline with deadlines |
| `run_scenario` | Model interconnection slip in weeks |

## Build

```bash
npm run build -w @cartographer/mcp
```

## Run (stdio)

```bash
npx cartographer-mcp
```

Or from the package directory after build:

```bash
npm run start -w @cartographer/mcp
```

## Cursor MCP config

Add to `.cursor/mcp.json` (or global Cursor MCP settings):

```json
{
  "mcpServers": {
    "cartographer": {
      "command": "node",
      "args": [
        "C:/WAVSVN/components/_cartographer/packages/mcp/bin/cartographer-mcp.js"
      ]
    }
  }
}
```

After `npm install` at the repo root, you can also use the workspace binary:

```json
{
  "mcpServers": {
    "cartographer": {
      "command": "npx",
      "args": ["cartographer-mcp"],
      "cwd": "C:/WAVSVN/components/_cartographer"
    }
  }
}
```

Restart Cursor after saving the config. The server loads fixture data from `@cartographer/data` on startup.
