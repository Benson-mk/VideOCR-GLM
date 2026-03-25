<template>
  <div class="queue-view-container">
    <a-card title="Queue" :bordered="false">
      <!-- Queue Controls -->
      <a-space class="queue-controls" style="margin-bottom: 20px">
        <a-button
          type="primary"
          :disabled="!queueStore.canStartProcessing"
          @click="startProcessing"
        >
          <template #icon>
            <PlayCircleOutlined />
          </template>
          Start Processing
        </a-button>
        <a-button
          :disabled="!queueStore.canStopProcessing"
          @click="stopProcessing"
        >
          <template #icon>
            <PauseCircleOutlined />
          </template>
          Stop Processing
        </a-button>
        <a-button @click="clearCompleted">
          <template #icon>
            <DeleteOutlined />
          </template>
          Clear Completed
        </a-button>
        <a-button @click="clearFailed">
          <template #icon>
            <DeleteOutlined />
          </template>
          Clear Failed
        </a-button>
        <a-button danger @click="clearAll">
          <template #icon>
            <ClearOutlined />
          </template>
          Clear All
        </a-button>
      </a-space>

      <!-- Parallel Workers -->
      <a-form-item label="Parallel Workers" style="margin-bottom: 20px">
        <a-input-number
          v-model:value="parallelWorkers"
          :min="1"
          :max="10"
          @change="onParallelWorkersChange"
        />
      </a-form-item>

      <!-- Queue Stats -->
      <a-row :gutter="16" style="margin-bottom: 20px">
        <a-col :span="6">
          <a-statistic
            title="Pending"
            :value="queueStore.pendingItems.length"
          />
        </a-col>
        <a-col :span="6">
          <a-statistic
            title="Processing"
            :value="queueStore.processingItems.length"
          />
        </a-col>
        <a-col :span="6">
          <a-statistic
            title="Completed"
            :value="queueStore.completedItems.length"
          />
        </a-col>
        <a-col :span="6">
          <a-statistic title="Failed" :value="queueStore.failedItems.length" />
        </a-col>
      </a-row>

      <!-- Queue List -->
      <a-list
        :data-source="queueStore.items"
        :locale="{ emptyText: 'No videos in queue' }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <QueueItem :item="item" />
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  ClearOutlined,
} from '@ant-design/icons-vue'
import { useQueueStore } from '@/stores/queue'
import QueueItem from '@/components/QueueItem.vue'

const queueStore = useQueueStore()
const parallelWorkers = ref(queueStore.parallelWorkers)

let saveTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  // Load queue from localStorage
  queueStore.loadQueue()

  // Start polling for queue updates
  queueStore.startPolling()

  // Sync with backend to get current state
  await queueStore.syncQueue()

  // Update parallel workers ref
  parallelWorkers.value = queueStore.parallelWorkers

  // Set up auto-save with debouncing
  setupAutoSave()
})

onUnmounted(() => {
  // Stop polling when component unmounts
  queueStore.stopPolling()

  // Clear any pending save timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})

// Set up auto-save for queue state changes
const setupAutoSave = () => {
  // Watch for changes in the queue store
  watch(
    () => queueStore.$state,
    () => {
      // Debounce save to avoid excessive writes
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }

      saveTimeout = setTimeout(() => {
        queueStore.saveQueue()
      }, 500)
    },
    { deep: true },
  )
}

const startProcessing = () => {
  queueStore.startProcessing()
  message.info('Processing started')
}

const stopProcessing = () => {
  queueStore.stopProcessing()
  message.info('Processing stopped')
}

const clearCompleted = () => {
  queueStore.clearCompleted()
  message.success('Completed items cleared')
}

const clearFailed = () => {
  queueStore.clearFailed()
  message.success('Failed items cleared')
}

const clearAll = () => {
  queueStore.clearAll()
  message.success('All items cleared')
}

const onParallelWorkersChange = (value: any) => {
  if (value !== null && value !== undefined) {
    queueStore.setParallelWorkers(Number(value))
  }
}
</script>

<style scoped lang="less">
.queue-view-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.queue-controls {
  display: flex;
  gap: 8px;
}
</style>
