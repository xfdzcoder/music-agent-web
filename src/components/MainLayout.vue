<template>
  <div class="main-layout">
    <!-- 左侧菜单 -->
    <Sidebar
        :collapsed="sidebarCollapsed"
        :current-menu="currentMenu"
        @toggle="sidebarCollapsed = !sidebarCollapsed"
        @menu-change="handleMenuChange"
    />

    <!-- 主内容 -->
    <div class="main-content">
      <router-view />
    </div>

    <!-- 播放器 -->
    <PlayerBar v-model:visible="playerBarVisible" @change-playlist-visible="playlistVisible => showFloatBall = !playlistVisible" />

    <!-- 悬浮球 -->
    <FloatBall
        v-if="showFloatBall"
        :menu-content-visible="isHistoryOpen || chatDialogOpen"
        @open-chat="handleOpenChat"
        @open-history="handleOpenHistory"
    />

    <!-- ChatDialog（互斥显示） -->
    <ChatDialog
        v-if="chatDialogOpen"
        :is-open="chatDialogOpen"
        @close="chatDialogOpen = false"
        @update:is-open="chatDialogOpen = $event"
        ref="chatDialogRef"
        class="overlay-dialog"
    />

    <!-- HistorySidebar（互斥显示） -->
    <HistorySidebar
        v-if="isHistoryOpen"
        :is-open="isHistoryOpen"
        @select="handleSelectHistory"
        class="overlay-dialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import Sidebar from '@/components/Sidebar.vue'
import PlayerBar from '@/components/PlayerBar.vue'
import FloatBall from '@/components/FloatBall.vue'
import ChatDialog from '@/components/ChatDialog.vue'
import HistorySidebar from '@/components/HistorySidebar.vue'

const router = useRouter()

// UI 状态
const sidebarCollapsed = ref(false)
const currentMenu = ref('now-playing')
const playerBarVisible = ref(false)
const showFloatBall = ref(true)

// 两个浮层互斥
const chatDialogOpen = ref(false)
const isHistoryOpen = ref(false)

const chatDialogRef = ref<InstanceType<typeof ChatDialog>>()

// 切换菜单
function handleMenuChange(menu: string) {
  currentMenu.value = menu
  router.push({ name: menu })
}

// ======================================
// 互斥逻辑
// ======================================
function handleOpenChat() {
  if (isHistoryOpen.value) isHistoryOpen.value = false
  chatDialogOpen.value = !chatDialogOpen.value
}

function handleOpenHistory() {
  console.log('isHistoryOpen', isHistoryOpen.value)
  if (chatDialogOpen.value) chatDialogOpen.value = false
  isHistoryOpen.value = !isHistoryOpen.value
  console.log('isHistoryOpen', isHistoryOpen.value)
}

function handleSelectHistory(threadId: string) {
  // 切换会话给 ChatDialog
  console.log('切换到历史线程:', threadId)

  // 显示聊天窗口
  chatDialogOpen.value = true
  isHistoryOpen.value = false

  nextTick(() => {
    // chatDialogRef.value?.focus()
  })
}
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ChatDialog & HistorySidebar 共用的定位 */
.overlay-dialog {
  position: absolute;
  right: 100px; /* 根据 FloatBall 位置调整 */
  bottom: 90px; /* 根据 PlayerBar 调整 */
  width: 420px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  z-index: 2000;
}
</style>
