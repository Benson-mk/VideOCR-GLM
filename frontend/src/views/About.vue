<template>
  <div class="about-container">
    <a-card title="About VideOCR-GLM" :bordered="false">
      <a-space direction="vertical" style="width: 100%" size="large">
        <!-- Logo and Title -->
        <div class="about-header">
          <img src="/icon.png" alt="VideOCR-GLM Logo" class="logo" />
          <h1>VideOCR-GLM</h1>
          <p class="subtitle">Video OCR with GLM-OCR</p>
        </div>

        <!-- Description -->
        <a-card type="inner" title="Description">
          <p>
            VideOCR-GLM is a powerful video OCR tool that uses GLM-OCR
            model to extract subtitles from videos. It supports multiple
            languages, dual-zone OCR, and advanced image processing options.
          </p>
          <p>
            This GUI provides an easy-to-use interface for the VideOCR-GLM CLI,
            allowing you to add videos to a processing queue, configure
            settings, and monitor progress in real-time.
          </p>
        </a-card>

        <!-- Features -->
        <a-card type="inner" title="Features">
          <a-list :data-source="features" size="small">
            <template #renderItem="{ item }">
              <a-list-item>
                <CheckCircleOutlined
                  style="color: #52c41a; margin-right: 8px"
                />
                {{ item }}
              </a-list-item>
            </template>
          </a-list>
        </a-card>

        <!-- Links -->
        <a-card type="inner" title="Links">
          <a-space direction="vertical" style="width: 100%">
            <a-button
              type="link"
              href="https://github.com/Benson-mk/VideOCR-GLM"
              target="_blank"
            >
              <template #icon>
                <GithubOutlined />
              </template>
              GitHub Repository
            </a-button>
            <a-button
              type="link"
              href="https://github.com/Benson-mk/VideOCR-GLM/issues"
              target="_blank"
            >
              <template #icon>
                <BugOutlined />
              </template>
              Report Issues
            </a-button>
            <a-button
              type="link"
              href="https://github.com/Benson-mk/VideOCR-GLM/blob/main/README.md"
              target="_blank"
            >
              <template #icon>
                <FileTextOutlined />
              </template>
              Documentation
            </a-button>
          </a-space>
        </a-card>

        <!-- Version Info -->
        <a-card type="inner" title="Version Information">
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="GUI Version">
              {{ guiVersion }}
            </a-descriptions-item>
            <a-descriptions-item label="CLI Version">
              {{ cliVersion }}
            </a-descriptions-item>
            <a-descriptions-item label="Build Date">
              {{ buildDate }}
            </a-descriptions-item>
            <a-descriptions-item label="Node.js Version">
              {{ nodeVersion }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- Credits -->
        <a-card type="inner" title="Credits">
          <p>VideOCR-GLM is built with:</p>
          <a-space wrap>
            <a-tag color="blue"> Vue 3 </a-tag>
            <a-tag color="green"> TypeScript </a-tag>
            <a-tag color="cyan"> Vite </a-tag>
            <a-tag color="purple"> Ant Design Vue </a-tag>
            <a-tag color="orange"> Pinia </a-tag>
            <a-tag color="red"> Python </a-tag>
            <a-tag color="pink"> GLM-OCR </a-tag>
          </a-space>
        </a-card>

        <!-- License -->
        <a-card type="inner" title="License">
          <p>This project is licensed under the MIT License.</p>
          <a-button
            type="link"
            href="https://github.com/Benson-mk/VideOCR-GLM/blob/main/LICENSE"
            target="_blank"
          >
            View License
          </a-button>
        </a-card>
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  CheckCircleOutlined,
  GithubOutlined,
  BugOutlined,
  FileTextOutlined,
} from '@ant-design/icons-vue'

const guiVersion = ref('1.0.0')
const cliVersion = ref('1.0.0')
const buildDate = ref('')
const nodeVersion = ref('')

const features = [
  'Video preview with crop zone selection',
  'Support for dual-zone OCR',
  'Multiple language support (100+ languages)',
  'Batch processing with queue management',
  'Parallel processing support',
  'Real-time progress visualization',
  'Advanced OCR settings',
  'Image processing options',
  'Ollama integration for GLM-OCR',
  'Settings import/export',
  'Configurable time ranges',
  'Subtitle position detection',
]

onMounted(() => {
  // Set build date
  buildDate.value = new Date().toLocaleDateString()

  // Get Node.js version (browser-safe)
  try {
    nodeVersion.value =
      typeof process !== 'undefined' && process.versions?.node
        ? process.versions.node
        : 'Browser Environment'
  } catch (error) {
    nodeVersion.value = 'Browser Environment'
  }
})
</script>

<style scoped lang="less">
.about-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.about-header {
  text-align: center;
  padding: 40px 0;

  .logo {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
  }

  h1 {
    margin: 0 0 10px 0;
    font-size: 32px;
    color: #1890ff;
  }

  .subtitle {
    margin: 0;
    font-size: 16px;
    color: #666;
  }
}

:deep(.ant-card-inner) {
  margin-bottom: 0;
}

:deep(.ant-list-item) {
  padding: 8px 0;
}
</style>
