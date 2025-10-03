# AI-Powered Task Management Agent

A modern task management system powered by AI that allows users to manage tasks through natural language commands. Built with FastAPI, LangGraph, PostgreSQL, and Next.js.

## 🚀 Features

- **Natural Language Interface**: Interact with tasks using conversational AI
- **Real-time Updates**: WebSocket-powered live synchronization
- **Dark Mode Support**: Built-in theme switching with system preference detection
- **Intelligent Agent**: Powered by Google Gemini and LangGraph
- **Full CRUD Operations**: Create, read, update, delete tasks via chat or UI
- **Priority Management**: Set task priorities and due dates
- **Status Tracking**: Track task progress with multiple status states
- **Search & Filter**: Advanced filtering and search capabilities
- **Mobile Responsive**: Works seamlessly on all devices

## 🏗️ Architecture

### Backend
- **FastAPI**: High-performance async Python web framework
- **LangGraph**: Stateful agent orchestration framework
- **Google Gemini**: Large language model for natural language processing
- **PostgreSQL**: Robust relational database with async support
- **WebSockets**: Real-time bidirectional communication
- **SQLAlchemy**: Modern async ORM with Alembic migrations
- **Redis**: Caching and session management

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling framework
- **Dark Mode**: System-aware theme switching
- **WebSocket Client**: Real-time communication with backend

## 🛠️ Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- Google Gemini API key

### 1. Clone and Setup
```bash
# Extract the ZIP file or clone repository
cd ai_task_management_agent
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` file and add your Google Gemini API key:
```bash
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_actual_api_key_here
SECRET_KEY=your_secure_secret_key_here
```

### 3. Run with Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🚀 Development Setup

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start database only
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## 📝 Usage Examples

### Natural Language Commands

The AI agent understands various task management commands:

**Creating Tasks:**
- "Create a task to buy groceries tomorrow"
- "Add a high priority task to call the dentist"
- "Remind me to submit the report by Friday"

**Updating Tasks:**
- "Mark the grocery shopping task as done"
- "Change the priority of task 5 to urgent"
- "Update the dentist appointment to next week"

**Querying Tasks:**
- "Show me all my pending tasks"
- "List high priority tasks that are overdue"
- "Find tasks related to work"

**Deleting Tasks:**
- "Delete the task about buying milk"
- "Remove task number 3"

### API Endpoints

**Task Management:**
- `GET /api/v1/tasks` - List all tasks with filtering
- `POST /api/v1/tasks` - Create a new task
- `GET /api/v1/tasks/{id}` - Get specific task
- `PUT /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task
- `GET /api/v1/tasks/stats/summary` - Get task statistics

**WebSocket:**
- `WS /ws` - Real-time communication endpoint

## 🎨 UI Components

### Two-Panel Layout
- **Left Panel**: Chat interface for natural language interaction
- **Right Panel**: Visual task list with filtering and editing capabilities

### Features
- **Theme Toggle**: Switch between light/dark modes
- **Connection Status**: Visual indicator of WebSocket connection
- **Task Statistics**: Overview dashboard with metrics
- **Search & Filter**: Advanced task filtering options
- **Inline Editing**: Quick task editing without modal dialogs

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskdb
ASYNC_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/taskdb
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_secret_key
ENVIRONMENT=development
DEBUG=true
```

**Frontend:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### Database Migration

```bash
# Create new migration
cd backend
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## 📊 Task Schema

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Status Enum:** pending, in_progress, done, cancelled
**Priority Enum:** low, medium, high, urgent

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
pytest --cov=app
```

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:watch
```

## 🚀 Deployment

### Production Deployment
```bash
# Build and start production services
docker-compose up -d --build

# Scale services if needed
docker-compose up -d --scale backend=2
```

### Environment-specific Configurations
- **Development**: Use `docker-compose.dev.yml` for database only
- **Production**: Use main `docker-compose.yml` with all services
- **Testing**: Configure separate test database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LangGraph](https://github.com/langchain-ai/langgraph) for agent orchestration
- [FastAPI](https://fastapi.tiangolo.com/) for the amazing web framework
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [Google Gemini](https://ai.google.dev/) for language model capabilities

## 📞 Support

For support, create an issue in the repository or contact the development team.

---

**Built with ❤️ using modern web technologies**
