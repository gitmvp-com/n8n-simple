# n8n MVP - Setup & Development Guide

## Overview

This is a minimal viable version of n8n - a workflow automation platform. It includes:

- **Backend API** built with Express.js and TypeScript
- **Frontend UI** built with Vue 3 and Vite
- **SQLite Database** for data persistence
- **Workflow Execution Engine** that runs nodes sequentially

## Installation

### 1. Install Backend Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `sqlite3` - Database
- `axios` - HTTP client for API calls
- `uuid` - Generate unique IDs
- TypeScript development tools

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

This installs:
- `vue` - UI framework
- `vite` - Development server and build tool
- `pinia` - State management
- `axios` - HTTP client
- `tailwindcss` - Styling utility framework

## Development

### Start Development Servers

Run both backend and frontend in parallel:

```bash
npm run dev
```

This will start:
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173

The frontend development server proxies `/api` requests to the backend.

### Available Scripts

#### Backend
- `npm run dev:backend` - Start backend in development mode with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run typecheck` - Check TypeScript types without emitting files

#### Frontend
- `npm run dev:frontend` - Start Vite dev server
- `npm run build:frontend` - Build production frontend (creates `frontend/dist`)

#### Full Stack
- `npm run dev` - Run both backend and frontend
- `npm run build` - Build everything
- `npm start` - Run production build (requires build first)

## Project Structure

```
n8n-simple/
├── src/
│   ├── backend/
│   │   ├── index.ts              # Main server file
│   │   ├── routes/
│   │   │   ├── workflows.ts        # Workflow CRUD endpoints
│   │   │   └── executions.ts       # Workflow execution endpoints
│   │   ├── models/
│   │   │   └── database.ts         # SQLite database operations
│   │   └── engine/
│   │       └── executor.ts         # Workflow execution logic
│   └── shared/
│       └── types.ts            # Shared TypeScript types
├── frontend/
│   ├── src/
│   │   ├── App.vue              # Root component
│   │   ├── main.ts             # Vue app entry point
│   │   ├── style.css           # Global styles
│   │   ├── api/
│   │   │   └── index.ts           # Axios API client
│   │   ├── stores/
│   │   │   └── workflow.ts        # Pinia store for workflows
│   │   ├── views/
│   │   │   ├── Home.vue           # Workflows list page
│   │   │   └── Editor.vue         # Workflow editor
│   │   ├── router/
│   │   │   └── index.ts           # Vue Router setup
│   │   └─┐ types/
│   │       └── index.ts           # TypeScript types
│   ├── index.html          # HTML entry point
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript config
│   ├── tailwind.config.js  # Tailwind CSS config
│   ├── postcss.config.js   # PostCSS config
│   └── package.json        # Frontend dependencies
├── tsconfig.json        # Backend TypeScript config
├── package.json         # Backend dependencies
├── .gitignore
└── README.md
```

## API Endpoints

### Workflows
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/:id` - Get workflow details
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `GET /api/workflows/:id/executions` - Get workflow execution history

### Executions
- `POST /api/executions/:workflowId` - Execute workflow
- `GET /api/executions/:id` - Get execution status and results

### Health
- `GET /health` - Server health check
- `GET /api/health` - API health check

## Node Types

The workflow engine supports these node types:

### 1. Start Node
- Entry point for the workflow
- Passes input data to the next node
- Each workflow must have exactly one start node

### 2. HTTP Node
- Makes HTTP requests to external APIs
- Configuration:
  - `url` - Target URL
  - `method` - HTTP method (GET, POST, PUT, DELETE)
  - `headers` - Request headers
  - `body` - Request body (for POST/PUT)
- Returns response data

### 3. Code Node
- Executes JavaScript code
- Configuration:
  - `code` - JavaScript code to execute
- Has access to `input` (previous node output) and `context` (execution context)
- Example: `return input.value * 2`

### 4. Output Node
- Marks the workflow output
- Optionally maps input data using path expressions
- Returns the final result

## Database

The application uses SQLite3 with two tables:

### Workflows Table
```sql
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  nodes TEXT NOT NULL,          -- JSON array
  connections TEXT NOT NULL,    -- JSON array
  active BOOLEAN DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME
)
```

### Executions Table
```sql
CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- running, success, error
  input_data TEXT,              -- JSON
  output_data TEXT,             -- JSON
  error TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  FOREIGN KEY(workflow_id) REFERENCES workflows(id)
)
```

## Workflow Execution Flow

1. **Start Node** - Initialize with input data
2. **Sequential Execution** - Execute nodes in order following connections
3. **Data Passing** - Each node receives output from previous node
4. **Error Handling** - If a node fails, execution stops with error
5. **Output Node** - Return final result
6. **Status Update** - Update execution record with status and results

## Dependencies

### Backend
- **express** (5.1.0) - Web server framework
- **helmet** (8.1.0) - Security middleware
- **sqlite3** (5.1.7) - Database
- **axios** (1.12.0) - HTTP client
- **uuid** (9.0.1) - Unique ID generation
- **typescript** (5.3.3) - TypeScript compiler

### Frontend
- **vue** (3.3.11) - UI framework
- **vite** (5.1.0) - Build tool
- **pinia** (2.1.7) - State management
- **vue-router** (4.3.2) - Routing
- **tailwindcss** (3.4.1) - CSS framework
- **axios** (1.12.0) - HTTP client

## Extending the MVP

### Adding New Node Types

1. Add type to `frontend/src/types/index.ts`
2. Add case in `src/backend/engine/executor.ts` executeNode function
3. Add UI form in `frontend/src/views/Editor.vue` config section

### Adding Features

- **Conditional Logic** - Add condition nodes that branch execution
- **Loops** - Add loop nodes for iterating over data
- **More Integrations** - Add nodes for specific services (Slack, GitHub, etc.)
- **Webhooks** - Add webhook trigger nodes
- **Scheduling** - Add cron job scheduling for workflows
- **Error Handling** - Add error handlers and retry logic

## Troubleshooting

### Backend fails to start
- Check Node.js version: `node --version` (needs >= 22.0.0)
- Check port 3000 is not in use
- Check database folder exists: `mkdir -p data`

### Frontend won't connect to backend
- Check backend is running on http://localhost:3000
- Check CORS headers are being sent (see middleware in `src/backend/index.ts`)
- Check browser console for errors

### Workflows don't execute
- Check workflow has a Start node
- Check all nodes have valid configuration
- Check execution logs in the output panel
- Look at browser network tab for API errors

## Performance Notes

- Workflows execute sequentially (one node at a time)
- HTTP requests have 30 second timeout
- Code execution uses `new Function()` which is less secure than proper sandboxing
- For production, consider:
  - Worker threads for CPU-intensive operations
  - Connection pooling for database
  - Caching for frequently used workflows
  - Rate limiting on API endpoints
  - Proper security sandboxing for code nodes

## Next Steps

1. Experiment with creating workflows using the UI
2. Test the HTTP and Code nodes
3. Explore the database using SQLite tools
4. Try extending with new node types
5. Consider deploying to a server
