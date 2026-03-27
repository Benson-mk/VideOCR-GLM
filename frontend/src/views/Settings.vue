<template>
  <div class="settings-container">
    <a-card title="Settings" :bordered="false">
      <a-form layout="vertical">
        <!-- General Settings -->
        <a-divider>General Settings</a-divider>

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

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Start Time">
              <a-time-picker
                v-model:value="startTime"
                format="HH:mm:ss"
                :show-now="false"
                allow-clear
                style="width: 100%"
                @change="onStartTimeChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="End Time">
              <a-time-picker
                v-model:value="endTime"
                format="HH:mm:ss"
                :show-now="false"
                allow-clear
                style="width: 100%"
                @change="onEndTimeChange"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- OCR Settings -->
        <a-divider>OCR Settings</a-divider>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Similarity Threshold (0-100)">
              <a-input-number
                v-model:value="settings.advanced.ocr.sim_threshold"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="SSIM Threshold (0-100)">
              <a-input-number
                v-model:value="settings.advanced.ocr.ssim_threshold"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Max Merge Gap (seconds)">
              <a-input-number
                v-model:value="settings.advanced.ocr.max_merge_gap"
                :min="0"
                :step="0.01"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Frames to Skip">
              <a-input-number
                v-model:value="settings.advanced.ocr.frames_to_skip"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Min Subtitle Duration (seconds)">
              <a-input-number
                v-model:value="settings.advanced.ocr.min_subtitle_duration"
                :min="0"
                :step="0.1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="OCR Image Max Width">
              <a-input-number
                v-model:value="settings.advanced.ocr.ocr_image_max_width"
                :min="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item>
          <a-checkbox v-model:checked="settings.advanced.ocr.post_processing">
            Enable Post Processing
          </a-checkbox>
        </a-form-item>

        <!-- Image Processing -->
        <a-divider>Image Processing</a-divider>

        <a-form-item label="Subtitle Position">
          <a-select
            v-model:value="settings.advanced.image_processing.subtitle_position"
          >
            <a-select-option value="center"> Center </a-select-option>
            <a-select-option value="left"> Left </a-select-option>
            <a-select-option value="right"> Right </a-select-option>
            <a-select-option value="any"> Any </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Brightness Threshold (0-255, leave empty for auto)">
          <a-input-number
            v-model:value="brightnessThreshold"
            :min="0"
            :max="255"
            style="width: 100%"
            @change="onBrightnessThresholdChange"
          />
        </a-form-item>

        <!-- Crop Zones -->
        <a-divider>Crop Zones</a-divider>

        <a-form-item>
          <a-checkbox
            v-model:checked="settings.advanced.image_processing.use_fullframe"
          >
            Use Full Frame for OCR
          </a-checkbox>
        </a-form-item>

        <a-form-item>
          <a-checkbox
            v-model:checked="settings.advanced.use_dual_zone"
            :disabled="settings.advanced.image_processing.use_fullframe"
          >
            Enable Dual Zone OCR
          </a-checkbox>
        </a-form-item>

        <a-form-item
          label="Crop Zone 1"
          :class="{
            'disabled-field': settings.advanced.image_processing.use_fullframe,
          }"
        >
          <a-row :gutter="8">
            <a-col :span="6">
              <a-input-number
                v-model:value="cropZone1.x"
                placeholder="X"
                :min="0"
                :disabled="settings.advanced.image_processing.use_fullframe"
                style="width: 100%"
              />
            </a-col>
            <a-col :span="6">
              <a-input-number
                v-model:value="cropZone1.y"
                placeholder="Y"
                :min="0"
                :disabled="settings.advanced.image_processing.use_fullframe"
                style="width: 100%"
              />
            </a-col>
            <a-col :span="6">
              <a-input-number
                v-model:value="cropZone1.width"
                placeholder="Width"
                :min="1"
                :disabled="settings.advanced.image_processing.use_fullframe"
                style="width: 100%"
              />
            </a-col>
            <a-col :span="6">
              <a-input-number
                v-model:value="cropZone1.height"
                placeholder="Height"
                :min="1"
                :disabled="settings.advanced.image_processing.use_fullframe"
                style="width: 100%"
              />
            </a-col>
          </a-row>
        </a-form-item>

        <a-form-item
          v-if="settings.advanced.use_dual_zone"
          label="Crop Zone 2"
          :class="{
            'disabled-field': settings.advanced.image_processing.use_fullframe,
          }"
        >
          <a-row :gutter="8">
            <a-col :span="6">
              <a-input-number
                v-model:value="cropZone2.x"
                placeholder="X"
                :min="0"
                :disabled="settings.advanced.image_processing.use_fullframe"
                style="width: 100%"
              />
            </a-col>
            <a-col :span="6">
              <a-input-number
                v-model:value="cropZone2.y"
                placeholder="Y"
                :min="0"
                :disabled="settings.advanced.image_processing.use_fullframe"
                style="width: 100%"
              />
            </a-col>
            <a-col :span="6">
              <a-input-number
                v-model:value="cropZone2.width"
                placeholder="Width"
                :min="1"
                :disabled="settings.advanced.image_processing.use_fullframe"
                style="width: 100%"
              />
            </a-col>
            <a-col :span="6">
              <a-input-number
                v-model:value="cropZone2.height"
                placeholder="Height"
                :min="1"
                :disabled="settings.advanced.image_processing.use_fullframe"
                style="width: 100%"
              />
            </a-col>
          </a-row>
        </a-form-item>

        <!-- Ollama Settings -->
        <a-divider>Ollama Settings</a-divider>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Ollama Host">
              <a-input v-model:value="settings.advanced.ollama.host" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Ollama Port">
              <a-input-number
                v-model:value="settings.advanced.ollama.port"
                :min="1"
                :max="65535"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Ollama Model">
              <a-input v-model:value="settings.advanced.ollama.model" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Ollama Timeout (seconds)">
              <a-input-number
                v-model:value="settings.advanced.ollama.timeout"
                :min="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- System Settings -->
        <a-divider>System Settings</a-divider>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Parallel Workers">
              <a-input-number
                v-model:value="settings.advanced.system.parallel_workers"
                :min="1"
                :max="10"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Allow System Sleep">
              <a-checkbox
                v-model:checked="settings.advanced.system.allow_system_sleep"
              >
                Allow system to sleep during processing
              </a-checkbox>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Queue Cleanup Settings -->
        <a-divider>Queue Cleanup</a-divider>

        <a-form-item>
          <a-checkbox v-model:checked="settings.advanced.system.cleanup_enabled">
            Enable Automatic Queue Cleanup
          </a-checkbox>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Cleanup Max Age (hours)">
              <a-input-number
                v-model:value="settings.advanced.system.cleanup_max_age"
                :min="1"
                :step="0.5"
                style="width: 100%"
              />
              <template #extra>
                Remove completed items older than this duration
              </template>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Cleanup Interval (hours)">
              <a-input-number
                v-model:value="settings.advanced.system.cleanup_interval"
                :min="1"
                :step="0.5"
                style="width: 100%"
              />
              <template #extra>
                How often to run automatic cleanup
              </template>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Manual Cleanup">
          <a-space>
            <a-button
              :loading="cleaningQueue"
              @click="cleanupQueueNow"
            >
              <template #icon>
                <DeleteOutlined />
              </template>
              Cleanup Old Items Now
            </a-button>
            <a-tooltip
              title="Immediately remove completed items older than the max age setting"
            >
              <InfoCircleOutlined style="color: #999" />
            </a-tooltip>
          </a-space>
        </a-form-item>

        <a-form-item label="Backend Uploads">
          <a-space>
            <a-button
              danger
              :loading="clearingUploads"
              @click="clearBackendUploads"
            >
              <template #icon>
                <DeleteOutlined />
              </template>
              Clear Backend Uploads
            </a-button>
            <a-tooltip
              title="Delete all uploaded video files from the backend uploads directory"
            >
              <InfoCircleOutlined style="color: #999" />
            </a-tooltip>
          </a-space>
        </a-form-item>

        <!-- Actions -->
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="saveSettings">
              <template #icon>
                <SaveOutlined />
              </template>
              Save Settings
            </a-button>
            <a-button @click="resetSettings">
              <template #icon>
                <ReloadOutlined />
              </template>
              Reset to Defaults
            </a-button>
            <a-button @click="exportSettings">
              <template #icon>
                <ExportOutlined />
              </template>
              Export
            </a-button>
            <a-upload
              :before-upload="importSettings"
              :show-upload-list="false"
              accept=".json"
            >
              <a-button>
                <template #icon>
                  <ImportOutlined />
                </template>
                Import
              </a-button>
            </a-upload>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  SaveOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { ALL_LANGUAGES } from '@/constants/languages'
import { useSettingsStore } from '@/stores/settings'
import type { CropZone } from '@/types/cli'

const settingsStore = useSettingsStore()

// Settings
const settings = reactive({
  general: { ...settingsStore.general },
  advanced: JSON.parse(JSON.stringify(settingsStore.advanced)),
})

// Time refs
const startTime = ref<Dayjs | undefined>(undefined)
const endTime = ref<Dayjs | undefined>(undefined)

// Crop zones
const cropZone1 = reactive<CropZone>({ x: 0, y: 0, width: 0, height: 0 })
const cropZone2 = reactive<CropZone>({ x: 0, y: 0, width: 0, height: 0 })
const brightnessThreshold = ref<number | undefined>(
  settings.advanced.image_processing.brightness_threshold,
)
const clearingUploads = ref(false)
const cleaningQueue = ref(false)

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

  // Initialize crop zones
  if (settings.advanced.crop_zones[0]) {
    Object.assign(cropZone1, settings.advanced.crop_zones[0])
  }
  if (settings.advanced.crop_zones[1]) {
    Object.assign(cropZone2, settings.advanced.crop_zones[1])
  }

  brightnessThreshold.value =
    settings.advanced.image_processing.brightness_threshold
})

// Handlers
const onBrightnessThresholdChange = (value: string | number | undefined) => {
  settings.advanced.image_processing.brightness_threshold =
    typeof value === 'number' ? value : undefined
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

const saveSettings = async () => {
  // Update crop zones
  settings.advanced.crop_zones = []
  if (cropZone1.width > 0 && cropZone1.height > 0) {
    settings.advanced.crop_zones.push({ ...cropZone1 })
  }
  if (
    settings.advanced.use_dual_zone &&
    cropZone2.width > 0 &&
    cropZone2.height > 0
  ) {
    settings.advanced.crop_zones.push({ ...cropZone2 })
  }

  settingsStore.updateGeneralSettings(settings.general)
  settingsStore.updateAdvancedSettings(settings.advanced)

  // Sync cleanup settings to backend
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/queue/cleanup-settings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: settings.advanced.system.cleanup_enabled,
          maxAge: settings.advanced.system.cleanup_max_age * 3600000, // Convert hours to milliseconds
          interval: settings.advanced.system.cleanup_interval * 3600000, // Convert hours to milliseconds
        }),
      },
    )

    if (!response.ok) {
      throw new Error('Failed to update cleanup settings')
    }
  } catch (error) {
    console.error('[Settings] Update cleanup settings error:', error)
    message.warning('Settings saved but failed to update cleanup settings on backend')
    return
  }

  message.success('Settings saved successfully')
}

const resetSettings = () => {
  settingsStore.resetSettings()
  Object.assign(settings.general, settingsStore.general)
  Object.assign(settings.advanced, settingsStore.advanced)

  // Reset time pickers
  if (settings.general.time_start) {
    startTime.value = dayjs(settings.general.time_start, 'HH:mm:ss')
  } else {
    startTime.value = undefined
  }
  if (settings.general.time_end) {
    endTime.value = dayjs(settings.general.time_end, 'HH:mm:ss')
  } else {
    endTime.value = undefined
  }

  // Reset crop zones
  Object.assign(cropZone1, { x: 0, y: 0, width: 0, height: 0 })
  Object.assign(cropZone2, { x: 0, y: 0, width: 0, height: 0 })
  brightnessThreshold.value =
    settings.advanced.image_processing.brightness_threshold

  message.success('Settings reset to defaults')
}

const exportSettings = () => {
  const json = settingsStore.exportSettings()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'videocr-settings.json'
  a.click()
  URL.revokeObjectURL(url)

  message.success('Settings exported')
}

const importSettings = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    if (settingsStore.importSettings(content)) {
      Object.assign(settings.general, settingsStore.general)
      Object.assign(settings.advanced, settingsStore.advanced)

      // Update time pickers
      if (settings.general.time_start) {
        startTime.value = dayjs(settings.general.time_start, 'HH:mm:ss')
      } else {
        startTime.value = undefined
      }
      if (settings.general.time_end) {
        endTime.value = dayjs(settings.general.time_end, 'HH:mm:ss')
      } else {
        endTime.value = undefined
      }

      message.success('Settings imported successfully')
    } else {
      message.error('Failed to import settings')
    }
  }
  reader.readAsText(file)

  return false
}

const cleanupQueueNow = async () => {
  try {
    cleaningQueue.value = true

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/queue/cleanup-now`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxAge: settings.advanced.system.cleanup_max_age * 3600000, // Convert hours to milliseconds
        }),
      },
    )

    if (!response.ok) {
      throw new Error('Failed to cleanup queue')
    }

    const data = await response.json()
    message.success(data.message || 'Queue cleanup completed successfully')
  } catch (error) {
    console.error('[Settings] Cleanup queue error:', error)
    message.error('Failed to cleanup queue')
  } finally {
    cleaningQueue.value = false
  }
}

const clearBackendUploads = async () => {
  Modal.confirm({
    title: 'Clear Backend Uploads',
    content:
      'Are you sure you want to delete all uploaded video files from the backend uploads directory? This action cannot be undone.',
    okText: 'Yes, Clear All',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: async () => {
      try {
        clearingUploads.value = true

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/uploads/clear`,
          {
            method: 'POST',
          },
        )

        if (!response.ok) {
          throw new Error('Failed to clear uploads')
        }

        const data = await response.json()
        message.success(data.message || 'Backend uploads cleared successfully')
      } catch (error) {
        console.error('[Settings] Clear uploads error:', error)
        message.error('Failed to clear backend uploads')
      } finally {
        clearingUploads.value = false
      }
    },
  })
}
</script>

<style scoped lang="less">
.settings-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.disabled-field {
  opacity: 0.5;
  pointer-events: none;
}
</style>
