import { get, post, put } from "@/utils/request.ts"
import type { MusicInfo, PlayState, PlayMode } from "@/api/music/types.ts"

export async function getAllMusicList(): Promise<MusicInfo[]> {
  return get<MusicInfo[]>('/music/all')
}

export async function playMusic(musicUuid: string): Promise<void> {
  return post(`/music/play/${musicUuid}`)
}

export async function pauseMusic(): Promise<void> {
  return put(`/music/pause`)
}

// 更新播放模式
export async function updatePlayMode(mode: PlayMode): Promise<void> {
  return put(`/music/mode/${mode}`)
}

// 更新音量
export async function updateVolume(volume: number): Promise<void> {
  return put(`/music/volume/${volume}`)
}

// 获取当前播放状态
export async function getPlayState(): Promise<PlayState> {
  return get<PlayState>(`/music/state`)
}
