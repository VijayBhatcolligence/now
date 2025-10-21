# Project Builder MCP Server

A Model Context Protocol (MCP) server for managing software project planning and design with real-time frontend synchronization.

## What is this?

This MCP server helps AI assistants create and manage project data (requirements, design, architecture) and broadcasts updates to a React frontend in real-time via WebSocket.

## Installation

### 1. Install Python Dependencies

```bash
pip install mcp websockets
```

### 2. Configure React Frontend Path

Edit `mcp_server/utils/react_manager.py` (line 8):

```python
REACT_DIR = r"C:\path\to\your\react-frontend"
```

Replace with your actual React frontend directory path.

### 3. Add to Claude Code MCP Config

Edit your Claude config file:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add this:

```json
{
  "mcpServers": {
    "project-builder": {
      "command": "python",
      "args": ["C:\\full\\path\\to\\mcp_server\\server_mcp_sdk.py"]
    }
  }
}
```

**Important**: Update the path to match your actual location!

## Tools

### `host_tool`
Initialize a new project with directory structure

### `update_project_files`
Update project files (requirement.js, ddd.js, frontend_data.js, technical_architecture.js, summary.md) with merge strategies (replace/merge/append)

### `get_project_data`
Get currently active project data

### `get_project_list`
Get list of all projects with metadata

### `select_project`
Load an existing project and broadcast to frontend

### `delete_project`
Delete a project completely

### `close_connection`
Shutdown React and WebSocket servers

## How it Works

1. **Project Storage**: Creates structured JSON/Markdown files in `mcp_server/projects/`
2. **React Server**: Auto-starts on port 3000
3. **WebSocket**: Broadcasts updates to frontend on port 8080
4. **Multi-terminal Sync**: Projects sync across multiple terminals

## Project Files

Each project contains:
- `requirement.js` - Requirements & user flows
- `ddd.js` - Domain-driven design structures
- `frontend_data.js` - UI specifications & canvas data
- `technical_architecture.js` - Architecture & tech stack
- `summary.md` - Project summary

## Troubleshooting

**React won't start?**
- Check `REACT_DIR` path is correct
- Run `npm install` in your React directory
- Ensure port 3000 is free

**WebSocket issues?**
- Check port 8080 is available
- Verify firewall settings

**Project not syncing?**
- Check `current_project.json` exists
- Verify WebSocket connection

## Requirements

- Python 3.8+
- Node.js 14+
- React frontend configured at specified path

---

**Version**: 1.0.0
