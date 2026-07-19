import http.server
import socketserver
import webbrowser
import threading
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Specifying directory is supported in Python 3.7+
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def open_browser():
    print(f"Opening browser at http://localhost:{PORT}...")
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    # Move to the directory of this file
    os.chdir(DIRECTORY)
    
    # Open browser after a short delay to let the server bind first
    threading.Timer(0.8, open_browser).start()
    
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Serving MBot_Life at http://localhost:{PORT}")
            print("Press Ctrl+C to stop the server.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
        sys.exit(0)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)
