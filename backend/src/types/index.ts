import type { WebSocket } from 'ws'

export interface CLIParameters {
  video_path: string
  output: string
  lang: string
  time_start: string
  time_end: string
  sim_threshold: number
  max_merge_gap: number
  use_fullframe: boolean
  brightness_threshold: number | null
  ssim_threshold: number
  subtitle_position: string
  frames_to_skip: number
  post_processing: boolean
  min_subtitle_duration: number
  ocr_image_max_width: number
  use_dual_zone: boolean
  crop_x: number | null
  crop_y: number | null
  crop_width: number | null
  crop_height: number | null
  crop_x2: number | null
  crop_y2: number | null
  crop_width2: number | null
  crop_height2: number | null
  allow_system_sleep: boolean
  ollama_host: string
  ollama_port: number
  ollama_model: string
  ollama_timeout: number
}

export interface ProgressInfo {
  current_frame: number
  total_frames: number
  percentage: number
  text_length?: number
}

export interface ExecutionResult {
  success: boolean
  output: string
  error: string | null
  exitCode: number | null
}

export interface Job {
  id: string
  parameters: CLIParameters
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'stopped'
  progress: ProgressInfo | null
  result: ExecutionResult | null
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
  process: any
  ws: WebSocket | null
}

export interface ExecuteRequest {
  parameters: CLIParameters
}

export interface ExecuteResponse {
  jobId: string
  status: string
}

export interface StatusResponse {
  jobId: string
  status: string
  progress: ProgressInfo | null
  result: ExecutionResult | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export interface StopResponse {
  jobId: string
  status: string
  message: string
}