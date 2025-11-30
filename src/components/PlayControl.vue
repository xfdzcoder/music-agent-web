<template>
  <div class="player-controls">
    <button class="control-btn" @click="previous" title="上一首">
      <i class="bi bi-chevron-left"></i>
    </button>
    <i v-if="isPlaying" class="bi bi-pause-circle-fill control-btn" @click="togglePlay"></i>
    <i v-else class="bi bi-play-circle-fill control-btn" @click="togglePlay"></i>
    <button class="control-btn" @click="next" title="下一首">
      <i class="bi bi-chevron-right"></i>
    </button>
    <!-- 播放模式 -->
    <button class="control-btn" @click="togglePlayMode" :title="playModeText">
      <i v-if="playMode === 'single'" class="bi bi-repeat-1"></i>
      <i v-else-if="playMode === 'loop'" class="bi bi-repeat"></i>
      <i v-else class="bi bi-shuffle"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useMusicStore } from "@/stores/music.ts"
import { storeToRefs } from "pinia"

const musicStore = useMusicStore()
const { isPlaying, playMode } = storeToRefs(musicStore)
const { togglePlay, previous, next, togglePlayMode } = musicStore

const playModeText = computed(() => {
  switch (playMode.value) {
    case 'single':
      return '单曲循环'
    case 'loop':
      return '列表循环'
    case 'order':
      return '顺序播放'
    default:
      return '播放模式'
  }
})

</script>

<style scoped>

/* 播放控制 */
.player-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 普通控制按钮（基于主题色的半透明底） */
.control-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--theme-rgba-06); /* 10% alpha 背景 */
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.16s ease, background 0.16s ease;
  color: var(--text-primary);
}

.control-btn:hover {
  background: var(--theme-rgba-10);
  transform: scale(1.08);
}
</style>