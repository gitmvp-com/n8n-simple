import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Workflow, NodeConfig, Connection } from '@/types'
import { createWorkflow, fetchWorkflows, updateWorkflowData, deleteWorkflowData, executeWorkflowData } from '@/api'

export const useWorkflowStore = defineStore('workflow', () => {
  const workflows = ref<Workflow[]>([])
  const currentWorkflow = ref<Workflow | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadWorkflows = async () => {
    loading.value = true
    try {
      const data = await fetchWorkflows()
      workflows.value = data
      error.value = null
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const createNew = async (name: string, description?: string) => {
    try {
      const workflow = await createWorkflow({ name, description, nodes: [], connections: [] })
      workflows.value.push(workflow)
      currentWorkflow.value = workflow
      return workflow
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  const updateCurrent = async (nodes: NodeConfig[], connections: Connection[]) => {
    if (!currentWorkflow.value) return
    try {
      const updated = await updateWorkflowData(currentWorkflow.value.id, {
        ...currentWorkflow.value,
        nodes,
        connections,
      })
      currentWorkflow.value = updated
      const idx = workflows.value.findIndex(w => w.id === updated.id)
      if (idx >= 0) workflows.value[idx] = updated
    } catch (e: any) {
      error.value = e.message
    }
  }

  const executeWorkflow = async (inputData?: any) => {
    if (!currentWorkflow.value) return
    try {
      const result = await executeWorkflowData(currentWorkflow.value.id, inputData)
      return result
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  const deleteCurrent = async () => {
    if (!currentWorkflow.value) return
    try {
      await deleteWorkflowData(currentWorkflow.value.id)
      workflows.value = workflows.value.filter(w => w.id !== currentWorkflow.value!.id)
      currentWorkflow.value = null
    } catch (e: any) {
      error.value = e.message
    }
  }

  return {
    workflows,
    currentWorkflow,
    loading,
    error,
    loadWorkflows,
    createNew,
    updateCurrent,
    executeWorkflow,
    deleteCurrent,
  }
})
