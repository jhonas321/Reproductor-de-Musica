export interface Song {
  id: string;

  title: string;

  artist: string;

  album: string;

  duration: number;

  uri: string;

  artwork: string | null;

  contentUri?: string;

  createdAt?: number | null;

  modifiedAt?: number | null;

  fileSize?: number;

  // Información automática de MediaStore
  folderPath?: string;

  fileName?: string;

  volumeName?: string;
}

export type RepeatMode =
  | 'off'
  | 'all'
  | 'one';

export type SortKey =
  | 'title'
  | 'artist'
  | 'album'
  | 'newest';

export interface Playlist {
  id: string;

  name: string;

  songIds: string[];

  createdAt: number;

  updatedAt: number;
}

export interface AppSettings {
  minDuration: number;

  sortKey: SortKey;

  sortAscending: boolean;

  resumeLastSong: boolean;
}

export interface TrackDetails {
  id: string;

  duration: number | null;

  bitrate: number | null;

  sampleRate: number | null;

  channels: string | null;

  format: string | null;

  title: string | null;

  artist: string | null;

  album: string | null;

  year: number | null;

  genre: string | null;

  track: number | null;

  disc: number | null;

  composer: string | null;

  lyricist: string | null;

  lyrics: string | null;

  albumArtist: string | null;

  comment: string | null;
}