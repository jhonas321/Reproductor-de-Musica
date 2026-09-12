import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

import {
  getTrackMetadataAsync,
  getTracksAsync,
} from '@nodefinity/react-native-music-library';

import * as MediaLibrary from 'expo-media-library/legacy';

import HmusicMediaStore from '../../modules/hmusic-media-store';

import type {
  AndroidAudioLocation,
} from '../../modules/hmusic-media-store';

import type {
  Song,
  TrackDetails,
} from '../types/Song';

import {
  normalizeMetadata,
  uniqueSongs,
} from '../utils/music';


/* =========================================================
   CONFIGURACIÓN DE CACHÉ
========================================================= */

const LIBRARY_CACHE_KEY =
  '@hmusic/local-library-cache-v2';

const LIBRARY_CACHE_VERSION =
  2;

/*
 * Durante este tiempo Hmusic puede abrir usando la biblioteca
 * ya procesada, evitando volver a escanear ~2000 canciones.
 *
 * El caché acelera la apertura inicial. useMusicLibrary realiza
 * después un escaneo real silencioso, por lo que una canción nueva
 * no tiene que esperar a que caduquen estos 15 minutos.
 */
const LIBRARY_CACHE_MAX_AGE_MS =
  15 * 60 * 1000;


/* =========================================================
   TIPOS INTERNOS
========================================================= */

interface CachedLibrary {
  version:
    number;

  savedAt:
    number;

  songs:
    Song[];
}


interface GetLocalSongsOptions {
  /*
   * true:
   * ignora el caché y vuelve a consultar Android.
   *
   * Se usa al actualizar manualmente, al volver a Hmusic
   * y durante la revalidación silenciosa de la biblioteca.
   */
  forceRefresh?:
    boolean;
}


/* =========================================================
   CACHÉ EN MEMORIA
========================================================= */

/*
 * Evita volver a leer AsyncStorage varias veces durante
 * la misma ejecución de Hmusic.
 */
let memoryCache:
  CachedLibrary | null =
  null;


/*
 * Si dos partes de la app llaman getLocalSongs() casi
 * al mismo tiempo, ambas reutilizan el mismo escaneo.
 */
let activeScan:
  Promise<Song[]> | null =
  null;


/* =========================================================
   ERRORES
========================================================= */

export class MusicPermissionError extends Error {
  constructor() {
    super(
      'No se concedió permiso para acceder a la música.'
    );

    this.name =
      'MusicPermissionError';
  }
}


/* =========================================================
   UTILIDADES DE CACHÉ
========================================================= */

function isCacheFresh(
  cache:
    CachedLibrary | null
) {
  if (!cache) {
    return false;
  }

  if (
    cache.version !==
    LIBRARY_CACHE_VERSION
  ) {
    return false;
  }

  if (
    !Array.isArray(
      cache.songs
    )
  ) {
    return false;
  }

  const age =
    Date.now() -
    cache.savedAt;

  return (
    age >= 0 &&
    age <
      LIBRARY_CACHE_MAX_AGE_MS
  );
}


async function readLibraryCache():
  Promise<Song[] | null> {

  /*
   * 1. Primero memoria RAM.
   */
  if (
    isCacheFresh(
      memoryCache
    )
  ) {
    return memoryCache!.songs;
  }


  /*
   * 2. Después almacenamiento persistente.
   */
  try {
    const raw =
      await AsyncStorage
        .getItem(
          LIBRARY_CACHE_KEY
        );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(
        raw
      ) as CachedLibrary;

    if (
      !isCacheFresh(
        parsed
      )
    ) {
      return null;
    }

    memoryCache =
      parsed;

    return parsed.songs;

  } catch (error) {
    console.log(
      'Error leyendo caché de biblioteca:',
      error
    );

    return null;
  }
}


function saveLibraryCache(
  songs:
    Song[]
) {
  const cache:
    CachedLibrary = {
      version:
        LIBRARY_CACHE_VERSION,

      savedAt:
        Date.now(),

      songs,
    };


  /*
   * Guardamos inmediatamente en memoria.
   */
  memoryCache =
    cache;


  /*
   * No bloqueamos la interfaz esperando AsyncStorage.
   * La biblioteca ya puede mostrarse mientras se guarda.
   */
  void AsyncStorage
    .setItem(
      LIBRARY_CACHE_KEY,
      JSON.stringify(
        cache
      )
    )
    .catch(
      error => {
        console.log(
          'Error guardando caché de biblioteca:',
          error
        );
      }
    );
}


/*
 * Para un botón futuro de:
 *
 * "Actualizar biblioteca"
 *
 * se puede hacer:
 *
 * await clearLocalSongsCache();
 * const songs = await getLocalSongs({
 *   forceRefresh: true,
 * });
 */
export async function clearLocalSongsCache() {
  memoryCache =
    null;

  await AsyncStorage
    .removeItem(
      LIBRARY_CACHE_KEY
    );
}


/* =========================================================
   NORMALIZAR CONTENT URI
========================================================= */

function normalizeContentUri(
  uri?:
    string | null
) {
  return (uri ?? '')
    .trim()
    .toLowerCase();
}


/* =========================================================
   NORMALIZAR RUTA DE CARPETA
========================================================= */

function normalizeFolderPath(
  path?:
    string | null
) {
  const clean =
    (path ?? '')
      .replace(
        /\\/g,
        '/'
      )
      .replace(
        /^\/+/,
        ''
      )
      .replace(
        /\/+$/,
        ''
      )
      .trim();

  return clean ||
    'Otros';
}


/* =========================================================
   PERMISOS
========================================================= */

async function ensureMusicPermission() {
  /*
   * Primero consultamos el estado actual.
   * Si ya está concedido no necesitamos volver a pedirlo.
   */
  const currentPermission =
    await MediaLibrary
      .getPermissionsAsync(
        false,
        ['audio']
      );


  if (
    currentPermission.granted
  ) {
    return;
  }


  const permission =
    await MediaLibrary
      .requestPermissionsAsync(
        false,
        ['audio']
      );


  if (
    !permission.granted
  ) {
    throw new MusicPermissionError();
  }
}


/* =========================================================
   OBTENER UBICACIONES DESDE ANDROID MEDIASTORE
========================================================= */

async function getAndroidLocations():
  Promise<AndroidAudioLocation[]> {

  if (
    Platform.OS !==
    'android'
  ) {
    return [];
  }


  try {
    const locations =
      await HmusicMediaStore
        .getAudioLocationsAsync();


    /*
     * Normalmente cada contentUri es único.
     * Usamos Map para eliminar duplicados en O(n).
     */
    const unique =
      new Map<
        string,
        AndroidAudioLocation
      >();


    for (
      const location
      of locations
    ) {
      const normalizedUri =
        normalizeContentUri(
          location.contentUri
        );


      const key =
        normalizedUri ||
        `${location.volumeName}:${location.id}`;


      unique.set(
        key,
        location
      );
    }


    return Array.from(
      unique.values()
    );

  } catch (error) {
    /*
     * Si nuestro módulo nativo falla,
     * Hmusic todavía debe cargar canciones.
     */
    console.log(
      'Error obteniendo carpetas automáticas:',
      error
    );


    return [];
  }
}


/* =========================================================
   OBTENER TRACKS PAGINADOS
========================================================= */

async function getAllTracks() {
  const tracks:
    any[] =
    [];


  let cursor:
    string | undefined;


  /*
   * 500 mantiene un equilibrio entre consumo de memoria
   * y cantidad de llamadas al bridge.
   *
   * Con 2000 canciones son aproximadamente 4 páginas.
   */
  while (true) {
    const result =
      await getTracksAsync({
        first:
          500,

        after:
          cursor,

        sortBy: [
          'title',
          true,
        ],
      });


    tracks.push(
      ...result.items
    );


    if (
      !result.hasNextPage ||
      !result.endCursor
    ) {
      break;
    }


    cursor =
      result.endCursor;
  }


  return tracks;
}


/* =========================================================
   CONVERTIR TRACKS A SONG
========================================================= */

function buildSongs(
  tracks:
    any[],

  locations:
    AndroidAudioLocation[]
):
  Song[] {

  /*
   * Mapas de búsqueda O(1).
   *
   * Esto es especialmente importante con bibliotecas grandes:
   * evitamos hacer .find() sobre miles de ubicaciones por
   * cada canción.
   */
  const locationByUri =
    new Map<
      string,
      AndroidAudioLocation
    >();


  const locationById =
    new Map<
      string,
      AndroidAudioLocation
    >();


  for (
    const location
    of locations
  ) {
    const uri =
      normalizeContentUri(
        location.contentUri
      );


    if (uri) {
      locationByUri.set(
        uri,
        location
      );
    }


    if (
      !locationById.has(
        location.id
      )
    ) {
      locationById.set(
        location.id,
        location
      );
    }
  }


  const songs:
    Song[] =
    new Array(
      tracks.length
    );


  /*
   * Usamos un bucle simple para reducir callbacks y
   * objetos temporales al procesar miles de canciones.
   */
  for (
    let index = 0;
    index < tracks.length;
    index += 1
  ) {
    const track =
      tracks[index];


    const trackUrl =
      String(
        track.url ?? ''
      );


    const originalContentUri =
      track.contentUri ??
      (
        trackUrl.startsWith(
          'content://'
        )
          ? track.url
          : undefined
      );


    const locationByContentUri =
      locationByUri.get(
        normalizeContentUri(
          originalContentUri
        )
      );


    const locationByTrackId =
      locationById.get(
        String(
          track.id
        )
      );


    const location =
      locationByContentUri ??
      locationByTrackId;


    const finalContentUri =
      originalContentUri ??
      location?.contentUri ??
      undefined;


    songs[index] = {
      id:
        String(
          track.id
        ),

      title:
        normalizeMetadata(
          track.title,
          `Canción ${index + 1}`
        ),

      artist:
        normalizeMetadata(
          track.artist,
          'Artista desconocido'
        ),

      album:
        normalizeMetadata(
          track.album,
          'Álbum desconocido'
        ),

      duration:
        Number(
          track.duration
        ) || 0,

      /*
       * URI utilizada por expo-audio.
       */
      uri:
        track.url,

      artwork:
        track.artwork ??
        null,

      /*
       * URI nativa Android.
       */
      contentUri:
        finalContentUri,

      createdAt:
        track.createdAt ??
        null,

      modifiedAt:
        track.modifiedAt ??
        null,

      fileSize:
        Number(
          track.fileSize
        ) || 0,

      folderPath:
        normalizeFolderPath(
          location?.folderPath
        ),

      fileName:
        location?.displayName ??
        undefined,

      volumeName:
        location?.volumeName ??
        undefined,
    };
  }


  return uniqueSongs(
    songs
  );
}


/* =========================================================
   ESCANEAR BIBLIOTECA REAL
========================================================= */

async function scanLocalSongs():
  Promise<Song[]> {

  /*
   * Ejecutamos ambos trabajos costosos en paralelo:
   *
   * - librería musical
   * - MediaStore nativo
   */
  const [
    tracks,
    locations,
  ] =
    await Promise.all([
      getAllTracks(),
      getAndroidLocations(),
    ]);


  const songs =
    buildSongs(
      tracks,
      locations
    );


  saveLibraryCache(
    songs
  );


  return songs;
}


/* =========================================================
   OBTENER TODAS LAS CANCIONES LOCALES
========================================================= */

export async function getLocalSongs(
  options:
    GetLocalSongsOptions = {}
):
  Promise<Song[]> {

  await ensureMusicPermission();


  /*
   * Apertura rápida:
   *
   * Si existe caché reciente, devolvemos las canciones
   * procesadas inmediatamente sin escanear las ~2000 de nuevo.
   */
  if (
    !options.forceRefresh
  ) {
    const cached =
      await readLibraryCache();

    if (cached) {
      return cached;
    }
  }


  /*
   * Evita dos escaneos simultáneos.
   */
  if (
    activeScan
  ) {
    return activeScan;
  }


  activeScan =
    scanLocalSongs();


  try {
    return await activeScan;

  } finally {
    activeScan =
      null;
  }
}


/* =========================================================
   OBTENER INFORMACIÓN DETALLADA DE UNA CANCIÓN
========================================================= */

export async function getSongDetails(
  songId:
    string
):
  Promise<TrackDetails> {

  return await getTrackMetadataAsync(
    songId
  ) as TrackDetails;
}
