"""
Quick Start Launcher for LexiExtract PDF Compliance Portal
Auto-detects available ports and starts the full-stack server.
"""

import os
import sys
import socket
import webbrowser
import uvicorn

WORKSPACE_ROOT = os.path.abspath(os.path.dirname(__file__))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from backend.main import app

def find_free_port():
    candidate_ports = [8888, 9000, 3001, 3002, 5001, 5002, 8081, 7000, 5000]
    for port in candidate_ports:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(('127.0.0.1', port))
            s.close()
            return port
        except Exception:
            continue
            
    # Fallback to ephemeral port
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port

if __name__ == "__main__":
    port = find_free_port()
    url = f"http://127.0.0.1:{port}"
    print(f"\n========================================================")
    print(f"  LEXIEXTRACT - PDF COMPLIANCE EXTRACTION PORTAL")
    print(f"  Server running at: {url}")
    print(f"  API Documentation: {url}/docs")
    print(f"========================================================\n")
    
    try:
        webbrowser.open(url)
    except Exception:
        pass

    uvicorn.run(app, host="127.0.0.1", port=port)
