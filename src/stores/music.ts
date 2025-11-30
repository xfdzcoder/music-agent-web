import { defineStore } from "pinia"
import { ref } from "vue"
import type { MusicInfo, PlayMode } from "@/api/music/types.ts"
import { getAllMusicList, pauseMusic, playMusic, updatePlayMode } from "@/api/music"

export const useMusicStore = defineStore("music", () => {

  const currentMusic = ref<MusicInfo>()
  const currentMusicIndex = ref<number>(-1)
  const currentPlaylist = ref<MusicInfo[]>([])

  const refreshPlaylist = () => {
    getAllMusicList()
      .then(resp => {
        currentPlaylist.value = resp
        if (currentMusicIndex.value < 0) {
          currentMusicIndex.value = 0
          currentMusic.value = currentPlaylist.value[currentMusicIndex.value]
        }
      })
  }

  const currentMusicTimeMs = ref<number>(0)
  const timer = ref<number>()
  const play = () => {
    playMusic(currentMusic.value?.uuid ?? "")
      .then(() => {
        const startMs = Date.now() - currentMusicTimeMs.value
        timer.value = setInterval(() => {
          currentMusicTimeMs.value = Date.now() - startMs
        }, 50)
      })
  }
  const pause = () => {
    pauseMusic()
      .finally(() => {
        clearInterval(timer.value)
      })
  }

  const volume = ref(10)


  const isPlaying = ref(false)

  function togglePlay() {
    if (! currentMusic.value) {
      return
    }

    isPlaying.value = ! isPlaying.value

    if (isPlaying.value) {
      play()
    } else {
      pause()
    }
  }

  function previous() {
    console.log("上一首")
  }

  function next() {
    console.log("下一首")
  }

  const playMode = ref<PlayMode>()

// 切换播放模式
  function togglePlayMode() {
    switch (playMode.value) {
      case "single":
        playMode.value = "loop"
        break
      case "loop":
        playMode.value = "order"
        break
      case "order":
        playMode.value = "single"
        break
    }
    // 调用后端接口同步播放模式
    updatePlayMode(playMode.value as PlayMode).catch(error => {
      console.error("更新播放模式失败:", error)
    })
  }


  return {
    currentMusic,
    currentMusicIndex,
    currentPlaylist,
    refreshPlaylist,

    currentMusicTimeMs,
    play,
    pause,

    volume,
    isPlaying,
    togglePlay,
    previous,
    next,

    playMode,
    togglePlayMode,
  }
})