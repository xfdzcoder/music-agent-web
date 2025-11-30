<template>
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
                <div class="song-artist">{{ song.artist.join(", ") }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">

import { ref } from "vue"
import { useMusicStore } from "@/stores/music.ts"

const musicStore = useMusicStore()
const { currentPlaylist, currentMusicIndex } = musicStore

function playSong(index: number) {
  console.log(index)
}


const showPlaylist = ref(false)
function togglePlaylist() {
  showPlaylist.value = !showPlaylist.value
}

</script>

<style scoped>

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
.playlist-item:nth-child(1) {
  animation-delay: 0.02s;
}

.playlist-item:nth-child(2) {
  animation-delay: 0.04s;
}

.playlist-item:nth-child(3) {
  animation-delay: 0.06s;
}

.playlist-item:nth-child(4) {
  animation-delay: 0.08s;
}

.playlist-item:nth-child(5) {
  animation-delay: 0.10s;
}

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
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>