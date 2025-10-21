#!/usr/bin/env python3
"""
MCP Server using official Model Context Protocol SDK
"""
import asyncio
import sys
import io
from datetime import datetime
from typing import Any

# Ensure stderr uses UTF-8 on Windows
if sys.platform == 'win32':
    if hasattr(sys.stderr, 'buffer'):
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True, errors='replace')
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True, errors='replace')

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Import your existing utilities
from utils.file_manager import (
    create_project_directory,
    create_empty_json_file,
    update_project_registry,
    project_exists,
    update_json_file,
    read_json_file,
    write_text_file,
    get_project_file_path,
    get_all_projects,
    read_project_files,
    delete_project_directory,
    remove_from_registry,
    write_current_project,
    read_current_project,
    VALID_FILE_TYPES
)
from utils.broadcast_manager import broadcast_to_frontends, start_websocket_server, set_current_project_data, stop_websocket_server, watch_current_project_file
from utils.react_manager import start_react_server, check_react_status, stop_react_server

# Global variable to store current project data with version tracking
current_project_data = {
    "project_name": "",
    "requirements": {},
    "ddd": {},
    "frontend_data": {},
    "technical_architecture": {},
    "summary": "",  # Markdown summary file (not broadcast, only returned in get/select)
    "version": 0,  # Version counter for state changes
    "last_updated": "",  # ISO timestamp of last update
    "last_command": ""  # Last command executed
}

# Global state version counter
state_version = 0

# Create MCP server instance with proper configuration
server = Server("project-builder")

# Log initialization
print("Initializing MCP Server: project-builder", file=sys.stderr, flush=True)


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools"""
    return [
        Tool(
            name="host_tool",
            description="Initialize a new project with directory structure",
            inputSchema={
                "type": "object",
                "properties": {
                    "project_name": {
                        "type": "string",
                        "description": "Name of the project to create (alphanumeric with underscores only)"
                    }
                },
                "required": ["project_name"]
            }
        ),
        Tool(
            name="update_project_files",
            description="Update project files (requirement.js, ddd.js, frontend_data.js, technical_architecture.js, summary.md) with new data using various merge strategies",
            inputSchema={
                "type": "object",
                "properties": {
                    "project_name": {
                        "type": "string",
                        "description": "Name of the project to update"
                    },
                    "file_type": {
                        "type": "string",
                        "enum": ["requirement.js", "ddd.js", "frontend_data.js", "technical_architecture.js", "summary.md"],
                        "description": "Which project file to update"
                    },
                    "update_data": {
                        "type": ["object", "string"],
                        "description": "Data to update: JSON object for .js files, string for .md files"
                    },
                    "merge_strategy": {
                        "type": "string",
                        "enum": ["replace", "merge", "append"],
                        "default": "merge",
                        "description": "How to apply updates: 'replace' (overwrite entire file), 'merge' (deep merge objects and deduplicate arrays), 'append' (same as merge). Note: For .md files, all strategies act as 'replace'"
                    }
                },
                "required": ["project_name", "file_type", "update_data"]
            }
        ),
        Tool(
            name="get_project_data",
            description="Get the currently broadcasting project data. Returns project name and all 4 files (requirement.js, ddd.js, frontend_data.js, technical_architecture.js). Use this to understand what project the backend is currently working with.",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="get_project_list",
            description="Get list of all projects from the registry. Returns array of projects with metadata (project_name, created_at, last_updated, status).",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="select_project",
            description="Select and load an existing project. Loads all project files, updates global state, starts React server if needed, and begins broadcasting the selected project.",
            inputSchema={
                "type": "object",
                "properties": {
                    "project_name": {
                        "type": "string",
                        "description": "Name of the existing project to select and load"
                    }
                },
                "required": ["project_name"]
            }
        ),
        Tool(
            name="delete_project",
            description="Delete a project completely. Removes project directory, all files, and updates registry. If the deleted project is currently loaded, clears frontend state and broadcasts project_deleted event.",
            inputSchema={
                "type": "object",
                "properties": {
                    "project_name": {
                        "type": "string",
                        "description": "Name of the project to delete"
                    }
                },
                "required": ["project_name"]
            }
        ),
        Tool(
            name="close_connection",
            description="Gracefully shutdown all servers (React development server and WebSocket server). Use this to clean up and stop all running services.",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls"""
    global current_project_data, state_version

    print(f"\n{'='*60}", file=sys.stderr, flush=True)
    print(f"🔧 Tool Call Received: {name}", file=sys.stderr, flush=True)
    print(f"📥 Arguments: {arguments}", file=sys.stderr, flush=True)
    print(f"📊 Current State Version: {state_version}", file=sys.stderr, flush=True)
    print(f"📊 Current Project: {current_project_data.get('project_name', 'None')}", file=sys.stderr, flush=True)
    print(f"{'='*60}", file=sys.stderr, flush=True)

    if name == "host_tool":
        return await handle_host_tool(arguments)
    elif name == "update_project_files":
        return await handle_update_project_files(arguments)
    elif name == "get_project_data":
        return await handle_get_project_data(arguments)
    elif name == "get_project_list":
        return await handle_get_project_list(arguments)
    elif name == "select_project":
        return await handle_select_project(arguments)
    elif name == "delete_project":
        return await handle_delete_project(arguments)
    elif name == "close_connection":
        return await handle_close_connection(arguments)
    else:
        raise ValueError(f"Unknown tool: {name}")


async def handle_host_tool(arguments: dict) -> list[TextContent]:
    """Handle host_tool: Initialize new project"""
    global current_project_data, state_version

    project_name = arguments.get("project_name")
    previous_project = current_project_data.get("project_name", "")

    print(f"\n{'='*60}", file=sys.stderr, flush=True)
    print(f"📝 CREATE PROJECT COMMAND", file=sys.stderr, flush=True)
    print(f"   New Project: {project_name}", file=sys.stderr, flush=True)
    print(f"   Previous: {previous_project}", file=sys.stderr, flush=True)
    print(f"   Current Version: {state_version}", file=sys.stderr, flush=True)
    print(f"{'='*60}", file=sys.stderr, flush=True)

    # Validate project name
    if not project_name:
        result = {
            "status": "error",
            "error": "project_name is required"
        }
        return [TextContent(type="text", text=str(result))]

    if not project_name.replace("_", "").isalnum():
        result = {
            "status": "error",
            "error": "project_name must be alphanumeric with underscores only"
        }
        return [TextContent(type="text", text=str(result))]

    # Check if project already exists
    if project_exists(project_name):
        result = {
            "status": "error",
            "error": f"Project '{project_name}' already exists"
        }
        return [TextContent(type="text", text=str(result))]

    try:
        # 1. Check and start React server if needed
        print(f"Checking React server status...", file=sys.stderr, flush=True)
        react_status = await check_react_status()
        react_info = {}
        react_is_ready = False

        if react_status["status"] == "not_running":
            print(f"React server not running, starting it...", file=sys.stderr, flush=True)
            react_result = await start_react_server()

            # If React is starting, wait for it to be ready
            if react_result.get("status") == "starting":
                print(f"⏳ Waiting for React server to be ready...", file=sys.stderr, flush=True)

                # Wait up to 30 seconds for React to be ready
                from utils.react_manager import is_port_in_use, REACT_PORT
                import asyncio

                for i in range(30):
                    await asyncio.sleep(1)
                    if is_port_in_use(REACT_PORT):
                        print(f"✅ React server is now ready on port {REACT_PORT}!", file=sys.stderr, flush=True)
                        react_is_ready = True
                        react_info = {
                            "react_server": "ready",
                            "react_url": f"http://localhost:{REACT_PORT}",
                            "react_message": f"React server started and ready (took {i+1}s)"
                        }
                        break
                    if (i + 1) % 5 == 0:
                        print(f"⏳ Still waiting... ({i + 1}s elapsed)", file=sys.stderr, flush=True)

                if not react_is_ready:
                    # Timeout - React didn't start in time
                    react_info = {
                        "react_server": "starting",
                        "react_url": react_result.get("url"),
                        "react_message": "React server is still starting (may take up to 30s more)",
                        "warning": "Frontend connection may fail until React is fully ready"
                    }
            else:
                # React already running or error
                react_is_ready = react_result.get("status") in ["running", "already_running"]
                react_info = {
                    "react_server": react_result["status"],
                    "react_url": react_result.get("url"),
                    "react_message": react_result.get("message") or react_result.get("error")
                }

            print(f"React server: {react_info['react_server']}", file=sys.stderr, flush=True)
        else:
            react_is_ready = True
            react_info = {
                "react_server": "already_running",
                "react_url": react_status["url"],
                "react_message": "React server already running"
            }
            print(f"React server already running on {react_status['url']}", file=sys.stderr, flush=True)

        # 2. Create project directory
        project_path = create_project_directory(project_name)

        # 3. Create requirement.js
        requirements_data = {
            "project_name": project_name,
            "requirements": [],
            "user_flows": [],
            "features": [],
            "pages": [],
            "created_at": datetime.now().isoformat()
        }
        create_empty_json_file(f"{project_path}/requirement.js", requirements_data)

        # 4. Create ddd.js
        ddd_data = {
            "bounded_contexts": [],
            "entities": [],
            "value_objects": [],
            "aggregates": [],
            "services": [],
            "repositories": [],
            "domain_events": []
        }
        create_empty_json_file(f"{project_path}/ddd.js", ddd_data)

        # 5. Create frontend_data.js
        frontend_data = {
            "pages": [],
            "theme": {
                "colors": {},
                "fonts": {}
            },
            "interactions": []
        }
        create_empty_json_file(f"{project_path}/frontend_data.js", frontend_data)

        # 6. Create technical_architecture.js
        technical_architecture_data = {
            "architecture_patterns": [],
            "technology_stack": {
                "frontend": [],
                "backend": [],
                "database": [],
                "infrastructure": []
            },
            "system_components": [],
            "api_design": {
                "rest_endpoints": [],
                "graphql_schema": [],
                "websocket_events": []
            },
            "data_models": [],
            "security": {
                "authentication": [],
                "authorization": [],
                "encryption": []
            },
            "deployment": {
                "environments": [],
                "ci_cd": [],
                "monitoring": []
            },
            "scalability": {
                "caching_strategy": [],
                "load_balancing": [],
                "database_optimization": []
            }
        }
        create_empty_json_file(f"{project_path}/technical_architecture.js", technical_architecture_data)

        # 6.5. Create summary.md (conversational digest file)
        summary_content = f"""# {project_name}

## Project Summary

**Created:** {datetime.now().strftime('%B %d, %Y at %I:%M %p')}

This is a project summary file that serves as a conversational digest of the project.

## Overview

Project '{project_name}' has been initialized with the following structure:
- Requirements gathering system
- User flow definitions
- Feature specifications
- Page layouts
- Domain-driven design components
- Frontend data management
- Technical architecture planning

## Status

Status: Initialized
Last Updated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}

---

*This file can be updated using the update_project_files tool with file_type="summary.md"*
"""
        write_text_file(f"{project_path}/summary.md", summary_content)

        # 7. Update project registry
        update_project_registry(project_name, {
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "status": "initialized"
        })

        # 8. Store project data in global variable with version tracking
        state_version += 1
        timestamp = datetime.now().isoformat()

        current_project_data["project_name"] = project_name
        current_project_data["requirements"] = requirements_data
        current_project_data["ddd"] = ddd_data
        current_project_data["frontend_data"] = frontend_data
        current_project_data["technical_architecture"] = technical_architecture_data
        current_project_data["summary"] = summary_content
        current_project_data["version"] = state_version
        current_project_data["last_updated"] = timestamp
        current_project_data["last_command"] = "host_tool"

        # 8.5. Update broadcast_manager's local copy
        set_current_project_data(current_project_data)

        # 8.6. Write to shared file so other MCP instances can detect the change
        write_current_project(project_name)

        print(f"✅ Project data stored in global state", file=sys.stderr, flush=True)
        print(f"   New Version: {state_version}", file=sys.stderr, flush=True)
        print(f"   Timestamp: {timestamp}", file=sys.stderr, flush=True)
        print(f"   Wrote to shared file: current_project.json", file=sys.stderr, flush=True)

        # 9. Broadcast to ALL frontends with enhanced metadata
        is_project_switch = (previous_project and previous_project != project_name)

        broadcast_message = {
            "type": "project_switched" if is_project_switch else "project_initialized",
            "action": "create",
            "force_update": True,  # Force all frontends to update
            "version": state_version,
            "timestamp": timestamp,
            "command": "host_tool",
            "previous_project": previous_project if is_project_switch else None,
            "data": {
                "project_name": project_name,
                "requirements": requirements_data,
                "ddd": ddd_data,
                "frontend_data": frontend_data,
                "technical_architecture": technical_architecture_data
            }
        }

        print(f"\n📡 BROADCASTING TO ALL FRONTENDS:", file=sys.stderr, flush=True)
        print(f"   Event Type: {broadcast_message['type']}", file=sys.stderr, flush=True)
        print(f"   Action: create", file=sys.stderr, flush=True)
        print(f"   Force Update: {broadcast_message['force_update']}", file=sys.stderr, flush=True)
        print(f"   Version: {broadcast_message['version']}", file=sys.stderr, flush=True)
        if is_project_switch:
            print(f"   Switch: {previous_project} → {project_name}", file=sys.stderr, flush=True)

        await broadcast_to_frontends(broadcast_message)
        print(f"✅ Broadcast complete\n", file=sys.stderr, flush=True)

        # 10. Return success
        result = {
            "status": "success",
            "message": f"Project '{project_name}' initialized successfully",
            "project_name": project_name,
            "files_created": ["requirement.js", "ddd.js", "frontend_data.js", "technical_architecture.js", "summary.md"],
            "project_path": project_path,
            **react_info
        }

        return [TextContent(type="text", text=str(result))]

    except Exception as e:
        result = {
            "status": "error",
            "error": str(e)
        }
        return [TextContent(type="text", text=str(result))]


async def handle_update_project_files(arguments: dict) -> list[TextContent]:
    """Handle update_project_files: Update project JSON files"""
    global current_project_data, state_version

    print(f"\n{'='*60}", file=sys.stderr, flush=True)
    print(f"📝 UPDATE PROJECT FILES COMMAND", file=sys.stderr, flush=True)
    print(f"   Current Project: {current_project_data.get('project_name', 'None')}", file=sys.stderr, flush=True)
    print(f"   Current Version: {state_version}", file=sys.stderr, flush=True)
    print(f"{'='*60}", file=sys.stderr, flush=True)

    # Extract parameters
    project_name = arguments.get("project_name")
    file_type = arguments.get("file_type")
    update_data = arguments.get("update_data")
    merge_strategy = arguments.get("merge_strategy", "merge")  # Default to merge

    # FIX: Handle string-to-dict conversion for JSON files
    # MCP SDK may pass JSON objects as string representations
    if file_type and not file_type.endswith('.md'):
        # This is a JSON file (.js), ensure update_data is a dict
        if isinstance(update_data, str):
            try:
                import json
                update_data = json.loads(update_data)
                print(f"✅ Converted update_data from JSON string to dict", file=sys.stderr, flush=True)
            except json.JSONDecodeError as e:
                result = {
                    "status": "error",
                    "error": f"Invalid JSON in update_data: {str(e)}"
                }
                print(f"❌ Failed to parse update_data as JSON: {e}", file=sys.stderr, flush=True)
                return [TextContent(type="text", text=str(result))]

    # Validate required parameters
    if not project_name:
        result = {
            "status": "error",
            "error": "project_name is required"
        }
        return [TextContent(type="text", text=str(result))]

    if not file_type:
        result = {
            "status": "error",
            "error": "file_type is required"
        }
        return [TextContent(type="text", text=str(result))]

    if not update_data:
        result = {
            "status": "error",
            "error": "update_data is required"
        }
        return [TextContent(type="text", text=str(result))]

    # Validate file type
    if file_type not in VALID_FILE_TYPES:
        result = {
            "status": "error",
            "error": f"Invalid file_type '{file_type}'. Must be one of: {VALID_FILE_TYPES}"
        }
        return [TextContent(type="text", text=str(result))]

    # Validate project exists
    if not project_exists(project_name):
        result = {
            "status": "error",
            "error": f"Project '{project_name}' does not exist"
        }
        return [TextContent(type="text", text=str(result))]

    try:
        print(f"Updating {file_type} in project '{project_name}' with strategy '{merge_strategy}'", file=sys.stderr, flush=True)

        # Update the file on disk using the utility function
        updated_data = update_json_file(project_name, file_type, update_data, merge_strategy)

        # Update current_project_data global variable with version tracking
        state_version += 1
        timestamp = datetime.now().isoformat()

        # Convert file_type to data key (handle special case: requirement.js → requirements)
        file_key = file_type.replace(".js", "").replace(".md", "")
        if file_key == "requirement":
            file_key = "requirements"  # File is requirement.js but key is requirements (plural)

        current_project_data[file_key] = updated_data
        current_project_data["project_name"] = project_name
        current_project_data["version"] = state_version
        current_project_data["last_updated"] = timestamp
        current_project_data["last_command"] = "update_project_files"

        # Update broadcast_manager's local copy
        set_current_project_data(current_project_data)

        # Write to shared file so other MCP instances can detect the change
        write_current_project(project_name)

        # Update project registry with last_updated timestamp
        update_project_registry(project_name, {
            "last_updated": timestamp,
            "status": "updated"
        })

        print(f"✅ Successfully updated {file_type}", file=sys.stderr, flush=True)
        print(f"   Wrote to shared file: current_project.json", file=sys.stderr, flush=True)
        print(f"   New Version: {state_version}", file=sys.stderr, flush=True)
        print(f"   Timestamp: {timestamp}", file=sys.stderr, flush=True)

        # Broadcast the update to ALL connected frontends with enhanced metadata
        broadcast_message = {
            "type": "files_updated",
            "action": "update",
            "force_update": True,  # Force all frontends to update
            "version": state_version,
            "timestamp": timestamp,
            "command": "update_project_files",
            "updated_file": file_type,
            "merge_strategy": merge_strategy,
            "data": {
                "project_name": project_name,
                "requirements": current_project_data["requirements"],
                "ddd": current_project_data["ddd"],
                "frontend_data": current_project_data["frontend_data"],
                "technical_architecture": current_project_data["technical_architecture"]
            }
        }

        print(f"\n📡 BROADCASTING TO ALL FRONTENDS:", file=sys.stderr, flush=True)
        print(f"   Event Type: {broadcast_message['type']}", file=sys.stderr, flush=True)
        print(f"   Action: update", file=sys.stderr, flush=True)
        print(f"   Updated File: {file_type}", file=sys.stderr, flush=True)
        print(f"   Force Update: {broadcast_message['force_update']}", file=sys.stderr, flush=True)
        print(f"   Version: {broadcast_message['version']}", file=sys.stderr, flush=True)

        await broadcast_to_frontends(broadcast_message)
        print(f"✅ Broadcast complete\n", file=sys.stderr, flush=True)

        # Return success response
        result = {
            "status": "success",
            "message": f"Successfully updated {file_type} in project '{project_name}'",
            "project_name": project_name,
            "file_type": file_type,
            "merge_strategy": merge_strategy,
            "updated_data": updated_data
        }

        return [TextContent(type="text", text=str(result))]

    except ValueError as e:
        # Validation errors
        result = {
            "status": "error",
            "error": str(e)
        }
        return [TextContent(type="text", text=str(result))]

    except FileNotFoundError as e:
        # File not found errors
        result = {
            "status": "error",
            "error": str(e)
        }
        return [TextContent(type="text", text=str(result))]

    except Exception as e:
        # General errors
        result = {
            "status": "error",
            "error": f"Failed to update file: {str(e)}"
        }
        return [TextContent(type="text", text=str(result))]


async def handle_get_project_data(arguments: dict) -> list[TextContent]:
    """Handle get_project_data: Return currently broadcasting project data"""
    global current_project_data

    print(f"📡 Getting current project data", file=sys.stderr, flush=True)

    try:
        # Check if any project is currently loaded
        if not current_project_data["project_name"]:
            result = {
                "status": "no_project",
                "message": "No project is currently being broadcast",
                "project_name": "",
                "requirements": {},
                "ddd": {},
                "frontend_data": {},
                "technical_architecture": {},
                "summary": ""
            }
            print(f"⚠️ No project currently loaded", file=sys.stderr, flush=True)
            return [TextContent(type="text", text=str(result))]

        # Return current project data
        result = {
            "status": "success",
            "project_name": current_project_data["project_name"],
            "requirements": current_project_data["requirements"],
            "ddd": current_project_data["ddd"],
            "frontend_data": current_project_data["frontend_data"],
            "technical_architecture": current_project_data["technical_architecture"],
            "summary": current_project_data["summary"]
        }

        print(f"✅ Returning project data for: {current_project_data['project_name']}", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]

    except Exception as e:
        result = {
            "status": "error",
            "error": str(e)
        }
        print(f"❌ Error getting project data: {e}", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]


async def handle_get_project_list(arguments: dict) -> list[TextContent]:
    """Handle get_project_list: Return all projects from registry"""
    print(f"📋 Getting project list", file=sys.stderr, flush=True)

    try:
        # Get all projects from registry
        projects = get_all_projects()

        result = {
            "status": "success",
            "projects": projects,
            "count": len(projects)
        }

        print(f"✅ Found {len(projects)} projects", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]

    except Exception as e:
        result = {
            "status": "error",
            "error": str(e)
        }
        print(f"❌ Error getting project list: {e}", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]


async def handle_select_project(arguments: dict) -> list[TextContent]:
    """Handle select_project: Load existing project and start broadcasting"""
    global current_project_data, state_version

    project_name = arguments.get("project_name")
    previous_project = current_project_data.get("project_name", "")

    print(f"\n{'='*60}", file=sys.stderr, flush=True)
    print(f"🔄 SELECT PROJECT COMMAND", file=sys.stderr, flush=True)
    print(f"   Requested: {project_name}", file=sys.stderr, flush=True)
    print(f"   Previous: {previous_project}", file=sys.stderr, flush=True)
    print(f"   Current Version: {state_version}", file=sys.stderr, flush=True)
    print(f"{'='*60}", file=sys.stderr, flush=True)

    # Validate project name
    if not project_name:
        result = {
            "status": "error",
            "error": "project_name is required"
        }
        return [TextContent(type="text", text=str(result))]

    # Check if project exists
    if not project_exists(project_name):
        result = {
            "status": "error",
            "error": f"Project '{project_name}' does not exist"
        }
        return [TextContent(type="text", text=str(result))]

    try:
        # 1. Check and start React server if needed
        print(f"Checking React server status...", file=sys.stderr, flush=True)
        react_status = await check_react_status()
        react_info = {}
        react_is_ready = False

        if react_status["status"] == "not_running":
            print(f"React server not running, starting it...", file=sys.stderr, flush=True)
            react_result = await start_react_server()

            # If React is starting, wait for it to be ready
            if react_result.get("status") == "starting":
                print(f"⏳ Waiting for React server to be ready...", file=sys.stderr, flush=True)

                # Wait up to 30 seconds for React to be ready
                from utils.react_manager import is_port_in_use, REACT_PORT
                import asyncio

                for i in range(30):
                    await asyncio.sleep(1)
                    if is_port_in_use(REACT_PORT):
                        print(f"✅ React server is now ready on port {REACT_PORT}!", file=sys.stderr, flush=True)
                        react_is_ready = True
                        react_info = {
                            "react_server": "ready",
                            "react_url": f"http://localhost:{REACT_PORT}",
                            "react_message": f"React server started and ready (took {i+1}s)"
                        }
                        break
                    if (i + 1) % 5 == 0:
                        print(f"⏳ Still waiting... ({i + 1}s elapsed)", file=sys.stderr, flush=True)

                if not react_is_ready:
                    # Timeout - React didn't start in time
                    react_info = {
                        "react_server": "starting",
                        "react_url": react_result.get("url"),
                        "react_message": "React server is still starting (may take up to 30s more)",
                        "warning": "Frontend connection may fail until React is fully ready"
                    }
            else:
                # React already running or error
                react_is_ready = react_result.get("status") in ["running", "already_running"]
                react_info = {
                    "react_server": react_result["status"],
                    "react_url": react_result.get("url"),
                    "react_message": react_result.get("message") or react_result.get("error")
                }

            print(f"React server: {react_info['react_server']}", file=sys.stderr, flush=True)
        else:
            react_is_ready = True
            react_info = {
                "react_server": "already_running",
                "react_url": react_status["url"],
                "react_message": "React server already running"
            }
            print(f"React server already running on {react_status['url']}", file=sys.stderr, flush=True)

        # 2. Load all project files
        print(f"Loading project files for '{project_name}'...", file=sys.stderr, flush=True)
        project_files = read_project_files(project_name)

        if not project_files:
            result = {
                "status": "error",
                "error": f"Failed to load project files for '{project_name}'. Project may be incomplete or corrupted. Missing required files (requirement.js, ddd.js, frontend_data.js, technical_architecture.js). Consider deleting and recreating the project."
            }
            return [TextContent(type="text", text=str(result))]

        # 3. Update global current_project_data with version tracking
        state_version += 1
        timestamp = datetime.now().isoformat()

        current_project_data["project_name"] = project_name
        current_project_data["requirements"] =project_files.get("requirements", {})
        current_project_data["ddd"] = project_files.get("ddd", {})
        current_project_data["frontend_data"] = project_files.get("frontend_data", {})
        current_project_data["technical_architecture"] = project_files.get("technical_architecture", {})
        current_project_data["summary"] = project_files.get("summary", "")
        current_project_data["version"] = state_version
        current_project_data["last_updated"] = timestamp
        current_project_data["last_command"] = "select_project"

        # 3.5. Update broadcast_manager's local copy
        set_current_project_data(current_project_data)

        # 3.6. Write to shared file so other MCP instances can detect the change
        write_current_project(project_name)

        print(f"✅ Loaded project data into global state", file=sys.stderr, flush=True)
        print(f"   New Version: {state_version}", file=sys.stderr, flush=True)
        print(f"   Timestamp: {timestamp}", file=sys.stderr, flush=True)
        print(f"   Wrote to shared file: current_project.json", file=sys.stderr, flush=True)

        # 4. Broadcast to ALL frontends with enhanced metadata
        is_project_switch = (previous_project and previous_project != project_name)

        broadcast_message = {
            "type": "project_switched" if is_project_switch else "project_initialized",
            "action": "switch" if is_project_switch else "initialize",
            "force_update": True,  # Force all frontends to update
            "version": state_version,
            "timestamp": timestamp,
            "command": "select_project",
            "previous_project": previous_project if is_project_switch else None,
            "data": {
                "project_name": project_name,
                "requirements": current_project_data["requirements"],
                "ddd": current_project_data["ddd"],
                "frontend_data": current_project_data["frontend_data"],
                "technical_architecture": current_project_data["technical_architecture"]
            }
        }

        print(f"\n📡 BROADCASTING TO ALL FRONTENDS:", file=sys.stderr, flush=True)
        print(f"   Event Type: {broadcast_message['type']}", file=sys.stderr, flush=True)
        print(f"   Force Update: {broadcast_message['force_update']}", file=sys.stderr, flush=True)
        print(f"   Version: {broadcast_message['version']}", file=sys.stderr, flush=True)
        if is_project_switch:
            print(f"   Switch: {previous_project} → {project_name}", file=sys.stderr, flush=True)

        await broadcast_to_frontends(broadcast_message)
        print(f"✅ Broadcast complete\n", file=sys.stderr, flush=True)

        # 5. Return success with full project data
        result = {
            "status": "success",
            "message": f"Project '{project_name}' selected and loaded successfully",
            "project_name": project_name,
            "files_loaded": ["requirement.js", "ddd.js", "frontend_data.js", "technical_architecture.js", "summary.md"],
            "requirements": current_project_data["requirements"],
            "ddd": current_project_data["ddd"],
            "frontend_data": current_project_data["frontend_data"],
            "technical_architecture": current_project_data["technical_architecture"],
            "summary": current_project_data["summary"],
            **react_info
        }

        print(f"✅ Project '{project_name}' selected successfully with full data", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]

    except Exception as e:
        result = {
            "status": "error",
            "error": str(e)
        }
        print(f"❌ Error selecting project: {e}", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]


async def handle_delete_project(arguments: dict) -> list[TextContent]:
    """Handle delete_project: Delete project directory and registry entry"""
    global current_project_data, state_version

    project_name = arguments.get("project_name")
    print(f"🗑️ Deleting project: {project_name}", file=sys.stderr, flush=True)

    # Validate project name
    if not project_name:
        result = {
            "status": "error",
            "error": "project_name is required"
        }
        return [TextContent(type="text", text=str(result))]

    # Check if project exists
    if not project_exists(project_name):
        result = {
            "status": "error",
            "error": f"Project '{project_name}' does not exist"
        }
        return [TextContent(type="text", text=str(result))]

    # Track deletion status
    folder_deleted = False
    registry_updated = False
    errors = []

    # Check if this is the currently loaded project (check BOTH local state AND shared file)
    is_active_project_local = (current_project_data["project_name"] == project_name)

    # IMPORTANT: Check shared file to see if another terminal has this project active
    shared_project_info = read_current_project()
    is_active_project_shared = (shared_project_info.get("project_name") == project_name)

    # Project is active if it's in either local state OR shared file
    is_active_project = is_active_project_local or is_active_project_shared

    print(f"🔍 Delete check: local={is_active_project_local}, shared={is_active_project_shared}, will_clear={is_active_project}", file=sys.stderr, flush=True)

    # Step 1: Try to delete project directory
    try:
        delete_project_directory(project_name)
        folder_deleted = True
        print(f"✅ Deleted project directory: {project_name}", file=sys.stderr, flush=True)
    except ValueError as e:
        # Project doesn't exist - this is a critical error
        result = {
            "status": "error",
            "error": str(e)
        }
        return [TextContent(type="text", text=str(result))]
    except Exception as e:
        # Folder deletion failed, but continue to try registry update
        errors.append(f"Folder deletion failed: {str(e)}")
        print(f"⚠️ Failed to delete folder: {e}", file=sys.stderr, flush=True)
        print(f"⚠️ Attempting to update registry anyway...", file=sys.stderr, flush=True)

    # Step 2: Try to remove from registry (even if folder deletion failed)
    try:
        remove_from_registry(project_name)
        registry_updated = True
        print(f"✅ Removed from registry: {project_name}", file=sys.stderr, flush=True)
    except Exception as e:
        errors.append(f"Registry update failed: {str(e)}")
        print(f"❌ Failed to update registry: {e}", file=sys.stderr, flush=True)

    # Step 3: If this was the active project, clear it and broadcast
    if is_active_project and (folder_deleted or registry_updated):
        print(f"⚠️ Deleted project was active, clearing frontend...", file=sys.stderr, flush=True)

        # Clear current_project_data with version increment
        state_version += 1
        timestamp = datetime.now().isoformat()

        current_project_data["project_name"] = ""
        current_project_data["requirements"] ={}
        current_project_data["ddd"] = {}
        current_project_data["frontend_data"] = {}
        current_project_data["technical_architecture"] = {}
        current_project_data["summary"] = ""
        current_project_data["version"] = state_version
        current_project_data["last_updated"] = timestamp
        current_project_data["last_command"] = "delete_project"

        # Update broadcast_manager's local copy
        set_current_project_data(current_project_data)

        # Clear shared file since no project is active
        write_current_project("")

        # Broadcast project_deleted event to frontend with version tracking
        broadcast_message = {
            "type": "project_deleted",
            "action": "delete",
            "force_update": True,
            "version": state_version,
            "timestamp": timestamp,
            "command": "delete_project",
            "data": {
                "project_name": project_name,
                "message": f"Project '{project_name}' has been deleted"
            }
        }

        print(f"\n📡 BROADCASTING PROJECT DELETION:", file=sys.stderr, flush=True)
        print(f"   Deleted Project: {project_name}", file=sys.stderr, flush=True)
        print(f"   Version: {state_version}", file=sys.stderr, flush=True)

        await broadcast_to_frontends(broadcast_message)
        print(f"✅ Broadcast complete\n", file=sys.stderr, flush=True)

    # Step 4: Return appropriate response
    if folder_deleted and registry_updated:
        # Complete success
        result = {
            "status": "success",
            "message": f"Project '{project_name}' deleted successfully (folder + registry)",
            "project_name": project_name,
            "was_active": is_active_project,
            "frontend_cleared": is_active_project,
            "folder_deleted": True,
            "registry_updated": True
        }
        print(f"✅ Project '{project_name}' deleted successfully", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]

    elif registry_updated and not folder_deleted:
        # Partial success - registry updated but folder remains
        result = {
            "status": "partial_success",
            "message": f"Project '{project_name}' removed from registry, but folder deletion failed",
            "project_name": project_name,
            "was_active": is_active_project,
            "frontend_cleared": is_active_project,
            "folder_deleted": False,
            "registry_updated": True,
            "errors": errors,
            "note": "You may need to manually delete the folder"
        }
        print(f"⚠️ Partial deletion: Registry updated, folder remains", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]

    else:
        # Complete failure
        result = {
            "status": "error",
            "error": f"Failed to delete project: {'; '.join(errors)}",
            "project_name": project_name,
            "folder_deleted": folder_deleted,
            "registry_updated": registry_updated,
            "errors": errors
        }
        print(f"❌ Failed to delete project: {errors}", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]


async def handle_close_connection(arguments: dict) -> list[TextContent]:
    """Handle close_connection: Shutdown React and WebSocket servers"""
    print(f"🛑 Closing all connections...", file=sys.stderr, flush=True)

    results = {
        "react_server": {},
        "websocket_server": {}
    }

    try:
        # Stop React server
        print(f"Stopping React server...", file=sys.stderr, flush=True)
        react_result = await stop_react_server()
        results["react_server"] = react_result
        print(f"React server: {react_result['status']}", file=sys.stderr, flush=True)

        # Stop WebSocket server
        print(f"Stopping WebSocket server...", file=sys.stderr, flush=True)
        ws_result = await stop_websocket_server()
        results["websocket_server"] = ws_result
        print(f"WebSocket server: {ws_result['status']}", file=sys.stderr, flush=True)

        # Determine overall status
        if (react_result.get("status") in ["stopped", "not_running"] and
            ws_result.get("status") in ["stopped", "not_running"]):
            overall_status = "success"
            message = "All servers stopped successfully"
        else:
            overall_status = "partial"
            message = "Some servers may not have stopped completely"

        result = {
            "status": overall_status,
            "message": message,
            "details": results
        }

        print(f"✅ Close connection complete", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]

    except Exception as e:
        result = {
            "status": "error",
            "error": f"Failed to close connections: {str(e)}",
            "details": results
        }
        print(f"❌ Error closing connections: {e}", file=sys.stderr, flush=True)
        return [TextContent(type="text", text=str(result))]


async def periodic_broadcast():
    """Periodically broadcast project data every 10 seconds ONLY if data changed"""
    from utils.file_manager import read_project_files
    import json

    last_broadcast_data = None

    while True:
        await asyncio.sleep(10)

        if current_project_data["project_name"]:
            try:
                project_name = current_project_data["project_name"]
                updated_data = read_project_files(project_name)

                if updated_data:
                    # Create a snapshot of current data for comparison
                    current_snapshot = {
                        "project_name": project_name,
                        "requirements": updated_data.get("requirements", {}),
                        "ddd": updated_data.get("ddd", {}),
                        "frontend_data": updated_data.get("frontend_data", {}),
                        "technical_architecture": updated_data.get("technical_architecture", {})
                    }

                    # Only broadcast if data has changed
                    if json.dumps(current_snapshot, sort_keys=True) != json.dumps(last_broadcast_data, sort_keys=True):
                        current_project_data["requirements"] = updated_data.get("requirements", {})
                        current_project_data["ddd"] = updated_data.get("ddd", {})
                        current_project_data["frontend_data"] = updated_data.get("frontend_data", {})
                        current_project_data["technical_architecture"] = updated_data.get("technical_architecture", {})

                        # Update broadcast_manager's local copy
                        set_current_project_data(current_project_data)

                        await broadcast_to_frontends({
                            "type": "project_initialized",
                            "data": {
                                "project_name": project_name,
                                "requirements": current_project_data["requirements"],
                                "ddd": current_project_data["ddd"],
                                "frontend_data": current_project_data["frontend_data"],
                                "technical_architecture": current_project_data["technical_architecture"],
                                "timestamp": datetime.now().isoformat()
                            }
                        })

                        last_broadcast_data = current_snapshot
                        print(f"✅ Broadcasted updated data for: {project_name}", file=sys.stderr, flush=True)
                    else:
                        print(f"ℹ️ No changes detected for: {project_name}, skipping broadcast", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"Error in periodic broadcast: {e}", file=sys.stderr, flush=True)


async def run_mcp_server():
    """Run the MCP server with stdio transport"""
    async with stdio_server() as (read_stream, write_stream):
        print("🔌 MCP stdio transport connected", file=sys.stderr, flush=True)
        print("✅ Connection established - Server is now CONNECTED", file=sys.stderr, flush=True)

        init_options = server.create_initialization_options()
        await server.run(
            read_stream,
            write_stream,
            init_options
        )


async def main():
    """Main entry point"""
    try:
        print("=" * 60, file=sys.stderr, flush=True)
        print("🚀 MCP Project Builder Server Starting...", file=sys.stderr, flush=True)
        print("=" * 60, file=sys.stderr, flush=True)

        # Start background services as separate tasks BEFORE printing ready message
        # These run in the background and won't block the MCP server
        background_tasks = []

        try:
            # Start WebSocket server in background
            ws_task = asyncio.create_task(start_websocket_server())
            background_tasks.append(ws_task)

            # Start periodic broadcast in background
            broadcast_task = asyncio.create_task(periodic_broadcast())
            background_tasks.append(broadcast_task)

            # Start file watcher for multi-terminal sync
            file_watcher_task = asyncio.create_task(watch_current_project_file())
            background_tasks.append(file_watcher_task)

            # Give background tasks a moment to start
            await asyncio.sleep(0.1)

            print("📡 Background services initiated", file=sys.stderr, flush=True)
        except Exception as e:
            print(f"⚠️ Background services warning: {e}", file=sys.stderr, flush=True)

        print("\n" + "=" * 60, file=sys.stderr, flush=True)
        print("✅ MCP SERVER IS READY AND RUNNING", file=sys.stderr, flush=True)
        print("=" * 60, file=sys.stderr, flush=True)
        print("📋 Available Tools:", file=sys.stderr, flush=True)
        print("   - host_tool: Initialize a new project", file=sys.stderr, flush=True)
        print("   - update_project_files: Update project JSON files", file=sys.stderr, flush=True)
        print("   - get_project_data: Get currently broadcasting project data", file=sys.stderr, flush=True)
        print("   - get_project_list: Get list of all projects from registry", file=sys.stderr, flush=True)
        print("   - select_project: Select and load an existing project", file=sys.stderr, flush=True)
        print("   - delete_project: Delete a project and all its files", file=sys.stderr, flush=True)
        print("   - close_connection: Shutdown all servers (React + WebSocket)", file=sys.stderr, flush=True)
        print("\n💡 Server is listening for MCP requests via stdio...", file=sys.stderr, flush=True)
        print("=" * 60 + "\n", file=sys.stderr, flush=True)

        # Run the MCP server - this is the main blocking operation
        await run_mcp_server()

    except KeyboardInterrupt:
        print("\n🛑 Server shutting down gracefully...", file=sys.stderr, flush=True)
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Server error: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
