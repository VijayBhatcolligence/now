import asyncio
import websockets
import json
import sys
import io
import os
import copy
from datetime import datetime

# Configure UTF-8 encoding for Windows
if sys.platform == 'win32' and hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)

# Import file manager functions for watching current project
from utils.file_manager import read_current_project, read_project_files, CURRENT_PROJECT_FILE, update_json_file

# Store connected WebSocket clients
connected_frontends = set()

# Store server instance to keep it alive
websocket_server = None

# Store current project data locally (updated by server)
_current_project_data = {
    "project_name": "",
    "requirements": {},
    "ddd": {},
    "frontend_data": {},
    "technical_architecture": {},
    "summary": ""
}

# Track last known version from shared file
_last_known_version = 0

def set_current_project_data(project_data: dict):
    """Update the current project data (called by server)"""
    global _current_project_data
    _current_project_data.update(project_data)
    print(f"✅ Updated broadcast_manager project data: {project_data.get('project_name', 'N/A')}", file=sys.stderr, flush=True)

def get_current_project_data() -> dict:
    """Get the current project data"""
    return _current_project_data

async def handle_frontend_connection(websocket, path=None):
    """Handle WebSocket connections from React frontend"""
    from utils.file_manager import read_project_files, REGISTRY_FILE
    from datetime import datetime

    connected_frontends.add(websocket)
    print(f"✅ Frontend connected. Total clients: {len(connected_frontends)}", file=sys.stderr, flush=True)

    # Start keep-alive ping task
    async def keep_alive():
        """Send periodic pings to keep connection alive"""
        try:
            while True:
                await asyncio.sleep(30)  # Ping every 30 seconds
                if websocket in connected_frontends:
                    try:
                        await websocket.ping()
                        print(f"💓 Sent keep-alive ping", file=sys.stderr, flush=True)
                    except Exception as e:
                        print(f"❌ Ping failed: {e}", file=sys.stderr, flush=True)
                        break
                else:
                    break
        except asyncio.CancelledError:
            pass

    # Start keep-alive task in background
    keep_alive_task = asyncio.create_task(keep_alive())

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get("type")
                print(f"📥 Received message type: {msg_type}", file=sys.stderr, flush=True)

                if msg_type == "request_canvas_mode":
                    # Get project name from request
                    project_name = data.get("data", {}).get("project_name", "demo_project")
                    print(f"🎨 Canvas mode requested for project: {project_name}", file=sys.stderr, flush=True)

                    # Read frontend_data.js which now contains canvas data with pages
                    project_files = read_project_files(project_name)
                    if project_files and "frontend_data" in project_files:
                        frontend_data = project_files["frontend_data"]

                        print(f"🔍 frontend_data type: {type(frontend_data)}", file=sys.stderr, flush=True)
                        print(f"🔍 frontend_data keys: {frontend_data.keys() if isinstance(frontend_data, dict) else 'NOT A DICT'}", file=sys.stderr, flush=True)

                        # Check if we have multi-page structure
                        if isinstance(frontend_data, dict) and "pages" in frontend_data:
                            pages = frontend_data["pages"]

                            # Send canvas_mode_ready message with pages
                            response = {
                                "type": "canvas_mode_ready",
                                "data": {
                                    "project_name": project_name,
                                    "pages": pages,
                                    "currentPageId": pages[0]["id"] if pages else None,
                                    "timestamp": datetime.now().isoformat()
                                }
                            }
                            try:
                                await websocket.send(json.dumps(response))
                                print(f"📤 Sent canvas_mode_ready with {len(pages)} pages", file=sys.stderr, flush=True)
                            except Exception as send_error:
                                print(f"❌ Failed to send canvas_mode_ready: {send_error}", file=sys.stderr, flush=True)
                        else:
                            # Fallback for old single-canvas format
                            response = {
                                "type": "canvas_mode_ready",
                                "data": {
                                    "project_name": project_name,
                                    "canvas_data": frontend_data,
                                    "timestamp": datetime.now().isoformat()
                                }
                            }
                            try:
                                await websocket.send(json.dumps(response))
                                print(f"📤 Sent canvas_mode_ready with legacy canvas format", file=sys.stderr, flush=True)
                            except Exception as send_error:
                                print(f"❌ Failed to send canvas_mode_ready: {send_error}", file=sys.stderr, flush=True)
                    else:
                        print(f"⚠️ No canvas data found for project: {project_name}", file=sys.stderr, flush=True)

                elif msg_type == "client_ready":
                    print(f"✅ Client ready - sending current project data", file=sys.stderr, flush=True)

                    # Get current project data from local store
                    current_data = get_current_project_data()

                    # Check if a project is currently loaded
                    if current_data.get("project_name"):
                        project_name = current_data["project_name"]
                        print(f"📡 Broadcasting currently selected project: {project_name}", file=sys.stderr, flush=True)

                        response = {
                            "type": "project_initialized",
                            "data": {
                                "project_name": project_name,
                                "requirements": current_data.get("requirements", {}),
                                "ddd": current_data.get("ddd", {}),
                                "frontend_data": current_data.get("frontend_data", {}),
                                "technical_architecture": current_data.get("technical_architecture", {}),
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                        try:
                            await websocket.send(json.dumps(response))
                            print(f"📤 Sent project_initialized for: {project_name}", file=sys.stderr, flush=True)
                        except Exception as send_error:
                            print(f"❌ Failed to send project_initialized: {send_error}", file=sys.stderr, flush=True)
                    else:
                        print(f"⚠️ No project currently selected - checking registry for fallback", file=sys.stderr, flush=True)

                        # Fallback: try to find most recent project from registry
                        if os.path.exists(REGISTRY_FILE):
                            with open(REGISTRY_FILE, 'r', encoding='utf-8') as f:
                                registry = json.load(f)
                                projects = registry.get("projects", {})

                                if projects:
                                    latest_project = max(
                                        projects.items(),
                                        key=lambda x: x[1].get("last_updated", x[1].get("created_at", "")),
                                        default=(None, None)
                                    )

                                    if latest_project[0]:
                                        project_name = latest_project[0]
                                        project_files = read_project_files(project_name)

                                        if project_files:
                                            response = {
                                                "type": "project_initialized",
                                                "data": {
                                                    "project_name": project_name,
                                                    "requirements": project_files.get("requirements", {}),
                                                    "ddd": project_files.get("ddd", {}),
                                                    "frontend_data": project_files.get("frontend_data", {}),
                                                    "technical_architecture": project_files.get("technical_architecture", {}),
                                                    "timestamp": datetime.now().isoformat()
                                                }
                                            }
                                            try:
                                                await websocket.send(json.dumps(response))
                                                print(f"📤 Sent project_initialized for fallback: {project_name}", file=sys.stderr, flush=True)
                                            except Exception as send_error:
                                                print(f"❌ Failed to send project_initialized (fallback): {send_error}", file=sys.stderr, flush=True)
                        else:
                            print(f"⚠️ No projects found in registry", file=sys.stderr, flush=True)

                elif msg_type == "request_files":
                    # Handle file refresh request
                    project_name = data.get("data", {}).get("project_name", "demo_project")
                    project_files = read_project_files(project_name)

                    if project_files:
                        response = {
                            "type": "files_updated",
                            "data": {
                                "project_name": project_name,
                                "requirements": project_files.get("requirements", {}),
                                "ddd": project_files.get("ddd", {}),
                                "frontend_data": project_files.get("frontend_data", {}),
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                        try:
                            await websocket.send(json.dumps(response))
                            print(f"📤 Sent files_updated", file=sys.stderr, flush=True)
                        except Exception as send_error:
                            print(f"❌ Failed to send files_updated: {send_error}", file=sys.stderr, flush=True)

                elif msg_type == "page_delete":
                    # Handle page deletion from canvas
                    print(f"🗑️ Received page_delete request", file=sys.stderr, flush=True)

                    # Extract data
                    page_id = data.get("data", {}).get("pageId")
                    project_name = get_current_project_data().get("project_name")

                    if not project_name or not page_id:
                        print(f"❌ Missing project_name or pageId", file=sys.stderr, flush=True)
                        continue

                    # Load current frontend_data
                    project_files = read_project_files(project_name)
                    if not project_files or "frontend_data" not in project_files:
                        print(f"❌ No frontend_data found", file=sys.stderr, flush=True)
                        continue

                    frontend_data = project_files["frontend_data"]

                    # Remove page from pages array
                    if "pages" in frontend_data:
                        original_pages = frontend_data["pages"]
                        updated_pages = [p for p in original_pages if p.get("id") != page_id]

                        if len(updated_pages) == len(original_pages):
                            print(f"⚠️ Page {page_id} not found", file=sys.stderr, flush=True)
                            continue

                        # Update frontend_data
                        frontend_data["pages"] = updated_pages

                        # Save to file
                        try:
                            update_json_file(project_name, "frontend_data.js", frontend_data, "replace")
                            print(f"✅ Deleted page {page_id} from file", file=sys.stderr, flush=True)

                            # Broadcast update to all frontends
                            response = {
                                "type": "page_deleted",
                                "data": {
                                    "pages": updated_pages,
                                    "currentPageId": updated_pages[0]["id"] if updated_pages else None
                                }
                            }
                            await broadcast_to_frontends(response)
                        except Exception as e:
                            print(f"❌ Failed to delete page: {e}", file=sys.stderr, flush=True)

                elif msg_type == "page_add":
                    # Handle page addition from canvas
                    print(f"➕ Received page_add request", file=sys.stderr, flush=True)

                    # Extract data
                    page_data = data.get("data", {})
                    page_name = page_data.get("name", "New Page")
                    page_type = page_data.get("type", "blank")
                    project_name = get_current_project_data().get("project_name")

                    if not project_name:
                        print(f"❌ No project selected", file=sys.stderr, flush=True)
                        continue

                    # Load current frontend_data
                    project_files = read_project_files(project_name)
                    if not project_files or "frontend_data" not in project_files:
                        print(f"❌ No frontend_data found", file=sys.stderr, flush=True)
                        continue

                    frontend_data = project_files["frontend_data"]

                    # Create new page
                    new_page = {
                        "id": f"PAGE-FE-{int(datetime.now().timestamp() * 1000)}",
                        "name": page_name,
                        "route": f"/{page_name.lower().replace(' ', '-')}",
                        "layout": "MainLayout",
                        "icon": "📄",
                        "components": [],
                        "canvas": {
                            "width": 1400,
                            "height": 900,
                            "backgroundColor": "#ffffff"
                        },
                        "sections": []
                    }

                    # Add page to pages array
                    if "pages" not in frontend_data:
                        frontend_data["pages"] = []

                    frontend_data["pages"].append(new_page)

                    # Save to file
                    try:
                        update_json_file(project_name, "frontend_data.js", frontend_data, "replace")
                        print(f"✅ Added page {new_page['id']} to file", file=sys.stderr, flush=True)

                        # Broadcast update
                        response = {
                            "type": "page_added",
                            "data": {
                                "pages": frontend_data["pages"],
                                "currentPageId": new_page["id"]
                            }
                        }
                        await broadcast_to_frontends(response)
                    except Exception as e:
                        print(f"❌ Failed to add page: {e}", file=sys.stderr, flush=True)

                elif msg_type == "page_rename":
                    # Handle page rename from canvas
                    print(f"✏️ Received page_rename request", file=sys.stderr, flush=True)

                    page_id = data.get("data", {}).get("pageId")
                    new_name = data.get("data", {}).get("newName")
                    project_name = get_current_project_data().get("project_name")

                    if not all([project_name, page_id, new_name]):
                        print(f"❌ Missing required fields", file=sys.stderr, flush=True)
                        continue

                    # Load frontend_data
                    project_files = read_project_files(project_name)
                    if not project_files or "frontend_data" not in project_files:
                        print(f"❌ No frontend_data found", file=sys.stderr, flush=True)
                        continue

                    frontend_data = project_files["frontend_data"]

                    # Update page name
                    if "pages" in frontend_data:
                        page_found = False
                        for page in frontend_data["pages"]:
                            if page.get("id") == page_id:
                                page["name"] = new_name
                                page_found = True
                                break

                        if page_found:
                            # Save to file
                            try:
                                update_json_file(project_name, "frontend_data.js", frontend_data, "replace")
                                print(f"✅ Renamed page {page_id} to '{new_name}'", file=sys.stderr, flush=True)

                                # Broadcast
                                response = {
                                    "type": "page_renamed",
                                    "data": {"pages": frontend_data["pages"]}
                                }
                                await broadcast_to_frontends(response)
                            except Exception as e:
                                print(f"❌ Failed to rename page: {e}", file=sys.stderr, flush=True)

                elif msg_type == "page_duplicate":
                    # Handle page duplication from canvas
                    print(f"📋 Received page_duplicate request", file=sys.stderr, flush=True)

                    page_id = data.get("data", {}).get("pageId")
                    project_name = get_current_project_data().get("project_name")

                    if not project_name or not page_id:
                        print(f"❌ Missing required fields", file=sys.stderr, flush=True)
                        continue

                    # Load frontend_data
                    project_files = read_project_files(project_name)
                    if not project_files or "frontend_data" not in project_files:
                        print(f"❌ No frontend_data found", file=sys.stderr, flush=True)
                        continue

                    frontend_data = project_files["frontend_data"]

                    # Find page to duplicate
                    if "pages" in frontend_data:
                        source_page = next((p for p in frontend_data["pages"] if p.get("id") == page_id), None)

                        if source_page:
                            # Deep copy the page
                            new_page = copy.deepcopy(source_page)

                            # Update ID and name
                            new_page["id"] = f"PAGE-FE-{int(datetime.now().timestamp() * 1000)}"
                            new_page["name"] = f"{source_page['name']} (Copy)"

                            # Add to pages
                            frontend_data["pages"].append(new_page)

                            # Save
                            try:
                                update_json_file(project_name, "frontend_data.js", frontend_data, "replace")
                                print(f"✅ Duplicated page {page_id}", file=sys.stderr, flush=True)

                                # Broadcast
                                response = {
                                    "type": "page_duplicated",
                                    "data": {
                                        "pages": frontend_data["pages"],
                                        "currentPageId": new_page["id"]
                                    }
                                }
                                await broadcast_to_frontends(response)
                            except Exception as e:
                                print(f"❌ Failed to duplicate page: {e}", file=sys.stderr, flush=True)

                elif msg_type == "canvas_edit":
                    # Handle canvas component edits
                    print(f"🎨 Received canvas_edit request", file=sys.stderr, flush=True)

                    edit_data = data.get("data", {})
                    project_name = edit_data.get("project_name")
                    page_id = edit_data.get("pageId")
                    action = edit_data.get("action")  # 'add_component', 'update_component', 'delete_component'

                    if not all([project_name, page_id, action]):
                        print(f"❌ Missing required fields", file=sys.stderr, flush=True)
                        continue

                    # Load frontend_data
                    project_files = read_project_files(project_name)
                    if not project_files or "frontend_data" not in project_files:
                        print(f"❌ No frontend_data found", file=sys.stderr, flush=True)
                        continue

                    frontend_data = project_files["frontend_data"]

                    # Find the page
                    if "pages" in frontend_data:
                        page_index = next((i for i, p in enumerate(frontend_data["pages"]) if p.get("id") == page_id), None)

                        if page_index is not None:
                            page = frontend_data["pages"][page_index]

                            if "components" not in page:
                                page["components"] = []

                            # Handle different actions
                            if action == "add_component":
                                component = edit_data.get("component", {})
                                page["components"].append(component)
                                print(f"➕ Added component {component.get('id')}", file=sys.stderr, flush=True)

                            elif action == "update_component":
                                component_id = edit_data.get("component_id")
                                updates = edit_data.get("updates", {})

                                for comp in page["components"]:
                                    if comp.get("id") == component_id:
                                        comp.update(updates)
                                        print(f"✏️ Updated component {component_id}", file=sys.stderr, flush=True)
                                        break

                            elif action == "delete_component":
                                component_id = edit_data.get("component_id")
                                page["components"] = [c for c in page["components"] if c.get("id") != component_id]
                                print(f"🗑️ Deleted component {component_id}", file=sys.stderr, flush=True)

                            # Save to file
                            try:
                                update_json_file(project_name, "frontend_data.js", frontend_data, "replace")
                                print(f"✅ Canvas edit saved to file", file=sys.stderr, flush=True)

                                # Broadcast
                                response = {
                                    "type": "canvas_updated",
                                    "data": {"pages": frontend_data["pages"]}
                                }
                                await broadcast_to_frontends(response)
                            except Exception as e:
                                print(f"❌ Failed to save canvas edit: {e}", file=sys.stderr, flush=True)

                else:
                    print(f"⚠️ Unknown message type: {msg_type}", file=sys.stderr, flush=True)

            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {e}", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"❌ Error handling message: {e}", file=sys.stderr, flush=True)

    finally:
        # Cancel keep-alive task
        keep_alive_task.cancel()
        try:
            await keep_alive_task
        except asyncio.CancelledError:
            pass

        connected_frontends.remove(websocket)
        print(f"❌ Frontend disconnected. Total clients: {len(connected_frontends)}", file=sys.stderr, flush=True)

async def broadcast_to_frontends(message):
    """Broadcast message to all connected frontends"""
    if connected_frontends:
        await asyncio.gather(
            *[client.send(json.dumps(message)) for client in connected_frontends],
            return_exceptions=True
        )
        print(f"Broadcasted to {len(connected_frontends)} frontend(s)", file=sys.stderr, flush=True)
    else:
        print("No frontends connected to broadcast to", file=sys.stderr, flush=True)

async def start_websocket_server():
    """Start WebSocket server on port 8080"""
    global websocket_server
    try:
        websocket_server = await websockets.serve(handle_frontend_connection, "localhost", 8080)
        print("✅ WebSocket server started on ws://localhost:8080", file=sys.stderr, flush=True)
        # Keep the server alive by storing the reference
        # It will run in the background as long as the event loop is active

        # Keep the server running indefinitely
        await asyncio.Future()  # Run forever
    except asyncio.CancelledError:
        print("🛑 WebSocket server shutting down...", file=sys.stderr, flush=True)
        if websocket_server:
            websocket_server.close()
            await websocket_server.wait_closed()
    except OSError as e:
        if e.errno == 10048:  # Port already in use
            print(f"⚠️ WebSocket server port 8080 already in use - skipping WebSocket server", file=sys.stderr, flush=True)
        else:
            print(f"⚠️ Error starting WebSocket server: {e}", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"⚠️ Error starting WebSocket server: {e}", file=sys.stderr, flush=True)

async def stop_websocket_server():
    """Stop WebSocket server and close all connections"""
    global websocket_server, connected_frontends

    try:
        # Close all client connections
        if connected_frontends:
            print(f"Closing {len(connected_frontends)} WebSocket client connection(s)...", file=sys.stderr, flush=True)
            # Send close message to all clients
            await asyncio.gather(
                *[client.close() for client in list(connected_frontends)],
                return_exceptions=True
            )
            connected_frontends.clear()

        # Close the server
        if websocket_server:
            print("Stopping WebSocket server...", file=sys.stderr, flush=True)
            websocket_server.close()
            await websocket_server.wait_closed()
            websocket_server = None
            print("✅ WebSocket server stopped successfully", file=sys.stderr, flush=True)
            return {
                "status": "stopped",
                "message": "WebSocket server stopped successfully"
            }
        else:
            return {
                "status": "not_running",
                "message": "WebSocket server was not running"
            }

    except Exception as e:
        return {
            "status": "error",
            "error": f"Failed to stop WebSocket server: {str(e)}"
        }

async def watch_current_project_file():
    """
    Watch the current_project.json file for changes and broadcast updates
    This allows multiple MCP instances to sync their project selection
    """
    global _last_known_version
    from datetime import datetime

    print("👁️  Starting file watcher for current_project.json", file=sys.stderr, flush=True)

    while True:
        try:
            await asyncio.sleep(0.5)  # Check every 500ms

            # Read the shared file
            current_project_info = read_current_project()

            if not current_project_info or "project_name" not in current_project_info:
                continue

            # Check if version has changed
            file_version = current_project_info.get("version", 0)

            if file_version > _last_known_version:
                project_name = current_project_info["project_name"]
                print(f"📁 Detected project change in shared file: {project_name} (v{file_version})", file=sys.stderr, flush=True)

                # Update last known version
                _last_known_version = file_version

                # Load project files
                project_files = read_project_files(project_name)

                if project_files and connected_frontends:
                    # Broadcast to all connected frontends
                    broadcast_message = {
                        "type": "project_switched",
                        "action": "switch",
                        "force_update": True,
                        "version": file_version,
                        "timestamp": current_project_info.get("timestamp", datetime.now().isoformat()),
                        "command": "file_watcher",
                        "data": {
                            "project_name": project_name,
                            "requirements": project_files.get("requirements", {}),
                            "ddd": project_files.get("ddd", {}),
                            "frontend_data": project_files.get("frontend_data", {}),
                            "technical_architecture": project_files.get("technical_architecture", {})
                        }
                    }

                    await broadcast_to_frontends(broadcast_message)
                    print(f"✅ Broadcasted project switch to {len(connected_frontends)} frontend(s)", file=sys.stderr, flush=True)
                elif not project_files:
                    print(f"⚠️  Failed to load project files for: {project_name}", file=sys.stderr, flush=True)

        except asyncio.CancelledError:
            print("🛑 File watcher shutting down...", file=sys.stderr, flush=True)
            break
        except Exception as e:
            print(f"❌ Error in file watcher: {e}", file=sys.stderr, flush=True)
            # Continue watching despite errors
            await asyncio.sleep(2)
