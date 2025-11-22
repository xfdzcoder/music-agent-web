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
              :src="currentSong.cover"
              :alt="currentSong.title"
              crossorigin="anonymous"
              @load="handleImageLoad"
          />
          <div class="cover-tint"></div>
        </div>
      </div>

      <div class="right-content">
        <div class="song-info-section">
          <h1 class="song-title">{{ currentSong.title }}</h1>
          <div class="song-meta">
            <span class="song-artist">{{ currentSong.artist }}</span>
            <span class="divider">·</span>
            <span class="song-album">{{ currentSong.album }}</span>
          </div>
        </div>

        <div class="lyrics-wrapper">
          <div class="lyrics-scroll" ref="lyricsScrollRef">
            <div class="lyric-spacer"></div>
            <div
                v-for="(line, index) in lyrics"
                :key="index"
                class="lyric-line"
                :class="{ 'lyric-active': index === currentLyricIndex }"
                @click="scrollToLyric(index)"
            >
              {{ line.text }}
            </div>
            <div class="lyric-spacer"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { FastAverageColor } from "fast-average-color"
import { useColor } from "@/stores/color.ts"
import { storeToRefs } from "pinia"
import { adjustBrightness } from "@/utils/color.ts"

// ================= 状态管理 =================
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
      ignoredColor: [255, 255, 255, 255, 0, 0, 0, 255] // 忽略纯白和纯黑
    })
    changeColor(color.hex)
  } catch (e) {
    console.warn("颜色提取失败", e)
  }
}

// ================= 业务数据 (保持不变) =================
interface LyricLine {
  time : number
  text : string
}

const currentLyricIndex = ref(1)
const lyricsScrollRef = ref<HTMLDivElement>()

const currentSong = ref({
  title: "Cruel Summer",
  artist: "Taylor Swift",
  album: "Lover",
  cover: "https://picsum.photos/800/800",
})

const lyrics = ref<LyricLine[]>([
  { time: 0, text: "🎵" },
  { time: 5, text: "Fever dream high in the quiet of the night" },
  { time: 10, text: "You know that I caught it" },
  { time: 15, text: "Bad, bad boy" },
  { time: 20, text: "Shiny toy with a price" },
  { time: 25, text: "You know that I bought it" },
  { time: 30, text: "Killing me slow, out the window" },
  { time: 35, text: "I'm always waiting for you to be waiting below" },
  { time: 40, text: "Devils roll the dice, angels roll their eyes" },
  { time: 45, text: "What doesn't kill me makes me want you more" },
  { time: 50, text: "And it's new, the shape of your body" },
  { time: 55, text: "It's blue, the feeling I've got" },
  { time: 60, text: "And it's ooh, whoa, oh" },
  { time: 65, text: "It's a cruel summer" },
  { time: 70, text: "It's cool, that's what I tell 'em" },
  { time: 75, text: "No rules, in breakable heaven" },
  { time: 80, text: "But ooh, whoa, oh" },
  { time: 85, text: "It's a cruel summer" },
  { time: 90, text: "With you" },
])

const scrollToLyric = (index : number) => {
  currentLyricIndex.value = index
}
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