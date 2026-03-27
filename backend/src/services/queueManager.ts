import { v4 as uuidv4 } from 'uuid'
import type { CLIParameters, ProgressInfo, ExecutionResult } from '../types/index.js'
import { cliExecutor } from './cliExecutor.js'

export interface QueueItem {
  id: string
  parameters: CLIParameters
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'stopped'
  progress: ProgressInfo | null
  result: ExecutionResult | null
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
  process: any
  ws: any
  jobId: string | null
}

export class QueueManager {
  private queue: QueueItem[] = []
  private parallelWorkers: number = 1
  private activeWorkers: number = 0
  private isProcessing: boolean = false
  
  // Cleanup settings
  private cleanupEnabled: boolean = true
  private cleanupMaxAge: number = 3600000 // 1 hour in milliseconds
  private cleanupInterval: number = 3600000 // 1 hour in milliseconds
  private cleanupTimer: NodeJS.Timeout | null = null

  /**
   * Set the number of parallel workers
   */
  setParallelWorkers(count: number): void {
    this.parallelWorkers = Math.max(1, Math.min(10, count))
    console.log(`[QueueManager] Parallel workers set to ${this.parallelWorkers}`)
    
    // Try to process more items if we have more workers available
    this.processQueue()
  }

  /**
   * Get the number of parallel workers
   */
  getParallelWorkers(): number {
    return this.parallelWorkers
  }

  /**
   * Get the number of active workers
   */
  getActiveWorkers(): number {
    return this.activeWorkers
  }

  /**
   * Add an item to the queue
   */
  addToQueue(parameters: CLIParameters): QueueItem {
    const itemId = uuidv4()
    const item: QueueItem = {
      id: itemId,
      parameters,
      status: 'pending',
      progress: null,
      result: null,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      process: null,
      ws: null,
      jobId: null,
    }

    this.queue.push(item)
    console.log(`[QueueManager] Added item ${itemId} to queue (total: ${this.queue.length})`)

    // Try to process the queue
    this.processQueue()

    return item
  }

  /**
   * Get all items in the queue
   */
  getQueue(): QueueItem[] {
    return [...this.queue]
  }

  /**
   * Get a specific item by ID
   */
  getItem(itemId: string): QueueItem | undefined {
    return this.queue.find(item => item.id === itemId)
  }

  /**
   * Remove an item from the queue
   */
  removeFromQueue(itemId: string): boolean {
    const index = this.queue.findIndex(item => item.id === itemId)
    
    if (index === -1) {
      return false
    }

    const item = this.queue[index]

    // Stop the job if it's processing
    if (item.status === 'processing' && item.process) {
      item.process.kill()
      this.activeWorkers--
    }

    // Close WebSocket connection
    if (item.ws && item.ws.readyState === 1) {
      item.ws.close()
    }

    this.queue.splice(index, 1)
    console.log(`[QueueManager] Removed item ${itemId} from queue`)

    // Try to process next item
    this.processQueue()

    return true
  }

  /**
   * Clear completed items from the queue
   */
  clearCompleted(): void {
    const beforeLength = this.queue.length
    this.queue = this.queue.filter(item => 
      item.status !== 'completed' && item.status !== 'failed' && item.status !== 'stopped'
    )
    const cleared = beforeLength - this.queue.length
    console.log(`[QueueManager] Cleared ${cleared} completed items from queue`)
  }

  /**
   * Clear all items from the queue
   */
  clearAll(): void {
    // Stop all processing jobs
    this.queue.forEach(item => {
      if (item.status === 'processing' && item.process) {
        item.process.kill()
      }
      if (item.ws && item.ws.readyState === 1) {
        item.ws.close()
      }
    })

    this.queue = []
    this.activeWorkers = 0
    this.isProcessing = false
    console.log(`[QueueManager] Cleared all items from queue`)
  }

  /**
   * Start processing the queue
   */
  startProcessing(): void {
    if (this.isProcessing) {
      console.log(`[QueueManager] Already processing`)
      return
    }

    this.isProcessing = true
    console.log(`[QueueManager] Started processing queue`)
    this.processQueue()
  }

  /**
   * Stop processing the queue
   */
  stopProcessing(): void {
    if (!this.isProcessing) {
      console.log(`[QueueManager] Not processing`)
      return
    }

    this.isProcessing = false
    console.log(`[QueueManager] Stopped processing queue`)
  }

  /**
   * Process the queue (start pending items)
   */
  private processQueue(): void {
    if (!this.isProcessing) {
      return
    }

    // Find pending items
    const pendingItems = this.queue.filter(item => item.status === 'pending')

    // Calculate how many items we can start
    const availableWorkers = this.parallelWorkers - this.activeWorkers
    const itemsToStart = Math.min(availableWorkers, pendingItems.length)

    if (itemsToStart === 0) {
      return
    }

    console.log(`[QueueManager] Processing ${itemsToStart} items (${this.activeWorkers}/${this.parallelWorkers} workers active)`)

    // Start items
    for (let i = 0; i < itemsToStart; i++) {
      const item = pendingItems[i]
      this.executeItem(item)
    }
  }

  /**
   * Execute a queue item
   */
  private executeItem(item: QueueItem): void {
    item.status = 'processing'
    item.startedAt = new Date()
    item.jobId = uuidv4()
    this.activeWorkers++

    console.log(`[QueueManager] Starting item ${item.id} (job ${item.jobId})`)

    // Execute CLI
    const process = cliExecutor.execute(
      item.parameters,
      (progress: ProgressInfo) => {
        // Update progress
        item.progress = progress
        this.sendProgressUpdate(item)
      },
      (error: string) => {
        console.error(`[QueueManager] Item ${item.id} error: ${error}`)
      },
      (result: ExecutionResult) => {
        // Handle completion
        item.status = result.success ? 'completed' : 'failed'
        item.result = result
        item.completedAt = new Date()
        item.process = null
        this.activeWorkers--

        console.log(`[QueueManager] Item ${item.id} completed with status: ${item.status}`)

        // Send final update
        this.sendProgressUpdate(item)

        // Close WebSocket connection
        if (item.ws && item.ws.readyState === 1) {
          item.ws.close()
        }

        // Process next item in queue
        this.processQueue()
      }
    )

    item.process = process
  }

  /**
   * Stop a running item
   */
  stopItem(itemId: string): boolean {
    const item = this.getItem(itemId)

    if (!item) {
      return false
    }

    if (item.status === 'processing' && item.process) {
      console.log(`[QueueManager] Stopping item ${itemId}`)
      item.process.kill()
      item.status = 'stopped'
      item.completedAt = new Date()
      item.process = null
      this.activeWorkers--

      // Send final update
      this.sendProgressUpdate(item)

      // Close WebSocket connection
      if (item.ws && item.ws.readyState === 1) {
        item.ws.close()
      }

      // Process next item in queue
      this.processQueue()

      return true
    }

    return false
  }

  /**
   * Retry a failed or stopped item
   */
  retryItem(itemId: string): boolean {
    const item = this.getItem(itemId)

    if (!item) {
      return false
    }

    // Only allow retrying failed or stopped items
    if (item.status !== 'failed' && item.status !== 'stopped') {
      console.warn(`[QueueManager] Cannot retry item ${itemId} with status: ${item.status}`)
      return false
    }

    // Reset item state
    item.status = 'pending'
    item.progress = null
    item.result = null
    item.startedAt = null
    item.completedAt = null
    item.jobId = null

    console.log(`[QueueManager] Retrying item ${itemId}`)

    // Process the queue
    this.processQueue()

    return true
  }

  /**
   * Connect WebSocket to an item
   */
  connectWebSocket(itemId: string, ws: any): boolean {
    const item = this.getItem(itemId)

    if (!item) {
      return false
    }

    item.ws = ws
    console.log(`[QueueManager] WebSocket connected to item ${itemId}`)

    // Send current status
    this.sendProgressUpdate(item)

    return true
  }

  /**
   * Send progress update via WebSocket
   */
  private sendProgressUpdate(item: QueueItem): void {
    if (item.ws && item.ws.readyState === 1) {
      const update = {
        type: 'progress',
        itemId: item.id,
        jobId: item.jobId,
        status: item.status,
        progress: item.progress,
        result: item.result,
        createdAt: item.createdAt.toISOString(),
        startedAt: item.startedAt?.toISOString() || null,
        completedAt: item.completedAt?.toISOString() || null,
      }

      item.ws.send(JSON.stringify(update))
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
    stopped: number
    parallelWorkers: number
    activeWorkers: number
    isProcessing: boolean
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      processing: this.queue.filter(item => item.status === 'processing').length,
      completed: this.queue.filter(item => item.status === 'completed').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
      stopped: this.queue.filter(item => item.status === 'stopped').length,
      parallelWorkers: this.parallelWorkers,
      activeWorkers: this.activeWorkers,
      isProcessing: this.isProcessing,
    }
  }

  /**
   * Clean up old completed items
   */
  cleanupOldItems(maxAge: number = 3600000): void {
    const now = Date.now()
    const beforeLength = this.queue.length

    this.queue = this.queue.filter(item => {
      if (
        (item.status === 'completed' || item.status === 'failed' || item.status === 'stopped') &&
        item.completedAt &&
        now - item.completedAt.getTime() > maxAge
      ) {
        console.log(`[QueueManager] Cleaning up old item ${item.id}`)
        return false
      }
      return true
    })

    const cleared = beforeLength - this.queue.length
    if (cleared > 0) {
      console.log(`[QueueManager] Cleaned up ${cleared} old items`)
    }
  }

  /**
   * Get cleanup settings
   */
  getCleanupSettings(): {
    enabled: boolean
    maxAge: number
    interval: number
  } {
    return {
      enabled: this.cleanupEnabled,
      maxAge: this.cleanupMaxAge,
      interval: this.cleanupInterval,
    }
  }

  /**
   * Update cleanup settings
   */
  updateCleanupSettings(settings: {
    enabled?: boolean
    maxAge?: number
    interval?: number
  }): void {
    if (settings.enabled !== undefined) {
      this.cleanupEnabled = settings.enabled
      console.log(`[QueueManager] Cleanup enabled: ${this.cleanupEnabled}`)
    }

    if (settings.maxAge !== undefined) {
      this.cleanupMaxAge = Math.max(60000, settings.maxAge) // Minimum 1 minute
      console.log(`[QueueManager] Cleanup max age: ${this.cleanupMaxAge}ms`)
    }

    if (settings.interval !== undefined) {
      this.cleanupInterval = Math.max(60000, settings.interval) // Minimum 1 minute
      console.log(`[QueueManager] Cleanup interval: ${this.cleanupInterval}ms`)
    }

    // Restart cleanup timer with new settings
    this.restartCleanupTimer()
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    if (this.cleanupEnabled) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupOldItems(this.cleanupMaxAge)
      }, this.cleanupInterval)

      console.log(`[QueueManager] Cleanup timer started (interval: ${this.cleanupInterval}ms)`)
    }
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
      console.log(`[QueueManager] Cleanup timer stopped`)
    }
  }

  /**
   * Restart cleanup timer with current settings
   */
  private restartCleanupTimer(): void {
    this.stopCleanupTimer()
    this.startCleanupTimer()
  }
}

// Singleton instance
export const queueManager = new QueueManager()

// Start cleanup timer with default settings
queueManager['startCleanupTimer']()
