<template>
  <div
      class="now-playing"
      :style="{
        '--bg-color': color,
        '--bg-dark': themeDarkColor
      }"
  >
    <div class="background-overlay"></div>

    <div class="now-playing-container">
      <div class="album-section">
        <div class="cover-wrapper">
          <img
              ref="imgRef"
              :src="currentMusic?.pictures[0]"
              :alt="currentMusic?.title"
              crossorigin="anonymous"
              @load="handleImageLoad"
          />
          <div class="cover-tint"></div>
        </div>
      </div>

      <div class="right-content">
        <div class="song-info-section">
          <h1 class="song-title">{{ currentMusic?.title }}</h1>
          <div class="song-meta">
            <span class="song-artist">{{ currentMusic?.artist.join(", ") }}</span>
            <span class="divider">·</span>
            <span class="song-album">{{ currentMusic?.album }}</span>
          </div>
        </div>

        <div class="lyrics-wrapper">
          <div class="lyrics-scroll" ref="lyricsScrollRef">
            <div class="lyric-spacer"></div>
            <div
                v-for="(lyric, index) in resolvedLyrics"
                :key="index"
                class="lyric-line"
                :class="{ 'lyric-active': index === currentLyricIndex }"
                :ref="el => lyricRefs[index] = el"
            >
              {{ lyric.text }}
            </div>
            <div class="lyric-spacer"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue"
import { FastAverageColor } from "fast-average-color"
import { useColor } from "@/stores/color.ts"
import { storeToRefs } from "pinia"
import { adjustBrightness } from "@/utils/color.ts"
import { useMusicStore } from "@/stores/music.ts"

// ================= 状态管理 =================
const musicStore = useMusicStore()
const { currentMusic, currentMusicTimeMs } = storeToRefs(musicStore)
const { refreshPlaylist } = musicStore

const colorStore = useColor()
const { color } = storeToRefs(colorStore)
const { changeColor } = colorStore

const themeDarkColor = computed(() => {
  // 核心修改：基于提取的颜色，生成一个暗 60% 的颜色
  // 这样右侧背景就是深色系的主题色，而不是死板的纯黑
  return adjustBrightness(color.value, 0)
})

const fac = new FastAverageColor()
const imgRef = ref<HTMLImageElement>()

const handleImageLoad = async() => {
  if (! imgRef.value) return
  try {
    const color = await fac.getColorAsync(imgRef.value, {
      algorithm: "dominant",
      ignoredColor: [255, 255, 255, 255, 0, 0, 0, 255],
    })
    changeColor(color.hex)
  } catch (e) {
    console.warn("颜色提取失败", e)
  }
}


type Lyric = {
  time: number
  text: string
}
const resolvedLyrics = computed<Lyric[]>(() => {
  if (! currentMusic.value?.lyrics) {
    return [{ time: 0, text: "暂无歌词" }]
  }

  const result: Lyric[] = []
  const timeReg = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?]/g

  for (const line of currentMusic.value?.lyrics.split("\n")) {
    if (! line.trim()) continue

    const times = [...line.matchAll(timeReg)]
    if (times.length === 0) continue

    // 去掉时间标签后的歌词内容
    const text = line.replace(timeReg, "").trim() || ""
    if (!text) continue

    for (const match of times) {
      const min = parseInt(match[1] ?? "0")
      const sec = parseInt(match[2] ?? "0")
      const ms = match[3] ? parseInt(match[3].padEnd(3, "0")) : 0 // 补足毫秒位

      const time = min * 60 * 1000 + sec * 1000 + ms

      result.push({ time, text })
    }
  }

  result.sort((a, b) => a.time - b.time)
  return result
})
const currentLyricIndex = computed<number>((): number => {
  if (! resolvedLyrics?.value || resolvedLyrics?.value?.length === 0) {
    return 0
  }

  for (let i = resolvedLyrics.value.length - 1; i >= 0; i--) {
    const lyricTime = resolvedLyrics.value[i]?.time ?? 0
    if (currentMusicTimeMs.value >= lyricTime) {
      return i
    }
  }

  return 0
})
const lyricsScrollRef = ref<HTMLDivElement>()
const lyricRefs = ref<(HTMLDivElement | null)[]>([])
// 监听索引变化，滚动到当前行
watch(currentLyricIndex, async (newIndex: number) => {
  await nextTick() // 等待 DOM 更新
  const container = lyricsScrollRef.value
  const currentEl = lyricRefs.value[newIndex]

  if (container && currentEl) {
    // 方法1: scrollTop 滚动到中心
    const containerHeight = container.clientHeight
    const lyricHeight = currentEl.offsetHeight
    const offsetTop = currentEl.offsetTop
    container.scrollTop = offsetTop - containerHeight / 2 + lyricHeight / 2

    // 方法2: 或直接用 scrollIntoView
    // currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})

onMounted(() => {
  refreshPlaylist()
})
</script>

<style scoped>
.now-playing {
  position: relative;
  width: 100%;
  height: 100vh;

  /* 【核心修改】
    使用径向渐变：
    - 中心点在左侧 (20% 50%)：显示明亮的 --bg-color
    - 边缘及右侧：显示深色的 --bg-dark (不再是纯黑 #101010)
    这样右侧背景依然有色彩倾向。
  */
  background: radial-gradient(
      circle at 20% 50%,
      var(--bg-color) 0%,
      var(--bg-dark) 100%
  );

  color: #ffffff;
  overflow: hidden;
  display: flex;
  justify-content: center;
  transition: background 1s ease;
}

/* 【核心修改】背景蒙层
  用这个蒙层来保证文字对比度，而不是靠背景色变黑。
  从左到右：透明 -> 半透明黑。
  这样右侧歌词底下的颜色是：(深色主色 + 半透明黑)，既有颜色又能看清字。
*/
.background-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%);
  pointer-events: none;
  z-index: 0;
}

.now-playing-container {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  z-index: 1;
}

/* ============================
   左侧：专辑封面
   ============================ */
.album-section {
  flex: 0 0 50%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.cover-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  /* 保持宽广的渐变范围 */
  mask-image: linear-gradient(to right, black 10%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 10%, transparent 100%);
}

.cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.cover-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
}

/* ============================
   右侧：内容区域
   ============================ */
.right-content {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 15vh;
  padding-left: 0; /* 紧贴中线 */
  padding-right: 60px;
  z-index: 10;
}

.song-info-section {
  flex-shrink: 0;
  margin-bottom: 30px;
  text-align: left;
}

.song-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.song-meta {
  display: flex;
  align-items: center;
  font-size: 18px;
  opacity: 0.7;
  font-weight: 500;
}

.divider {
  margin: 0 8px;
  opacity: 0.5;
}

/* ============================
   歌词区域
   ============================ */
.lyrics-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
  margin-bottom: 10vh;
  mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 80%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 80%, transparent 100%);
}

.lyrics-scroll {
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
}

.lyrics-scroll::-webkit-scrollbar {
  display: none;
}

.lyric-spacer {
  height: 40%;
}

.lyric-line {
  padding: 12px 0;
  font-size: 18px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.45); /* 稍微调亮一点点未选中歌词 */
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
  transform-origin: left center;
  max-width: 90%;
}

.lyric-line:hover {
  color: rgba(255, 255, 255, 0.8);
}

.lyric-active {
  color: #ffffff;
  font-size: 26px;
  font-weight: 700;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

/* ============================
   响应式
   ============================ */
@media (max-width: 1024px) {
  .now-playing-container {
    flex-direction: column;
  }

  .album-section {
    flex: none;
    height: 40vh;
    width: 100%;
  }

  .cover-wrapper {
    mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
  }

  .right-content {
    padding: 20px;
    padding-top: 0;
    justify-content: center;
  }
}
</style>