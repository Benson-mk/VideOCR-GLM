/**
 * CLI Utilities
 * Helper functions for building CLI parameters
 */

import type { QueueItem } from '@/types/queue'
import type { CLIParameters } from '@/types/cli'

/**
 * Build CLI parameters from a queue item
 */
export function buildCLIParameters(item: QueueItem): CLIParameters {
  const { settings, video_path, output_path } = item
  const { general, advanced } = settings

  // When use_fullframe is enabled, disable dual_zone and crop zone parameters
  const useFullframe = advanced.image_processing.use_fullframe
  const useDualZone = useFullframe ? false : advanced.use_dual_zone

  return {
    video_path,
    output: output_path,
    lang: general.lang,
    time_start: general.time_start,
    time_end: general.time_end,
    sim_threshold: advanced.ocr.sim_threshold,
    max_merge_gap: advanced.ocr.max_merge_gap,
    use_fullframe: useFullframe,
    brightness_threshold: advanced.image_processing.brightness_threshold,
    ssim_threshold: advanced.ocr.ssim_threshold,
    subtitle_position: advanced.image_processing.subtitle_position,
    frames_to_skip: advanced.ocr.frames_to_skip,
    post_processing: advanced.ocr.post_processing,
    min_subtitle_duration: advanced.ocr.min_subtitle_duration,
    ocr_image_max_width: advanced.ocr.ocr_image_max_width,
    use_dual_zone: useDualZone,
    // Only include crop zone parameters if use_fullframe is disabled
    crop_x: useFullframe ? null : (advanced.crop_zones[0]?.x || null),
    crop_y: useFullframe ? null : (advanced.crop_zones[0]?.y || null),
    crop_width: useFullframe ? null : (advanced.crop_zones[0]?.width || null),
    crop_height: useFullframe ? null : (advanced.crop_zones[0]?.height || null),
    crop_x2: useFullframe ? null : (advanced.crop_zones[1]?.x || null),
    crop_y2: useFullframe ? null : (advanced.crop_zones[1]?.y || null),
    crop_width2: useFullframe ? null : (advanced.crop_zones[1]?.width || null),
    crop_height2: useFullframe ? null : (advanced.crop_zones[1]?.height || null),
    allow_system_sleep: advanced.system.allow_system_sleep,
    ollama_host: advanced.ollama.host,
    ollama_port: advanced.ollama.port,
    ollama_model: advanced.ollama.model,
    ollama_timeout: advanced.ollama.timeout,
  }
}

/**
 * Get output directory from video path
 */
export function getOutputDirectory(videoPath: string, customOutputDir?: string): string {
  if (customOutputDir) {
    return customOutputDir
  }
  
  // Use the same directory as the video file
  const lastSeparator = Math.max(videoPath.lastIndexOf('/'), videoPath.lastIndexOf('\\'))
  return lastSeparator !== -1 ? videoPath.substring(0, lastSeparator) : '.'
}

/**
 * Get output file name from video path
 */
export function getOutputFileName(videoPath: string): string {
  const fileName = videoPath.split(/[/\\]/).pop() || videoPath
  return fileName.replace(/\.[^/.]+$/, '') + '.srt'
}

/**
 * Format time string (seconds to MM:SS or HH:MM:SS)
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse time string (MM:SS or HH:MM:SS to seconds)
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(Number)
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  
  return 0
}