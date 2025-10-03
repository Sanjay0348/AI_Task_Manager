from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Dict, Set
import asyncio
import json
import logging
from datetime import datetime

try:
    # Try absolute imports first (when run as module)
    from app.core.config import settings
    from app.db.database import async_engine, Base
    from app.agents.task_agent import task_agent
    from app.models.schemas import ChatMessage, AgentResponse, WebSocketMessage
    from app.api.routes import router
except ImportError:
    # Fall back to relative imports (when run directly)
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).parent.parent))

    from app.core.config import settings
    from app.db.database import async_engine, Base
    from app.agents.task_agent import task_agent
    from app.models.schemas import ChatMessage, AgentResponse, WebSocketMessage
    from app.api.routes import router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(
            f"WebSocket connected. Total connections: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(
            f"WebSocket disconnected. Total connections: {len(self.active_connections)}"
        )

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message, default=str))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return

        disconnected = set()
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(json.dumps(message, default=str))
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected.add(connection)

        # Remove disconnected connections
        for connection in disconnected:
            self.active_connections.discard(connection)


# Global connection manager
manager = ConnectionManager()


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Task Management Agent...")

    # Create database tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database tables created")
    logger.info("Task Management Agent ready!")

    yield

    # Shutdown
    logger.info("Shutting down Task Management Agent...")
    await async_engine.dispose()


# Create FastAPI app
app = FastAPI(
    title="AI-Powered Task Management Agent",
    description="A task management system with AI agent and real-time updates",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1", tags=["tasks"])


# WebSocket endpoint for real-time chat and updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message_data = json.loads(data)
                message_type = message_data.get("type", "chat_message")
                print(message_data, "----message data---")
                if message_type == "chat_message":
                    user_message = message_data.get("data", {}).get("message", "")
                    print(user_message, "[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]")
                    if user_message.strip():
                        # Send typing indicator
                        await manager.send_personal_message(
                            {
                                "type": "typing_indicator",
                                "data": {"typing": True},
                                "timestamp": datetime.utcnow().isoformat(),
                            },
                            websocket,
                        )

                        # Process message with agent
                        agent_response = await task_agent.process_message(user_message)

                        # Send agent response
                        await manager.send_personal_message(
                            {
                                "type": "agent_response",
                                "data": {
                                    "user_message": user_message,
                                    "agent_response": agent_response["response"],
                                    "success": agent_response["success"],
                                    "tool_results": agent_response["tool_results"],
                                },
                                "timestamp": agent_response["timestamp"],
                            },
                            websocket,
                        )

                        # If tasks were modified, broadcast task update to all clients
                        if agent_response.get("tool_results"):
                            await manager.broadcast(
                                {
                                    "type": "task_list_update",
                                    "data": {"message": "Tasks have been updated"},
                                    "timestamp": datetime.utcnow().isoformat(),
                                }
                            )

                elif message_type == "ping":
                    # Health check
                    await manager.send_personal_message(
                        {
                            "type": "pong",
                            "data": {"status": "ok"},
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                        websocket,
                    )

            except json.JSONDecodeError:
                await manager.send_personal_message(
                    {
                        "type": "error",
                        "data": {"message": "Invalid JSON format"},
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    websocket,
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "AI-Powered Task Management Agent API",
        "version": "1.0.0",
        "docs": "/docs",
        "websocket": "/ws",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        # reload=settings.debug
    )
