import {
  NativeModule,
  requireNativeModule,
} from 'expo';


export interface AndroidAudioLocation {
  id: string;

  contentUri: string;

  displayName: string;

  folderPath: string;

  volumeName: string;
}


export interface DeleteRequestResult {
  status:
    | 'requested'
    | 'deleted'
    | 'not_deleted';

  count: number;
}


export interface DeleteResultEvent {
  confirmed: boolean;

  deletedCount: number;

  requestedCount: number;
}


export interface LyricsFolderInfo {
  uri: string;

  name: string;
}


export interface LyricsFolderResultEvent {
  granted: boolean;

  uri:
    string | null;

  name:
    string | null;
}


export interface SidecarLyricsResult {
  content: string;

  format:
    | 'lrc'
    | 'txt';

  fileName: string;

  uri: string;
}


type HmusicMediaStoreEvents = {
  onDeleteResult:
    (
      event:
        DeleteResultEvent
    ) => void;

  onLyricsFolderResult:
    (
      event:
        LyricsFolderResultEvent
    ) => void;
};


declare class HmusicMediaStoreNativeModule
  extends NativeModule<
    HmusicMediaStoreEvents
  > {

  getAudioLocationsAsync:
    () =>
      Promise<
        AndroidAudioLocation[]
      >;


  refreshAudioLibraryAsync:
    () =>
      Promise<
        AndroidAudioLocation[]
      >;


  shareAudioAsync:
    (
      contentUri:
        string,

      displayName?:
        string | null
    ) =>
      Promise<boolean>;


  shareMultipleAudioAsync:
    (
      contentUris:
        string[]
    ) =>
      Promise<boolean>;


  openAudioWithAsync:
    (
      contentUri:
        string,

      displayName?:
        string | null
    ) =>
      Promise<boolean>;


  requestDeleteAudioAsync:
    (
      contentUri:
        string
    ) =>
      Promise<
        DeleteRequestResult
      >;


  requestDeleteMultipleAudioAsync:
    (
      contentUris:
        string[]
    ) =>
      Promise<
        DeleteRequestResult
      >;


  getLyricsFolderAsync:
    () =>
      Promise<
        LyricsFolderInfo | null
      >;


  requestLyricsFolderAsync:
    () =>
      Promise<boolean>;


  clearLyricsFolderAsync:
    () =>
      Promise<boolean>;


  findSidecarLyricsAsync:
    (
      audioFileName?:
        string | null,

      songTitle?:
        string | null
    ) =>
      Promise<
        SidecarLyricsResult | null
      >;
}


const HmusicMediaStore =
  requireNativeModule<
    HmusicMediaStoreNativeModule
  >(
    'HmusicMediaStore'
  );


export default HmusicMediaStore;
