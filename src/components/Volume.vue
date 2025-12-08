<template>
  <div
      class="player-volume"
      @mouseenter="showVolumeSlider = true"
      @mouseleave="showVolumeSlider = false"
      :style="style"
  >
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
            :value="volume"
            @change="onVolumeChange"
            orient="vertical"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { adjustBrightness } from "@/utils/color.ts"
import { computed, ref } from "vue"
import { useColor } from "@/stores/color.ts"
import { storeToRefs } from "pinia"
import { useMusicStore } from "@/stores/music.ts"

const showVolumeSlider = ref(false)

const musicStore = useMusicStore()
const { volume } = storeToRefs(musicStore)
const { setVolume } = musicStore

function onVolumeChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target?.value) {
    setVolume(Number(target?.value))
  }
}

const isMuted = ref()
const toggleMute = () => {
  isMuted.value = ! isMuted.value
}


const colorStore = useColor()
const { color } = storeToRefs(colorStore)

function hexToRgb(hex: string) {
  const h = (hex || "#667eea").replace("#", "")
  const r = parseInt(h.substring(0, 2), 16) || 0
  const g = parseInt(h.substring(2, 4), 16) || 0
  const b = parseInt(h.substring(4, 6), 16) || 0
  return { r, g, b }
}

const style = computed(() => {
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
  } as Record<string, string>
})
</script>


<style scoped>
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
  writing-mode: vertical-lr;
  direction: rtl;
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
</style>