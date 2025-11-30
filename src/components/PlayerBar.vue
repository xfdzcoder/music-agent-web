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
            <img :src="currentMusic?.pictures[0]" alt="专辑封面"/>
          </div>
          <div class="song-details">
            <div class="song-title">{{ currentMusic?.title }}</div>
            <div class="song-artist">{{ currentMusic?.artist[0] }}</div>
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
          <!-- 播放模式 -->
          <button class="control-btn" @click="togglePlayMode" :title="playModeText">
            <i v-if="playMode === 'single'" class="bi bi-repeat-1"></i>
            <i v-else-if="playMode === 'loop'" class="bi bi-repeat"></i>
            <i v-else class="bi bi-shuffle"></i>
          </button>
        </div>

        <!-- 音频频谱可视化 -->
        <div class="visualizer-container">
          <canvas ref="visualizerCanvas" class="visualizer"></canvas>
        </div>

        <!-- 音量控制 -->
        <div class="player-volume" @mouseenter="showVolumeSlider = true" @mouseleave="showVolumeSlider = false">
          <button class="control-btn" @click="toggleMute" title="音量">
            <i v-if="isMuted" class="bi bi-volume-mute"></i>
            <i v-else class="bi bi-volume-up"></i>
          </button>
          <!-- 垂直音量条 -->
          <Transition name="fade">
            <div v-if="showVolumeSlider" class="volume-slider-container">
              <input
                  type="range"
                  class="volume-slider"
                  min="0"
                  max="100"
                  v-model="volume"
                  orient="vertical"
              />
            </div>
          </Transition>
        </div>

        <!-- 播放列表 -->
        <div class="playlist-container">
          <button class="control-btn" @click="togglePlaylist" title="播放列表">
            <i class="bi bi-list"></i>
          </button>
          <!-- 播放列表弹窗 -->
          <Transition name="slide-up">
            <div v-if="showPlaylist" class="playlist-popup" @click.stop>
              <div class="playlist-content">
                <div v-if="currentPlaylist.length === 0" class="empty-playlist">
                  <p>播放列表为空</p>
                </div>
                <div v-else class="playlist-items">
                  <div
                      v-for="(song, index) in Array(15).fill(currentPlaylist[0]).map((song, i) => ({ ...song, index: i }))"
                      :key="index"
                      class="playlist-item"
                      :class="{ 'active': index === currentMusicIndex }"
                      @click="playSong(index)"
                  >
                    <div class="song-info">
                      <div class="song-title">{{ song.title }}</div>
                      <div class="song-artist">{{ song.artist.join(', ') }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue"
import { useColor } from "@/stores/color"
import { storeToRefs } from "pinia"
import { adjustBrightness } from "@/utils/color"
import { useMusicStore } from "@/stores/music.ts"

defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  "update:visible": [value: boolean]
  "changePlaylistVisible": [visible: boolean]
}>()

// 主题颜色
const colorStore = useColor()
const { color } = storeToRefs(colorStore)

// 音乐播放状态管理
const musicStore = useMusicStore()
const {
  currentMusic,
  currentMusicIndex,
  currentPlaylist,
  isPlaying,
  playMode,
  volume,
  isMuted
} = storeToRefs(musicStore)

const {
  togglePlay,
  previous,
  next,
  togglePlayMode,
  toggleMute,
  startPeriodicSync,
  stopPeriodicSync,
  setAudioElement,
  refreshPlaylist
} = musicStore

// 组件状态
const showVolumeSlider = ref(false)
const showPlaylist = ref(false)
const visualizerCanvas = ref<HTMLCanvasElement | null>(null)
let hideTimer: number | null = null

// 播放模式文本
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

// 切换播放列表显示
function togglePlaylist() {
  showPlaylist.value = !showPlaylist.value
  emit('changePlaylistVisible', showPlaylist.value)
}

// 播放指定歌曲
function playSong(index: number) {
  // 这里需要调用musicStore的方法来播放指定歌曲
  console.log('播放歌曲:', index)
  showPlaylist.value = false
}

// 音频分析相关
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let dataArray: Uint8Array<ArrayBuffer> | null = null
let animationFrameId: number | null = null
let audioElement: HTMLAudioElement | null = null
let source: MediaElementAudioSourceNode | null = null

// 可视化配置
const BAR_COUNT = 512 // 柱状条数量，可配置

// 初始化音频元素和分析器
function initAudioPlayer() {
  if (!visualizerCanvas.value) return

  try {
    // 创建音频元素
    audioElement = new Audio()
    
    // 将音频元素传递给音乐商店管理
    setAudioElement(audioElement)
    
    // 初始化音频上下文和分析器
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = BAR_COUNT * 2 // FFT大小是柱状条数量的2倍
    
    const bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)
    
    // 连接音频源到分析器
    source = audioContext.createMediaElementSource(audioElement)
    source.connect(analyser)
    analyser.connect(audioContext.destination)
    
    // 开始可视化
    drawVisualizer()

    // 从后端获取初始播放状态
    musicStore.fetchPlayState()

    // 开始定期同步
    startPeriodicSync()
  } catch (error) {
    console.error("音频播放器初始化失败:", error)
  }
}

// 绘制频谱可视化
function drawVisualizer() {
  if (!visualizerCanvas.value || !analyser || !dataArray) return
  
  const canvas = visualizerCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 调整canvas大小以适应容器
  const container = canvas.parentElement
  if (container) {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  }
  
  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 获取频率数据
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray)
    
    // 计算柱状图参数
    const barWidth = canvas.width / BAR_COUNT
    const barSpacing = 2
    const actualBarWidth = barWidth - barSpacing
    
    // 创建整个canvas的横向渐变
    const mainColor = color.value
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
    gradient.addColorStop(0, mainColor)
    gradient.addColorStop(1, adjustBrightness(mainColor, -30))
    
    // 绘制频谱柱状图
    for (let i = 0; i < BAR_COUNT && i < dataArray.length; i++) {
      // 从数据数组中采样
      const barHeight = ((dataArray[i] || 0) / 255) * canvas.height
      
      // 使用整个canvas的渐变
      ctx.fillStyle = gradient
      
      // 绘制柱状图
      const x = i * barWidth
      ctx.fillRect(x, canvas.height - barHeight, actualBarWidth, barHeight)
    }
  }
  
  // 继续下一帧
  animationFrameId = requestAnimationFrame(drawVisualizer)
}

// 监听当前音乐变化
watch(currentMusic, (newMusic) => {
  if (newMusic && audioElement) {
    // 设置音频源为流式接口
    audioElement.src = `/api/music/inline/${newMusic.uuid}`
    // 如果当前是播放状态，音频元素会自动播放（由音乐商店控制）
  }
})

// 鼠标事件处理
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
function hexToRgb(hex: string) {
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
  const mainRgbString = `${mainRgb.r}, ${mainRgb.g}, ${mainRgb.b}`
  
  return {
    // 基础颜色变量
    "--theme-color": mainColor,
    "--theme-dark": darkColor,
    "--theme-light": lightColor,
    "--main-rgb": mainRgbString,
    
    // 渐变背景变量
    "--theme-gradient": `linear-gradient(135deg, ${mainColor} 0%, ${darkColor} 100%)`,
    "--theme-fill-gradient": `linear-gradient(90deg, ${mainColor} 0%, ${darkColor} 100%)`,
    "--item-hover-bg": `linear-gradient(135deg, ${darkColor}, ${mainColor})`,
    "--item-active-bg": `linear-gradient(135deg, ${mainColor}, ${darkColor})`,
    
    // 半透明背景变量
    "--theme-rgba-10": `rgba(${mainRgbString}, 0.10)`,
    "--theme-rgba-06": `rgba(${mainRgbString}, 0.06)`,
    
    // 文本颜色变量
    "--text-primary": lightColor,
    "--text-secondary": adjustBrightness(mainColor, 30),
    "--thumb-border": mainColor,
  } as Record<string, string>
})

// 生命周期钩子
onMounted(() => {
  // 刷新播放列表
  // 初始化音频播放器
  nextTick(() => {
    refreshPlaylist()
    initAudioPlayer()
  })
})

onUnmounted(() => {
  // 清理资源
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  if (audioElement) {
    audioElement.pause()
    audioElement.src = ''
  }
  if (audioContext) {
    audioContext.close()
  }
  // 停止定期同步
  stopPeriodicSync()
  // 清除隐藏定时器
  clearHideTimer()
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

/* 音频频谱可视化 */
.visualizer-container {
  flex: 1;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
}

.visualizer {
  width: 100%;
  height: 100%;
  background: transparent;
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

/* 音量控制 */
.player-volume {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
  margin-right: 16px;
}

.volume-slider-container {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 12px;
  width: 40px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 14px;
  box-shadow: none;
  z-index: 1001;
}

.volume-slider {
  width: 6px;
  height: 100%;
  appearance: none;
  background: linear-gradient(180deg, var(--theme-color) 0%, var(--theme-dark) 100%);
  border-radius: 3px;
  outline: none;
  writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.volume-slider:hover {
  opacity: 1;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, var(--theme-color), var(--theme-dark));
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(var(--main-rgb), 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(var(--main-rgb), 0.5);
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, var(--theme-color), var(--theme-dark));
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(var(--main-rgb), 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.volume-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(var(--main-rgb), 0.5);
}

/* 动画 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
}

/* 音量条过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
  opacity: 1;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 播放列表样式 */
.playlist-container {
  position: relative;
}

.playlist-popup {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: 320px;
  max-height: 60vh;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 24px;
  box-shadow: none;
  margin-bottom: 12px;
  z-index: 1001;
  overflow: hidden;
  border: none;
}

.playlist-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 18px 18px 28px;
  mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 5%,
      black 95%,
      transparent 100%
  );
  -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 5%,
      black 95%,
      transparent 100%
  );
}

/* 隐藏或细化滚动条 */
.playlist-content::-webkit-scrollbar { width: 6px; }
.playlist-content::-webkit-scrollbar-track { background: transparent; }
.playlist-content::-webkit-scrollbar-thumb { background: rgba(var(--main-rgb), 0.12); border-radius: 3px; }
.playlist-content::-webkit-scrollbar-thumb:hover { background: rgba(var(--main-rgb), 0.2); }

.playlist-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px;
  transition: transform 0.16s ease, opacity 0.18s ease;
  animation: slideIn 0.28s ease forwards;
  opacity: 0;
}

/* 为每个播放列表项添加延迟动画 */
.playlist-item:nth-child(1) { animation-delay: 0.02s; }
.playlist-item:nth-child(2) { animation-delay: 0.04s; }
.playlist-item:nth-child(3) { animation-delay: 0.06s; }
.playlist-item:nth-child(4) { animation-delay: 0.08s; }
.playlist-item:nth-child(5) { animation-delay: 0.10s; }

/* 气泡容器 */
.playlist-item > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  /* 默认气泡为半透明玻璃 */
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--theme-color);
  box-shadow: none;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease;
}

.playlist-item:hover > div {
  transform: translateY(-4px);
  background-image: var(--item-hover-bg);
  color: white;
}

.playlist-item.active > div {
  transform: translateY(-4px);
  background-image: var(--item-active-bg);
  color: white;
}

.playlist-item .song-info {
  display: flex;
  height: 40px;
  min-width: 0;
  gap: 6px;
  padding: 6px;
  color: var(--theme-color);
}

.playlist-item .song-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0;
  color: var(--theme-color);
}

.playlist-item .song-artist {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--theme-color);
}


/* 当项被选中或悬停时，确保文字颜色为白色 */
.playlist-item:hover .song-title,
.playlist-item:hover .song-artist,
.playlist-item.active .song-title,
.playlist-item.active .song-artist {
  color: white;
  -webkit-text-fill-color: white;
}

.empty-playlist {
  padding: 40px 20px;
  text-align: center;
  color: var(--theme-color);
  font-size: 14px;
}

.empty-playlist p {
  margin: 0;
  background: linear-gradient(135deg, #fff 0%, var(--theme-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 播放列表滚动条 */
.playlist-content::-webkit-scrollbar {
  width: 6px;
}

.playlist-content::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-content::-webkit-scrollbar-thumb {
  background: rgba(var(--main-rgb), 0.12);
  border-radius: 3px;
}

.playlist-content::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--main-rgb), 0.2);
}

/* 入场动画 */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>