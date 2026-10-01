import AsyncStorage from "@react-native-async-storage/async-storage";
import TrackPlayer, {
  RepeatMode as TrackRepeatMode,
  useActiveMediaItem,
  useIsPlaying,
  useProgress,
} from "@rntp/player";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RepeatMode, Song } from "../types/Song";

import { uniqueSongs } from "../utils/music";

import { setupTrackPlayer } from "../services/trackPlayerSetup";

import HmusicEqualizer from "../../modules/hmusic-equalizer";

export type {
  HmusicEqualizerBand,
  HmusicEqualizerInfo,
} from "../../modules/hmusic-equalizer";

import type { HmusicEqualizerInfo } from "../../modules/hmusic-equalizer";

const PLAYER_STATE_KEY = "@musicplayer/player-state";

const MAX_HISTORY_ITEMS = 100;

const PREVIOUS_RESTART_SECONDS = 3;

const SAVE_INTERVAL_SECONDS = 5;

interface SavedPlayerState {
  songId: string | null;

  position: number;

  queueIds: string[];

  historyIds?: string[];

  shuffle: boolean;

  repeatMode: RepeatMode;
}

function isRepeatMode(value: unknown): value is RepeatMode {
  return value === "off" || value === "all" || value === "one";
}

function safePosition(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function songToMediaItem(song: Song) {
  return {
    mediaId: song.id,

    url: song.contentUri || song.uri,

    title: song.title,

    artist: song.artist,

    albumTitle: song.album,

    duration: song.duration,

    ...(song.artwork
      ? {
          artworkUrl: song.artwork,
        }
      : {}),

    extras: {
      songId: song.id,
    },
  };
}

export function useMusicPlayer(
  songs: Song[],

  resumeLastSong: boolean
) {
  const isPlaying = useIsPlaying();

  const progress = useProgress(0.25);

  const activeMediaItem = useActiveMediaItem();

  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  const [queue, setQueue] = useState<Song[]>([]);

  const [shuffle, setShuffle] = useState(false);

  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  const restored = useRef(false);

  const lastSavedBucket = useRef(-1);

  const historyRef = useRef<string[]>([]);

  const currentTimeRef = useRef(0);

  currentTimeRef.current = progress.position || 0;

  /* =========================================================
     COLA ACTIVA
  ========================================================= */

  const activeQueue = useMemo(
    () => (queue.length > 0 ? queue : songs),
    [queue, songs]
  );

  /*
   * Guardamos la cola más reciente en un ref.
   *
   * IMPORTANTE:
   * La sincronización con RNTP no debe depender directamente
   * de activeQueue. Cuando reconstruimos la cola, React actualiza
   * activeQueue antes de que RNTP termine de actualizar
   * activeMediaItem. Si el efecto se dispara en ese intervalo,
   * puede restaurar temporalmente la canción anterior.
   */
  const activeQueueRef = useRef<Song[]>(activeQueue);

  activeQueueRef.current = activeQueue;

  const currentIndex = useMemo(
    () =>
      currentSong
        ? activeQueue.findIndex((song) => song.id === currentSong.id)
        : -1,
    [currentSong, activeQueue]
  );

  const buildQueueForSong = useCallback(
    (
      song: Song,

      sourceQueue?: Song[]
    ) => {
      const base =
        sourceQueue && sourceQueue.length > 0
          ? uniqueSongs(sourceQueue)
          : activeQueue.length > 0
          ? uniqueSongs(activeQueue)
          : uniqueSongs(songs);

      if (base.some((item) => item.id === song.id)) {
        return base;
      }

      return uniqueSongs([song, ...base]);
    },
    [activeQueue, songs]
  );

  const pushHistory = useCallback((songId: string) => {
    historyRef.current = [...historyRef.current, songId].slice(
      -MAX_HISTORY_ITEMS
    );
  }, []);

  /* =========================================================
     SINCRONIZAR CANCIÓN ACTIVA DESDE RNTP

     Esto permite que Next/Previous desde notificación, lockscreen
     o audífonos también actualicen la interfaz.

     IMPORTANTE:
     NO dependemos de activeQueue.

     Al reproducir una canción hacemos:
       1. setQueue(...)
       2. setCurrentSong(...)
       3. TrackPlayer.setMediaItems(...)

     React puede aplicar 1 y 2 antes de que RNTP termine el paso 3.
     Si este efecto dependiera de activeQueue, se ejecutaría con el
     mediaId NATIVO anterior y haría el salto visual:
       nueva -> anterior -> nueva

     La cola actual se consulta por ref, sin usarla como disparador.
  ========================================================= */

  useEffect(() => {
    const mediaId = activeMediaItem?.mediaId;

    if (!mediaId) {
      return;
    }

    const song =
      activeQueueRef.current.find((item) => item.id === mediaId) ||
      songs.find((item) => item.id === mediaId);

    if (!song) {
      return;
    }

    setCurrentSong((current) => {
      if (current?.id === song.id) {
        return current;
      }

      if (current) {
        pushHistory(current.id);
      }

      return song;
    });
  }, [activeMediaItem?.mediaId, songs, pushHistory]);

  /* =========================================================
     PERSISTENCIA
  ========================================================= */

  const persist = useCallback(
    async (position: number) => {
      try {
        const data: SavedPlayerState = {
          songId: currentSong?.id ?? null,

          position: safePosition(position),

          queueIds: activeQueue.map((song) => song.id),

          historyIds: historyRef.current.slice(-MAX_HISTORY_ITEMS),

          shuffle,

          repeatMode,
        };

        await AsyncStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(data));
      } catch (error) {
        console.log("Error guardando estado del reproductor:", error);
      }
    },
    [currentSong, activeQueue, shuffle, repeatMode]
  );

  /* =========================================================
     RESTAURAR ÚLTIMA SESIÓN
  ========================================================= */

  useEffect(() => {
    if (!resumeLastSong || restored.current || songs.length === 0) {
      return;
    }

    restored.current = true;

    void (async () => {
      try {
        await setupTrackPlayer();

        const raw = await AsyncStorage.getItem(PLAYER_STATE_KEY);

        if (!raw) {
          return;
        }

        const saved = JSON.parse(raw) as Partial<SavedPlayerState>;

        const map = new Map(songs.map((song) => [song.id, song]));

        const restoredQueue = (
          Array.isArray(saved.queueIds) ? saved.queueIds : []
        )
          .map((id) => (typeof id === "string" ? map.get(id) : undefined))
          .filter(Boolean) as Song[];

        const song =
          typeof saved.songId === "string" ? map.get(saved.songId) : undefined;

        historyRef.current = (
          Array.isArray(saved.historyIds) ? saved.historyIds : []
        )
          .filter((id): id is string => typeof id === "string" && map.has(id))
          .slice(-MAX_HISTORY_ITEMS);

        const restoredRepeatMode: RepeatMode = isRepeatMode(saved.repeatMode)
          ? saved.repeatMode
          : "off";

        setRepeatMode(restoredRepeatMode);

        TrackPlayer.setRepeatMode(
          restoredRepeatMode === "one"
            ? TrackRepeatMode.One
            : restoredRepeatMode === "all"
            ? TrackRepeatMode.All
            : TrackRepeatMode.Off
        );

        const restoredShuffle = Boolean(saved.shuffle);

        setShuffle(restoredShuffle);

        TrackPlayer.setShuffleEnabled(restoredShuffle);

        if (!song) {
          return;
        }

        const safeQueue =
          restoredQueue.length > 0
            ? uniqueSongs(restoredQueue)
            : uniqueSongs(songs);

        const queueWithSong = safeQueue.some((item) => item.id === song.id)
          ? safeQueue
          : uniqueSongs([song, ...safeQueue]);

        const index = Math.max(
          0,
          queueWithSong.findIndex((item) => item.id === song.id)
        );

        setQueue(queueWithSong);

        setCurrentSong(song);

        TrackPlayer.setMediaItems(queueWithSong.map(songToMediaItem), index);

        const position = safePosition(saved.position);

        if (position > 0) {
          TrackPlayer.seekTo(position);
        }

        /*
         * Restauramos la canción y la posición,
         * pero no reproducimos automáticamente.
         */
      } catch (error) {
        console.log("Error restaurando reproductor:", error);
      }
    })();
  }, [songs, resumeLastSong]);

  /* =========================================================
     GUARDADO PERIÓDICO
  ========================================================= */

  useEffect(() => {
    if (!currentSong) {
      return;
    }

    const currentTime = progress.position || 0;

    const bucket = Math.floor(currentTime / SAVE_INTERVAL_SECONDS);

    if (bucket === lastSavedBucket.current) {
      return;
    }

    lastSavedBucket.current = bucket;

    void persist(currentTime);
  }, [progress.position, currentSong, persist]);

  useEffect(() => {
    if (!currentSong) {
      return;
    }

    void persist(progress.position || 0);
  }, [currentSong?.id, queue, shuffle, repeatMode, persist]);

  /* =========================================================
     CARGAR CANCIÓN
  ========================================================= */

  const loadSong = useCallback(
    async (
      song: Song,

      sourceQueue?: Song[],

      autoPlay = true,

      recordHistory = true
    ) => {
      await setupTrackPlayer();

      const nextQueue = buildQueueForSong(song, sourceQueue);

      if (recordHistory && currentSong && currentSong.id !== song.id) {
        pushHistory(currentSong.id);
      }

      const index = Math.max(
        0,
        nextQueue.findIndex((item) => item.id === song.id)
      );

      setQueue(nextQueue);

      setCurrentSong(song);

      lastSavedBucket.current = -1;

      TrackPlayer.setMediaItems(nextQueue.map(songToMediaItem), index);

      if (autoPlay) {
        TrackPlayer.play();
      }
    },
    [buildQueueForSong, currentSong, pushHistory]
  );

  /* =========================================================
     PLAY SONG
  ========================================================= */

  const playSong = useCallback(
    async (
      song: Song,

      sourceQueue?: Song[]
    ) => {
      await setupTrackPlayer();

      if (currentSong?.id === song.id) {
        if (sourceQueue && sourceQueue.length > 0) {
          const nextQueue = buildQueueForSong(song, sourceQueue);

          const currentPosition = progress.position || 0;

          const index = Math.max(
            0,
            nextQueue.findIndex((item) => item.id === song.id)
          );

          setQueue(nextQueue);

          TrackPlayer.setMediaItems(nextQueue.map(songToMediaItem), index);

          if (currentPosition > 0) {
            TrackPlayer.seekTo(currentPosition);
          }
        }

        if (isPlaying) {
          TrackPlayer.pause();
        } else {
          TrackPlayer.play();
        }

        return;
      }

      await loadSong(song, sourceQueue, true);
    },
    [currentSong, isPlaying, loadSong, buildQueueForSong, progress.position]
  );

  /* =========================================================
     PLAY ALL
  ========================================================= */

  const playAll = useCallback(
    async (
      sourceQueue: Song[],

      startIndex = 0
    ) => {
      await setupTrackPlayer();

      const cleanQueue = uniqueSongs(sourceQueue);

      if (cleanQueue.length === 0) {
        return;
      }

      const index = Math.max(0, Math.min(startIndex, cleanQueue.length - 1));

      setQueue(cleanQueue);

      setCurrentSong(cleanQueue[index]);

      lastSavedBucket.current = -1;

      TrackPlayer.setMediaItems(cleanQueue.map(songToMediaItem), index);

      TrackPlayer.play();
    },
    []
  );

  /* =========================================================
     PLAY / PAUSE
  ========================================================= */

  const pause = useCallback(async () => {
    await setupTrackPlayer();

    TrackPlayer.pause();
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!currentSong) {
      return;
    }

    await setupTrackPlayer();

    if (isPlaying) {
      TrackPlayer.pause();
    } else {
      TrackPlayer.play();
    }
  }, [currentSong, isPlaying]);

  /* =========================================================
     SIGUIENTE
     RNTP controla el orden nativo. Si shuffle está activo,
     RNTP elige la siguiente pista de su cola aleatoria.
  ========================================================= */

  const next = useCallback(async () => {
    if (!currentSong || activeQueue.length === 0) {
      return;
    }

    await setupTrackPlayer();

    try {
      TrackPlayer.skipToNext();

      TrackPlayer.play();
    } catch (error) {
      /*
       * Si estamos al final y repeat está apagado,
       * no forzamos un salto manual.
       */
      console.log("No hay siguiente canción:", error);
    }
  }, [currentSong, activeQueue.length]);

  /* =========================================================
     ANTERIOR
     Si la canción ya avanzó más de 3 segundos, vuelve al inicio.
     Si no, RNTP retrocede en su propia cola (incluido shuffle).
  ========================================================= */

  const previous = useCallback(async () => {
    if (!currentSong || activeQueue.length === 0) {
      return;
    }

    await setupTrackPlayer();

    if (currentTimeRef.current > PREVIOUS_RESTART_SECONDS) {
      TrackPlayer.seekTo(0);

      return;
    }

    try {
      TrackPlayer.skipToPrevious();

      TrackPlayer.play();
    } catch (error) {
      TrackPlayer.seekTo(0);

      console.log("No hay canción anterior:", error);
    }
  }, [currentSong, activeQueue.length]);

  /* =========================================================
     SEEK
  ========================================================= */

  const seekTo = useCallback(
    async (seconds: number) => {
      if (!Number.isFinite(seconds)) {
        return;
      }

      await setupTrackPlayer();

      const max =
        (progress.duration || currentSong?.duration || 0) > 0
          ? progress.duration || currentSong?.duration || 0
          : Number.POSITIVE_INFINITY;

      const target = Math.min(Math.max(0, seconds), max);

      TrackPlayer.seekTo(target);
    },
    [progress.duration, currentSong?.duration]
  );

  /* =========================================================
     MODOS: SHUFFLE / REPEAT
  ========================================================= */

  const toggleShuffle = useCallback(async () => {
    await setupTrackPlayer();

    const nextValue = !shuffle;

    TrackPlayer.setShuffleEnabled(nextValue);

    setShuffle(nextValue);
  }, [shuffle]);

  const cycleRepeatMode = useCallback(async () => {
    await setupTrackPlayer();

    const nextMode: RepeatMode =
      repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";

    TrackPlayer.setRepeatMode(
      nextMode === "one"
        ? TrackRepeatMode.One
        : nextMode === "all"
        ? TrackRepeatMode.All
        : TrackRepeatMode.Off
    );

    setRepeatMode(nextMode);
  }, [repeatMode]);

  /* =========================================================
     REPRODUCIR DESPUÉS
  ========================================================= */

  const playNext = useCallback(
    async (song: Song) => {
      const base = activeQueue.length > 0 ? [...activeQueue] : [...songs];

      const filtered = base.filter((item) => item.id !== song.id);

      const index = currentSong
        ? filtered.findIndex((item) => item.id === currentSong.id)
        : -1;

      const insertIndex = Math.max(0, index + 1);

      filtered.splice(insertIndex, 0, song);

      const nextQueue = uniqueSongs(filtered);

      setQueue(nextQueue);

      if (currentSong) {
        await setupTrackPlayer();

        const nativeQueue = TrackPlayer.getQueue();

        const alreadyIndex = nativeQueue.findIndex(
          (item) => item.mediaId === song.id
        );

        if (alreadyIndex >= 0) {
          TrackPlayer.removeMediaItem(alreadyIndex);
        }

        const activeIndex = TrackPlayer.getActiveMediaItemIndex();

        TrackPlayer.insertMediaItem(
          Math.max(0, (activeIndex ?? 0) + 1),
          songToMediaItem(song)
        );
      }
    },
    [activeQueue, songs, currentSong]
  );

  /* =========================================================
     AÑADIR A COLA
  ========================================================= */

  const addToQueue = useCallback(
    async (song: Song) => {
      const base = queue.length > 0 ? queue : activeQueue;

      if (base.some((item) => item.id === song.id)) {
        return;
      }

      setQueue(uniqueSongs([...base, song]));

      if (currentSong) {
        await setupTrackPlayer();

        TrackPlayer.addMediaItem(songToMediaItem(song));
      }
    },
    [queue, activeQueue, currentSong]
  );

  /* =========================================================
     QUITAR DE COLA
  ========================================================= */

  const removeFromQueue = useCallback(
    async (songId: string) => {
      if (currentSong?.id === songId) {
        return;
      }

      const base = queue.length > 0 ? queue : activeQueue;

      const index = base.findIndex((item) => item.id === songId);

      if (index < 0) {
        return;
      }

      setQueue(base.filter((item) => item.id !== songId));

      if (currentSong) {
        await setupTrackPlayer();

        const nativeQueue = TrackPlayer.getQueue();

        const nativeIndex = nativeQueue.findIndex(
          (item) => item.mediaId === songId
        );

        if (nativeIndex >= 0) {
          TrackPlayer.removeMediaItem(nativeIndex);
        }
      }
    },
    [currentSong, queue, activeQueue]
  );

  /* =========================================================
     MOVER EN COLA
  ========================================================= */

  const moveQueueItem = useCallback(
    async (
      from: number,

      to: number
    ) => {
      const base = queue.length > 0 ? [...queue] : [...activeQueue];

      if (
        from < 0 ||
        to < 0 ||
        from >= base.length ||
        to >= base.length ||
        from === to
      ) {
        return;
      }

      const [moved] = base.splice(from, 1);

      if (!moved) {
        return;
      }

      base.splice(to, 0, moved);

      setQueue(base);

      if (currentSong) {
        await setupTrackPlayer();

        TrackPlayer.moveMediaItem(from, to);
      }
    },
    [queue, activeQueue, currentSong]
  );

  /* =========================================================
     LIMPIAR COLA
  ========================================================= */

  const clearQueue = useCallback(async () => {
    setQueue(currentSong ? [currentSong] : []);

    if (!currentSong) {
      await setupTrackPlayer();

      TrackPlayer.clear();

      return;
    }

    await setupTrackPlayer();

    const nativeQueue = TrackPlayer.getQueue();

    const activeIndex = TrackPlayer.getActiveMediaItemIndex();

    /*
     * Quitamos todas las canciones excepto la activa,
     * empezando desde el final para no desplazar índices.
     */
    for (let index = nativeQueue.length - 1; index >= 0; index -= 1) {
      if (index !== activeIndex) {
        TrackPlayer.removeMediaItem(index);
      }
    }
  }, [currentSong]);

  /* =========================================================
     ECUALIZADOR NATIVO
  ========================================================= */

  const getEqualizerInfo =
    useCallback(async (): Promise<HmusicEqualizerInfo> => {
      return await HmusicEqualizer.getEqualizerInfoAsync();
    }, []);

  const setEqualizerEnabled = useCallback(
    async (enabled: boolean): Promise<HmusicEqualizerInfo> => {
      return await HmusicEqualizer.setEqualizerEnabledAsync(enabled);
    },
    []
  );

  const setEqualizerBandLevel = useCallback(
    async (
      bandIndex: number,

      levelMb: number
    ): Promise<HmusicEqualizerInfo> => {
      return await HmusicEqualizer.setEqualizerBandLevelAsync(
        bandIndex,
        levelMb
      );
    },
    []
  );

  const setEqualizerLevels = useCallback(
    async (levelsMb: number[]): Promise<HmusicEqualizerInfo> => {
      return await HmusicEqualizer.setEqualizerLevelsAsync(levelsMb);
    },
    []
  );

  const resetEqualizer = useCallback(async (): Promise<HmusicEqualizerInfo> => {
    return await HmusicEqualizer.resetEqualizerAsync();
  }, []);

  return {
    currentSong,

    queue: activeQueue,

    currentIndex,

    isPlaying,

    currentTime: progress.position || 0,

    duration: progress.duration || currentSong?.duration || 0,

    shuffle,

    repeatMode,

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
  };
}
