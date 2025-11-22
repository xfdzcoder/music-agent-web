<template>
  <Transition name="slide-up">
    <div
        v-if="true"
        class="player-bar"
        :style="playerStyle"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
    >
      <div class="player-content">
        <!-- 歌曲信息 -->
        <div class="song-info">
          <div class="song-cover">
            <img :src="currentSong.cover" alt="专辑封面"/>
          </div>
          <div class="song-details">
            <div class="song-title">{{ currentSong.title }}</div>
            <div class="song-artist">{{ currentSong.artist }}</div>
          </div>
        </div>

        <!-- 播放控制 -->
        <div class="player-controls">
          <button class="control-btn" @click="previous" title="上一首">
            <i class="bi bi-chevron-left"></i>
          </button>
          <i v-if="isPlaying" class="bi bi-pause-circle-fill control-btn" @click="togglePlay"></i>
          <i v-else class="bi bi-play-circle-fill control-btn" @click="togglePlay"></i>
          <button class="control-btn" @click="next" title="下一首">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        <!-- 进度条 -->
        <div class="player-progress">
          <span class="time-current">{{ formatTime(currentTime) }}</span>
          <div class="progress-bar" @click="handleProgressClick">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
              <div class="progress-thumb" :style="{ left: `${progress}%` }"></div>
            </div>
          </div>
          <span class="time-total">{{ formatTime(duration) }}</span>
        </div>

        <!-- 音量控制 -->
        <div class="player-volume">
          <i v-if="isMuted" class="bi bi-volume-up control-btn" @click="toggleMute"></i>
          <i v-else class="bi bi-volume-mute control-btn" @click="toggleMute"></i>
          <input
              type="range"
              class="volume-slider"
              min="0"
              max="100"
              v-model="volume"
          />
        </div>
      </div>
    </div>
  </Transition>

  <!-- 触发区域 -->
  <div
      class="player-trigger"
      @mouseenter="handleTriggerEnter"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useColor } from "@/stores/color"
import { storeToRefs } from "pinia"
import { adjustBrightness } from "@/utils/color"

// Props
defineProps<{ visible : boolean }>()
const emit = defineEmits<{ "update:visible" : [value : boolean] }>()

// 从 Pinia 读取主题色
const colorStore = useColor()
const { color } = storeToRefs(colorStore) // color.value 是 hex，比如 "#667eea"

// 状态（逻辑保持不变）
const isPlaying = ref(false)
const isMuted = ref(false)
const volume = ref(80)
const currentTime = ref(0)
const duration = ref(240) // 示例：4分钟
const currentSong = ref({
  title: "示例歌曲",
  artist: "示例歌手",
  cover: "https://picsum.photos/48/48",
})
let hideTimer : number | null = null

const progress = computed(() => duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0)

function formatTime(seconds : number) : string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${ mins }:${ secs.toString().padStart(2, "0") }`
}

function togglePlay() {
  isPlaying.value = ! isPlaying.value
}

function previous() {
  console.log("上一首")
}

function next() {
  console.log("下一首")
}

function toggleMute() {
  isMuted.value = ! isMuted.value
}

function handleProgressClick(event : MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  currentTime.value = duration.value * percent
}

function handleTriggerEnter() {
  clearHideTimer()
  emit("update:visible", true)
}

function handleMouseEnter() {
  clearHideTimer()
}

function handleMouseLeave() {
  hideTimer = window.setTimeout(() => {
    emit("update:visible", false)
  }, 1000)
}

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

// ------------------ 主题色样式计算 ------------------
// 辅助：hex -> rgb
function hexToRgb(hex : string) {
  const h = (hex || "#667eea").replace("#", "")
  const r = parseInt(h.substring(0, 2), 16) || 0
  const g = parseInt(h.substring(2, 4), 16) || 0
  const b = parseInt(h.substring(4, 6), 16) || 0
  return { r, g, b }
}

const playerStyle = computed(() => {
  const mainColor = color?.value
  const darkColor = adjustBrightness(mainColor, -30)
  const lightColor = adjustBrightness(mainColor, 60)
  const mainRgb = hexToRgb(mainColor)
  return {
    // 颜色变量（在 CSS 中以 var(--...) 使用）
    "--theme-color": mainColor,
    "--theme-dark": darkColor,
    "--theme-light": lightColor,
    "--theme-rgba-10": `rgba(${ mainRgb.r }, ${ mainRgb.g }, ${ mainRgb.b }, 0.10)`,
    "--theme-rgba-06": `rgba(${ mainRgb.r }, ${ mainRgb.g }, ${ mainRgb.b }, 0.06)`,
    "--theme-gradient": `linear-gradient(135deg, ${ mainColor } 0%, ${ darkColor } 100%)`,
    "--theme-fill-gradient": `linear-gradient(90deg, ${ mainColor } 0%, ${ darkColor } 100%)`,
    "--thumb-border": mainColor,
    "--text-primary": lightColor,
    "--text-secondary": adjustBrightness(mainColor, 30),
  } as Record<string, string>
})
</script>

<style scoped>
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  backdrop-filter: blur(8px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  background: transparent;
  /* CSS 变量已由 playerStyle 注入 */
}

/* 触发区域 */
.player-trigger {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  z-index: 999;
}

/* 布局 */
.player-content {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 24px;
}

/* 歌曲信息 */
.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
}

.song-cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.song-details {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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

/* 进度条 */
.player-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-current, .time-total {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: center;
}

.progress-bar {
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 2px;
  overflow: visible;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--theme-fill-gradient);
  border-radius: 2px;
  transition: width 0.12s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid var(--thumb-border);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.14);
  opacity: 0;
  transition: opacity 0.16s;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

/* 音量控制 */
.player-volume {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 160px;
}

.volume-slider {
  flex: 1;
  height: 4px;
  appearance: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--theme-color);
  border-radius: 50%;
  cursor: pointer;
}

/* 动画 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
}
</style>
