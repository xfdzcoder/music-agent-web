import { defineStore } from "pinia"
import { ref, watch } from "vue"
import type { MusicInfo, PlayMode } from "@/api/music/types.ts"
import { getAllMusicList, getPlayState, pauseMusic, playMusic, updatePlayMode, updateVolume } from "@/api/music"

export const useMusicStore = defineStore("music", () => {

  const currentMusic = ref<MusicInfo>()
  const currentMusicIndex = ref<number>(-1)
  const currentPlaylist = ref<MusicInfo[]>([])

  function refreshPlaylist() {
    getAllMusicList()
      .then(resp => {
        currentPlaylist.value = resp
        if (currentMusicIndex.value < 0) {
          currentMusicIndex.value = 0
        }
      })
  }
  function setCurrentIndex(index: number) {
    if (index < 0 || index > currentPlaylist.value.length) {
      return
    }
    const nextMusic = currentPlaylist.value[index]
    if (nextMusic) {
      playMusic(nextMusic.uuid)
        .catch(err => {
          console.log(err)
        })
    }
  }
  watch(currentMusicIndex, () => {
    if (currentMusicIndex.value >= 0 && currentPlaylist.value.length > 0) {
      const music = currentPlaylist.value[currentMusicIndex.value]
      if (music?.uuid !== currentMusic.value?.uuid) {
        currentMusic.value = music
      }
    }
  })

  const isPlaying = ref(false)
  const currentMusicTimeMs = ref<number>(0)

  function play() {
    playMusic(currentMusic.value?.uuid ?? "")
      .catch(err => {
        console.log(err)
      })
  }

  function pause() {
    pauseMusic()
      .catch(err => {
        console.log(err)
      })
  }

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

  const volume = ref(10)

  function setVolume(volume: number) {
    updateVolume(volume)
      .catch(err => {
        console.log(err)
      })
  }

  const playMode = ref<PlayMode>()

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
    updatePlayMode(playMode.value as PlayMode)
      .catch(error => {
        console.error("更新播放模式失败:", error)
      })
  }

  const stateTimer = ref<number | null>()

  function initStateTimer() {
    stateTimer.value = setInterval(() => {
      getPlayState()
        .then(state => {
          isPlaying.value = state.is_playing
          volume.value = state.volume
          playMode.value = state.mode
          currentMusicTimeMs.value = state.position_ms
          currentPlaylist.value = state.playlist
          if (state.music) {
            currentMusicIndex.value = state.index
          } else {
            currentMusicIndex.value = 0
          }
        })
        .catch(err => {
          console.log(err)
        })

    }, 1000)
  }

  function clearStateTimer() {
    if (stateTimer.value) {
      clearInterval(stateTimer.value)
    }
  }

  const audioElement = ref<HTMLAudioElement>()
  const audioContext = ref<AudioContext>()

  function setAudio(audio: HTMLAudioElement, context: AudioContext) {
    audioElement.value = audio
    audioContext.value = context
  }

  watch(isPlaying, () => {
    doPlayAudio()
  })
  watch(currentMusicTimeMs, () => {
    if (audioElement.value) {
      audioElement.value.currentTime = currentMusicTimeMs.value
    }
  })

  function doPlayAudio() {
    if (! audioElement.value || ! audioContext.value) return
    console.log("watch(isPlaying", isPlaying.value)
    if (isPlaying.value) {
      if (audioContext && audioContext.value.state === "suspended") {
        audioContext.value.resume()
      }
      audioElement.value.play()
                  .catch(err => {
                    console.log(err)
                  })
    } else {
      audioElement.value.pause()
    }
  }


  return {
    currentMusic,
    currentMusicIndex,
    currentPlaylist,
    refreshPlaylist,
    setCurrentIndex,

    currentMusicTimeMs,
    play,
    pause,

    isPlaying,
    togglePlay,
    previous,
    next,

    volume,
    setVolume,

    playMode,
    togglePlayMode,

    stateTimer,
    initStateTimer,
    clearStateTimer,

    audioElement,
    audioContext,
    setAudio,
    doPlayAudio,
  }
})