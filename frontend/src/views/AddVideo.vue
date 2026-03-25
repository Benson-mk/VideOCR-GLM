<template>
  <div class="add-video-container">
    <a-row :gutter="24">
      <!-- Left Column: Add Video to Queue Card -->
      <a-col :xs="24" :sm="24" :md="24" :lg="18" :xl="18">
        <a-card title="Add Video to Queue" :bordered="false">
          <a-form layout="vertical">
            <!-- Video Selection -->
            <a-form-item v-if="!videoFile" label="Video File">
              <a-space direction="vertical" style="width: 100%">
                <a-upload
                  :before-upload="handleVideoUpload"
                  :show-upload-list="false"
                  accept="video/*"
                >
                  <a-button type="primary" size="large">
                    <template #icon>
                      <UploadOutlined />
                    </template>
                    Select Video File
                  </a-button>
                </a-upload>
                <a-button :loading="batchAdding" @click="handleFolderUpload">
                  <template #icon>
                    <FolderOpenOutlined />
                  </template>
                  Batch Add from Folder
                </a-button>
                <input
                  ref="folderInputRef"
                  type="file"
                  webkitdirectory
                  multiple
                  accept="video/*"
                  style="display: none"
                  @change="onFolderSelected"
                />
              </a-space>
            </a-form-item>

            <!-- Video Preview -->
            <a-form-item v-if="videoFile" label="Video Preview">
              <div class="video-player-wrapper">
                <!-- Video Display Area -->
                <div ref="videoDisplayRef" class="video-display-area">
                  <video
                    ref="videoRef"
                    :src="videoUrl"
                    @loadedmetadata="onVideoLoaded"
                    @timeupdate="onTimeUpdate"
                    @ended="onVideoEnded"
                  />
                  <canvas
                    ref="canvasRef"
                    class="crop-overlay"
                    :class="{ 'crop-mode': isCropMode }"
                  />
                </div>

                <!-- External Control Bar -->
                <div class="video-controls">
                  <div class="control-row">
                    <a-space>
                      <a-button
                        type="primary"
                        :icon="
                          isPlaying
                            ? h(PauseCircleOutlined)
                            : h(PlayCircleOutlined)
                        "
                        @click="togglePlay"
                      />
                      <a-button :icon="h(StopOutlined)" @click="stopVideo" />
                      <a-button
                        :icon="h(StepBackwardOutlined)"
                        @click="rewind"
                      />
                      <a-button
                        :icon="h(StepForwardOutlined)"
                        @click="fastForward"
                      />
                    </a-space>

                    <div class="time-display">
                      {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
                    </div>

                    <a-space>
                      <a-button
                        :icon="h(isMuted ? SoundFilled : SoundOutlined)"
                        @click="toggleMute"
                      />
                      <a-slider
                        v-model:value="volume"
                        :min="0"
                        :max="100"
                        style="width: 100px"
                        @change="onVolumeChange"
                      />
                      <a-button
                        :icon="h(FullscreenOutlined)"
                        @click="toggleFullscreen"
                      />
                    </a-space>
                  </div>

                  <!-- Progress Bar -->
                  <div class="progress-bar-container">
                    <a-slider
                      v-model:value="currentTime"
                      :min="0"
                      :max="duration"
                      :step="0.1"
                      @change="onSeek"
                    />
                  </div>
                </div>
              </div>
            </a-form-item>

            <!-- Crop Selection -->
            <a-form-item v-if="videoFile">
              <template #label>
                <a-divider>Crop Selection</a-divider>
              </template>

              <a-space direction="vertical" style="width: 100%">
                <a-space>
                  <a-checkbox
                    v-model:checked="
                      settings.advanced.image_processing.use_fullframe
                    "
                  >
                    Use Full Frame for OCR
                  </a-checkbox>
                  <a-checkbox v-model:checked="isCropMode">
                    Enable Crop Mode
                  </a-checkbox>
                  <a-checkbox
                    v-model:checked="settings.advanced.use_dual_zone"
                    :disabled="settings.advanced.image_processing.use_fullframe"
                  >
                    Enable Dual Zone
                  </a-checkbox>
                  <a-button-group>
                    <a-button
                      :disabled="
                        settings.advanced.image_processing.use_fullframe
                      "
                      @click="setPresetPosition('top')"
                    >
                      Top
                    </a-button>
                    <a-button
                      :disabled="
                        settings.advanced.image_processing.use_fullframe
                      "
                      @click="setPresetPosition('center')"
                    >
                      Center
                    </a-button>
                    <a-button
                      :disabled="
                        settings.advanced.image_processing.use_fullframe
                      "
                      @click="setPresetPosition('bottom')"
                    >
                      Bottom
                    </a-button>
                  </a-button-group>
                </a-space>

                <div
                  class="crop-zones-info"
                  :class="{
                    'disabled-field':
                      settings.advanced.image_processing.use_fullframe,
                  }"
                >
                  <div v-if="cropZones.length === 0" class="no-crop-zones">
                    {{
                      isCropMode
                        ? 'Click and drag on the video to select crop area'
                        : 'Enable Crop Mode to select crop area'
                    }}
                  </div>
                  <div v-else>
                    <div
                      v-for="(zone, index) in cropZones"
                      :key="index"
                      class="crop-zone-item"
                      :class="{ selected: selectedZoneIndex === index }"
                      @click="selectZone(index)"
                    >
                      <strong>Zone {{ index + 1 }}:</strong>
                      X: {{ zone.x }}, Y: {{ zone.y }}, Width: {{ zone.width }},
                      Height: {{ zone.height }}
                      <a-space>
                        <a-button
                          type="link"
                          size="small"
                          :disabled="
                            settings.advanced.image_processing.use_fullframe
                          "
                          @click.stop="editZone(index)"
                        >
                          Edit
                        </a-button>
                        <a-button
                          type="link"
                          danger
                          size="small"
                          :disabled="
                            settings.advanced.image_processing.use_fullframe
                          "
                          @click.stop="removeCropZone(index)"
                        >
                          Remove
                        </a-button>
                      </a-space>
                    </div>
                  </div>
                </div>

                <!-- Selected Zone Editor -->
                <div
                  v-if="selectedZoneIndex !== null"
                  class="zone-editor"
                  :class="{
                    'disabled-field':
                      settings.advanced.image_processing.use_fullframe,
                  }"
                >
                  <div class="zone-editor-header">
                    <span class="zone-editor-title">Zone {{ selectedZoneIndex + 1 }}</span>
                  </div>
                  <div class="zone-editor-grid">
                    <div class="zone-editor-field">
                      <label>X</label>
                      <a-input-number
                        v-model:value="cropZones[selectedZoneIndex].x"
                        :min="0"
                        :max="videoRef?.videoWidth || 0"
                        :disabled="
                          settings.advanced.image_processing.use_fullframe
                        "
                        size="small"
                        style="width: 100%"
                        @change="updateZoneFromInput"
                      />
                    </div>
                    <div class="zone-editor-field">
                      <label>Y</label>
                      <a-input-number
                        v-model:value="cropZones[selectedZoneIndex].y"
                        :min="0"
                        :max="videoRef?.videoHeight || 0"
                        :disabled="
                          settings.advanced.image_processing.use_fullframe
                        "
                        size="small"
                        style="width: 100%"
                        @change="updateZoneFromInput"
                      />
                    </div>
                    <div class="zone-editor-field">
                      <label>W</label>
                      <a-input-number
                        v-model:value="cropZones[selectedZoneIndex].width"
                        :min="10"
                        :max="
                          (videoRef?.videoWidth || 0) -
                            cropZones[selectedZoneIndex].x
                        "
                        :disabled="
                          settings.advanced.image_processing.use_fullframe
                        "
                        size="small"
                        style="width: 100%"
                        @change="updateZoneFromInput"
                      />
                    </div>
                    <div class="zone-editor-field">
                      <label>H</label>
                      <a-input-number
                        v-model:value="cropZones[selectedZoneIndex].height"
                        :min="10"
                        :max="
                          (videoRef?.videoHeight || 0) -
                            cropZones[selectedZoneIndex].y
                        "
                        :disabled="
                          settings.advanced.image_processing.use_fullframe
                        "
                        size="small"
                        style="width: 100%"
                        @change="updateZoneFromInput"
                      />
                    </div>
                  </div>
                </div>
              </a-space>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- Right Column: General Settings and Actions Cards -->
      <a-col :xs="24" :sm="24" :md="24" :lg="6" :xl="6">
        <!-- General Settings Card -->
        <a-card
          title="General Settings"
          :bordered="false"
          class="settings-card"
        >
          <a-form layout="vertical">
            <a-form-item label="Language">
              <a-select
                v-model:value="settings.general.lang"
                show-search
                :filter-option="filterLanguage"
                style="width: 100%"
              >
                <a-select-option
                  v-for="lang in ALL_LANGUAGES"
                  :key="lang.code"
                  :value="lang.code"
                >
                  {{ lang.name }} ({{ lang.code }})
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="Output Directory">
              <a-input
                v-model:value="settings.general.output_dir"
                placeholder=".\backend\uploads (default)"
              />
            </a-form-item>

            <a-form-item label="Start Time">
              <div class="time-picker-container">
                <a-time-picker
                  v-model:value="startTime"
                  format="HH:mm:ss"
                  :show-now="false"
                  allow-clear
                  style="flex: 1"
                  @change="onStartTimeChange"
                />
                <a-button
                  :icon="h(ClockCircleOutlined)"
                  :disabled="!videoFile"
                  title="Set to current video time"
                  @click="setStartTimeToCurrent"
                />
              </div>
            </a-form-item>

            <a-form-item label="End Time">
              <div class="time-picker-container">
                <a-time-picker
                  v-model:value="endTime"
                  format="HH:mm:ss"
                  :show-now="false"
                  allow-clear
                  style="flex: 1"
                  @change="onEndTimeChange"
                />
                <a-button
                  :icon="h(ClockCircleOutlined)"
                  :disabled="!videoFile"
                  title="Set to current video time"
                  @click="setEndTimeToCurrent"
                />
              </div>
            </a-form-item>
          </a-form>
        </a-card>

        <!-- Actions Card -->
        <a-card title="Actions" :bordered="false" class="actions-card">
          <a-space direction="vertical" style="width: 100%">
            <a-button
              type="primary"
              size="large"
              :disabled="!videoFile"
              block
              @click="addToQueue"
            >
              <template #icon>
                <PlusOutlined />
              </template>
              Add to Queue
            </a-button>
            <a-button size="large" block @click="resetForm">
              <template #icon>
                <ReloadOutlined />
              </template>
              Reset
            </a-button>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, h } from 'vue'
import { message } from 'ant-design-vue'
import {
  UploadOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
  SoundFilled,
  FullscreenOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { ALL_LANGUAGES } from '@/constants/languages'
import { useSettingsStore } from '@/stores/settings'
import { useQueueStore } from '@/stores/queue'
import type { CropZone } from '@/types/cli'

const settingsStore = useSettingsStore()
const queueStore = useQueueStore()

// Video refs
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const videoDisplayRef = ref<HTMLDivElement>()
const videoFile = ref<File | null>(null)
const videoUrl = ref<string>('')

// Batch add refs
const folderInputRef = ref<HTMLInputElement>()
const batchAdding = ref(false)

// Playback state
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(100)
const isMuted = ref(false)

// Crop mode
const isCropMode = ref(false)

// Time refs
const startTime = ref<Dayjs | undefined>(undefined)
const endTime = ref<Dayjs | undefined>(undefined)

// Crop zones
const cropZones = ref<CropZone[]>([])
const selectedZoneIndex = ref<number | null>(null)
const isDrawing = ref(false)
const isMoving = ref(false)
const isResizing = ref(false)
const resizeHandle = ref<string | null>(null) // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
const startX = ref(0)
const startY = ref(0)
const originalZone = ref<CropZone | null>(null)

// Resize handle size
const HANDLE_SIZE = 10

// Settings
const settings = reactive({
  general: { ...settingsStore.general },
  advanced: JSON.parse(JSON.stringify(settingsStore.advanced)),
})

// Initialize
onMounted(() => {
  settingsStore.loadSettings()
  Object.assign(settings.general, settingsStore.general)
  Object.assign(settings.advanced, settingsStore.advanced)

  // Initialize time pickers with saved values
  if (settings.general.time_start) {
    startTime.value = dayjs(settings.general.time_start, 'HH:mm:ss')
  }
  if (settings.general.time_end) {
    endTime.value = dayjs(settings.general.time_end, 'HH:mm:ss')
  }
})

onUnmounted(() => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }
})

// Video handlers
const handleVideoUpload = (file: File) => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }

  videoFile.value = file
  videoUrl.value = URL.createObjectURL(file)

  // Restore crop zones from settings instead of clearing them
  cropZones.value = [...settings.advanced.crop_zones]
  selectedZoneIndex.value = cropZones.value.length > 0 ? 0 : null

  isPlaying.value = false
  currentTime.value = 0
  isCropMode.value = false

  return false // Prevent auto upload
}

const handleFolderUpload = async () => {
  // Trigger the hidden file input
  folderInputRef.value?.click()
}

const onFolderSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) {
    return
  }

  batchAdding.value = true

  try {
    // Filter for video files only
    const videoFiles = Array.from(files).filter(
      (file) =>
        file.type.startsWith('video/') ||
        file.name.match(/\.(mp4|avi|mov|mkv|flv|wmv|webm)$/i),
    )

    if (videoFiles.length === 0) {
      message.warning('No video files found in the selected folder')
      return
    }

    // Update settings store
    settingsStore.updateGeneralSettings(settings.general)
    settingsStore.updateAdvancedSettings(settings.advanced)

    // Upload each video to backend and add to queue
    let successCount = 0
    let failCount = 0

    for (const file of videoFiles) {
      try {
        // Upload file to backend
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/upload`,
          {
            method: 'POST',
            body: formData,
          },
        )

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json()
          throw new Error(error.error || 'Failed to upload file')
        }

        const uploadResult = await uploadResponse.json()
        console.log(`[BatchAdd] File uploaded: ${file.name}`, uploadResult)

        // Add to queue with server-side file path
        await queueStore.addToQueue(uploadResult.path, {
          general: { ...settings.general },
          advanced: JSON.parse(JSON.stringify(settings.advanced)),
        })

        successCount++
      } catch (error) {
        console.error(`[BatchAdd] Error adding ${file.name}:`, error)
        failCount++
      }
    }

    // Show summary message
    if (successCount > 0 && failCount === 0) {
      message.success(`Successfully added ${successCount} videos to queue`)
    } else if (successCount > 0 && failCount > 0) {
      message.warning(`Added ${successCount} videos, ${failCount} failed`)
    } else {
      message.error(`Failed to add any videos to queue`)
    }
  } catch (error) {
    console.error('[BatchAdd] Error:', error)
    message.error(
      error instanceof Error ? error.message : 'Failed to add videos to queue',
    )
  } finally {
    batchAdding.value = false
    // Reset the input so the same folder can be selected again
    if (target) {
      target.value = ''
    }
  }
}

const onVideoLoaded = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
    setupCanvas()
    setupCropSelection()
    adjustVideoSize()

    // Draw restored crop zones on the canvas
    if (cropZones.value.length > 0) {
      drawCropZones()
    }
  }
}

const onTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

const onVideoEnded = () => {
  isPlaying.value = false
}

// Playback controls
const togglePlay = () => {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const stopVideo = () => {
  if (!videoRef.value) return

  videoRef.value.pause()
  videoRef.value.currentTime = 0
  isPlaying.value = false
  currentTime.value = 0
}

const rewind = () => {
  if (!videoRef.value) return

  videoRef.value.currentTime = Math.max(0, videoRef.value.currentTime - 5)
}

const fastForward = () => {
  if (!videoRef.value) return

  videoRef.value.currentTime = Math.min(
    duration.value,
    videoRef.value.currentTime + 5,
  )
}

const onSeek = (value: number | [number, number]) => {
  if (!videoRef.value) return

  const seekValue = Array.isArray(value) ? value[0] : value
  videoRef.value.currentTime = seekValue
}

const onVolumeChange = (value: number | [number, number]) => {
  if (!videoRef.value) return

  const volumeValue = Array.isArray(value) ? value[0] : value
  videoRef.value.volume = volumeValue / 100
  isMuted.value = volumeValue === 0
}

const toggleMute = () => {
  if (!videoRef.value) return

  isMuted.value = !isMuted.value
  videoRef.value.muted = isMuted.value
}

const toggleFullscreen = () => {
  if (!videoDisplayRef.value) return

  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    videoDisplayRef.value.requestFullscreen()
  }
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Canvas setup
const setupCanvas = () => {
  if (!videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 2

    // Draw existing crop zones
    drawCropZones()
  }
}

const drawCropZones = () => {
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  cropZones.value.forEach((zone, index) => {
    const isSelected = selectedZoneIndex.value === index

    // Draw zone rectangle
    ctx.strokeStyle = index === 0 ? '#ff0000' : '#00ff00'
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.strokeRect(zone.x, zone.y, zone.width, zone.height)

    // Draw semi-transparent fill for selected zone
    if (isSelected) {
      ctx.fillStyle =
        index === 0 ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)'
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height)

      // Draw resize handles
      drawResizeHandles(ctx, zone)
    }

    // Draw zone label
    ctx.fillStyle = index === 0 ? '#ff0000' : '#00ff00'
    ctx.font = '16px Arial'
    ctx.fillText(`Zone ${index + 1}`, zone.x, zone.y - 5)
  })
}

const drawResizeHandles = (ctx: CanvasRenderingContext2D, zone: CropZone) => {
  const handles = [
    { x: zone.x - HANDLE_SIZE / 2, y: zone.y - HANDLE_SIZE / 2 }, // nw
    {
      x: zone.x + zone.width / 2 - HANDLE_SIZE / 2,
      y: zone.y - HANDLE_SIZE / 2,
    }, // n
    { x: zone.x + zone.width - HANDLE_SIZE / 2, y: zone.y - HANDLE_SIZE / 2 }, // ne
    {
      x: zone.x + zone.width - HANDLE_SIZE / 2,
      y: zone.y + zone.height / 2 - HANDLE_SIZE / 2,
    }, // e
    {
      x: zone.x + zone.width - HANDLE_SIZE / 2,
      y: zone.y + zone.height - HANDLE_SIZE / 2,
    }, // se
    {
      x: zone.x + zone.width / 2 - HANDLE_SIZE / 2,
      y: zone.y + zone.height - HANDLE_SIZE / 2,
    }, // s
    { x: zone.x - HANDLE_SIZE / 2, y: zone.y + zone.height - HANDLE_SIZE / 2 }, // sw
    {
      x: zone.x - HANDLE_SIZE / 2,
      y: zone.y + zone.height / 2 - HANDLE_SIZE / 2,
    }, // w
  ]

  handles.forEach((handle) => {
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.fillRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE)
    ctx.strokeRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE)
  })
}

// Adjust video size to match aspect ratio
const adjustVideoSize = () => {
  if (!videoRef.value || !videoDisplayRef.value) return

  const video = videoRef.value
  const container = videoDisplayRef.value

  const videoRatio = video.videoWidth / video.videoHeight
  // Use the left column's width (videoDisplayRef's parent)
  const parentWidth = container.parentElement?.clientWidth || 1200

  // Use full parent width
  const videoWidth = parentWidth
  const videoHeight = videoWidth / videoRatio

  // Set container dimensions to match video
  container.style.width = `${videoWidth}px`
  container.style.height = `${videoHeight}px`
  container.style.margin = '0 auto'

  // Video and canvas fill the container
  video.style.width = '100%'
  video.style.height = '100%'
  video.style.objectFit = 'fill'

  if (canvasRef.value) {
    canvasRef.value.style.width = '100%'
    canvasRef.value.style.height = '100%'
  }
}

// Crop selection
const setupCropSelection = () => {
  if (!canvasRef.value) return

  const canvas = canvasRef.value

  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)
}

const getMousePosition = (e: MouseEvent) => {
  if (!canvasRef.value) return { x: 0, y: 0 }

  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
}

const getResizeHandleAtPosition = (
  x: number,
  y: number,
  zone: CropZone,
): string | null => {
  const handles = {
    nw: { x: zone.x - HANDLE_SIZE / 2, y: zone.y - HANDLE_SIZE / 2 },
    ne: {
      x: zone.x + zone.width - HANDLE_SIZE / 2,
      y: zone.y - HANDLE_SIZE / 2,
    },
    sw: {
      x: zone.x - HANDLE_SIZE / 2,
      y: zone.y + zone.height - HANDLE_SIZE / 2,
    },
    se: {
      x: zone.x + zone.width - HANDLE_SIZE / 2,
      y: zone.y + zone.height - HANDLE_SIZE / 2,
    },
    n: {
      x: zone.x + zone.width / 2 - HANDLE_SIZE / 2,
      y: zone.y - HANDLE_SIZE / 2,
    },
    s: {
      x: zone.x + zone.width / 2 - HANDLE_SIZE / 2,
      y: zone.y + zone.height - HANDLE_SIZE / 2,
    },
    e: {
      x: zone.x + zone.width - HANDLE_SIZE / 2,
      y: zone.y + zone.height / 2 - HANDLE_SIZE / 2,
    },
    w: {
      x: zone.x - HANDLE_SIZE / 2,
      y: zone.y + zone.height / 2 - HANDLE_SIZE / 2,
    },
  }

  for (const [handle, pos] of Object.entries(handles)) {
    if (
      x >= pos.x &&
      x <= pos.x + HANDLE_SIZE &&
      y >= pos.y &&
      y <= pos.y + HANDLE_SIZE
    ) {
      return handle
    }
  }

  return null
}

const isPointInZone = (x: number, y: number, zone: CropZone): boolean => {
  return (
    x >= zone.x &&
    x <= zone.x + zone.width &&
    y >= zone.y &&
    y <= zone.y + zone.height
  )
}

const onMouseDown = (e: MouseEvent) => {
  if (!isCropMode.value || !canvasRef.value) return

  const pos = getMousePosition(e)

  // Check if clicking on resize handle of selected zone
  if (selectedZoneIndex.value !== null) {
    const zone = cropZones.value[selectedZoneIndex.value]
    const handle = getResizeHandleAtPosition(pos.x, pos.y, zone)

    if (handle) {
      isResizing.value = true
      resizeHandle.value = handle
      startX.value = pos.x
      startY.value = pos.y
      originalZone.value = { ...zone }
      return
    }
  }

  // Check if clicking on existing zone
  for (let i = cropZones.value.length - 1; i >= 0; i--) {
    if (isPointInZone(pos.x, pos.y, cropZones.value[i])) {
      selectedZoneIndex.value = i
      isMoving.value = true
      startX.value = pos.x
      startY.value = pos.y
      originalZone.value = { ...cropZones.value[i] }
      drawCropZones()
      return
    }
  }

  // Start drawing new zone
  selectedZoneIndex.value = null
  startX.value = pos.x
  startY.value = pos.y
  isDrawing.value = true
  drawCropZones()
}

const onMouseMove = (e: MouseEvent) => {
  if (!isCropMode.value || !canvasRef.value) return

  const pos = getMousePosition(e)

  // Update cursor based on position
  if (
    selectedZoneIndex.value !== null &&
    !isDrawing.value &&
    !isMoving.value &&
    !isResizing.value
  ) {
    const zone = cropZones.value[selectedZoneIndex.value]
    const handle = getResizeHandleAtPosition(pos.x, pos.y, zone)

    if (handle) {
      const cursors: Record<string, string> = {
        nw: 'nw-resize',
        ne: 'ne-resize',
        sw: 'sw-resize',
        se: 'se-resize',
        n: 'n-resize',
        s: 's-resize',
        e: 'e-resize',
        w: 'w-resize',
      }
      canvasRef.value.style.cursor = cursors[handle]
    } else if (isPointInZone(pos.x, pos.y, zone)) {
      canvasRef.value.style.cursor = 'move'
    } else {
      canvasRef.value.style.cursor = 'crosshair'
    }
  }

  // Handle resizing
  if (
    isResizing.value &&
    selectedZoneIndex.value !== null &&
    originalZone.value
  ) {
    const zone = cropZones.value[selectedZoneIndex.value]
    const dx = pos.x - startX.value
    const dy = pos.y - startY.value

    switch (resizeHandle.value) {
      case 'nw':
        zone.x = Math.max(0, originalZone.value.x + dx)
        zone.y = Math.max(0, originalZone.value.y + dy)
        zone.width = originalZone.value.width - dx
        zone.height = originalZone.value.height - dy
        break
      case 'ne':
        zone.y = Math.max(0, originalZone.value.y + dy)
        zone.width = originalZone.value.width + dx
        zone.height = originalZone.value.height - dy
        break
      case 'sw':
        zone.x = Math.max(0, originalZone.value.x + dx)
        zone.width = originalZone.value.width - dx
        zone.height = originalZone.value.height + dy
        break
      case 'se':
        zone.width = originalZone.value.width + dx
        zone.height = originalZone.value.height + dy
        break
      case 'n':
        zone.y = Math.max(0, originalZone.value.y + dy)
        zone.height = originalZone.value.height - dy
        break
      case 's':
        zone.height = originalZone.value.height + dy
        break
      case 'e':
        zone.width = originalZone.value.width + dx
        break
      case 'w':
        zone.x = Math.max(0, originalZone.value.x + dx)
        zone.width = originalZone.value.width - dx
        break
    }

    // Ensure minimum size
    if (zone.width < 10) zone.width = 10
    if (zone.height < 10) zone.height = 10

    drawCropZones()
    return
  }

  // Handle moving
  if (
    isMoving.value &&
    selectedZoneIndex.value !== null &&
    originalZone.value
  ) {
    const zone = cropZones.value[selectedZoneIndex.value]
    const dx = pos.x - startX.value
    const dy = pos.y - startY.value

    zone.x = Math.max(0, originalZone.value.x + dx)
    zone.y = Math.max(0, originalZone.value.y + dy)

    drawCropZones()
    return
  }

  // Handle drawing new zone
  if (isDrawing.value) {
    const width = pos.x - startX.value
    const height = pos.y - startY.value

    // Draw preview
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      drawCropZones()
      ctx.strokeStyle = '#ffff00'
      ctx.strokeRect(startX.value, startY.value, width, height)
    }
  }
}

const onMouseUp = (e: MouseEvent) => {
  if (!isCropMode.value || !canvasRef.value) return

  const pos = getMousePosition(e)

  // Handle resize end
  if (isResizing.value && selectedZoneIndex.value !== null) {
    const zone = cropZones.value[selectedZoneIndex.value]
    zone.x = Math.round(zone.x)
    zone.y = Math.round(zone.y)
    zone.width = Math.round(zone.width)
    zone.height = Math.round(zone.height)

    settings.advanced.crop_zones = [...cropZones.value]
    isResizing.value = false
    resizeHandle.value = null
    originalZone.value = null
    drawCropZones()
    return
  }

  // Handle move end
  if (isMoving.value && selectedZoneIndex.value !== null) {
    const zone = cropZones.value[selectedZoneIndex.value]
    zone.x = Math.round(zone.x)
    zone.y = Math.round(zone.y)

    settings.advanced.crop_zones = [...cropZones.value]
    isMoving.value = false
    originalZone.value = null
    drawCropZones()
    return
  }

  // Handle drawing end
  if (isDrawing.value) {
    const width = Math.abs(pos.x - startX.value)
    const height = Math.abs(pos.y - startY.value)
    const x = Math.min(startX.value, pos.x)
    const y = Math.min(startY.value, pos.y)

    if (width > 10 && height > 10) {
      const zone: CropZone = {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      }

      if (settings.advanced.use_dual_zone) {
        if (cropZones.value.length < 2) {
          cropZones.value.push(zone)
          selectedZoneIndex.value = cropZones.value.length - 1
        } else {
          message.warning('Maximum 2 crop zones allowed')
        }
      } else {
        cropZones.value = [zone]
        selectedZoneIndex.value = 0
      }

      settings.advanced.crop_zones = [...cropZones.value]
      drawCropZones()
    }

    isDrawing.value = false
  }
}

const selectZone = (index: number) => {
  selectedZoneIndex.value = index
  drawCropZones()
}

const editZone = (index: number) => {
  selectedZoneIndex.value = index
  isCropMode.value = true
  drawCropZones()
  message.info(
    `Zone ${index + 1} selected. Drag to move, use corners to resize, or edit values below.`,
  )
}

const updateZoneFromInput = () => {
  if (selectedZoneIndex.value !== null) {
    const zone = cropZones.value[selectedZoneIndex.value]

    // Ensure values are valid
    zone.x = Math.max(0, Math.round(zone.x))
    zone.y = Math.max(0, Math.round(zone.y))
    zone.width = Math.max(10, Math.round(zone.width))
    zone.height = Math.max(10, Math.round(zone.height))

    // Update settings
    settings.advanced.crop_zones = [...cropZones.value]
    drawCropZones()
  }
}

const removeCropZone = (index: number) => {
  cropZones.value.splice(index, 1)
  if (selectedZoneIndex.value === index) {
    selectedZoneIndex.value = null
  } else if (
    selectedZoneIndex.value !== null &&
    selectedZoneIndex.value > index
  ) {
    selectedZoneIndex.value--
  }
  settings.advanced.crop_zones = [...cropZones.value]
  drawCropZones()
}

const setPresetPosition = (position: 'top' | 'center' | 'bottom') => {
  if (!videoRef.value) return

  const video = videoRef.value
  const width = video.videoWidth
  const height = video.videoHeight

  const zone: CropZone = {
    x: 0,
    y:
      position === 'top'
        ? 0
        : position === 'center'
          ? height / 3
          : (height * 2) / 3,
    width: width,
    height: height / 3,
  }

  cropZones.value = [zone]
  selectedZoneIndex.value = 0
  settings.advanced.crop_zones = [...cropZones.value]
  drawCropZones()
}

// Time handlers
const setStartTimeToCurrent = () => {
  if (!videoRef.value) return

  const hours = Math.floor(currentTime.value / 3600)
  const mins = Math.floor((currentTime.value % 3600) / 60)
  const secs = Math.floor(currentTime.value % 60)
  const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  startTime.value = dayjs(timeString, 'HH:mm:ss')
  settings.general.time_start = timeString
}

const setEndTimeToCurrent = () => {
  if (!videoRef.value) return

  const hours = Math.floor(currentTime.value / 3600)
  const mins = Math.floor((currentTime.value % 3600) / 60)
  const secs = Math.floor(currentTime.value % 60)
  const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  endTime.value = dayjs(timeString, 'HH:mm:ss')
  settings.general.time_end = timeString
}

const onStartTimeChange = (value: string | Dayjs | null) => {
  if (value && typeof value !== 'string') {
    settings.general.time_start = value.format('HH:mm:ss')
  } else {
    settings.general.time_start = ''
  }
}

const onEndTimeChange = (value: string | Dayjs | null) => {
  if (value && typeof value !== 'string') {
    settings.general.time_end = value.format('HH:mm:ss')
  } else {
    settings.general.time_end = ''
  }
}

// Language filter
const filterLanguage = (input: string, option: any) => {
  const lang = ALL_LANGUAGES.find((l) => l.code === option.value)
  if (!lang) return false
  return (
    lang.name.toLowerCase().includes(input.toLowerCase()) ||
    lang.code.toLowerCase().includes(input.toLowerCase())
  )
}

// Add to queue
const addToQueue = async () => {
  if (!videoFile.value) {
    message.error('Please select a video file')
    return
  }

  try {
    // Upload file to backend first
    const formData = new FormData()
    // Append the file directly - FormData handles UTF-8 encoding automatically
    formData.append('file', videoFile.value)

    const uploadResponse = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/upload`,
      {
        method: 'POST',
        body: formData,
      },
    )

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      throw new Error(error.error || 'Failed to upload file')
    }

    const uploadResult = await uploadResponse.json()
    console.log('[AddVideo] File uploaded:', uploadResult)

    // Update settings store
    settingsStore.updateGeneralSettings(settings.general)
    settingsStore.updateAdvancedSettings(settings.advanced)

    // Add to queue with server-side file path
    queueStore.addToQueue(uploadResult.path, {
      general: { ...settings.general },
      advanced: JSON.parse(JSON.stringify(settings.advanced)),
    })

    message.success('Video added to queue')
    resetForm()
  } catch (error) {
    console.error('[AddVideo] Error adding to queue:', error)
    message.error(
      error instanceof Error ? error.message : 'Failed to add video to queue',
    )
  }
}

const resetForm = () => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }

  videoFile.value = null
  videoUrl.value = ''
  cropZones.value = []
  selectedZoneIndex.value = null
  isPlaying.value = false
  currentTime.value = 0
  isCropMode.value = false

  // Don't clear time values - they should persist like Output Directory
  // startTime.value = undefined
  // endTime.value = undefined

  Object.assign(settings.general, settingsStore.general)
  Object.assign(settings.advanced, settingsStore.advanced)
}
</script>

<style scoped lang="less">
.add-video-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.settings-card {
  margin-bottom: 24px;
}

.actions-card {
  margin-bottom: 0;
}

.video-player-wrapper {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
}

.video-display-area {
  position: relative;
  background: #000;
}

.video-display-area video {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  object-fit: fill;
}

.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  cursor: default;
  z-index: 10;
}

.crop-overlay.crop-mode {
  pointer-events: auto;
  cursor: crosshair;
}

.video-controls {
  background: #1a1a1a;
  padding: 12px 16px;
  border-top: 1px solid #333;
  width: 100%;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.time-display {
  color: #fff;
  font-family: monospace;
  font-size: 14px;
  min-width: 100px;
  text-align: center;
}

.progress-bar-container {
  width: 100%;
}

.progress-bar-container :deep(.ant-slider) {
  margin: 0;
}

.progress-bar-container :deep(.ant-slider-rail) {
  background: #333;
}

.progress-bar-container :deep(.ant-slider-track) {
  background: #1890ff;
}

.progress-bar-container :deep(.ant-slider-handle) {
  border-color: #1890ff;
}

.zone-editor {
  background: #f9f9f9;
  padding: 8px;
  border-radius: 8px;
  margin-top: 16px;
}

.zone-editor-header {
  margin-bottom: 8px;
}

.zone-editor-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.zone-editor-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.zone-editor-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zone-editor-field label {
  font-size: 11px;
  font-weight: 500;
  color: #666;
  margin: 0;
}

.crop-zones-info {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.no-crop-zones {
  color: #999;
  font-style: italic;
}

.crop-zone-item {
  margin-bottom: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
  }

  &.selected {
    background: #e6f7ff;
    border: 2px solid #1890ff;
  }
}

.time-picker-container {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.disabled-field {
  opacity: 0.5;
  pointer-events: none;
}

// Responsive adjustments
@media (max-width: 991px) {
  .add-video-container {
    max-width: 100%;
  }

  .settings-card {
    margin-top: 24px;
    margin-bottom: 24px;
  }

  .actions-card {
    margin-top: 24px;
  }
}
</style>
