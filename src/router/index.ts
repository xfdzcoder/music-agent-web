import { createMemoryHistory, createRouter, type RouteRecordRaw } from "vue-router"
import MainLayout from '@/components/layout/MainLayout.vue'
import NowPlaying from '@/views/NowPlaying.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'now-playing',
        component: NowPlaying
      },
      {
        path: 'all-songs',
        name: 'all-songs',
        component: () => import('@/views/AllSongs.vue')
      },
      {
        path: 'my-playlists',
        name: 'my-playlists',
        component: () => import('@/views/MyPlaylists.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

export default router