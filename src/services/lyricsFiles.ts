import HmusicMediaStore
  from '../../modules/hmusic-media-store';

import type {
  LyricsFolderResultEvent,
  SidecarLyricsResult,
} from '../../modules/hmusic-media-store';

import type {
  Song,
} from '../types/Song';


export async function getLyricsFolder() {
  return await HmusicMediaStore
    .getLyricsFolderAsync();
}


export async function requestLyricsFolder() {
  return await HmusicMediaStore
    .requestLyricsFolderAsync();
}


export async function clearLyricsFolder() {
  return await HmusicMediaStore
    .clearLyricsFolderAsync();
}


export async function findSidecarLyrics(
  song: Song
):
  Promise<
    SidecarLyricsResult | null
  > {

  return await HmusicMediaStore
    .findSidecarLyricsAsync(

      song.fileName ??
        null,

      song.title ??
        null

    );
}


export function addLyricsFolderResultListener(
  listener:
    (
      event:
        LyricsFolderResultEvent
    ) => void
) {

  return HmusicMediaStore
    .addListener(
      'onLyricsFolderResult',
      listener
    );
}
