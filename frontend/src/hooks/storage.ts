import { ref } from 'vue'
import { LocalStorage, SessionStorage } from '@bassist/utils'
import { STORAGE_PREFIX } from '@/constants'
import type { StorageType } from '@bassist/utils'

export function useStorage(type: StorageType = 'localStorage') {
  const prefix = ref(STORAGE_PREFIX)
  const isLocalStorage = ref(type === 'localStorage')

  /**
   * Storage instance, can operate specific APIs
   * @description For specific APIs and usage, see the documentation or TypeScript type declarations
   * @see https://paka.dev/npm/@bassist/utils
   *
   * @example
   *  storage.set('uid', 1)
   *  storage.get('uid') // 1
   */
  const storage: LocalStorage | SessionStorage = isLocalStorage.value
    ? new LocalStorage(prefix.value)
    : new SessionStorage(prefix.value)

  return {
    prefix,
    isLocalStorage,
    storage,
  }
}
