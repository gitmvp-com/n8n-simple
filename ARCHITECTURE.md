# n8n MVP - Architecture & Design

## System Overview

```
┌────────────────────────┐
│   User Browser (Vue 3 + Pinia)       │
│   - Home page (Workflows list)      │
│   - Editor (Drag-drop canvas)       │
│   - Real-time execution status      │
└────────────────────────┘
            │
            │ HTTP (JSON)
            │
┌────────────────────────┐
│   Express.js API (Node.js + TS)     │
│   - REST endpoints                  │
│   - CORS & Security middleware       │
│   - Workflow execution engine       │
└────────────────────────┘
            │
            │ SQL
            │
┌────────────────────────┐
│   SQLite Database                   │
│   - Workflows table                 │
│   - Executions table                │
└────────────────────────┘
```

## Backend Architecture

### Server Entry Point (`src/backend/index.ts`)

```
Express App
  ├─ Middleware
  │  ├─ Helmet (security headers)
  │  ├─ Express.json (body parsing)
  │  └─ CORS (cross-origin requests)
  ├─ Routes
  │  ├─ /api/workflows (CRUD operations)
  │  ├─ /api/executions (workflow runs)
  │  └─ /health (server status)
  ├─ Database
  │  └─ initializeDatabase() on startup
  └─ Error Handling
     └─ Global error middleware
```

### Database Layer (`src/backend/models/database.ts`)

Uses native `sqlite3` driver with promise-based wrapper:

- **Workflows CRUD**: insertWorkflow, getWorkflow, getAllWorkflows, updateWorkflow, deleteWorkflow
- **Executions CRUD**: insertExecution, getExecution, getExecutions, updateExecution
- **Constraints**: Foreign key relationships, timestamps, status tracking

### API Routes

#### Workflows Routes (`src/backend/routes/workflows.ts`)

```
GET /api/workflows              → List all workflows
POST /api/workflows             → Create workflow
GET /api/workflows/:id          → Get workflow details
PUT /api/workflows/:id          → Update workflow
DELETE /api/workflows/:id       → Delete workflow
GET /api/workflows/:id/executions → Get execution history
```

#### Executions Routes (`src/backend/routes/executions.ts`)

```
POST /api/executions/:workflowId   → Execute workflow (async)
GET /api/executions/:id            → Get execution status/results
```

### Workflow Executor (`src/backend/engine/executor.ts`)

**Core Function**: `executeWorkflow(executionId, workflow, inputData)`

**Flow**:
1. Find Start node (entry point)
2. Initialize execution context with input data
3. Loop through workflow:
   - Execute current node
   - Store result in context
   - Find next connected node
   - Continue until no more connections
4. Update execution record with final status and output
5. Catch and log any errors

**Node Execution** (`executeNode` function):
- **Start**: Pass input data through
- **Code**: Execute JavaScript using `new Function()` with access to context
- **HTTP**: Make axios request, return response data
- **Output**: Return final result

**Error Handling**:
- Node-level: Try-catch around each node execution
- Execution-level: Catch all errors and mark execution as failed
- Updates execution status to 'error' with error message

## Frontend Architecture

### Entry Point (`frontend/src/main.ts`)

```
Vue App
  ├─ Pinia Store (workflow state)
  ├─ Vue Router (navigation)
  └─ App.vue (root component)
     ├─ Header (navigation)
     └─ <router-view> (page content)
```

### State Management (`frontend/src/stores/workflow.ts`)

Pinia store manages:
- `workflows` - List of all workflows
- `currentWorkflow` - Workflow being edited
- `loading` - Loading state
- `error` - Error messages

Actions:
- `loadWorkflows()` - Fetch all workflows
- `createNew(name, description)` - Create workflow
- `updateCurrent(nodes, connections)` - Save workflow
- `executeWorkflow(inputData)` - Run workflow
- `deleteCurrent()` - Delete workflow

### API Client (`frontend/src/api/index.ts`)

Axios instance configured for:
- Base URL: `http://localhost:3000/api`
- Content-Type: `application/json`
- CORS-enabled

**Functions**:
- `fetchWorkflows()` - GET /workflows
- `fetchWorkflow(id)` - GET /workflows/:id
- `createWorkflow(data)` - POST /workflows
- `updateWorkflowData(id, data)` - PUT /workflows/:id
- `deleteWorkflowData(id)` - DELETE /workflows/:id
- `executeWorkflowData(id, inputData)` - POST /executions/:id
- `getExecution(id)` - GET /executions/:id
- `getExecutions(workflowId)` - GET /workflows/:id/executions

### Pages

#### Home (`frontend/src/views/Home.vue`)
- Displays list of all workflows
- Shows workflow stats (node count, creation date)
- Quick actions: Edit, Run
- Create new workflow button

#### Editor (`frontend/src/views/Editor.vue`)
- **Left Sidebar**:
  - Workflow name input
  - Save button
  - Node type palette (draggable)
  - Selected node configuration panel
  - Execute button
  
- **Canvas**:
  - Drag-and-drop node placement
  - Node boxes with delete button
  - Connection lines between nodes
  - SVG overlay for visual connections
  
- **Right Panel**:
  - Real-time execution output
  - Status indicator (running/success/error)
  - JSON output display
  - Error messages

### Component Structure

```
App.vue
  ├─ Header
  └─ <router-view>
     ├─ Home.vue
     │  ├─ Workflow list cards
     │  └─ Create button
     └─ Editor.vue
        ├─ Sidebar (node controls)
        ├─ Canvas (workflow nodes)
        └─ Output panel
```

## Data Models

### Workflow
```typescript
interface Workflow {
  id: string              // UUID
  name: string            // User-defined name
  description?: string    // Optional description
  nodes: NodeConfig[]     // Array of nodes
  connections: Connection[] // Array of connections
  active?: boolean        // Whether workflow is active
  created_at?: string     // ISO datetime
  updated_at?: string     // ISO datetime
}
```

### Node
```typescript
interface NodeConfig {
  id: string                      // UUID
  type: 'start' | 'code' | 'http' | 'output'
  label: string                   // Display name
  position: { x: number; y: number } // Canvas position
  data: Record<string, any>       // Node-specific config
}
```

### Connection
```typescript
interface Connection {
  source: string  // Node ID
  target: string  // Node ID
}
```

### Execution
```typescript
interface ExecutionResult {
  id: string                          // UUID
  workflowId: string                  // Workflow ID
  status: 'running' | 'success' | 'error'
  inputData?: any                     // Input to workflow
  outputData?: any                    // Output from workflow
  error?: string                      // Error message
  startedAt?: string                  // ISO datetime
  completedAt?: string                // ISO datetime
}
```

## Request/Response Flow

### Create Workflow
```
Frontend                          Backend
  POST /api/workflows    →
    { name, description,         → insertWorkflow()
      nodes, connections }       → Persist to SQLite
                                 →
  ←          201 Created
  Receives workflow with ID
```

### Execute Workflow
```
Frontend                          Backend
  POST /api/executions/:id →
    { inputData }               → insertExecution()
                                 → Status: 'running'
                                 →
  ←          202 Accepted
  Receives executionId           ← Returns immediately
  │
  │ Background processing
  │ starts on backend
  │                             → executeWorkflow()
  │                             → Run through nodes
  │                             → updateExecution()
  │                             → Status: 'success'/'error'
  │
  └ GET /api/executions/:id  →
     (polling)                   ← Returns updated status
```

## Technology Stack Rationale

### Backend
- **Express.js**: Lightweight, flexible, perfect for MVP
- **TypeScript**: Type safety without heavy framework overhead
- **SQLite**: No server setup needed, great for development/testing
- **Axios**: Promise-based HTTP client, clean syntax

### Frontend
- **Vue 3**: Approachable, reactive, single-file components
- **Vite**: Fast development experience, modern build tools
- **Pinia**: Simple state management, replaces Vuex
- **Tailwind CSS**: Utility-first, rapid UI development

## Scaling Considerations

For production deployment, consider:

1. **Database**:
   - Migrate from SQLite to PostgreSQL/MySQL
   - Add indexes on frequently queried columns
   - Implement connection pooling

2. **Execution**:
   - Use job queue (Bull, BullMQ) for async execution
   - Implement timeout mechanisms
   - Add retry logic for failed nodes

3. **Security**:
   - Sandbox code execution (VM2, isolated-vm)
   - Implement authentication (JWT, OAuth)
   - Add rate limiting
   - Validate/sanitize all inputs

4. **Performance**:
   - Cache compiled workflows
   - Implement execution timeouts
   - Add monitoring/logging (Winston, Pino)
   - Consider clustering for horizontal scaling

5. **Features**:
   - Add more node types
   - Implement conditional branches
   - Add loop/iterator nodes
   - Webhook triggers
   - Scheduled execution
   - Version control for workflows

## File Organization Philosophy

- **Separation of Concerns**: Database, routes, and execution are separate
- **Type Safety**: All major data structures are typed
- **Minimal Dependencies**: Only essential packages included
- **Clear Structure**: Easy to understand and extend
- **Frontend/Backend Separation**: Can be deployed independently
