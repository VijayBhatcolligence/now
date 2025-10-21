import os
import json
import sys
import io
from datetime import datetime
from utils.file_manager import (
    create_project_directory,
    create_empty_json_file,
    update_project_registry,
    project_exists
)
from utils.broadcast_manager import broadcast_to_frontends
from utils.react_manager import start_react_server, check_react_status

# Configure UTF-8 encoding for Windows
if sys.platform == 'win32' and hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)

async def handle_host_tool(params):
    """
    Handle host_tool: Initialize new project

    Input: {"project_name": "my_project"}
    """
    # Import global variable from server
    import server

    project_name = params.get("project_name")

    if not project_name:
        return {
            "status": "error",
            "error": "project_name is required"
        }

    # Validate project name (alphanumeric and underscores only)
    if not project_name.replace("_", "").isalnum():
        return {
            "status": "error",
            "error": "project_name must be alphanumeric with underscores only"
        }

    # Check if project already exists
    if project_exists(project_name):
        return {
            "status": "error",
            "error": f"Project '{project_name}' already exists"
        }

    try:
        # 1. Check and start React server if needed
        react_status = check_react_status()
        react_info = {}

        if react_status["status"] == "not_running":
            print("React server not running, starting it...")
            react_result = start_react_server()
            react_info = {
                "react_server": react_result["status"],
                "react_url": react_result.get("url"),
                "react_message": react_result.get("message") or react_result.get("error")
            }
            print(f"React server: {react_result['status']}")
        else:
            react_info = {
                "react_server": "already_running",
                "react_url": react_status["url"],
                "react_message": "React server already running"
            }
            print(f"React server already running on {react_status['url']}")

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

        # 3. Create ddd.js
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

        # 4. Create frontend_data.js
        frontend_data = {
            "pages": [],
            "theme": {
                "colors": {},
                "fonts": {}
            },
            "interactions": []
        }
        create_empty_json_file(f"{project_path}/frontend_data.js", frontend_data)

        # 5. Update project registry
        update_project_registry(project_name, {
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "status": "initialized"
        })

        # 6. Store project data in global variable
        server.current_project_data["project_name"] = project_name
        server.current_project_data["requirements"] = requirements_data
        server.current_project_data["ddd"] = ddd_data
        server.current_project_data["frontend_data"] = frontend_data

        # 7. Broadcast to frontend (React expects 'type' not 'event')
        await broadcast_to_frontends({
            "type": "project_initialized",
            "data": {
                "project_name": project_name,
                "requirements": requirements_data,
                "ddd": ddd_data,
                "frontend_data": frontend_data,
                "timestamp": datetime.now().isoformat()
            }
        })

        # 8. Return success to Claude Code
        return {
            "status": "success",
            "message": f"Project '{project_name}' initialized successfully",
            "project_name": project_name,
            "files_created": ["requirement.js", "ddd.js", "frontend_data.js", "technical_architecture.js", "summary.md"],
            "project_path": project_path,
            **react_info  # Include React server status
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
