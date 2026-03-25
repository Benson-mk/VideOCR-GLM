<template>
  <!-- Loading state while router initializes -->
  <div v-if="!isReady" class="loading-container">
    <a-spin size="large" tip="Loading..." />
  </div>
  
  <!-- Main app layout -->
  <a-layout v-else class="app-layout">
    <a-layout-header class="app-header">
      <div class="header-content">
        <div class="logo">
          <img src="/icon.png" alt="Logo" />
          <span class="logo-text">VideOCR-GLM</span>
        </div>
        <a-menu
          v-model:selected-keys="selectedKeys"
          mode="horizontal"
          theme="dark"
          class="nav-menu"
        >
          <a-menu-item key="home" @click="navigateTo('/')">
            <template #icon>
              <VideoCameraOutlined />
            </template>
            Add Video
          </a-menu-item>
          <a-menu-item key="queue" @click="navigateTo('/queue')">
            <template #icon>
              <UnorderedListOutlined />
            </template>
            Queue
          </a-menu-item>
          <a-menu-item key="settings" @click="navigateTo('/settings')">
            <template #icon>
              <SettingOutlined />
            </template>
            Settings
          </a-menu-item>
          <a-menu-item key="about" @click="navigateTo('/about')">
            <template #icon>
              <InfoCircleOutlined />
            </template>
            About
          </a-menu-item>
        </a-menu>
      </div>
    </a-layout-header>
    <a-layout-content class="app-content">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  VideoCameraOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

// Loading state to prevent blank screen on startup
const isReady = ref(false)

// Map paths to menu keys
const pathToKeyMap: Record<string, string> = {
  '/': 'home',
  '/add-video': 'home',
  '/queue': 'queue',
  '/settings': 'settings',
  '/about': 'about',
}

const selectedKeys = ref<string[]>([pathToKeyMap[route.path] || 'home'])

watch(
  () => route.path,
  (newPath) => {
    selectedKeys.value = [pathToKeyMap[newPath] || 'home']
  },
)

onMounted(async () => {
  console.log('[App] Component mounting...')
  
  // Wait for router to be fully initialized
  await nextTick()
  
  // Additional delay to ensure Vue router is ready
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // Ensure selected keys are set correctly on mount
  selectedKeys.value = [pathToKeyMap[route.path] || 'home']
  
  // Ensure we're on the home route when app starts
  // Use replace to avoid adding to history
  if (route.path !== '/' && route.path !== '/add-video') {
    console.log('[App] Redirecting to home route from:', route.path)
    await router.replace('/')
  } else {
    console.log('[App] Already on home route:', route.path)
  }
  
  // Mark app as ready to show content
  isReady.value = true
  console.log('[App] App ready, showing content')
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped lang="less">
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f0f2f5;
}

.app-layout {
  min-height: 100vh;
}

.app-header {
  padding: 0;
  background: #001529;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 20px;
  font-weight: bold;

  img {
    width: 32px;
    height: 32px;
  }

  .logo-text {
    color: white;
  }
}

.nav-menu {
  flex: 1;
  justify-content: flex-end;
  border-bottom: none;
  background: transparent;
}

.app-content {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}
</style>
