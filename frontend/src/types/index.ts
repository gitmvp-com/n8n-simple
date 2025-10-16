export interface NodeConfig {
  id: string
  type: 'start' | 'code' | 'http' | 'output'
  label: string
  position: { x: number; y: number }
  data: Record<string, any>
}

export interface Connection {
  source: string
  target: string
}

export interface Workflow {
  id: string
  name: string
  description?: string
  nodes: NodeConfig[]
  connections: Connection[]
  active?: boolean
  created_at?: string
  updated_at?: string
}

export interface ExecutionResult {
  id: string
  workflowId: string
  status: 'running' | 'success' | 'error'
  inputData?: any
  outputData?: any
  error?: string
  startedAt?: string
  completedAt?: string
}
