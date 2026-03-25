<template>
  <div class="queue-item">
    <div class="queue-item-content">
      <div class="queue-item-header">
        <h4>{{ item.video_name }}</h4>
        <a-tag :color="statusColor">
          {{ statusText }}
        </a-tag>
      </div>

      <div class="queue-item-details">
        <p><strong>Output:</strong> {{ item.output_path }}</p>
        <p><strong>Language:</strong> {{ item.settings.general.lang }}</p>
        <p v-if="item.settings.general.time_start">
          <strong>Time Range:</strong> {{ item.settings.general.time_start }}
          <span v-if="item.settings.general.time_end">
            - {{ item.settings.general.time_end }}</span>
        </p>
      </div>

      <!-- Progress Bar -->
      <div
        v-if="item.status === 'processing' && item.progress"
        class="progress-section"
      >
        <a-progress
          :percent="item.progress.percentage"
          :status="item.progress.percentage === 100 ? 'success' : 'active'"
        />
        <p class="progress-text">
          Frame {{ item.progress.current_frame }} /
          {{ item.progress.total_frames }}
          <span v-if="item.progress.text_length">
            ({{ item.progress.text_length }} chars)
          </span>
        </p>
      </div>

      <!-- Error Message -->
      <a-alert
        v-if="item.error"
        type="error"
        :message="item.error"
        show-icon
        style="margin-top: 10px"
      />

      <!-- Success Message with Download -->
      <a-alert
        v-if="item.status === 'completed'"
        type="success"
        message="Processing completed successfully!"
        show-icon
        style="margin-top: 10px"
      >
        <template #action>
          <a-button type="link" size="small" @click="downloadOutput">
            <template #icon>
              <DownloadOutlined />
            </template>
            Download SRT
          </a-button>
        </template>
      </a-alert>

      <!-- Timestamps -->
      <div class="queue-item-timestamps">
        <small>Created: {{ formatDate(item.created_at) }}</small>
        <small v-if="item.started_at">Started: {{ formatDate(item.started_at) }}</small>
        <small v-if="item.completed_at">Completed: {{ formatDate(item.completed_at) }}</small>
      </div>
    </div>

    <!-- Actions -->
    <div class="queue-item-actions">
      <a-space direction="vertical">
        <a-button
          v-if="item.status === 'failed' || item.status === 'cancelled'"
          type="primary"
          size="small"
          @click="retryItem"
        >
          <template #icon>
            <RedoOutlined />
          </template>
          Retry
        </a-button>
        <a-button
          v-if="item.status === 'processing'"
          danger
          size="small"
          @click="stopItem"
        >
          <template #icon>
            <StopOutlined />
          </template>
          Stop
        </a-button>
        <a-button
          v-if="item.status !== 'processing'"
          danger
          size="small"
          @click="removeItem"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          Remove
        </a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  RedoOutlined,
  StopOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons-vue'
import type { QueueItem as QueueItemType } from '@/types/queue'
import { useQueueStore } from '@/stores/queue'

interface Props {
  item: QueueItemType
}

const props = defineProps<Props>()
const queueStore = useQueueStore()

const statusColor = computed(() => {
  const colors: Record<string, string> = {
    pending: 'default',
    processing: 'processing',
    completed: 'success',
    failed: 'error',
    cancelled: 'warning',
  }
  return colors[props.item.status] || 'default'
})

const statusText = computed(() => {
  const texts: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  }
  return texts[props.item.status] || props.item.status
})

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString()
}

const retryItem = () => {
  queueStore.retryItem(props.item.id)
  message.info('Item queued for retry')
}

const stopItem = () => {
  queueStore.stopItem(props.item.id)
  message.info('Item stopped')
}

const removeItem = () => {
  queueStore.removeFromQueue(props.item.id)
  message.success('Item removed from queue')
}

const downloadOutput = async () => {
  try {
    // Extract filename from output path
    const filename = props.item.output_path.split(/[/\\]/).pop() || 'output.srt'

    // Download from backend
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/download?path=${encodeURIComponent(props.item.output_path)}`,
    )

    if (!response.ok) {
      throw new Error('Failed to download file')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    message.success('File downloaded successfully')
  } catch (error) {
    console.error('[QueueItem] Error downloading file:', error)
    message.error(
      error instanceof Error ? error.message : 'Failed to download file',
    )
  }
}
</script>

<style scoped lang="less">
.queue-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  padding: 10px;
  background: #fafafa;
  border-radius: 4px;
  transition: background 0.3s;

  &:hover {
    background: #f0f0f0;
  }
}

.queue-item-content {
  flex: 1;
  margin-right: 20px;
}

.queue-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  h4 {
    margin: 0;
    font-size: 16px;
  }
}

.queue-item-details {
  margin-bottom: 10px;

  p {
    margin: 5px 0;
    font-size: 14px;
    color: #666;
  }
}

.progress-section {
  margin: 15px 0;
}

.progress-text {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #666;
}

.queue-item-timestamps {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e8e8e8;

  small {
    display: block;
    margin: 3px 0;
    color: #999;
  }
}

.queue-item-actions {
  flex-shrink: 0;
}
</style>
