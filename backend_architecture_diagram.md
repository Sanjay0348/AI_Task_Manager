# Backend Architecture Diagrams

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WebApp[Web Application]
        Mobile[Mobile App]
        API_Client[API Client]
    end

    subgraph "API Gateway Layer"
        FastAPI[FastAPI Application]
        WS[WebSocket Handler]
        REST[REST API Handler]
    end

    subgraph "AI Processing Layer"
        Agent[Task Management Agent]
        LangGraph[LangGraph Workflow]
        LLM[Google Gemini LLM]
    end

    subgraph "Tool Layer"
        CreateTool[Create Task Tool]
        UpdateTool[Update Task Tool]
        DeleteTool[Delete Task Tool]
        ListTool[List Tasks Tool]
        FilterTool[Filter Tasks Tool]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL Database)]
        Redis[(Redis Cache)]
    end

    subgraph "Infrastructure"
        Docker[Docker Container]
        Nginx[Nginx Load Balancer]
    end

    WebApp --> FastAPI
    Mobile --> FastAPI
    API_Client --> FastAPI

    FastAPI --> WS
    FastAPI --> REST

    WS --> Agent
    REST --> PostgreSQL

    Agent --> LangGraph
    LangGraph --> LLM
    LangGraph --> CreateTool
    LangGraph --> UpdateTool
    LangGraph --> DeleteTool
    LangGraph --> ListTool
    LangGraph --> FilterTool

    CreateTool --> PostgreSQL
    UpdateTool --> PostgreSQL
    DeleteTool --> PostgreSQL
    ListTool --> PostgreSQL
    FilterTool --> PostgreSQL

    Agent --> Redis
    FastAPI --> Docker
    Docker --> Nginx
```

## LangGraph Workflow Detail

```mermaid
stateDiagram-v2
    [*] --> AgentNode

    state AgentNode {
        [*] --> ReceiveInput
        ReceiveInput --> ProcessWithLLM
        ProcessWithLLM --> CheckToolCalls
        CheckToolCalls --> [*]
    }

    AgentNode --> Decision{Has Tool Calls?}

    Decision -->|Yes| ExecuteTools
    Decision -->|No| GenerateResponse

    state ExecuteTools {
        [*] --> ExtractToolCalls
        ExtractToolCalls --> ExecuteAsyncTools
        ExecuteAsyncTools --> ProcessResults
        ProcessResults --> [*]
    }

    ExecuteTools --> GenerateResponse

    state GenerateResponse {
        [*] --> FormatResponse
        FormatResponse --> CreateUserMessage
        CreateUserMessage --> [*]
    }

    GenerateResponse --> [*]
```

## Database Schema

```mermaid
erDiagram
    TASKS {
        int id PK
        string title
        text description
        enum status
        enum priority
        datetime due_date
        datetime created_at
        datetime updated_at
    }

    TASK_STATUS {
        string PENDING
        string IN_PROGRESS
        string DONE
        string CANCELLED
    }

    TASK_PRIORITY {
        string LOW
        string MEDIUM
        string HIGH
        string URGENT
    }

    TASKS ||--|| TASK_STATUS : has
    TASKS ||--|| TASK_PRIORITY : has
```

## Message Flow Sequence

```mermaid
sequenceDiagram
    participant User
    participant WebSocket
    participant Agent
    participant LangGraph
    participant LLM
    participant Tools
    participant Database
    participant Client

    User->>WebSocket: "Create a task for tomorrow"
    WebSocket->>Agent: process_message()
    Agent->>LangGraph: ainvoke(initial_state)

    LangGraph->>LLM: Send with system prompt
    LLM->>LangGraph: Response with tool calls

    LangGraph->>Tools: Execute create_task tool
    Tools->>Database: INSERT new task
    Database->>Tools: Return task data
    Tools->>LangGraph: Return tool result

    LangGraph->>LLM: Generate final response
    LLM->>LangGraph: Final response
    LangGraph->>Agent: Return final state

    Agent->>WebSocket: Send response
    WebSocket->>Client: Deliver to user
    WebSocket->>Client: Broadcast task update
```

## Tool Execution Flow

```mermaid
flowchart TD
    Start([User Input]) --> Parse[Parse Natural Language]
    Parse --> Intent[Determine Intent]

    Intent --> Create{Create Task?}
    Intent --> Update{Update Task?}
    Intent --> Delete{Delete Task?}
    Intent --> List{List Tasks?}
    Intent --> Filter{Filter Tasks?}

    Create --> CreateTool[create_task Tool]
    Update --> UpdateTool[update_task Tool]
    Delete --> DeleteTool[delete_task Tool]
    List --> ListTool[list_tasks Tool]
    Filter --> FilterTool[filter_tasks Tool]

    CreateTool --> ValidateCreate[Validate Input]
    UpdateTool --> ValidateUpdate[Validate Input]
    DeleteTool --> ValidateDelete[Validate Input]
    ListTool --> ValidateList[Validate Input]
    FilterTool --> ValidateFilter[Validate Input]

    ValidateCreate --> DB1[(Database Insert)]
    ValidateUpdate --> DB2[(Database Update)]
    ValidateDelete --> DB3[(Database Delete)]
    ValidateList --> DB4[(Database Query)]
    ValidateFilter --> DB5[(Database Query)]

    DB1 --> Response1[Return Task Data]
    DB2 --> Response2[Return Updated Task]
    DB3 --> Response3[Return Deletion Confirmation]
    DB4 --> Response4[Return Task List]
    DB5 --> Response5[Return Filtered Tasks]

    Response1 --> End([Response to User])
    Response2 --> End
    Response3 --> End
    Response4 --> End
    Response5 --> End
```

## Error Handling Flow

```mermaid
flowchart TD
    Start([Process Request]) --> Try[Try Operation]

    Try --> Success{Success?}
    Success -->|Yes| ReturnSuccess[Return Success Response]
    Success -->|No| CatchError[Catch Exception]

    CatchError --> LogError[Log Error Details]
    LogError --> DetermineType[Determine Error Type]

    DetermineType --> DBError{Database Error?}
    DetermineType --> ToolError{Tool Error?}
    DetermineType --> LLMError{LLM Error?}
    DetermineType --> ValidationError{Validation Error?}

    DBError -->|Yes| DBErrorResponse[Return DB Error Message]
    ToolError -->|Yes| ToolErrorResponse[Return Tool Error Message]
    LLMError -->|Yes| LLMErrorResponse[Return LLM Error Message]
    ValidationError -->|Yes| ValidationErrorResponse[Return Validation Error Message]

    DBErrorResponse --> End([End])
    ToolErrorResponse --> End
    LLMErrorResponse --> End
    ValidationErrorResponse --> End
    ReturnSuccess --> End
```

## WebSocket Connection Management

```mermaid
stateDiagram-v2
    [*] --> Disconnected

    Disconnected --> Connecting: WebSocket Connect
    Connecting --> Connected: Connection Accepted
    Connecting --> Disconnected: Connection Failed

    Connected --> Processing: Receive Message
    Processing --> Connected: Send Response
    Processing --> Connected: Send Error

    Connected --> Disconnected: Client Disconnect
    Connected --> Disconnected: Connection Error

    state Connected {
        [*] --> Idle
        Idle --> Typing: Start Processing
        Typing --> Processing: Tool Execution
        Processing --> Idle: Complete
    }
```

## Performance Optimization

```mermaid
graph TB
    subgraph "Connection Pooling"
        Pool[Database Connection Pool]
        Pool --> DB[(PostgreSQL)]
    end

    subgraph "Caching Layer"
        Redis[(Redis Cache)]
        Cache[Cache Manager]
    end

    subgraph "Async Processing"
        AsyncTools[Async Tool Execution]
        AsyncDB[Async Database Operations]
    end

    subgraph "Load Balancing"
        LB[Load Balancer]
        Instances[Multiple App Instances]
    end

    Pool --> AsyncDB
    Cache --> Redis
    AsyncTools --> AsyncDB
    LB --> Instances
```

This comprehensive architecture provides a robust, scalable, and intelligent task management system that can handle natural language processing, real-time communication, and complex database operations efficiently.
