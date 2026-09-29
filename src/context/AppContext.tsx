import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';


import {
  useFavorites,
} from '../hooks/useFavorites';


import {
  useListeningStats,
} from '../hooks/useListeningStats';


import {
  useMusicLibrary,
} from '../hooks/useMusicLibrary';


import {
  useMusicPlayer,
} from '../hooks/useMusicPlayer';


import {
  usePlaylists,
} from '../hooks/usePlaylists';


import {
  useSettings,
} from '../hooks/useSettings';


import {
  useSleepTimer,
} from '../hooks/useSleepTimer';


import {
  sortSongs,
} from '../utils/music';


import {
  publishPlayerProgress,
  usePlayerProgressStore,
} from './PlayerProgressStore';


type LibraryHook =
  ReturnType<
    typeof useMusicLibrary
  >;


type FavoritesHook =
  ReturnType<
    typeof useFavorites
  >;


type PlaylistsHook =
  ReturnType<
    typeof usePlaylists
  >;


type StatsHook =
  ReturnType<
    typeof useListeningStats
  >;


type SettingsHook =
  ReturnType<
    typeof useSettings
  >;


type FullPlayer =
  ReturnType<
    typeof useMusicPlayer
  >;


type SleepTimer =
  ReturnType<
    typeof useSleepTimer
  >;


type PlayerCore =
  Omit<
    FullPlayer,
    'currentTime' |
    'duration'
  >;


interface AppContextType {
  library:
    LibraryHook;

  favorites:
    FavoritesHook;

  playlists:
    PlaylistsHook;

  stats:
    StatsHook;

  settings:
    SettingsHook;

  player:
    PlayerCore;

  sleepTimer:
    SleepTimer;
}



const AppContext =
  createContext<
    AppContextType | null
  >(null);



export function AppProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const rawLibrary =
    useMusicLibrary();


  const rawFavorites =
    useFavorites();


  const rawPlaylists =
    usePlaylists();


  const rawStats =
    useListeningStats();


  const rawSettings =
    useSettings();


  const visibleSongs =
    useMemo(
      () => {
        const filtered =
          rawLibrary.songs
            .filter(
              song =>
                song.duration >=
                rawSettings
                  .settings
                  .minDuration
            );


        return sortSongs(
          filtered,

          rawSettings
            .settings
            .sortKey,

          rawSettings
            .settings
            .sortAscending
        );
      },
      [
        rawLibrary.songs,

        rawSettings
          .settings
          .minDuration,

        rawSettings
          .settings
          .sortKey,

        rawSettings
          .settings
          .sortAscending,
      ]
    );


  const playerFull =
    useMusicPlayer(
      visibleSongs,

      rawSettings
        .settings
        .resumeLastSong
    );


  /*
   * =========================================================
   * FACHADA ESTABLE DEL REPRODUCTOR
   * =========================================================
   *
   * useMusicPlayer recibe actualizaciones frecuentes de
   * el reproductor (por ejemplo currentTime cada ~250 ms).
   *
   * Algunas funciones internas pueden recrearse durante esas
   * actualizaciones aunque su comportamiento sea el mismo.
   * Si exponemos esas referencias directamente por AppContext,
   * pantallas grandes como Home reciben un nuevo "player" y
   * React Native vuelve a actualizar sus VirtualizedList.
   *
   * Guardamos el reproductor más reciente en un ref y exponemos
   * callbacks ESTABLES. Así el AppContext solo cambia cuando
   * cambia estado real del reproductor:
   * canción, cola, índice, playing, shuffle o repeat.
   */

  const playerFullRef =
    useRef(
      playerFull
    );

  playerFullRef.current =
    playerFull;


  const playSong =
    useCallback<
      FullPlayer['playSong']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .playSong(
            ...args
          ),
      []
    );


  const playAll =
    useCallback<
      FullPlayer['playAll']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .playAll(
            ...args
          ),
      []
    );


  const pause =
    useCallback<
      FullPlayer['pause']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .pause(
            ...args
          ),
      []
    );


  const togglePlayPause =
    useCallback<
      FullPlayer['togglePlayPause']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .togglePlayPause(
            ...args
          ),
      []
    );


  const next =
    useCallback<
      FullPlayer['next']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .next(
            ...args
          ),
      []
    );


  const previous =
    useCallback<
      FullPlayer['previous']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .previous(
            ...args
          ),
      []
    );


  const seekTo =
    useCallback<
      FullPlayer['seekTo']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .seekTo(
            ...args
          ),
      []
    );


  const toggleShuffle =
    useCallback<
      FullPlayer['toggleShuffle']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .toggleShuffle(
            ...args
          ),
      []
    );


  const cycleRepeatMode =
    useCallback<
      FullPlayer['cycleRepeatMode']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .cycleRepeatMode(
            ...args
          ),
      []
    );


  const playNext =
    useCallback<
      FullPlayer['playNext']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .playNext(
            ...args
          ),
      []
    );


  const addToQueue =
    useCallback<
      FullPlayer['addToQueue']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .addToQueue(
            ...args
          ),
      []
    );


  const removeFromQueue =
    useCallback<
      FullPlayer['removeFromQueue']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .removeFromQueue(
            ...args
          ),
      []
    );


  const moveQueueItem =
    useCallback<
      FullPlayer['moveQueueItem']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .moveQueueItem(
            ...args
          ),
      []
    );


  const clearQueue =
    useCallback<
      FullPlayer['clearQueue']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .clearQueue(
            ...args
          ),
      []
    );


  const getEqualizerInfo =
    useCallback<
      FullPlayer['getEqualizerInfo']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .getEqualizerInfo(
            ...args
          ),
      []
    );


  const setEqualizerEnabled =
    useCallback<
      FullPlayer['setEqualizerEnabled']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .setEqualizerEnabled(
            ...args
          ),
      []
    );


  const setEqualizerBandLevel =
    useCallback<
      FullPlayer['setEqualizerBandLevel']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .setEqualizerBandLevel(
            ...args
          ),
      []
    );


  const setEqualizerLevels =
    useCallback<
      FullPlayer['setEqualizerLevels']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .setEqualizerLevels(
            ...args
          ),
      []
    );


  const resetEqualizer =
    useCallback<
      FullPlayer['resetEqualizer']
    >(
      (
        ...args
      ) =>
        playerFullRef
          .current
          .resetEqualizer(
            ...args
          ),
      []
    );


  /*
   * El temporizador recibe también una función pause estable.
   * Así useSleepTimer no se reconstruye por cambios rápidos
   * del estado del reproductor.
   */
  const rawSleepTimer =
    useSleepTimer(
      pause
    );


  const lastRegistered =
    useRef<
      string | null
    >(null);


  useEffect(
    () => {
      const id =
        playerFull
          .currentSong
          ?.id ??
        null;


      if (
        !id ||
        id ===
          lastRegistered
            .current
      ) {
        return;
      }


      lastRegistered.current =
        id;


      rawStats.registerPlay(
        id
      );
    },
    [
      playerFull
        .currentSong
        ?.id,

      rawStats
        .registerPlay,
    ]
  );


  const library =
    useMemo(
      () => ({
        ...rawLibrary,

        songs:
          visibleSongs,
      }),
      [
        rawLibrary.songs,
        rawLibrary.loading,
        rawLibrary.error,
        rawLibrary.refresh,
        visibleSongs,
      ]
    );


  const favorites =
    useMemo(
      () => ({
        favorites:
          rawFavorites
            .favorites,

        isFavorite:
          rawFavorites
            .isFavorite,

        toggleFavorite:
          rawFavorites
            .toggleFavorite,
      }),
      [
        rawFavorites
          .favorites,

        rawFavorites
          .isFavorite,

        rawFavorites
          .toggleFavorite,
      ]
    );


  const playlists =
    useMemo(
      () => ({
        playlists:
          rawPlaylists
            .playlists,

        createPlaylist:
          rawPlaylists
            .createPlaylist,

        renamePlaylist:
          rawPlaylists
            .renamePlaylist,

        deletePlaylist:
          rawPlaylists
            .deletePlaylist,

        addSong:
          rawPlaylists
            .addSong,

        addSongs:
          rawPlaylists
            .addSongs,

        removeSong:
          rawPlaylists
            .removeSong,

        moveSong:
          rawPlaylists
            .moveSong,

        clearPlaylist:
          rawPlaylists
            .clearPlaylist,
      }),
      [
        rawPlaylists
          .playlists,

        rawPlaylists
          .createPlaylist,

        rawPlaylists
          .renamePlaylist,

        rawPlaylists
          .deletePlaylist,

        rawPlaylists
          .addSong,

        rawPlaylists
          .addSongs,

        rawPlaylists
          .removeSong,

        rawPlaylists
          .moveSong,

        rawPlaylists
          .clearPlaylist,
      ]
    );


  const stats =
    useMemo(
      () => ({
        recentIds:
          rawStats
            .recentIds,

        playCounts:
          rawStats
            .playCounts,

        registerPlay:
          rawStats
            .registerPlay,

        clearHistory:
          rawStats
            .clearHistory,
      }),
      [
        rawStats
          .recentIds,

        rawStats
          .playCounts,

        rawStats
          .registerPlay,

        rawStats
          .clearHistory,
      ]
    );


  const settings =
    useMemo(
      () => ({
        settings:
          rawSettings
            .settings,

        updateSettings:
          rawSettings
            .updateSettings,
      }),
      [
        rawSettings
          .settings,

        rawSettings
          .updateSettings,
      ]
    );


  const sleepTimer =
    useMemo(
      () => ({
        endsAt:
          rawSleepTimer
            .endsAt,

        start:
          rawSleepTimer
            .start,

        cancel:
          rawSleepTimer
            .cancel,
      }),
      [
        rawSleepTimer
          .endsAt,

        rawSleepTimer
          .start,

        rawSleepTimer
          .cancel,
      ]
    );


  /*
   * Solo incluimos estado lento + callbacks estables.
   * currentTime y duration continúan exclusivamente en
   * ProgressContext.
   */
  const player =
    useMemo<
      PlayerCore
    >(
      () => ({
        currentSong:
          playerFull.currentSong,

        queue:
          playerFull.queue,

        currentIndex:
          playerFull.currentIndex,

        isPlaying:
          playerFull.isPlaying,

        shuffle:
          playerFull.shuffle,

        repeatMode:
          playerFull.repeatMode,

        playSong,

        playAll,

        pause,

        togglePlayPause,

        next,

        previous,

        seekTo,

        toggleShuffle,

        cycleRepeatMode,

        playNext,

        addToQueue,

        removeFromQueue,

        moveQueueItem,

        clearQueue,

        getEqualizerInfo,

        setEqualizerEnabled,

        setEqualizerBandLevel,

        setEqualizerLevels,

        resetEqualizer,
      }),
      [
        playerFull.currentSong,
        playerFull.queue,
        playerFull.currentIndex,
        playerFull.isPlaying,
        playerFull.shuffle,
        playerFull.repeatMode,

        playSong,
        playAll,
        pause,
        togglePlayPause,
        next,
        previous,
        seekTo,
        toggleShuffle,
        cycleRepeatMode,
        playNext,
        addToQueue,
        removeFromQueue,
        moveQueueItem,
        clearQueue,
        getEqualizerInfo,
        setEqualizerEnabled,
        setEqualizerBandLevel,
        setEqualizerLevels,
        resetEqualizer,
      ]
    );


  const value =
    useMemo<
      AppContextType
    >(
      () => ({
        library,

        favorites,

        playlists,

        stats,

        settings,

        player,

        sleepTimer,
      }),
      [
        library,
        favorites,
        playlists,
        stats,
        settings,
        player,
        sleepTimer,
      ]
    );


  /*
   * El progreso rápido NO viaja por AppContext.
   *
   * el reproductor actualiza currentTime aproximadamente... cada 250 ms.
   * Publicamos esos cambios en un store externo para que solamente
   * MiniPlayer / PlayerModal / Lyrics (los consumidores reales del
   * progreso) se actualicen.
   *
   * De esta forma pantallas con FlatList, como Home, Cola, Álbumes,
   * etc., quedan fuera del ciclo rápido del reproductor.
   */
  useEffect(
    () => {
      publishPlayerProgress(
        playerFull.currentTime,
        playerFull.duration
      );
    },
    [
      playerFull.currentTime,
      playerFull.duration,
    ]
  );


  return (
    <AppContext.Provider
      value={
        value
      }
    >
      {children}
    </AppContext.Provider>
  );
}


export function useApp() {
  const value =
    useContext(
      AppContext
    );


  if (!value) {
    throw new Error(
      'useApp debe utilizarse dentro de AppProvider.'
    );
  }


  return value;
}


export function usePlayerProgress() {
  return usePlayerProgressStore();
}
