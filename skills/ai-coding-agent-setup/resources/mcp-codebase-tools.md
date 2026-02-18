# MCP Servers for Codebase Navigation

Model Context Protocol (MCP) gives AI agents live, dynamic access to your IDE, codebase, and infrastructure — beyond what static files can provide. This resource covers the key MCP servers for code navigation, semantic search, and developer tooling.

---

## Overview: Why MCP for Codebase Understanding

Static files (AGENTS.md, skills) give agents context about *how the project works*. MCP gives agents tools to *explore the living codebase* — finding usages, navigating call hierarchies, checking diagnostics, and querying databases.

| Without MCP | With MCP |
|-------------|---------|
| Agent reads a file's source to understand it | Agent calls `find_usages("UserService")` |
| Agent guesses at function signatures | Agent calls `get_type_definition` on any symbol |
| Agent misses a compilation error | Agent calls `get_diagnostics` and sees errors directly |
| Agent re-discovers schema from migration files | Agent queries live DB schema via MCP |

---

## Primary MCP Servers

### 1. Bifrost — IDE Language Server for Agents

The highest-value MCP server for codebase navigation. Bifrost is a VS Code extension that exposes the IDE's Language Server Protocol (LSP) capabilities to LLMs via MCP.

**Install:** Search "Bifrost" in VS Code Extensions, or `ext install bifrost.bifrost-mcp`

**Configuration** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "bifrost": {
      "type": "stdio",
      "command": "node",
      "args": ["${userHome}/.vscode/extensions/bifrost.bifrost-mcp-*/dist/server.js"]
    }
  }
}
```

**Available Tools:**

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `find_usages` | Find all references to a symbol | "Where is `UserService` used?" |
| `get_call_hierarchy` | Incoming and outgoing call graph | "What calls `processPayment()`?" |
| `go_to_definition` | Navigate to symbol definition | "Where is `AuthToken` defined?" |
| `find_implementations` | Find all implementations of an interface | "What implements `IRepository`?" |
| `get_type_definition` | Type info for a symbol | "What type does `result` have?" |
| `get_workspace_symbols` | Search symbols across the project | "Find all classes named `*Service`" |
| `get_document_symbols` | Outline symbols in a file | "List all functions in `auth.ts`" |
| `get_diagnostics` | Compilation errors and warnings | "Are there any type errors?" |
| `get_hover_info` | Documentation on hover | "What does `encryptPII` do?" |

**Add to AGENTS.md:**
```markdown
## MCP Tools Available

Code navigation (via Bifrost MCP):
- `find_usages` — find all references to a symbol
- `get_call_hierarchy` — trace calls to/from a function
- `go_to_definition` — navigate to a definition
- `get_diagnostics` — check for compilation errors

Use these tools instead of grepping source files for symbol references.
```

---

### 2. vscode-mcp-server — VS Code Control and File Analysis

Open-source server that turns a local VS Code instance into an MCP server. Complements Bifrost with additional file editing, terminal, and symbol tools.

**Install:** `npx @vscode/mcp-server`

**Configuration** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "vscode": {
      "type": "stdio",
      "command": "npx",
      "args": ["@vscode/mcp-server"]
    }
  }
}
```

**Key Tools:**

| Tool | Purpose |
|------|---------|
| `get_diagnostics_code` | File or workspace errors/warnings |
| `get_symbol_definition_code` | Type info and docs for a symbol at a line |
| `get_document_symbols_code` | Hierarchical outline of functions/classes |
| `search_symbols_code` | Find symbols by name across workspace |
| `open_file` | Open a file in the editor |
| `run_terminal_command` | Execute a terminal command |

---

### 3. GitHub MCP Server — Remote Repository Context

For exploring code that isn't locally checked out, or for cross-repository searches.

**Install:** `npx @github/mcp-server`

**Configuration** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@github/mcp-server"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

**Key Tools:**

| Tool | Purpose |
|------|---------|
| `search_code` | Full-text code search across repositories |
| `get_file_contents` | Read a file from a remote repo |
| `list_commits` | View commit history for a branch/file |
| `get_pull_request` | Read PR details and review comments |
| `list_issues` | Browse open issues |
| `create_issue` | Create an issue from within the agent session |

---

### 4. Semantic Search via Vector Store MCP

For natural-language queries over large codebases or documentation, connect a vector store.

#### Option A: Qdrant (self-hosted)

```json
{
  "servers": {
    "qdrant": {
      "type": "stdio",
      "command": "npx",
      "args": ["qdrant-mcp-server"],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "COLLECTION_NAME": "codebase"
      }
    }
  }
}
```

**Workflow:**
1. Index codebase: `python scripts/index-codebase.py --collection codebase`
2. Query: agent calls `search("How does auth work?")` → returns relevant code chunks

#### Option B: Azure AI Search (cloud)

```json
{
  "servers": {
    "azure-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["azure-ai-search-mcp"],
      "env": {
        "AZURE_SEARCH_ENDPOINT": "${env:AZURE_SEARCH_ENDPOINT}",
        "AZURE_SEARCH_API_KEY": "${env:AZURE_SEARCH_API_KEY}",
        "INDEX_NAME": "codebase-index"
      }
    }
  }
}
```

---

### 5. Database MCP Server — Live Schema Access

Prevent agents from guessing at database schemas by giving them direct query access.

**Configuration example (PostgreSQL):**
```json
{
  "servers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${env:DATABASE_URL}"
      }
    }
  }
}
```

Agents can call:
- `list_tables` — enumerate all tables
- `describe_table` — columns, types, constraints for a table
- `query` — run a SELECT query (read-only by default)

**Security note:** Use a read-only database user for the MCP server connection. Never point MCP at a production database with write credentials.

---

## Full mcp.json Template

Place this at `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "bifrost": {
      "type": "stdio",
      "command": "node",
      "args": ["${userHome}/.vscode/extensions/bifrost.bifrost-mcp-*/dist/server.js"],
      "description": "LSP-powered code navigation (find usages, call hierarchy, diagnostics)"
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@github/mcp-server"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      },
      "description": "GitHub code search and repository access"
    }
  }
}
```

Add other servers (vscode, postgres, qdrant) as needed.

---

## Tool Selection Guide

When should agents use which tool?

| Question | Preferred Tool |
|----------|---------------|
| "Where is X defined?" | Bifrost `go_to_definition` |
| "What calls function X?" | Bifrost `get_call_hierarchy` |
| "What implements interface X?" | Bifrost `find_implementations` |
| "Are there compilation errors?" | Bifrost `get_diagnostics` or vscode `get_diagnostics_code` |
| "Find all files using a pattern" | Bifrost `find_usages` or vscode `search_symbols_code` |
| "What's the DB schema for table X?" | DB MCP `describe_table` |
| "How does the auth flow work?" (concept) | Semantic search MCP `search` |
| "Find code in another repo" | GitHub MCP `search_code` |

Document this guide in AGENTS.md so agents know which tool to reach for.

---

## Troubleshooting MCP Configuration

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Server not found in agent session | mcp.json path wrong or extension not installed | Verify `.vscode/mcp.json` exists; reload VS Code window |
| Tool call returns "not connected" | MCP server process not running | Check MCP extension status in VS Code Output panel |
| Bifrost tools not available | Extension not activated | Open any source file to trigger language server activation |
| GitHub auth failure | `GITHUB_TOKEN` env var missing | Add to shell profile or `.env` (git-ignored) |
| DB query fails with permission denied | DB user insufficient permissions | Use a dedicated read-only DB user for MCP |
