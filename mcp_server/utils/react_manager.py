import subprocess
import socket
import asyncio
import os
import sys
from pathlib import Path

REACT_DIR = r"C:\Users\bijay\OneDrive\Desktop\react_demo\eraleur-frontend"
REACT_PORT = 3000
STARTUP_TIMEOUT = 30  # Increased timeout for React startup

def is_port_in_use(port: int) -> bool:
    """Check if a port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

async def start_react_server():
    """Start React development server in background without waiting"""

    # Check if React is already running on port 3000
    if is_port_in_use(REACT_PORT):
        return {
            "status": "already_running",
            "message": f"React server already running on port {REACT_PORT}",
            "url": f"http://localhost:{REACT_PORT}"
        }

    # Check if React directory exists
    if not os.path.exists(REACT_DIR):
        return {
            "status": "error",
            "error": f"React directory not found: {REACT_DIR}"
        }

    # Check if package.json exists
    package_json = os.path.join(REACT_DIR, "package.json")
    if not os.path.exists(package_json):
        return {
            "status": "error",
            "error": "package.json not found in React directory"
        }

    # Check if node_modules exists
    node_modules = os.path.join(REACT_DIR, "node_modules")
    if not os.path.exists(node_modules):
        return {
            "status": "error",
            "error": "node_modules not found. Please run 'npm install' in the React directory first"
        }

    try:
        print(f"Starting React server in {REACT_DIR}...", file=sys.stderr, flush=True)

        # Create log file for React server output
        log_file_path = os.path.join(REACT_DIR, "react-server.log")
        log_file = open(log_file_path, "w", buffering=1)  # Line buffering for immediate output

        # Start React server in background
        # On Windows, use shell=True with string command for better compatibility
        if os.name == 'nt':
            # Set environment to prevent interactive prompts
            env = os.environ.copy()
            env['CI'] = 'true'  # Prevent browser auto-open and interactive prompts
            env['BROWSER'] = 'none'  # Don't open browser

            process = subprocess.Popen(
                "npm start",
                cwd=REACT_DIR,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,  # Prevent waiting for stdin
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
                shell=True,
                env=env
            )
        else:
            # Set environment to prevent interactive prompts (Linux/Mac)
            env = os.environ.copy()
            env['CI'] = 'true'
            env['BROWSER'] = 'none'

            process = subprocess.Popen(
                ["npm", "start"],
                cwd=REACT_DIR,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                shell=False,
                env=env
            )

        print(f"React process started with PID: {process.pid}", file=sys.stderr, flush=True)
        print(f"React server starting in background. It will be ready in ~15-30 seconds.", file=sys.stderr, flush=True)

        # Return immediately - don't wait for React to fully start
        # The server will be ready after a few seconds
        return {
            "status": "starting",
            "message": f"React server is starting in background on port {REACT_PORT}",
            "url": f"http://localhost:{REACT_PORT}",
            "pid": process.pid,
            "log_file": log_file_path,
            "note": "Server will be ready in 15-30 seconds"
        }

    except FileNotFoundError:
        return {
            "status": "error",
            "error": "npm not found. Please ensure Node.js is installed"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": f"Failed to start React server: {str(e)}"
        }


async def start_react_server_and_wait():
    """Start React server and WAIT for it to be fully ready (use this for standalone mode)"""

    # First start the server
    result = await start_react_server()

    # If it's already running or starting, wait for it
    if result["status"] == "already_running":
        return result

    if result["status"] == "starting":
        print(f"Waiting up to {STARTUP_TIMEOUT} seconds for React to be ready...", file=sys.stderr, flush=True)

        # Wait for React to start, checking every second
        for i in range(STARTUP_TIMEOUT):
            await asyncio.sleep(1)

            # Check if port is now in use
            if is_port_in_use(REACT_PORT):
                print(f"React server is now running on port {REACT_PORT}!", file=sys.stderr, flush=True)
                return {
                    "status": "started",
                    "message": f"React server started successfully on port {REACT_PORT}",
                    "url": f"http://localhost:{REACT_PORT}",
                    "pid": result["pid"],
                    "log_file": result["log_file"]
                }

            if (i + 1) % 5 == 0:
                print(f"Still waiting... ({i + 1}s elapsed)", file=sys.stderr, flush=True)

        # Timeout reached
        return {
            "status": "error",
            "error": f"React server failed to start within {STARTUP_TIMEOUT} seconds. Check {result['log_file']}",
        }

    return result

async def check_react_status():
    """Check if React server is running"""
    if is_port_in_use(REACT_PORT):
        return {
            "status": "running",
            "url": f"http://localhost:{REACT_PORT}"
        }
    else:
        return {
            "status": "not_running"
        }

async def stop_react_server():
    """Stop React development server running on the configured port"""

    # Check if React server is running
    if not is_port_in_use(REACT_PORT):
        return {
            "status": "not_running",
            "message": f"React server is not running on port {REACT_PORT}"
        }

    try:
        print(f"Stopping React server on port {REACT_PORT}...", file=sys.stderr, flush=True)

        # Kill process on port using platform-specific commands
        if os.name == 'nt':  # Windows
            # Use netstat to find PID and taskkill to stop it
            result = subprocess.run(
                f'for /f "tokens=5" %a in (\'netstat -aon ^| findstr :{REACT_PORT}\') do taskkill /F /PID %a',
                shell=True,
                capture_output=True,
                text=True
            )
        else:  # Linux/Mac
            result = subprocess.run(
                f"lsof -ti:{REACT_PORT} | xargs kill -9",
                shell=True,
                capture_output=True,
                text=True
            )

        # Wait a moment for port to be released
        await asyncio.sleep(2)

        # Verify port is now free
        if not is_port_in_use(REACT_PORT):
            print(f"✅ React server stopped successfully", file=sys.stderr, flush=True)
            return {
                "status": "stopped",
                "message": f"React server on port {REACT_PORT} stopped successfully"
            }
        else:
            return {
                "status": "error",
                "error": "Failed to stop React server - port still in use"
            }

    except Exception as e:
        return {
            "status": "error",
            "error": f"Failed to stop React server: {str(e)}"
        }

# Standalone mode functionality
async def main():
    """Main function when running standalone"""
    print("=" * 60)
    print("🚀 React Server Manager - Standalone Mode")
    print("=" * 60)
    print(f"React Directory: {REACT_DIR}")
    print(f"Port: {REACT_PORT}")
    print("=" * 60 + "\n")

    # Check current status
    print("Checking React server status...")
    status = await check_react_status()

    if status["status"] == "running":
        print(f"✅ React server is already running on {status['url']}")
        print("\n💡 React is ready to use!")
    else:
        print("⚠️  React server is not running. Starting now...\n")
        result = await start_react_server_and_wait()  # Use the waiting version

        if result["status"] == "started":
            print(f"\n✅ SUCCESS! React server started on {result['url']}")
            print(f"📋 PID: {result['pid']}")
            print(f"📄 Log file: {result['log_file']}")
            print("\n💡 React is ready to use!")
        elif result["status"] == "already_running":
            print(f"\n✅ React server was already running on {result['url']}")
        else:
            print(f"\n❌ ERROR: {result['error']}")
            sys.exit(1)

    print("\n" + "=" * 60)
    print("✅ Done! React server is running.")
    print("=" * 60)
    print("\n💡 To stop React server, use: npx kill-port 3000")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)