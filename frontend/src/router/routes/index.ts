import type { RouteRecordRaw } from 'vue-router'

/**
 * Route configuration
 * @description All routes are centrally managed here
 */
const routes: RouteRecordRaw[] = [
  /**
   * Add Video (Home)
   */
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/AddVideo.vue'),
    meta: {
      title: 'Add Video',
    },
  },
  /**
   * Add Video
   */
  {
    path: '/add-video',
    name: 'add-video',
    component: () => import('@/views/AddVideo.vue'),
    meta: {
      title: 'Add Video',
    },
  },
  /**
   * Settings
   */
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: 'Settings',
    },
  },
  /**
   * Queue View
   */
  {
    path: '/queue',
    name: 'queue',
    component: () => import('@/views/QueueView.vue'),
    meta: {
      title: 'Queue',
    },
  },
  /**
   * About
   */
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/About.vue'),
    meta: {
      title: 'About',
    },
  },
]

export default routes