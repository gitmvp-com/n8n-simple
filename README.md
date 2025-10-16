# n8n MVP

A minimal viable version of [n8n](https://n8n.io) - a workflow automation platform.

This MVP provides:
- **Simple Workflow Editor UI** - Visual workflow builder with basic nodes
- **Workflow Execution Engine** - Execute workflows with simple node types
- **REST API** - Create, update, and run workflows
- **SQLite Database** - Persistent workflow storage

## Quick Start

### Prerequisites
- Node.js >= 22.0.0
- npm >= 10.0.0

### Installation

```bash
git clone https://github.com/gitmvp-com/n8n-simple.git
cd n8n-simple
npm install
cd frontend && npm install && cd ..
```

### Development

Run both backend and frontend in parallel:

```bash
npm run dev
```

Backend: http://localhost:3000
Frontend: http://localhost:5173

### Build

```bash
npm run build
npm run build:frontend
```

### Production

```bash
npm start
```

## Project Structure

```
n8n-simple/
├── src/
│   ├── backend/
│   │   ├── index.ts           # Express server setup
│   │   ├── routes/            # API routes
│   │   ├── models/            # Database models
│   │   └── engine/            # Workflow execution engine
│   └── shared/                # Shared types
└── frontend/
    ├── src/
    │   ├── components/        # Vue components
    │   ├── stores/            # Pinia stores
    │   ├── views/             # Page components
    │   └── App.vue
    └── package.json
```

## API Endpoints

### Workflows
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow details
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Executions
- `POST /api/executions/:workflowId` - Run workflow
- `GET /api/executions/:id` - Get execution status
- `GET /api/workflows/:id/executions` - Get workflow executions

## Features

### Node Types
1. **Start Node** - Entry point for workflow
2. **HTTP Node** - Make HTTP requests
3. **Code Node** - Execute JavaScript code
4. **Output Node** - Display results

### Workflow Editor
- Drag-and-drop node placement
- Node configuration panel
- Real-time workflow execution

### Execution
- Sequential node execution
- Data passing between nodes
- Error handling
- Execution status tracking

## Technologies Used

### Backend
- **Express.js** - Web server framework
- **SQLite** - Database
- **TypeScript** - Type safety
- **Axios** - HTTP client

### Frontend
- **Vue 3** - UI framework
- **Vite** - Build tool
- **Pinia** - State management
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## License

MIT
