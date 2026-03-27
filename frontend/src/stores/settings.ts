/**
 * Settings Store
 * Manages application settings with localStorage persistence
 */

import { defineStore } from 'pinia'
import type { VideoSettings, AdvancedSettings, GeneralSettings } from '@/types/cli'

const STORAGE_KEY = 'videocr-settings'

interface SettingsState {
  general: GeneralSettings
  advanced: AdvancedSettings
}

const defaultGeneralSettings: GeneralSettings = {
  lang: 'en',
  output_dir: '',
  time_start: '',
  time_end: '',
}

const defaultAdvancedSettings: AdvancedSettings = {
  use_dual_zone: false,
  crop_zones: [],
  ocr: {
    sim_threshold: 80,
    max_merge_gap: 0.09,
    ssim_threshold: 92,
    frames_to_skip: 1,
    post_processing: false,
    min_subtitle_duration: 0.2,
    ocr_image_max_width: 960,
  },
  image_processing: {
    brightness_threshold: null,
    use_fullframe: false,
    subtitle_position: 'center',
  },
  ollama: {
    host: 'localhost',
    port: 11434,
    model: 'glm-ocr:latest',
    timeout: 300,
  },
  system: {
    allow_system_sleep: false,
    parallel_workers: 1,
    cleanup_enabled: true,
    cleanup_max_age: 1, // hours
    cleanup_interval: 1, // hours
  },
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    general: { ...defaultGeneralSettings },
    advanced: JSON.parse(JSON.stringify(defaultAdvancedSettings)),
  }),

  getters: {
    videoSettings: (state): VideoSettings => ({
      general: state.general,
      advanced: state.advanced,
    }),
  },

  actions: {
    /**
     * Load settings from localStorage
     */
    loadSettings(): void {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          this.general = { ...defaultGeneralSettings, ...parsed.general }
          this.advanced = this.mergeAdvancedSettings(defaultAdvancedSettings, parsed.advanced)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    },

    /**
     * Save settings to localStorage
     */
    saveSettings(): void {
      try {
        const settings = {
          general: this.general,
          advanced: this.advanced,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      } catch (error) {
        console.error('Failed to save settings:', error)
      }
    },

    /**
     * Reset settings to defaults
     */
    resetSettings(): void {
      this.general = { ...defaultGeneralSettings }
      this.advanced = JSON.parse(JSON.stringify(defaultAdvancedSettings))
      this.saveSettings()
    },

    /**
     * Update general settings
     */
    updateGeneralSettings(settings: Partial<GeneralSettings>): void {
      this.general = { ...this.general, ...settings }
      this.saveSettings()
    },

    /**
     * Update advanced settings
     */
    updateAdvancedSettings(settings: Partial<AdvancedSettings>): void {
      this.advanced = this.mergeAdvancedSettings(this.advanced, settings)
      this.saveSettings()
    },

    /**
     * Export settings to JSON
     */
    exportSettings(): string {
      const settings = {
        general: this.general,
        advanced: this.advanced,
      }
      return JSON.stringify(settings, null, 2)
    },

    /**
     * Import settings from JSON
     */
    importSettings(json: string): boolean {
      try {
        const parsed = JSON.parse(json)
        this.general = { ...defaultGeneralSettings, ...parsed.general }
        this.advanced = this.mergeAdvancedSettings(defaultAdvancedSettings, parsed.advanced)
        this.saveSettings()
        return true
      } catch (error) {
        console.error('Failed to import settings:', error)
        return false
      }
    },

    /**
     * Merge advanced settings recursively
     */
    mergeAdvancedSettings(
      base: AdvancedSettings,
      override: Partial<AdvancedSettings>
    ): AdvancedSettings {
      return {
        use_dual_zone: override.use_dual_zone ?? base.use_dual_zone,
        crop_zones: override.crop_zones ?? base.crop_zones,
        ocr: { ...base.ocr, ...override.ocr },
        image_processing: { ...base.image_processing, ...override.image_processing },
        ollama: { ...base.ollama, ...override.ollama },
        system: { ...base.system, ...override.system },
      }
    },
  },
})

// Initialize settings on store creation
export function initializeSettings() {
  const store = useSettingsStore()
  store.loadSettings()
}