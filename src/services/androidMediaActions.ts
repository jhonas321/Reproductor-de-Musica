import {
    Platform,
  } from 'react-native';
  
  import HmusicMediaStore from '../../modules/hmusic-media-store';
  
  import type {
    DeleteResultEvent,
  } from '../../modules/hmusic-media-store';
  
  import type {
    Song,
  } from '../types/Song';
  
  
  /* =========================================================
     VERIFICAR ANDROID
  ========================================================= */
  
  function requireAndroid() {
    if (
      Platform.OS !==
      'android'
    ) {
      throw new Error(
        'Esta función está disponible solamente en Android.'
      );
    }
  }
  
  
  /* =========================================================
     OBTENER CONTENT URI DE UNA CANCIÓN
  ========================================================= */
  
  export function getSongContentUri(
    song: Song
  ) {
    if (
      song.contentUri?.startsWith(
        'content://'
      )
    ) {
      return song.contentUri;
    }
  
  
    if (
      song.uri.startsWith(
        'content://'
      )
    ) {
      return song.uri;
    }
  
  
    return null;
  }
  
  
  /* =========================================================
     OBTENER CONTENT URI O GENERAR ERROR
  ========================================================= */
  
  function requireSongContentUri(
    song: Song
  ) {
    const uri =
      getSongContentUri(
        song
      );
  
  
    if (!uri) {
      throw new Error(
        `No se encontró una URI compartible para "${song.title}".`
      );
    }
  
  
    return uri;
  }
  
  
  /* =========================================================
     COMPARTIR UNA CANCIÓN
  ========================================================= */
  
  export async function shareSongFile(
    song: Song
  ) {
    requireAndroid();
  
  
    const contentUri =
      requireSongContentUri(
        song
      );
  
  
    return await HmusicMediaStore
      .shareAudioAsync(
        contentUri,
        song.fileName ??
          song.title
      );
  }
  
  
  /* =========================================================
     COMPARTIR VARIAS CANCIONES
  ========================================================= */
  
  export async function shareMultipleSongFiles(
    songs: Song[]
  ) {
    requireAndroid();
  
  
    const uris =
      Array.from(
        new Set(
          songs
            .map(
              getSongContentUri
            )
            .filter(
              (
                uri
              ): uri is string =>
                Boolean(uri)
            )
        )
      );
  
  
    if (
      uris.length ===
      0
    ) {
      throw new Error(
        'No se encontraron archivos de audio compartibles.'
      );
    }
  
  
    return await HmusicMediaStore
      .shareMultipleAudioAsync(
        uris
      );
  }
  
  
  /* =========================================================
     ABRIR CON OTRA APLICACIÓN
  ========================================================= */
  
  export async function openSongWithApp(
    song: Song
  ) {
    requireAndroid();
  
  
    const contentUri =
      requireSongContentUri(
        song
      );
  
  
    return await HmusicMediaStore
      .openAudioWithAsync(
        contentUri,
        song.fileName ??
          song.title
      );
  }
  
  
  /* =========================================================
     ELIMINAR UNA CANCIÓN DEL DISPOSITIVO
  ========================================================= */
  
  export async function deleteSongFromDevice(
    song: Song
  ) {
    requireAndroid();
  
  
    const contentUri =
      requireSongContentUri(
        song
      );
  
  
    return await HmusicMediaStore
      .requestDeleteAudioAsync(
        contentUri
      );
  }
  
  
  /* =========================================================
     ELIMINAR VARIAS CANCIONES
  ========================================================= */
  
  export async function deleteSongsFromDevice(
    songs: Song[]
  ) {
    requireAndroid();
  
  
    const uris =
      Array.from(
        new Set(
          songs
            .map(
              getSongContentUri
            )
            .filter(
              (
                uri
              ): uri is string =>
                Boolean(uri)
            )
        )
      );
  
  
    if (
      uris.length ===
      0
    ) {
      throw new Error(
        'No se encontraron canciones eliminables.'
      );
    }
  
  
    return await HmusicMediaStore
      .requestDeleteMultipleAudioAsync(
        uris
      );
  }
  
  
  /* =========================================================
     ACTUALIZAR CONSULTA NATIVA DE MEDIASTORE
  ========================================================= */
  
  export async function refreshAndroidAudioLibrary() {
    requireAndroid();
  
  
    return await HmusicMediaStore
      .refreshAudioLibraryAsync();
  }
  
  
  /* =========================================================
     ESCUCHAR RESULTADO DE ELIMINACIÓN
  ========================================================= */
  
  export function addDeleteResultListener(
    listener:
      (
        event:
          DeleteResultEvent
      ) => void
  ) {
    return HmusicMediaStore
      .addListener(
        'onDeleteResult',
        listener
      );
  }