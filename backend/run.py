#!/usr/bin/env python3
"""
Startup script for the AI Task Management Agent
This script ensures the correct Python path is set before running the application.
"""

import sys
import os
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Now we can import and run the app
if __name__ == "__main__":
    import uvicorn
    from app.main import app

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
