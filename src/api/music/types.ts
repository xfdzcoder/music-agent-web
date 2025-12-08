export interface MusicInfo {
  uuid: string
  filepath: string
  album: string
  title: string
  artist: string[]
  date: number
  lyrics: string
  album_artist: string
  time_length: number
  pictures: string[]
}

export interface Device {
  device_id: string
  name: string
}

export interface PlayState {
  mode: PlayMode
  is_playing: boolean
  volume: number
  music: MusicInfo,
  device: Device
  position_ms: number
  playlist: MusicInfo[]
  index: number
}

export type PlayMode = "single" | "loop" | "order";