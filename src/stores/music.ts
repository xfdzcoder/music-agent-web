import { defineStore } from "pinia"
import { ref, watch } from "vue"
import type { MusicInfo, PlayMode } from "@/api/music/types.ts"
import { getAllMusicList, pauseMusic, playMusic, updatePlayMode, updateVolume, getPlayState } from "@/api/music"

export const useMusicStore = defineStore("music", () => {
  const currentMusic = ref<MusicInfo>()
  const currentMusicIndex = ref<number>(-1)
  const currentPlaylist = ref<MusicInfo[]>([])

  const refreshPlaylist = () => {
    getAllMusicList()
      .then(resp => {
        currentPlaylist.value = resp
        if (currentMusicIndex.value < 0 && resp.length > 0) {
          currentMusicIndex.value = 0
          currentMusic.value = currentPlaylist.value[currentMusicIndex.value]
        }
      })
  }

  // 播放状态相关
  const isPlaying = ref(false)
  const playMode = ref<PlayMode>('loop')
  const volume = ref(80)
  const isMuted = ref(false)
  const duration = ref(0)
  const currentMusicTimeMs = ref<number>(0)
  
  // 内部状态
  const timer = ref<number>()
  const audioElement = ref<HTMLAudioElement | null>(null)
  const pollInterval = ref<number | null>(null)

  // 设置音频元素
  const setAudioElement = (element: HTMLAudioElement) => {
    audioElement.value = element
    audioElement.value.volume = volume.value / 100
    
    // 监听音频事件
    audioElement.value.addEventListener('volumechange', () => {
      isMuted.value = audioElement.value?.muted || false
    })
    audioElement.value.addEventListener('timeupdate', handleTimeUpdate)
    audioElement.value.addEventListener('loadedmetadata', handleLoadedMetadata)
    audioElement.value.addEventListener('ended', handleTrackEnded)
  }

  // 处理音频时间更新
  const handleTimeUpdate = () => {
    if (audioElement.value) {
      // currentMusicTimeMs.value = audioElement.value.currentTime * 1000
      duration.value = audioElement.value.duration || 0
    }
  }

  // 处理音频元数据加载完成
  const handleLoadedMetadata = () => {
    if (audioElement.value) {
      duration.value = audioElement.value.duration || 0
    }
  }

  // 处理曲目结束
  const handleTrackEnded = () => {
    switch (playMode.value) {
      case 'single':
        // 单曲循环，重新播放当前曲目
        playCurrentTrack()
        break
      case 'loop':
        // 列表循环，播放下一首，到末尾回到开头
        next()
        break
      case 'order':
        // 顺序播放，播放下一首，到末尾停止
        if (currentMusicIndex.value < currentPlaylist.value.length - 1) {
          next()
        } else {
          isPlaying.value = false
        }
        break
    }
  }

  // 播放当前曲目
  const playCurrentTrack = () => {
    if (audioElement.value && currentMusic.value) {
      audioElement.value.play().then(() => {
        isPlaying.value = true
        playMusic(currentMusic.value?.uuid ?? "")

        // 启动定时器同步进度
        const startMs = Date.now() - currentMusicTimeMs.value
        timer.value = setInterval(() => {
          if (isPlaying.value) {
            currentMusicTimeMs.value = Date.now() - startMs
          } else {
            clearInterval(timer.value)
          }
        }, 50)
      }).catch(error => {
        console.error("播放失败:", error)
        isPlaying.value = false
      })
    }
  }

  // 播放/暂停切换
  const togglePlay = () => {
    if (isPlaying.value) {
      pause()
    } else {
      playCurrentTrack()
    }
  }

  // 播放
  const play = () => {
    if (!isPlaying.value) {
      playCurrentTrack()
    }
  }

  // 暂停
  const pause = () => {
    if (audioElement.value) {
      audioElement.value.pause()
      isPlaying.value = false
      pauseMusic()
      clearInterval(timer.value)
    }
  }

  // 下一首
  const next = () => {
    if (currentPlaylist.value.length === 0) return
    
    currentMusicIndex.value = (currentMusicIndex.value + 1) % currentPlaylist.value.length
    currentMusic.value = currentPlaylist.value[currentMusicIndex.value]
    
    // 如果正在播放，切换到新曲目
    if (isPlaying.value) {
      currentMusicTimeMs.value = 0
      playCurrentTrack()
    }
  }

  // 上一首
  const previous = () => {
    if (currentPlaylist.value.length === 0) return
    
    currentMusicIndex.value = (currentMusicIndex.value - 1 + currentPlaylist.value.length) % currentPlaylist.value.length
    currentMusic.value = currentPlaylist.value[currentMusicIndex.value]
    
    // 如果正在播放，切换到新曲目
    if (isPlaying.value) {
      currentMusicTimeMs.value = 0
      playCurrentTrack()
    }
  }

  // 切换播放模式
  const togglePlayMode = () => {
    switch (playMode.value) {
      case 'single':
        playMode.value = 'loop'
        break
      case 'loop':
        playMode.value = 'order'
        break
      case 'order':
        playMode.value = 'single'
        break
    }
    // 调用后端接口同步播放模式
    updatePlayMode(playMode.value).catch(error => {
      console.error('更新播放模式失败:', error)
    })
  }

  // 切换静音
  const toggleMute = () => {
    if (audioElement.value) {
      isMuted.value = !isMuted.value
      audioElement.value.muted = isMuted.value
    }
  }

  // 从后端获取播放状态
  const fetchPlayState = async () => {
    try {
      const state = await getPlayState()
      // 更新本地状态
      if (state.position_ms !== null && state.position_ms !== undefined) {
        currentMusicTimeMs.value = state.position_ms
        console.log('22', audioElement.value?.currentTime ?? 0 - currentMusicTimeMs.value / 1000)
        if (audioElement.value && Math.abs(audioElement.value.currentTime - currentMusicTimeMs.value / 1000) > 1) {
          // 只有当时间差大于1秒时才同步，避免频繁更新
          audioElement.value.currentTime = currentMusicTimeMs.value / 1000
        }
      }
      // 如果有新的音乐UUID，更新音频源
      if (state.music?.uuid !== currentMusic.value?.uuid) {
        const musicIndex = currentPlaylist.value.findIndex(m => m.uuid === state.music?.uuid)
        if (musicIndex !== -1 && musicIndex !== currentMusicIndex.value) {
          currentMusicIndex.value = musicIndex
          currentMusic.value = currentPlaylist.value[musicIndex]
        }
      }
      isPlaying.value = state.is_playing
      playMode.value = state.mode
      volume.value = state.volume
    } catch (error) {
      console.error('获取播放状态失败:', error)
    }
  }

  // 开始定期同步
  const startPeriodicSync = () => {
    // 每5秒从后端获取一次播放状态，用于纠错和初始化
    pollInterval.value = window.setInterval(fetchPlayState, 1000)
  }

  // 停止定期同步
  const stopPeriodicSync = () => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
  }

  // 监听音量变化
  watch(volume, (newVolume) => {
    if (audioElement.value) {
      audioElement.value.volume = newVolume / 100
    }
    // 调用后端接口同步音量
    updateVolume(newVolume).catch(error => {
      console.error('更新音量失败:', error)
    })
  })

  return {
    // 播放列表
    currentMusic,
    currentMusicIndex,
    currentPlaylist,
    refreshPlaylist,
    
    // 播放状态
    isPlaying,
    playMode,
    volume,
    isMuted,
    duration,
    currentMusicTimeMs,
    
    // 方法
    setAudioElement,
    togglePlay,
    play,
    pause,
    next,
    previous,
    togglePlayMode,
    toggleMute,
    startPeriodicSync,
    stopPeriodicSync,
    fetchPlayState
  }
})