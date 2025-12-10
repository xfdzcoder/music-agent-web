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
      <router-view/>
    </div>

    <!-- 播放器 -->
    <PlayerBar
        v-model:visible="playerBarVisible"
        @update-visible="visible => playerBarVisible = visible"
        @change-playlist-visible="onPlaylistVisibleChange"
    />

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
        class="overlay-dialog"
    />

    <!-- HistoryDialog（互斥显示） -->
    <HistoryDialog
        v-if="isHistoryOpen"
        :is-open="isHistoryOpen"
        @select-history="handleSelectHistory"
        class="overlay-dialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import Sidebar from "@/components/layout/Sidebar.vue"
import PlayerBar from "@/components/playbar/PlayerBar.vue"
import FloatBall from "@/components/chat/FloatBall.vue"
import ChatDialog from "@/components/chat/dialog/ChatDialog.vue"
import HistoryDialog from "@/components/chat/dialog/HistoryDialog.vue"

defineOptions({
  name: "MainLayout"
})

const router = useRouter()

const sidebarCollapsed = ref(false)
const playerBarVisible = ref(false)

const currentMenu = ref("now-playing")

function handleMenuChange(menu: string) {
  currentMenu.value = menu
  router.push({ name: menu })
}

const chatDialogOpen = ref(false)
const isHistoryOpen = ref(false)

function handleOpenChat() {
  if (isHistoryOpen.value) isHistoryOpen.value = false
  chatDialogOpen.value = ! chatDialogOpen.value
}

function handleOpenHistory() {
  if (chatDialogOpen.value) chatDialogOpen.value = false
  isHistoryOpen.value = ! isHistoryOpen.value
}

function handleSelectHistory() {
  chatDialogOpen.value = true
  isHistoryOpen.value = false
}

const showFloatBall = ref(true)

function onPlaylistVisibleChange(playlistVisible: boolean) {
  showFloatBall.value = ! playlistVisible
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

/* ChatDialog & HistoryDialog 共用的定位 */
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
