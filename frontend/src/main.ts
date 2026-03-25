import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import App from '@/App.vue'
import router from '@/router'

// Global styles
import 'virtual:uno.css'
import '@/styles/var.less'
import '@/styles/mixin.less'
import '@/styles/global.less'

// Create Pinia instance
const pinia = createPinia()

/**
 * Pinia supports feature extensions, such as local persistence functionality
 *
 * Run `npm i pinia-plugin-persistedstate` in the command line to install the persistence plugin
 * Import in this file: `import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'`
 * Uncomment the `pinia.use` line below to enable the plugin, and configure individual stores according to the documentation
 *
 * @see https://prazdevs.github.io/pinia-plugin-persistedstate/zh/guide/
 */
// pinia.use(piniaPluginPersistedstate)

createApp(App)
  .use(pinia) // Enable Pinia
  .use(router)
  .use(Antd) // Enable Ant Design Vue
  .mount('#app')
