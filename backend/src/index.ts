import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { queueManager } from './services/queueManager.js'
import type { ExecuteRequest, ExecuteResponse, StatusResponse, StopResponse } from './types/index.js'
import path from 'path'
import fs from 'fs'
import multer from 'multer'
import * as iconv from 'iconv-lite'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads with proper encoding support
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Decode the filename from Latin-1 to UTF-8 to handle Chinese characters
    try {
      // Multer decodes filenames as Latin-1 by default, so we need to re-encode as UTF-8
      const decodedName = iconv.decode(Buffer.from(file.originalname, 'latin1'), 'utf8')
      cb(null, decodedName)
    } catch (error) {
      // If decoding fails, use the original name
      console.error('[Upload] Filename decode error:', error)
      cb(null, file.originalname)
    }
  }
})

const upload = multer({
  storage: storage,
  // Allow any file type
  fileFilter: (req, file, cb) => {
    cb(null, true)
  },
  // Configure to handle UTF-8 filenames
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB max file size
  }
})

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// File upload endpoint using multer
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const filePath = req.file.path
    // Decode the filename from Latin-1 to UTF-8 for the response
    let filename: string
    try {
      filename = iconv.decode(Buffer.from(req.file.originalname, 'latin1'), 'utf8')
    } catch (error) {
      filename = req.file.originalname
    }

    console.log(`[Upload] File saved: ${filePath}`)
    console.log(`[Upload] Filename: ${filename}`)

    res.json({
      success: true,
      filename,
      path: filePath,
      url: `/uploads/${encodeURIComponent(filename)}`
    })
  } catch (error) {
    console.error('[Upload] Error:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

// Get queue statistics
app.get('/api/stats', (req, res) => {
  const stats = queueManager.getStats()
  res.json(stats)
})

// Add item to queue endpoint
app.post('/api/queue/add', (req, res) => {
  try {
    const { parameters }: ExecuteRequest = req.body

    if (!parameters) {
      return res.status(400).json({ error: 'Missing parameters' })
    }

    // Validate required parameters
    if (!parameters.video_path || !parameters.output || !parameters.lang) {
      return res.status(400).json({
        error: 'Missing required parameters: video_path, output, lang'
      })
    }

    // Add item to queue
    const item = queueManager.addToQueue(parameters)

    const response: ExecuteResponse = {
      jobId: item.id,
      status: item.status,
    }

    res.json(response)
  } catch (error) {
    console.error('[API] Add to queue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get queue status endpoint
app.get('/api/queue/status/:itemId', (req, res) => {
  try {
    const { itemId } = req.params
    const item = queueManager.getItem(itemId)

    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    const response: StatusResponse = {
      jobId: item.id,
      status: item.status,
      progress: item.progress,
      result: item.result,
      createdAt: item.createdAt.toISOString(),
      startedAt: item.startedAt?.toISOString() || null,
      completedAt: item.completedAt?.toISOString() || null,
    }

    res.json(response)
  } catch (error) {
    console.error('[API] Status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Stop item endpoint
app.post('/api/queue/stop/:itemId', (req, res) => {
  try {
    const { itemId } = req.params
    const stopped = queueManager.stopItem(itemId)

    if (!stopped) {
      return res.status(404).json({ error: 'Item not found or cannot be stopped' })
    }

    const response: StopResponse = {
      jobId: itemId,
      status: 'stopped',
      message: 'Item stopped successfully',
    }

    res.json(response)
  } catch (error) {
    console.error('[API] Stop error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Retry item endpoint
app.post('/api/queue/retry/:itemId', (req, res) => {
  try {
    const { itemId } = req.params
    const retried = queueManager.retryItem(itemId)

    if (!retried) {
      return res.status(404).json({ error: 'Item not found or cannot be retried' })
    }

    res.json({ message: 'Item retried successfully' })
  } catch (error) {
    console.error('[API] Retry error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all queue items endpoint
app.get('/api/queue', (req, res) => {
  try {
    const items = queueManager.getQueue()
    res.json(items)
  } catch (error) {
    console.error('[API] Queue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Remove item from queue endpoint
app.delete('/api/queue/:itemId', (req, res) => {
  try {
    const { itemId } = req.params
    const removed = queueManager.removeFromQueue(itemId)

    if (!removed) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json({ message: 'Item removed successfully' })
  } catch (error) {
    console.error('[API] Remove error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Start processing queue endpoint
app.post('/api/queue/start', (req, res) => {
  try {
    queueManager.startProcessing()
    res.json({ message: 'Queue processing started' })
  } catch (error) {
    console.error('[API] Start error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Stop processing queue endpoint
app.post('/api/queue/stop', (req, res) => {
  try {
    queueManager.stopProcessing()
    res.json({ message: 'Queue processing stopped' })
  } catch (error) {
    console.error('[API] Stop error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Clear completed items endpoint
app.post('/api/queue/clear-completed', (req, res) => {
  try {
    queueManager.clearCompleted()
    res.json({ message: 'Completed items cleared' })
  } catch (error) {
    console.error('[API] Clear completed error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Clear all items endpoint
app.post('/api/queue/clear-all', (req, res) => {
  try {
    queueManager.clearAll()
    res.json({ message: 'All items cleared' })
  } catch (error) {
    console.error('[API] Clear all error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Clear uploads endpoint
app.post('/api/uploads/clear', (req, res) => {
  try {
    // Check if uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ message: 'Uploads directory does not exist', filesCleared: 0 })
    }

    // Read all files in uploads directory
    const files = fs.readdirSync(uploadsDir)
    let filesCleared = 0

    // Delete each file
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file)
      const stat = fs.statSync(filePath)
      
      // Only delete files, not directories
      if (stat.isFile()) {
        fs.unlinkSync(filePath)
        filesCleared++
        console.log(`[Uploads] Deleted file: ${file}`)
      }
    })

    console.log(`[Uploads] Cleared ${filesCleared} files from uploads directory`)
    res.json({ 
      message: `Cleared ${filesCleared} files from uploads directory`,
      filesCleared 
    })
  } catch (error) {
    console.error('[API] Clear uploads error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Set parallel workers endpoint
app.post('/api/queue/workers', (req, res) => {
  try {
    const { count } = req.body
    
    if (typeof count !== 'number' || count < 1 || count > 10) {
      return res.status(400).json({ error: 'Invalid worker count (must be 1-10)' })
    }

    queueManager.setParallelWorkers(count)
    res.json({ message: `Parallel workers set to ${count}` })
  } catch (error) {
    console.error('[API] Set workers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get cleanup settings endpoint
app.get('/api/queue/cleanup-settings', (req, res) => {
  try {
    const settings = queueManager.getCleanupSettings()
    res.json(settings)
  } catch (error) {
    console.error('[API] Get cleanup settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update cleanup settings endpoint
app.post('/api/queue/cleanup-settings', (req, res) => {
  try {
    const { enabled, maxAge, interval } = req.body

    // Validate maxAge (in milliseconds, minimum 1 minute)
    if (maxAge !== undefined) {
      if (typeof maxAge !== 'number' || maxAge < 60000) {
        return res.status(400).json({ error: 'Invalid maxAge (must be at least 60000ms)' })
      }
    }

    // Validate interval (in milliseconds, minimum 1 minute)
    if (interval !== undefined) {
      if (typeof interval !== 'number' || interval < 60000) {
        return res.status(400).json({ error: 'Invalid interval (must be at least 60000ms)' })
      }
    }

    // Validate enabled
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid enabled value (must be boolean)' })
    }

    queueManager.updateCleanupSettings({ enabled, maxAge, interval })
    res.json({ message: 'Cleanup settings updated' })
  } catch (error) {
    console.error('[API] Update cleanup settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Trigger immediate cleanup endpoint
app.post('/api/queue/cleanup-now', (req, res) => {
  try {
    const { maxAge } = req.body

    if (maxAge !== undefined) {
      if (typeof maxAge !== 'number' || maxAge < 60000) {
        return res.status(400).json({ error: 'Invalid maxAge (must be at least 60000ms)' })
      }
      queueManager.cleanupOldItems(maxAge)
    } else {
      queueManager.cleanupOldItems()
    }

    res.json({ message: 'Cleanup triggered successfully' })
  } catch (error) {
    console.error('[API] Cleanup now error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Download file endpoint
app.get('/api/download', (req, res) => {
  try {
    const { path: filePath } = req.query

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'Missing file path' })
    }

    // Security check: ensure the path is within allowed directories
    const allowedDirs = [
      uploadsDir,
      path.join(process.cwd(), '..'),
    ]

    const resolvedPath = path.resolve(filePath)
    const isAllowed = allowedDirs.some(dir => resolvedPath.startsWith(path.resolve(dir)))

    if (!isAllowed) {
      console.error('[Download] Access denied to path:', filePath)
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      console.error('[Download] File not found:', resolvedPath)
      return res.status(404).json({ error: 'File not found' })
    }

    // Get filename for Content-Disposition header
    const filename = path.basename(resolvedPath)

    console.log(`[Download] Serving file: ${resolvedPath}`)

    // Send file
    res.download(resolvedPath, filename, (err) => {
      if (err) {
        console.error('[Download] Error sending file:', err)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' })
        }
      }
    })
  } catch (error) {
    console.error('[Download] Error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] New connection established')

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message)

      // Handle different message types
      switch (data.type) {
        case 'connect_item':
          // Connect WebSocket to an existing queue item
          if (data.itemId) {
            const connected = queueManager.connectWebSocket(data.itemId, ws)
            if (connected) {
              console.log(`[WebSocket] Connected to item ${data.itemId}`)
            } else {
              console.warn(`[WebSocket] Item ${data.itemId} not found`)
            }
          }
          break

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break

        default:
          console.warn(`[WebSocket] Unknown message type: ${data.type}`)
      }
    } catch (error) {
      console.error('[WebSocket] Message error:', error)
    }
  })

  ws.on('close', () => {
    console.log('[WebSocket] Connection closed')
  })

  ws.on('error', (error) => {
    console.error('[WebSocket] Error:', error)
  })
})

// Start server
const PORT = process.env.PORT || 5001

server.listen(PORT, () => {
  console.log(`[Server] Backend API running on http://localhost:${PORT}`)
  console.log(`[Server] WebSocket server running on ws://localhost:${PORT}/ws`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('[Server] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('[Server] Server closed')
    process.exit(0)
  })
})