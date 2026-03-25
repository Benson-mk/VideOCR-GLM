/**
 * Queue Management Store
 * Manages video processing queue by syncing with backend queue API
 */

import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import type { QueueItem, QueueItemStatus, ProgressInfo } from '@/types/queue'
import type { VideoSettings } from '@/types/cli'
import { buildCLIParameters } from '@/utils/cliUtils'

interface QueueState {
  items: QueueItem[]
  isProcessing: boolean
  parallelWorkers: number
  activeWorkers: number
  pollingInterval: number | null
}

// Storage key for localStorage
const QUEUE_STORAGE_KEY = 'videocr-queue'

// Interface for persisted queue data
interface PersistedQueueData {
  items: QueueItem[]
  isProcessing: boolean
  parallelWorkers: number
  activeWorkers: number
  savedAt: string
}

export const useQueueStore = defineStore('queue', {
  state: (): QueueState => ({
    items: [],
    isProcessing: false,
    parallelWorkers: 1,
    activeWorkers: 0,
    pollingInterval: null,
  }),

  getters: {
    pendingItems: (state) => state.items.filter(item => item.status === 'pending'),
    processingItems: (state) => state.items.filter(item => item.status === 'processing'),
    completedItems: (state) => state.items.filter(item => item.status === 'completed'),
    failedItems: (state) => state.items.filter(item => item.status === 'failed'),
    
    canStartProcessing: (state) => 
      !state.isProcessing && state.items.some(item => item.status === 'pending'),
    
    canStopProcessing: (state) => state.isProcessing,
    
    hasAvailableWorkers: (state) => state.activeWorkers < state.parallelWorkers,
  },

  actions: {
    /**
     * Add a video to the queue
     */
    async addToQueue(videoPath: string, settings: VideoSettings): Promise<QueueItem> {
      const videoName = videoPath.split(/[/\\]/).pop() || videoPath
      const lastSeparator = Math.max(videoPath.lastIndexOf('/'), videoPath.lastIndexOf('\\'))
      const outputDir = settings.general.output_dir || (lastSeparator !== -1 ? videoPath.substring(0, lastSeparator) : '.')
      const outputName = videoName.replace(/\.[^/.]+$/, '') + '.srt'
      const outputPath = `${outputDir}/${outputName}`

      const item: QueueItem = {
        id: uuidv4(),
        video_path: videoPath,
        video_name: videoName,
        output_path: outputPath,
        settings,
        status: 'pending',
        progress: null,
        error: null,
        created_at: new Date(),
        started_at: null,
        completed_at: null,
      }

      // Add to backend queue
      try {
        const parameters = buildCLIParameters({ ...item, id: item.id } as QueueItem)
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ parameters }),
        })

        if (!response.ok) {
          throw new Error('Failed to add item to queue')
        }

        const result = await response.json()
        
        // Update item with backend ID
        item.jobId = result.jobId
        
        // Add to local state
        this.items.push(item)
        
        // Sync with backend
        await this.syncQueue()
        
        return item
      } catch (error) {
        console.error('[Queue] Error adding item to queue:', error)
        throw error
      }
    },

    /**
     * Remove an item from the queue
     */
    async removeFromQueue(itemId: string): Promise<void> {
      const item = this.items.find(i => i.id === itemId)
      
      if (!item) {
        return
      }

      // If item has a backend job ID, remove from backend
      if (item.jobId) {
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/${item.jobId}`, {
            method: 'DELETE',
          })
        } catch (error) {
          console.error('[Queue] Error removing item from backend:', error)
        }
      }

      // Remove from local state
      const index = this.items.findIndex(i => i.id === itemId)
      if (index !== -1) {
        this.items.splice(index, 1)
      }
    },

    /**
     * Clear completed items from the queue
     */
    async clearCompleted(): Promise<void> {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/clear-completed`, {
          method: 'POST',
        })
        
        await this.syncQueue()
      } catch (error) {
        console.error('[Queue] Error clearing completed items:', error)
      }
    },

    /**
     * Clear failed items from the queue
     */
    async clearFailed(): Promise<void> {
      // Filter out failed items locally
      this.items = this.items.filter(item => item.status !== 'failed')
    },

    /**
     * Clear all items from the queue
     */
    async clearAll(): Promise<void> {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/clear-all`, {
          method: 'POST',
        })
        
        await this.syncQueue()
      } catch (error) {
        console.error('[Queue] Error clearing all items:', error)
      }
    },

    /**
     * Update item status
     */
    updateItemStatus(itemId: string, status: QueueItemStatus): void {
      const item = this.items.find(i => i.id === itemId)
      if (item) {
        item.status = status
        
        if (status === 'processing' && !item.started_at) {
          item.started_at = new Date()
        }
        
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          item.completed_at = new Date()
        }
      }
    },

    /**
     * Update item progress
     */
    updateItemProgress(itemId: string, progress: ProgressInfo): void {
      const item = this.items.find(i => i.id === itemId)
      if (item) {
        item.progress = progress
      }
    },

    /**
     * Update item error
     */
    updateItemError(itemId: string, error: string): void {
      const item = this.items.find(i => i.id === itemId)
      if (item) {
        item.error = error
      }
    },

    /**
     * Stop processing a specific item
     */
    async stopItem(itemId: string): Promise<void> {
      const item = this.items.find(i => i.id === itemId)
      
      if (item && item.jobId) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/stop/${item.jobId}`, {
            method: 'POST',
          })
          
          if (response.ok) {
            this.updateItemStatus(itemId, 'cancelled')
            await this.syncQueue()
          }
        } catch (error) {
          console.error('[Queue] Error stopping item:', error)
        }
      }
    },

    /**
     * Retry a failed item
     */
    async retryItem(itemId: string): Promise<void> {
      const item = this.items.find(i => i.id === itemId)
      
      if (item && (item.status === 'failed' || item.status === 'cancelled')) {
        try {
          // Call backend retry endpoint
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/retry/${item.jobId}`, {
            method: 'POST',
          })
          
          if (response.ok) {
            // Sync with backend to get updated state
            await this.syncQueue()
          } else {
            throw new Error('Failed to retry item')
          }
        } catch (error) {
          console.error('[Queue] Error retrying item:', error)
          throw error
        }
      }
    },

    /**
     * Start processing the queue
     */
    async startProcessing(): Promise<void> {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/start`, {
          method: 'POST',
        })
        
        await this.syncQueue()
      } catch (error) {
        console.error('[Queue] Error starting processing:', error)
      }
    },

    /**
     * Stop processing the queue
     */
    async stopProcessing(): Promise<void> {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/stop`, {
          method: 'POST',
        })
        
        await this.syncQueue()
      } catch (error) {
        console.error('[Queue] Error stopping processing:', error)
      }
    },

    /**
     * Set parallel workers count
     */
    async setParallelWorkers(count: number): Promise<void> {
      this.parallelWorkers = Math.max(1, Math.min(10, count))
      
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/workers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ count }),
        })
        
        await this.syncQueue()
      } catch (error) {
        console.error('[Queue] Error setting parallel workers:', error)
      }
    },

    /**
     * Sync queue state from backend
     */
    async syncQueue(): Promise<void> {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue`)
        
        if (response.ok) {
          const backendItems = await response.json()
          
          // Map backend items to frontend format
          this.items = backendItems.map((backendItem: any) => {
            // Find existing item by jobId
            const existingItem = this.items.find(i => i.jobId === backendItem.id)
            
            if (existingItem) {
              // Update existing item
              existingItem.status = backendItem.status
              existingItem.progress = backendItem.progress
              existingItem.error = backendItem.result?.error || null
              existingItem.started_at = backendItem.startedAt ? new Date(backendItem.startedAt) : existingItem.started_at
              existingItem.completed_at = backendItem.completedAt ? new Date(backendItem.completedAt) : existingItem.completed_at
              return existingItem
            } else {
              // Create new item from backend data
              return {
                id: backendItem.id,
                jobId: backendItem.id,
                video_path: backendItem.parameters.video_path,
                video_name: backendItem.parameters.video_path.split(/[/\\]/).pop() || backendItem.parameters.video_path,
                output_path: backendItem.parameters.output,
                settings: {
                  general: {
                    lang: backendItem.parameters.lang,
                    output_dir: '',
                    time_start: backendItem.parameters.time_start,
                    time_end: backendItem.parameters.time_end,
                  },
                  advanced: {
                    use_dual_zone: backendItem.parameters.use_dual_zone,
                    crop_zones: [],
                    ocr: {
                      sim_threshold: backendItem.parameters.sim_threshold,
                      max_merge_gap: backendItem.parameters.max_merge_gap,
                      ssim_threshold: backendItem.parameters.ssim_threshold,
                      frames_to_skip: backendItem.parameters.frames_to_skip,
                      post_processing: backendItem.parameters.post_processing,
                      min_subtitle_duration: backendItem.parameters.min_subtitle_duration,
                      ocr_image_max_width: backendItem.parameters.ocr_image_max_width,
                    },
                    image_processing: {
                      brightness_threshold: backendItem.parameters.brightness_threshold,
                      use_fullframe: backendItem.parameters.use_fullframe,
                      subtitle_position: backendItem.parameters.subtitle_position,
                    },
                    ollama: {
                      host: backendItem.parameters.ollama_host,
                      port: backendItem.parameters.ollama_port,
                      model: backendItem.parameters.ollama_model,
                      timeout: backendItem.parameters.ollama_timeout,
                    },
                    system: {
                      allow_system_sleep: backendItem.parameters.allow_system_sleep,
                      parallel_workers: 1,
                    },
                  },
                },
                status: backendItem.status,
                progress: backendItem.progress,
                error: backendItem.result?.error || null,
                created_at: new Date(backendItem.createdAt),
                started_at: backendItem.startedAt ? new Date(backendItem.startedAt) : null,
                completed_at: backendItem.completedAt ? new Date(backendItem.completedAt) : null,
              }
            }
          })
          
          // Update processing state and worker counts
          const stats = await this.getStats()
          this.isProcessing = stats.isProcessing
          this.parallelWorkers = stats.parallelWorkers
          this.activeWorkers = stats.activeWorkers
        }
      } catch (error) {
        console.error('[Queue] Error syncing queue:', error)
      }
    },

    /**
     * Get queue statistics from backend
     */
    async getStats(): Promise<any> {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/stats`)
        
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        console.error('[Queue] Error getting stats:', error)
      }
      
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        stopped: 0,
        parallelWorkers: 1,
        activeWorkers: 0,
        isProcessing: false,
      }
    },

    /**
     * Start polling for queue updates
     */
    startPolling(): void {
      if (this.pollingInterval) {
        return
      }

      // Initial sync
      this.syncQueue()

      // Poll every 2 seconds
      this.pollingInterval = window.setInterval(() => {
        this.syncQueue()
      }, 2000)

      console.log('[Queue] Started polling for queue updates')
    },

    /**
     * Stop polling for queue updates
     */
    stopPolling(): void {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
        console.log('[Queue] Stopped polling for queue updates')
      }
    },

    /**
     * Connect to WebSocket for real-time updates
     */
    connectWebSocket(itemId: string): void {
      const item = this.items.find(i => i.id === itemId)
      
      if (!item || !item.jobId) {
        return
      }

      const ws = new WebSocket(`${import.meta.env.VITE_API_BASE_URL.replace('http', 'ws')}/ws`)

      ws.onopen = () => {
        console.log(`[Queue] WebSocket connected for item ${item.jobId}`)
        // Send connect message
        ws.send(JSON.stringify({
          type: 'connect_item',
          itemId: item.jobId,
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'progress' && data.itemId === item.jobId) {
            // Update progress
            if (data.progress) {
              this.updateItemProgress(itemId, data.progress)
            }
            
            // Update status based on item status
            if (data.status === 'completed') {
              this.updateItemStatus(itemId, 'completed')
              ws.close()
            } else if (data.status === 'failed') {
              this.updateItemStatus(itemId, 'failed')
              if (data.result?.error) {
                this.updateItemError(itemId, data.result.error)
              }
              ws.close()
            } else if (data.status === 'stopped') {
              this.updateItemStatus(itemId, 'cancelled')
              ws.close()
            }
          }
        } catch (error) {
          console.error('[Queue] WebSocket message error:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[Queue] WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log(`[Queue] WebSocket closed for item ${item.jobId}`)
      }
    },

    /**
     * Save queue to localStorage
     */
    saveQueue(): void {
      try {
        const data: PersistedQueueData = {
          items: this.items,
          isProcessing: this.isProcessing,
          parallelWorkers: this.parallelWorkers,
          activeWorkers: this.activeWorkers,
          savedAt: new Date().toISOString(),
        }
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(data))
        console.log('[Queue] Queue saved to localStorage')
      } catch (error) {
        console.error('[Queue] Error saving queue to localStorage:', error)
      }
    },

    /**
     * Load queue from localStorage
     */
    loadQueue(): void {
      try {
        const saved = localStorage.getItem(QUEUE_STORAGE_KEY)
        if (saved) {
          const data: PersistedQueueData = JSON.parse(saved)
          
          // Restore items with proper Date objects
          this.items = data.items.map(item => ({
            ...item,
            created_at: new Date(item.created_at),
            started_at: item.started_at ? new Date(item.started_at) : null,
            completed_at: item.completed_at ? new Date(item.completed_at) : null,
          }))
          
          this.isProcessing = false  // Reset processing state
          this.parallelWorkers = data.parallelWorkers || 1
          this.activeWorkers = 0  // Reset active workers
          
          console.log(`[Queue] Queue loaded from localStorage: ${this.items.length} items`)
          
          // Sync with backend to get actual state
          this.syncQueue()
        }
      } catch (error) {
        console.error('[Queue] Error loading queue from localStorage:', error)
      }
    },

    /**
     * Clear persisted queue from localStorage
     */
    clearPersistedQueue(): void {
      try {
        localStorage.removeItem(QUEUE_STORAGE_KEY)
        console.log('[Queue] Persisted queue cleared from localStorage')
      } catch (error) {
        console.error('[Queue] Error clearing persisted queue:', error)
      }
    },
  },
})