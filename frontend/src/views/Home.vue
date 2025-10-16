<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
    <div class="max-w-6xl mx-auto px-6">
      <!-- Hero -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4">Workflow Automation Made Simple</h1>
        <p class="text-lg text-gray-400 mb-8">Create and execute workflows without leaving your browser</p>
        <router-link
          to="/editor"
          class="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition"
        >
          + New Workflow
        </router-link>
      </div>

      <!-- Workflows List -->
      <div class="grid gap-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">Your Workflows</h2>
          <button
            @click="loadWorkflows"
            class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
          >
            Refresh
          </button>
        </div>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-400">Loading workflows...</div>
        </div>

        <div v-else-if="workflows.length === 0" class="text-center py-12">
          <div class="text-gray-400">No workflows yet. Create one to get started!</div>
        </div>

        <div v-else class="grid gap-4">
          <div
            v-for="workflow in workflows"
            :key="workflow.id"
            class="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-lg mb-1">{{ workflow.name }}</h3>
                <p v-if="workflow.description" class="text-sm text-gray-400 mb-3">
                  {{ workflow.description }}
                </p>
                <div class="flex gap-2 text-xs text-gray-500">
                  <span>{{ workflow.nodes?.length || 0 }} nodes</span>
                  <span>•</span>
                  <span>Created {{ formatDate(workflow.created_at) }}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <router-link
                  :to="`/workflow/${workflow.id}`"
                  class="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm transition"
                >
                  Edit
                </router-link>
                <button
                  @click="openWorkflow(workflow.id)"
                  class="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm transition"
                >
                  Run
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import { useRouter } from 'vue-router'

const store = useWorkflowStore()
const router = useRouter()

onMounted(() => {
  loadWorkflows()
})

const loadWorkflows = () => {
  store.loadWorkflows()
}

const openWorkflow = (id: string) => {
  router.push(`/workflow/${id}`)
}

const formatDate = (date?: string) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString()
}
</script>
