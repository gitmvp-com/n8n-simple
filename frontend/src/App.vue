<template>
  <div id="app" class="h-screen w-screen flex flex-col bg-gray-900 text-white">
    <header class="bg-gray-800 border-b border-gray-700 p-4 shadow-lg">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="text-2xl font-bold">✨ n8n MVP</div>
          <div class="text-sm text-gray-400">Workflow Automation</div>
        </div>
        <nav class="flex gap-4">
          <router-link to="/" class="px-4 py-2 rounded hover:bg-gray-700 transition">Home</router-link>
          <router-link to="/editor" class="px-4 py-2 rounded hover:bg-gray-700 transition">Editor</router-link>
        </nav>
      </div>
    </header>
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
</style>
