import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import type { CLIParameters, ProgressInfo, ExecutionResult } from '../types/index.js'

  export class CLIExecutor {
  private progressRegex = /Processing frame (\d+) of (\d+)/
  private textLengthRegex = /\(text: (\d+) chars\)/
  private errorPatterns = [
    /^error:/i,
    /^exception:/i,
    /^traceback/i,
    /failed/i,
    /outside video/i,
    /invalid/i,
    /not found/i,
    /permission denied/i,
  ]

  /**
   * Check if a file exists before executing CLI
   */
  private checkFileExists(filePath: string): { exists: boolean; error?: string } {
  
  try {
    if (!fs.existsSync(filePath)) {
      return {
        exists: false,
        error: `Video file not found: ${path.basename(filePath)} - Please verify the file was uploaded and the path is correct`
      }
    }
    return { exists: true }
  } catch (err) {
    return {
      exists: false,
      error: `Cannot access video file: ${path.basename(filePath)} - ${err instanceof Error ? err.message : 'Unknown error'}`
    }
  }
}

  /**
   * Resolve the CLI path correctly regardless of where the backend is running from
   * This handles both dev mode (backend running from backend/ directory) and build mode
   */
  private resolveCliPath(): string {
    // Try multiple possible locations for the CLI Python script
    const possiblePaths = [
      // If backend is running from backend/ directory (dev mode), CLI is at ../VideOCR-GLM-CLI/
      path.join(process.cwd(), '..', 'VideOCR-GLM-CLI', 'videocr_glm_cli.py'),
      // If backend is running from project root (build mode), CLI is at ./VideOCR-GLM-CLI/
      path.join(process.cwd(), 'VideOCR-GLM-CLI', 'videocr_glm_cli.py'),
      // If backend is running from backend/dist/ directory, CLI is at ../../VideOCR-GLM-CLI/
      path.join(process.cwd(), '..', '..', 'VideOCR-GLM-CLI', 'videocr_glm_cli.py'),
    ]
    
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        console.log(`[CLI] Found CLI Python script at: ${possiblePath}`)
        return possiblePath
      }
    }
    
    // If none found, use the default path (will fail with clear error message)
    const defaultPath = path.join(process.cwd(), '..', 'VideOCR-GLM-CLI', 'videocr_glm_cli.py')
    console.warn(`[CLI] CLI Python script not found, using default path: ${defaultPath}`)
    return defaultPath
  }

  /**
   * Execute the CLI with given parameters
   * Uses Python script in development, bundled EXE in production
   */
  execute(
    parameters: CLIParameters,
    onProgress?: (progress: ProgressInfo) => void,
    onError?: (error: string) => void,
    onComplete?: (result: ExecutionResult) => void
  ): ChildProcess {
    // Check if video file exists before executing CLI
    const fileCheck = this.checkFileExists(parameters.video_path)
    if (!fileCheck.exists) {
      console.error(`[CLI] File check failed: ${fileCheck.error}`)
      
      // Return immediately with error
      const result: ExecutionResult = {
        success: false,
        output: '',
        error: fileCheck.error || null,
        exitCode: -1,
      }

      // Call onComplete asynchronously to match expected behavior
      setImmediate(() => {
        if (onComplete) {
          onComplete(result)
        }
      })

      // Return a dummy process object
      return {
        kill: () => {},
        on: () => {},
        once: () => {},
        emit: () => {},
        addListener: () => {},
        removeListener: () => {},
        removeAllListeners: () => {},
        listeners: () => [],
        listenerCount: () => 0,
        prependListener: () => {},
        prependOnceListener: () => {},
      } as any
    }

    const args = this.buildArgs(parameters)
    
    // Determine if running in packaged Electron app by checking for bundled EXE
    // Try multiple possible locations for the bundled EXE
    const possiblePaths = [
      // Standard Electron resources path
      (process as any).resourcesPath && path.join((process as any).resourcesPath, 'VideOCR-GLM-CLI', 'dist', 'videocr_glm_cli.exe'),
      // Unpacked build location
      path.join(process.cwd(), 'resources', 'VideOCR-GLM-CLI', 'dist', 'videocr_glm_cli.exe'),
      // Alternative unpacked location
      path.join(process.cwd(), 'dist-electron', 'win-unpacked', 'resources', 'VideOCR-GLM-CLI', 'dist', 'videocr_glm_cli.exe'),
    ]
    
    let bundledExePath: string | null = null
    for (const possiblePath of possiblePaths) {
      if (possiblePath && fs.existsSync(possiblePath)) {
        bundledExePath = possiblePath
        console.log(`[CLI] Found bundled EXE at: ${bundledExePath}`)
        break
      }
    }
    
    const useBundledExe = !!bundledExePath
    
    let cliPath: string
    let command: string
    let env: NodeJS.ProcessEnv = process.env

    if (useBundledExe && bundledExePath) {
      // Production mode: Use bundled EXE
      cliPath = bundledExePath
      command = cliPath
      console.log(`Executing CLI (bundled EXE): ${cliPath} ${args.join(' ')}`)
    } else {
      // Development mode: Use Python script
      // Resolve CLI path correctly regardless of where backend is running from
      cliPath = this.resolveCliPath()
      command = 'python'
      args.unshift(cliPath)
      // Set environment variables for proper encoding
      env = {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      }
      console.log(`Executing CLI (Python): python ${cliPath} ${args.slice(1).join(' ')}`)
    }

    const childProcess = spawn(command, args, { env })

    let output = ''
    let errorOutput = ''

    // Capture stdout for progress parsing and error detection
    childProcess.stdout?.on('data', (data) => {
      const text = data.toString()
      output += text

      // Check for error messages in stdout using multiple patterns
      const isError = this.errorPatterns.some(pattern => pattern.test(text))
      
      if (isError) {
        errorOutput += text
        console.error(`[CLI stdout error]: ${text.trim()}`)
        
        if (onError) {
          onError(text)
        }
      } else {
        // Try to parse progress
        const progress = this.parseProgress(text)
        if (progress && onProgress) {
          onProgress(progress)
        }
        
        console.log(`[CLI stdout]: ${text.trim()}`)
      }
    })

    // Capture stderr for errors
    childProcess.stderr?.on('data', (data) => {
      const text = data.toString()
      errorOutput += text
      console.error(`[CLI stderr]: ${text.trim()}`)

      if (onError) {
        onError(text)
      }
    })

    // Handle process completion
    childProcess.on('close', (code) => {
      const result: ExecutionResult = {
        success: code === 0,
        output,
        error: code !== 0 && errorOutput ? this.cleanErrorMessage(errorOutput) : null,
        exitCode: code,
      }

      console.log(`[CLI] Process exited with code ${code}`)

      if (onComplete) {
        onComplete(result)
      }
    })

    // Handle process errors
    childProcess.on('error', (err) => {
      console.error(`[CLI] Process error: ${err.message}`)

      const result: ExecutionResult = {
        success: false,
        output,
        error: err.message,
        exitCode: -1,
      }

      if (onComplete) {
        onComplete(result)
      }
    })

    return childProcess
  }

  /**
   * Build CLI arguments from parameters
   */
  private buildArgs(parameters: CLIParameters): string[] {
    const args: string[] = []

    // Required parameters
    args.push('--video_path', parameters.video_path)
    args.push('--output', parameters.output)
    args.push('--lang', parameters.lang)

    // Time range
    if (parameters.time_start) {
      args.push('--time_start', parameters.time_start)
    }
    if (parameters.time_end) {
      args.push('--time_end', parameters.time_end)
    }

    // OCR settings
    args.push('--sim_threshold', parameters.sim_threshold.toString())
    args.push('--max_merge_gap', parameters.max_merge_gap.toString())
    args.push('--ssim_threshold', parameters.ssim_threshold.toString())
    args.push('--frames_to_skip', parameters.frames_to_skip.toString())
    args.push('--min_subtitle_duration', parameters.min_subtitle_duration.toString())
    args.push('--ocr_image_max_width', parameters.ocr_image_max_width.toString())

    // Boolean flags
    if (parameters.use_fullframe) {
      args.push('--use_fullframe', 'true')
    }
    if (parameters.post_processing) {
      args.push('--post_processing', 'true')
    }
    if (parameters.use_dual_zone) {
      args.push('--use_dual_zone', 'true')
    }
    if (parameters.allow_system_sleep) {
      args.push('--allow_system_sleep', 'true')
    }

    // Optional parameters
    if (parameters.brightness_threshold !== null) {
      args.push('--brightness_threshold', parameters.brightness_threshold.toString())
    }
    args.push('--subtitle_position', parameters.subtitle_position)

    // Crop zone 1
    if (parameters.crop_x !== null) {
      args.push('--crop_x', parameters.crop_x.toString())
    }
    if (parameters.crop_y !== null) {
      args.push('--crop_y', parameters.crop_y.toString())
    }
    if (parameters.crop_width !== null) {
      args.push('--crop_width', parameters.crop_width.toString())
    }
    if (parameters.crop_height !== null) {
      args.push('--crop_height', parameters.crop_height.toString())
    }

    // Crop zone 2 (dual zone)
    if (parameters.crop_x2 !== null) {
      args.push('--crop_x2', parameters.crop_x2.toString())
    }
    if (parameters.crop_y2 !== null) {
      args.push('--crop_y2', parameters.crop_y2.toString())
    }
    if (parameters.crop_width2 !== null) {
      args.push('--crop_width2', parameters.crop_width2.toString())
    }
    if (parameters.crop_height2 !== null) {
      args.push('--crop_height2', parameters.crop_height2.toString())
    }

    // Ollama settings
    args.push('--ollama_host', parameters.ollama_host)
    args.push('--ollama_port', parameters.ollama_port.toString())
    args.push('--ollama_model', parameters.ollama_model)
    args.push('--ollama_timeout', parameters.ollama_timeout.toString())

    return args
  }

  /**
   * Parse progress from CLI output
   */
  private parseProgress(output: string): ProgressInfo | null {
    // Try to match progress pattern
    const progressMatch = output.match(this.progressRegex)
    if (progressMatch) {
      const current = parseInt(progressMatch[1], 10)
      const total = parseInt(progressMatch[2], 10)
      const percentage = Math.round((current / total) * 100)

      // Try to extract text length
      const textLengthMatch = output.match(this.textLengthRegex)
      const textLength = textLengthMatch ? parseInt(textLengthMatch[1], 10) : undefined

      return {
        current_frame: current,
        total_frames: total,
        percentage,
        text_length: textLength,
      }
    }

    return null
  }

  /**
   * Clean up error message for display
   */
  private cleanErrorMessage(error: string): string {
    // Remove excessive whitespace and newlines
    let cleaned = error.trim()
    
    // Replace multiple newlines with single newline
    cleaned = cleaned.replace(/\n\s*\n/g, '\n')
    
    // Remove ANSI color codes if present
    // eslint-disable-next-line no-control-regex
    cleaned = cleaned.replace(/\x1b\[[0-9;]*m/g, '')
    
    // Detect and clean up CLI usage messages
    if (cleaned.includes('usage: videocr_glm_cli.py')) {
      // Extract the actual error message before the usage
      const lines = cleaned.split('\n')
      const errorLine = lines.find(line => 
        line.includes('error:') || 
        line.includes('Error:') ||
        line.includes('does not exist') ||
        line.includes('not a valid file')
      )
      
      if (errorLine) {
        // Clean up the error line
        let cleanError = errorLine.trim()
        
        // Remove "videocr_glm_cli.py: error:" prefix if present
        cleanError = cleanError.replace(/^videocr_glm_cli\.py:\s*error:\s*/i, '')
        
        // Remove "argument --video_path:" prefix if present
        cleanError = cleanError.replace(/^argument\s+--video_path:\s*/i, '')
        
        // Extract filename from path for better readability
        const pathMatch = cleanError.match(/['"]([^'"]+)['"]/)
        if (pathMatch) {
          const filename = path.basename(pathMatch[1])
          cleanError = cleanError.replace(/['"]([^'"]+)['"]/i, `"${filename}"`)
        }
        
        return cleanError
      }
      
      // If no specific error line found, return a generic message
      return 'Video file not found or invalid. Please check the file path and try again.'
    }
    
    return cleaned
  }
}

// Singleton instance
export const cliExecutor = new CLIExecutor()