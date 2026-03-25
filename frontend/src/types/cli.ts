/**
 * CLI Parameter Types
 */

export interface CropZone {
  x: number
  y: number
  width: number
  height: number
}

export interface OllamaSettings {
  host: string
  port: number
  model: string
  timeout: number
}

export interface OCRSettings {
  sim_threshold: number
  max_merge_gap: number
  ssim_threshold: number
  frames_to_skip: number
  post_processing: boolean
  min_subtitle_duration: number
  ocr_image_max_width: number
}

export interface ImageProcessingSettings {
  brightness_threshold: number | null
  use_fullframe: boolean
  subtitle_position: 'center' | 'left' | 'right' | 'any'
}

export interface SystemSettings {
  allow_system_sleep: boolean
  parallel_workers: number
}

export interface GeneralSettings {
  lang: string
  output_dir: string
  time_start: string
  time_end: string
}

export interface AdvancedSettings {
  use_dual_zone: boolean
  crop_zones: CropZone[]
  ocr: OCRSettings
  image_processing: ImageProcessingSettings
  ollama: OllamaSettings
  system: SystemSettings
}

export interface VideoSettings {
  general: GeneralSettings
  advanced: AdvancedSettings
}

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