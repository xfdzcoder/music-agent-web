import { createMemoryHistory, createRouter, type RouteRecordRaw } from "vue-router"
import ChatView from '@/views/ChatView.vue'

const routes : RouteRecordRaw[] = [
  {
    path: '/',
    name: 'chat',
    component: ChatView
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

export default router