import os
import json
from typing import Any, Dict, List
import shutil

# Get the absolute path to mcp_server directory
# This file is in mcp_server/utils/, so go up one level to get mcp_server/
MCP_SERVER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Set absolute paths inside mcp_server directory ONLY
PROJECTS_DIR = os.path.join(MCP_SERVER_DIR, "projects")
REGISTRY_FILE = os.path.join(MCP_SERVER_DIR, "project_registry.json")
CURRENT_PROJECT_FILE = os.path.join(MCP_SERVER_DIR, "current_project.json")

# Valid file types for project updates
VALID_FILE_TYPES = ["requirement.js", "ddd.js", "frontend_data.js", "technical_architecture.js", "summary.md"]

def create_project_directory(project_name: str) -> str:
    """Creates project folder and returns path"""
    project_path = os.path.join(PROJECTS_DIR, project_name)
    os.makedirs(project_path, exist_ok=True)
    return project_path

def create_empty_json_file(filepath: str, initial_data: dict):
    """Creates JSON file with initial structure"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(initial_data, f, indent=2, ensure_ascii=False)

def read_json_file(filepath: str) -> dict:
    """Reads and parses JSON file, returns empty dict if file is empty or corrupted"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:  # Empty file
                return {}
            return json.loads(content)
    except json.JSONDecodeError:
        # Corrupted JSON, return empty dict
        return {}
    except Exception as e:
        # Other errors, re-raise
        raise e

def write_json_file(filepath: str, data: dict):
    """Writes dictionary to JSON file"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def read_text_file(filepath: str) -> str:
    """Reads text/markdown file and returns content as string"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        raise e

def write_text_file(filepath: str, content: str):
    """Writes string content to text/markdown file"""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def update_project_registry(project_name: str, metadata: dict):
    """Updates or creates project_registry.json"""
    registry = {"projects": {}}

    if os.path.exists(REGISTRY_FILE):
        registry = read_json_file(REGISTRY_FILE)
        # Ensure "projects" key exists
        if "projects" not in registry or not isinstance(registry.get("projects"), dict):
            registry["projects"] = {}

    registry["projects"][project_name] = metadata
    write_json_file(REGISTRY_FILE, registry)

def project_exists(project_name: str) -> bool:
    """Check if project directory exists"""
    project_path = os.path.join(PROJECTS_DIR, project_name)
    return os.path.exists(project_path)

def get_all_projects() -> List[Dict[str, Any]]:
    """
    Get list of all projects from registry with metadata

    Returns:
        List of projects with their metadata
    """
    if not os.path.exists(REGISTRY_FILE):
        return []

    registry = read_json_file(REGISTRY_FILE)

    # Handle empty or corrupted registry
    if not registry or "projects" not in registry:
        return []

    projects = registry.get("projects", {})

    # Ensure projects is a dict
    if not isinstance(projects, dict):
        return []

    # Convert to list format with project_name included
    project_list = []
    for project_name, metadata in projects.items():
        project_info = {
            "project_name": project_name,
            **metadata
        }
        project_list.append(project_info)

    return project_list

def read_project_files(project_name: str) -> dict:
    """
    Read all project files and return their data

    Returns None if project directory doesn't exist or if required JSON files are missing
    Includes summary.md if it exists (optional file)
    """
    project_path = os.path.join(PROJECTS_DIR, project_name)

    if not os.path.exists(project_path):
        return None

    # Check for all required JSON files first
    required_files = {
        "requirements": "requirement.js",
        "ddd": "ddd.js",
        "frontend_data": "frontend_data.js",
        "technical_architecture": "technical_architecture.js"
    }

    # Optional files (won't cause failure if missing)
    optional_files = {
        "summary": "summary.md"
    }

    missing_files = []
    for key, filename in required_files.items():
        file_path = os.path.join(project_path, filename)
        if not os.path.exists(file_path):
            missing_files.append(filename)

    # If any required files are missing, return None
    if missing_files:
        print(f"Warning: Project '{project_name}' is incomplete. Missing files: {missing_files}")
        return None

    result = {}

    # Read all required JSON files
    for key, filename in required_files.items():
        file_path = os.path.join(project_path, filename)
        try:
            result[key] = read_json_file(file_path)
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            result[key] = {}

    # Read optional text/markdown files
    for key, filename in optional_files.items():
        file_path = os.path.join(project_path, filename)
        if os.path.exists(file_path):
            try:
                result[key] = read_text_file(file_path)
            except Exception as e:
                print(f"Error reading {filename}: {e}")
                result[key] = ""
        else:
            # File doesn't exist, set empty string
            result[key] = ""

    return result

def deep_merge_dict(base: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deep merge two dictionaries. Updates will be merged into base.
    For nested dicts, recursively merge. For lists, concatenate without duplicates.

    Args:
        base: Base dictionary to merge into
        updates: Dictionary with updates to apply

    Returns:
        Merged dictionary (base is not modified, returns new dict)
    """
    result = base.copy()

    for key, value in updates.items():
        if key in result:
            # If both are dicts, recursively merge
            if isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = deep_merge_dict(result[key], value)
            # If both are lists, concatenate without duplicates
            elif isinstance(result[key], list) and isinstance(value, list):
                # Keep existing items and add new unique items
                existing_items = result[key]
                for item in value:
                    if item not in existing_items:
                        existing_items.append(item)
                result[key] = existing_items
            else:
                # Otherwise, update value overwrites base value
                result[key] = value
        else:
            # New key, just add it
            result[key] = value

    return result

def get_project_file_path(project_name: str, file_type: str) -> str:
    """
    Get full path to a project file

    Args:
        project_name: Name of the project
        file_type: File name (e.g., 'requirement.js', 'ddd.js')

    Returns:
        Full file path
    """
    project_path = os.path.join(PROJECTS_DIR, project_name)
    return os.path.join(project_path, file_type)

def update_json_file(project_name: str, file_type: str, update_data: Any, merge_strategy: str = "merge") -> Any:
    """
    Update a project file (JSON or Markdown) with specified merge strategy

    Args:
        project_name: Name of the project
        file_type: File to update (requirement.js, ddd.js, frontend_data.js, technical_architecture.js, summary.md)
        update_data: Data to update/merge into the file
                     - For JSON files: dict with data to merge
                     - For markdown files: string content to write
        merge_strategy: How to apply updates:
            - 'replace': Completely replace file contents with update_data
            - 'merge': Deep merge update_data into existing data (JSON only, default)
            - 'append': Append arrays and merge objects (JSON only)
            Note: For markdown files, all strategies act as 'replace'

    Returns:
        Updated file data (dict for JSON, string for markdown)

    Raises:
        ValueError: If file_type is invalid or project doesn't exist
        FileNotFoundError: If project file doesn't exist
    """
    # Validate file type
    if file_type not in VALID_FILE_TYPES:
        raise ValueError(f"Invalid file_type '{file_type}'. Must be one of: {VALID_FILE_TYPES}")

    # Validate project exists
    if not project_exists(project_name):
        raise ValueError(f"Project '{project_name}' does not exist")

    # Get file path
    file_path = get_project_file_path(project_name, file_type)

    # Check if file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File '{file_type}' not found in project '{project_name}'")

    # Handle markdown/text files differently from JSON files
    is_markdown = file_type.endswith('.md')

    if is_markdown:
        # For markdown files, update_data should be a string
        if not isinstance(update_data, str):
            raise ValueError(f"For markdown files, update_data must be a string, got {type(update_data)}")

        # Write the new content (merge strategies don't apply to plain text)
        write_text_file(file_path, update_data)
        return update_data
    else:
        # Handle JSON files
        if not isinstance(update_data, dict):
            raise ValueError(f"For JSON files, update_data must be a dict, got {type(update_data)}")

        # Read current file data
        current_data = read_json_file(file_path)

        # Apply merge strategy
        if merge_strategy == "replace":
            # Completely replace with new data
            new_data = update_data
        elif merge_strategy == "merge":
            # Deep merge new data into existing data
            new_data = deep_merge_dict(current_data, update_data)
        elif merge_strategy == "append":
            # Same as merge (deep_merge_dict already handles appending to lists)
            new_data = deep_merge_dict(current_data, update_data)
        else:
            raise ValueError(f"Invalid merge_strategy '{merge_strategy}'. Must be 'replace', 'merge', or 'append'")

        # Write updated data back to file
        write_json_file(file_path, new_data)

        return new_data

def delete_project_directory(project_name: str) -> bool:
    """
    Delete project directory and all its contents
    Windows/OneDrive compatible with retry logic

    Args:
        project_name: Name of the project to delete

    Returns:
        True if deletion successful

    Raises:
        ValueError: If project doesn't exist
        Exception: If deletion fails after retries
    """
    import stat
    import time

    if not project_exists(project_name):
        raise ValueError(f"Project '{project_name}' does not exist")

    project_path = os.path.join(PROJECTS_DIR, project_name)

    def handle_remove_readonly(func, path, exc_info):
        """
        Error handler for removing readonly files on Windows
        Also handles OneDrive locked files
        """
        try:
            # Try to change file permissions
            os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
            func(path)
        except Exception:
            # If changing permissions fails, try again after a short delay
            time.sleep(0.1)
            try:
                func(path)
            except Exception:
                pass  # Will be handled by outer exception

    # Try method 1: shutil.rmtree with error handler
    try:
        shutil.rmtree(project_path, onerror=handle_remove_readonly)
        return True
    except Exception as e1:
        # Method 1 failed, try method 2: Manual deletion with retry
        try:
            # For empty directories, sometimes rmdir works better on Windows
            if len(os.listdir(project_path)) == 0:
                os.rmdir(project_path)
                return True
            else:
                # Try to delete each file individually
                for root, dirs, files in os.walk(project_path, topdown=False):
                    for name in files:
                        file_path = os.path.join(root, name)
                        try:
                            os.chmod(file_path, stat.S_IWRITE)
                            os.remove(file_path)
                        except Exception:
                            time.sleep(0.1)
                            os.remove(file_path)
                    for name in dirs:
                        dir_path = os.path.join(root, name)
                        try:
                            os.rmdir(dir_path)
                        except Exception:
                            time.sleep(0.1)
                            os.rmdir(dir_path)
                # Finally remove the project directory itself
                os.rmdir(project_path)
                return True
        except Exception as e2:
            # Both methods failed
            raise Exception(f"Failed to delete project directory: {str(e1)}. Retry also failed: {str(e2)}")

def remove_from_registry(project_name: str) -> bool:
    """
    Remove project entry from registry.json

    Args:
        project_name: Name of the project to remove

    Returns:
        True if removal successful

    Raises:
        ValueError: If registry file doesn't exist or project not in registry
    """
    if not os.path.exists(REGISTRY_FILE):
        raise ValueError("Registry file does not exist")

    registry = read_json_file(REGISTRY_FILE)

    # Handle empty or corrupted registry
    if not registry or "projects" not in registry:
        raise ValueError(f"Project '{project_name}' not found in registry")

    if not isinstance(registry["projects"], dict):
        raise ValueError("Registry is corrupted")

    if project_name not in registry["projects"]:
        raise ValueError(f"Project '{project_name}' not found in registry")

    # Remove project from registry
    del registry["projects"][project_name]

    # Write updated registry back to file
    write_json_file(REGISTRY_FILE, registry)

    return True

def write_current_project(project_name: str) -> bool:
    """
    Write the currently selected project to shared file
    This allows all MCP instances to know which project is active

    Args:
        project_name: Name of the currently selected project

    Returns:
        True if successful
    """
    from datetime import datetime

    current_data = {
        "project_name": project_name,
        "timestamp": datetime.now().isoformat(),
        "version": int(datetime.now().timestamp() * 1000)  # Millisecond timestamp as version
    }

    write_json_file(CURRENT_PROJECT_FILE, current_data)
    return True

def read_current_project() -> dict:
    """
    Read the currently selected project from shared file

    Returns:
        Dictionary with project_name, timestamp, and version
        Returns empty dict if file doesn't exist
    """
    if not os.path.exists(CURRENT_PROJECT_FILE):
        return {}

    try:
        return read_json_file(CURRENT_PROJECT_FILE)
    except Exception:
        return {}
