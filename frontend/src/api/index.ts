import axios from 'axios'
import type { Workflow } from '@/types'

const API_BASE = 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function fetchWorkflows(): Promise<Workflow[]> {
  const response = await api.get('/workflows')
  return response.data
}

export async function fetchWorkflow(id: string): Promise<Workflow> {
  const response = await api.get(`/workflows/${id}`)
  return response.data
}

export async function createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
  const response = await api.post('/workflows', data)
  return response.data
}

export async function updateWorkflowData(id: string, data: Workflow): Promise<Workflow> {
  const response = await api.put(`/workflows/${id}`, data)
  return response.data
}

export async function deleteWorkflowData(id: string): Promise<void> {
  await api.delete(`/workflows/${id}`)
}

export async function executeWorkflowData(id: string, inputData?: any): Promise<any> {
  const response = await api.post(`/executions/${id}`, { inputData })
  return response.data
}

export async function getExecution(id: string): Promise<any> {
  const response = await api.get(`/executions/${id}`)
  return response.data
}

export async function getExecutions(workflowId: string): Promise<any[]> {
  const response = await api.get(`/workflows/${workflowId}/executions`)
  return response.data
}
