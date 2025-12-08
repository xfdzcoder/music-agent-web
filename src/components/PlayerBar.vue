<template>
  <Transition name="slide-up">
    <div
        v-if="visible"
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
        <PlayControl/>

        <!-- 音频频谱可视化 -->
        <div class="visualizer-container">
          <canvas ref="visualizerCanvas" class="visualizer"></canvas>
        </div>

        <Volume/>
        <Playlist @change-playlist-visible="playlistVisible => emit('changePlaylistVisible', playlistVisible)"/>

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
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import { useColor } from "@/stores/color"
import { storeToRefs } from "pinia"
import { adjustBrightness } from "@/utils/color"
import { useMusicStore } from "@/stores/music.ts"
import Volume from "@/components/Volume.vue"
import Playlist from "@/components/Playlist.vue"
import PlayControl from "@/components/PlayControl.vue"

defineProps<{
  visible: boolean
}>()
const emit = defineEmits<{
  "updateVisible": [value: boolean]
  "changePlaylistVisible": [playlistVisible: boolean]
}>()

const colorStore = useColor()
const { color } = storeToRefs(colorStore)

const musicStore = useMusicStore()
const {
  currentMusic,
  volume,
  isPlaying
} = storeToRefs(musicStore)
const {
  initStateTimer,
  clearStateTimer,
  setAudio
} = musicStore

const visualizerCanvas = ref<HTMLCanvasElement | null>(null)


// 音频分析相关
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null
let animationFrameId: number | null = null
let audioElement: HTMLAudioElement | null = null
let source: MediaElementAudioSourceNode | null = null
const BAR_COUNT = 512 // 柱状条数量

// 初始化音频元素和分析器
function initAudioPlayer() {
  if (! visualizerCanvas.value) return

  try {
    // 创建音频元素
    audioElement = new Audio()
    audioElement.volume = 1

    // 初始化音频上下文和分析器
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    setAudio(audioElement, audioContext)

    analyser = audioContext?.createAnalyser()
    analyser.fftSize = BAR_COUNT * 2 // FFT大小是柱状条数量的2倍

    const bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)

    // 连接音频源到分析器
    source = audioContext?.createMediaElementSource(audioElement)
    source.connect(analyser)
    analyser.connect(audioContext?.destination)

    // 开始可视化
    drawVisualizer()
  } catch (error) {
    console.error("音频播放器初始化失败:", error)
  }
}

// 绘制频谱可视化
function drawVisualizer() {
  if (! visualizerCanvas.value || ! analyser || ! dataArray) return

  const canvas = visualizerCanvas.value
  const ctx = canvas.getContext("2d")
  if (! ctx) return

  // 调整canvas大小以适应容器
  const container = canvas.parentElement
  if (container) {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  }

  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 获取频率数据
  analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)

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
  for (let i = 0; i < BAR_COUNT; i++) {
    // 从数据数组中采样
    const barHeight = ((dataArray[i] ?? 0) / 255) * canvas.height

    // 使用整个canvas的渐变
    ctx.fillStyle = gradient

    // 绘制柱状图
    const x = i * barWidth
    ctx.fillRect(x, canvas.height - barHeight, actualBarWidth, barHeight)
  }

  // 继续下一帧
  animationFrameId = requestAnimationFrame(drawVisualizer)
}


let hideTimer: number | null = null

function handleTriggerEnter() {
  clearHideTimer()
  emit("updateVisible", true)
}

function handleMouseEnter() {
  clearHideTimer()
}

function handleMouseLeave() {
  hideTimer = window.setTimeout(() => {
    emit("updateVisible", false)
  }, 1000)
}

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

// 监听音量变化
watch(volume, (newVolume) => {
  if (audioElement) {
    audioElement.volume = newVolume / 100
  }
})

// 监听当前音乐变化
watch(currentMusic, (newMusic) => {
  if (newMusic && audioElement) {
    // 设置音频源
    audioElement.src = `/api/music/inline/${ currentMusic.value?.uuid }`
    // 如果当前是播放状态，自动播放新音乐
    if (isPlaying.value) {
      audioElement.play().catch(error => {
        console.error("自动播放失败:", error)
      })
    }
  }
})

// 生命周期钩子
onMounted(() => {
  initAudioPlayer()
  initStateTimer()
})

onUnmounted(() => {
  // 清理资源
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  if (audioElement) {
    audioElement.pause()
    audioElement.src = ""
  }
  if (audioContext) {
    audioContext.close()
  }
  clearStateTimer()
})

// ------------------ 主题色样式计算 ------------------
// 辅助：hex -> rgb
function hexToRgb(hex: string) {
  const h = (hex || "#667eea").replace("#", "")
  const r = parseInt(h.substring(0, 2), 16) || 0
  const g = parseInt(h.substring(2, 4), 16) || 0
  const b = parseInt(h.substring(4, 6), 16) || 0
  return {
    r,
    g,
    b
  }
}

const playerStyle = computed(() => {
  const mainColor = color?.value
  const darkColor = adjustBrightness(mainColor, -30)
  const lightColor = adjustBrightness(mainColor, 60)
  const mainRgb = hexToRgb(mainColor)
  const mainRgbString = `${ mainRgb.r }, ${ mainRgb.g }, ${ mainRgb.b }`

  return {
    // 基础颜色变量
    "--theme-color": mainColor,
    "--theme-dark": darkColor,
    "--theme-light": lightColor,
    "--main-rgb": mainRgbString,

    // 渐变背景变量
    "--theme-gradient": `linear-gradient(135deg, ${ mainColor } 0%, ${ darkColor } 100%)`,
    "--theme-fill-gradient": `linear-gradient(90deg, ${ mainColor } 0%, ${ darkColor } 100%)`,
    "--item-hover-bg": `linear-gradient(135deg, ${ darkColor }, ${ mainColor })`,
    "--item-active-bg": `linear-gradient(135deg, ${ mainColor }, ${ darkColor })`,

    // 半透明背景变量
    "--theme-rgba-10": `rgba(${ mainRgbString }, 0.10)`,
    "--theme-rgba-06": `rgba(${ mainRgbString }, 0.06)`,

    // 文本颜色变量
    "--text-primary": lightColor,
    "--text-secondary": adjustBrightness(mainColor, 30),
    "--thumb-border": mainColor,
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
</style>