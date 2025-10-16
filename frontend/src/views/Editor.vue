<template>
  <div class="flex h-full bg-gray-900">
    <!-- Sidebar -->
    <div class="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
      <div class="mb-6">
        <input
          v-model="workflowName"
          type="text"
          placeholder="Workflow name"
          class="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-500 text-sm mb-2"
        />
        <button
          @click="saveWorkflow"
          class="w-full px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-sm font-semibold transition"
        >
          Save Workflow
        </button>
      </div>

      <div class="mb-6">
        <h3 class="font-semibold mb-3 text-sm">Node Types</h3>
        <div class="space-y-2">
          <div
            v-for="nodeType in nodeTypes"
            :key="nodeType"
            draggable
            @dragstart="startDrag(nodeType)"
            class="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 cursor-move text-sm transition"
          >
            {{ nodeType }}
          </div>
        </div>
      </div>

      <div class="mb-6" v-if="selectedNode">
        <h3 class="font-semibold mb-3 text-sm">Node Config</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold mb-1">Label</label>
            <input
              v-model="selectedNode.label"
              type="text"
              class="w-full px-2 py-1 rounded bg-gray-700 text-white text-sm"
            />
          </div>
          <div v-if="selectedNode.type === 'code'">
            <label class="block text-xs font-semibold mb-1">Code</label>
            <textarea
              v-model="selectedNode.data.code"
              class="w-full px-2 py-1 rounded bg-gray-700 text-white text-sm font-mono h-32"
            />
          </div>
          <div v-if="selectedNode.type === 'http'">
            <label class="block text-xs font-semibold mb-1">URL</label>
            <input
              v-model="selectedNode.data.url"
              type="text"
              class="w-full px-2 py-1 rounded bg-gray-700 text-white text-sm"
            />
            <label class="block text-xs font-semibold mb-1 mt-2">Method</label>
            <select
              v-model="selectedNode.data.method"
              class="w-full px-2 py-1 rounded bg-gray-700 text-white text-sm"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-700 pt-4">
        <button
          @click="executeWorkflow"
          class="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition mb-2"
        >
          ▶ Execute
        </button>
        <button
          @click="clearCanvas"
          class="w-full px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm transition"
        >
          Clear Canvas
        </button>
      </div>
    </div>

    <!-- Canvas -->
    <div
      class="flex-1 bg-gray-900 relative overflow-auto cursor-crosshair"
      @drop="handleDrop"
      @dragover="$event.preventDefault()"
      @click="deselectNode"
    >
      <svg class="absolute inset-0 w-full h-full pointer-events-none" v-if="nodes.length">
        <line
          v-for="(conn, idx) in connections"
          :key="`line-${idx}`"
          :x1="getNodePosition(conn.source).x + 60"
          :y1="getNodePosition(conn.source).y + 30"
          :x2="getNodePosition(conn.target).x"
          :y2="getNodePosition(conn.target).y + 30"
          stroke="#4b5563"
          stroke-width="2"
        />
      </svg>

      <div
        v-for="node in nodes"
        :key="node.id"
        :style="{
          left: node.position.x + 'px',
          top: node.position.y + 'px',
        }"
        @click.stop="selectNode(node)"
        @dragstart="startDragNode(node, $event)"
        draggable
        class="absolute w-32 rounded bg-gray-800 border-2 cursor-move"
        :class="selectedNode?.id === node.id ? 'border-blue-500' : 'border-gray-700'"
      >
        <div class="px-3 py-2 text-sm font-semibold">{{ node.label }}</div>
        <div class="px-3 pb-2 text-xs text-gray-500 flex justify-between">
          <span>{{ node.type }}</span>
          <button
            @click.stop="deleteNode(node.id)"
            class="text-red-400 hover:text-red-300"
          >
            ✗
          </button>
        </div>
      </div>
    </div>

    <!-- Output Panel -->
    <div class="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
      <h3 class="font-semibold mb-4">Execution Output</h3>
      <div v-if="execution" class="space-y-4">
        <div>
          <span class="text-xs font-semibold text-gray-400">Status:</span>
          <span
            class="ml-2"
            :class="{
              'text-yellow-400': execution.status === 'running',
              'text-green-400': execution.status === 'success',
              'text-red-400': execution.status === 'error',
            }"
          >
            {{ execution.status }}
          </span>
        </div>
        <div v-if="execution.outputData">
          <span class="text-xs font-semibold text-gray-400">Output:</span>
          <pre class="mt-2 text-xs bg-gray-900 p-2 rounded overflow-auto">{{ JSON.stringify(execution.outputData, null, 2) }}</pre>
        </div>
        <div v-if="execution.error" class="text-red-400 text-sm">
          <span class="font-semibold">Error:</span>
          {{ execution.error }}
        </div>
      </div>
      <div v-else class="text-gray-500 text-sm">No execution yet</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'
import { v4 as uuidv4 } from 'uuid'
import { getExecution, fetchWorkflow } from '@/api'
import type { NodeConfig, Connection } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useWorkflowStore()

const nodes = ref<NodeConfig[]>([])
const connections = ref<Connection[]>([])
const workflowName = ref('New Workflow')
const selectedNode = ref<NodeConfig | null>(null)
const draggedNodeType = ref<string | null>(null)
const execution = ref<any>(null)
const nodeTypes = ['start', 'code', 'http', 'output']

const getNodePosition = (nodeId: string) => {
  const node = nodes.value.find(n => n.id === nodeId)
  return node?.position || { x: 0, y: 0 }
}

onMounted(async () => {
  const workflowId = route.params.id as string
  if (workflowId) {
    try {
      const workflow = await fetchWorkflow(workflowId)
      nodes.value = workflow.nodes || []
      connections.value = workflow.connections || []
      workflowName.value = workflow.name
      store.currentWorkflow = workflow
    } catch (error) {
      console.error('Failed to load workflow:', error)
    }
  } else {
    // Create a start node by default
    const startNode: NodeConfig = {
      id: uuidv4(),
      type: 'start',
      label: 'Start',
      position: { x: 50, y: 50 },
      data: {},
    }
    nodes.value.push(startNode)
  }
})

const startDrag = (nodeType: string) => {
  draggedNodeType.value = nodeType
}

const startDragNode = (node: NodeConfig, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('nodeId', node.id)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (!draggedNodeType.value) return

  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const node: NodeConfig = {
    id: uuidv4(),
    type: draggedNodeType.value as any,
    label: `${draggedNodeType.value[0].toUpperCase()}${draggedNodeType.value.slice(1)}`,
    position: { x, y },
    data: draggedNodeType.value === 'code' ? { code: '' } : draggedNodeType.value === 'http' ? { url: '', method: 'GET' } : {},
  }

  nodes.value.push(node)
  draggedNodeType.value = null
  selectedNode.value = node
}

const selectNode = (node: NodeConfig) => {
  selectedNode.value = node
}

const deselectNode = () => {
  selectedNode.value = null
}

const deleteNode = (nodeId: string) => {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  connections.value = connections.value.filter(
    c => c.source !== nodeId && c.target !== nodeId
  )
  if (selectedNode.value?.id === nodeId) {
    selectedNode.value = null
  }
}

const clearCanvas = () => {
  nodes.value = []
  connections.value = []
  selectedNode.value = null
}

const saveWorkflow = async () => {
  if (store.currentWorkflow?.id) {
    await store.updateCurrent(nodes.value, connections.value)
  } else {
    const workflow = await store.createNew(workflowName.value)
    await store.updateCurrent(nodes.value, connections.value)
    router.push(`/workflow/${workflow.id}`)
  }
}

const executeWorkflow = async () => {
  try {
    const result = await store.executeWorkflow({})
    execution.value = result

    // Poll for completion
    const maxAttempts = 30
    let attempts = 0
    while (execution.value?.status === 'running' && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 500))
      const updated = await getExecution(result.id)
      execution.value = updated
      attempts++
    }
  } catch (error) {
    console.error('Execution failed:', error)
  }
}
</script>
