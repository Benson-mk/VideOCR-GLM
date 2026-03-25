/**
 * Queue Management Types
 */

import type { VideoSettings } from './cli'

export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface ProgressInfo {
  current_frame: number
  total_frames: number
  percentage: number
  text_length?: number
}

export interface QueueItem {
  id: string
  jobId?: string  // Backend job ID
  video_path: string
  video_name: string
  output_path: string
  settings: VideoSettings
  status: QueueItemStatus
  progress: ProgressInfo | null
  error: string | null
  created_at: Date
  started_at: Date | null
  completed_at: Date | null
  thumbnail?: string
}

export interface QueueState {
  items: QueueItem[]
  isProcessing: boolean
  parallelWorkers: number
  activeWorkers: number
}