import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

import {
  requireNativeModule,
} from 'expo-modules-core';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  RepeatMode,
  Song,
} from '../types/Song';

import {
  uniqueSongs,
} from '../utils/music';

import {
  getLockScreenArtworkUrl,
} from '../services/lockScreenArtwork';


const PLAYER_STATE_KEY =
  '@musicplayer/player-state';

const EQUALIZER_STATE_KEY =
  '@hmusic/equalizer-state-v1';

const MAX_HISTORY_ITEMS =
  100;

const PREVIOUS_RESTART_SECONDS =
  3;

const SAVE_INTERVAL_SECONDS =
  5;


interface SavedPlayerState {
  songId:
    string | null;

  position:
    number;

  queueIds:
    string[];

  historyIds?:
    string[];

  shuffle:
    boolean;

  repeatMode:
    RepeatMode;
}


type RemoteSubscription = {
  remove:
    () => void;
};


type HmusicRemoteAudioPlayer = {
  setActiveForLockScreen:
    (
      active:
        boolean,

      metadata?: {
        title?:
          string;

        artist?:
          string;

        albumTitle?:
          string;

        artworkUrl?:
          string;
      },

      options?: {
        showSeekForward?:
          boolean;

        showSeekBackward?:
          boolean;

        showNextTrack?:
          boolean;

        showPreviousTrack?:
          boolean;
      }
    ) => void;

  addListener:
    (
      eventName:
        | 'onRemoteNextTrack'
        | 'onRemotePreviousTrack',

      listener:
        () => void
    ) =>
      RemoteSubscription;
};


export interface HmusicEqualizerBand {
  index:
    number;

  centerFrequencyHz:
    number;

  levelMb:
    number;
}


export interface HmusicEqualizerInfo {
  supported:
    boolean;

  enabled:
    boolean;

  audioSessionId:
    number;

  minLevelMb:
    number;

  maxLevelMb:
    number;

  bands:
    HmusicEqualizerBand[];
}


interface SavedEqualizerState {
  enabled:
    boolean;

  levelsMb:
    number[];
}


type HmusicEqualizerNativeModule = {
  hmusicGetEqualizerInfo:
    (
      playerId:
        string
    ) =>
      HmusicEqualizerInfo;

  hmusicSetEqualizerEnabled:
    (
      playerId:
        string,

      enabled:
        boolean
    ) => {
      enabled:
        boolean;
    };

  hmusicSetEqualizerBandLevel:
    (
      playerId:
        string,

      bandIndex:
        number,

      levelMb:
        number
    ) => {
      bandIndex:
        number;

      levelMb:
        number;
    };

  hmusicSetEqualizerLevels:
    (
      playerId:
        string,

      levelsMb:
        number[]
    ) => {
      levelsMb:
        number[];
    };

  hmusicResetEqualizer:
    (
      playerId:
        string
    ) => {
      levelsMb:
        number[];
    };
};


const ExpoAudioEqualizer =
  requireNativeModule<
    HmusicEqualizerNativeModule
  >(
    'ExpoAudio'
  );

  console.log(
    'HMUSIC ExpoAudio keys:',
    Object.keys(
      ExpoAudioEqualizer
    )
  );


function isRepeatMode(
  value:
    unknown
): value is RepeatMode {
  return (
    value === 'off' ||
    value === 'all' ||
    value === 'one'
  );
}


function safePosition(
  value:
    unknown
) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  )
    ? value
    : 0;
}


export function useMusicPlayer(
  songs:
    Song[],

  resumeLastSong:
    boolean
) {
  const player =
    useAudioPlayer(
      null,
      {
        updateInterval:
          250,
      }
    );

  const status =
    useAudioPlayerStatus(
      player
    );


  /*
   * currentTime cambia cada ~250 ms. Lo guardamos en un ref
   * para que callbacks públicos como previous() no cambien de
   * identidad en cada tick y no obliguen a re-renderizar las
   * FlatList grandes a través de AppContext.
   */
  const currentTimeRef =
    useRef(
      0
    );


  currentTimeRef.current =
    status.currentTime ||
    0;

  const [
    currentSong,
    setCurrentSong,
  ] =
    useState<
      Song | null
    >(
      null
    );

  const [
    queue,
    setQueue,
  ] =
    useState<
      Song[]
    >(
      []
    );

  const [
    optimisticPlaying,
    setOptimisticPlaying,
  ] =
    useState(
      false
    );

  const [
    shuffle,
    setShuffle,
  ] =
    useState(
      false
    );

  const [
    repeatMode,
    setRepeatMode,
  ] =
    useState<
      RepeatMode
    >(
      'off'
    );

  const restored =
    useRef(
      false
    );

  const previousFinished =
    useRef(
      false
    );

  const lastSavedBucket =
    useRef(
      -1
    );

  const historyRef =
    useRef<
      string[]
    >(
      []
    );


  const equalizerRestored =
    useRef(
      false
    );


  const equalizerSaveTimer =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(
      null
    );


  /* =========================================================
     AUDIO MODE
  ========================================================= */

  useEffect(
    () => {
      setAudioModeAsync({
        playsInSilentMode:
          true,

        shouldPlayInBackground:
          true,

        interruptionMode:
          'doNotMix',
      }).catch(
        error => {
          console.log(
            'Audio mode:',
            error
          );
        }
      );
    },
    []
  );


  /* =========================================================
     ESTADO REAL DE REPRODUCCIÓN
  ========================================================= */

  useEffect(
    () => {
      setOptimisticPlaying(
        Boolean(
          status.playing
        )
      );
    },
    [
      status.playing,
    ]
  );


  /* =========================================================
     LOCK SCREEN / MEDIA SESSION
  ========================================================= */

  const activateLockScreen =
    useCallback(
      (
        song:
          Song
      ) => {
        void (
          async () => {
            try {
              const remotePlayer =
                player as unknown as
                  HmusicRemoteAudioPlayer;

              const artworkUrl =
                await getLockScreenArtworkUrl(
                  song.artwork,
                  song.id
                );

              remotePlayer
                .setActiveForLockScreen(
                  true,
                  {
                    title:
                      song.title,

                    artist:
                      song.artist,

                    albumTitle:
                      song.album,

                    ...(
                      artworkUrl
                        ? {
                            artworkUrl,
                          }
                        : {}
                    ),
                  },
                  {
                    showSeekForward:
                      false,

                    showSeekBackward:
                      false,

                    showNextTrack:
                      true,

                    showPreviousTrack:
                      true,
                  }
                );
            } catch (
              error
            ) {
              console.log(
                'Lock screen:',
                error
              );
            }
          }
        )();
      },
      [
        player,
      ]
    );


  /* =========================================================
     COLA ACTIVA
  ========================================================= */

  const activeQueue =
    useMemo(
      () =>
        queue.length > 0
          ? queue
          : songs,
      [
        queue,
        songs,
      ]
    );


  const currentIndex =
    useMemo(
      () =>
        currentSong
          ? activeQueue.findIndex(
              song =>
                song.id ===
                currentSong.id
            )
          : -1,
      [
        currentSong,
        activeQueue,
      ]
    );


  const buildQueueForSong =
    useCallback(
      (
        song:
          Song,

        sourceQueue?:
          Song[]
      ) => {
        const base =
          sourceQueue &&
          sourceQueue.length > 0
            ? uniqueSongs(
                sourceQueue
              )
            : activeQueue.length > 0
              ? uniqueSongs(
                  activeQueue
                )
              : uniqueSongs(
                  songs
                );

        if (
          base.some(
            item =>
              item.id ===
              song.id
          )
        ) {
          return base;
        }

        return uniqueSongs([
          song,
          ...base,
        ]);
      },
      [
        activeQueue,
        songs,
      ]
    );


  const pushHistory =
    useCallback(
      (
        songId:
          string
      ) => {
        historyRef.current =
          [
            ...historyRef.current,
            songId,
          ]
            .slice(
              -MAX_HISTORY_ITEMS
            );
      },
      []
    );


  /* =========================================================
     PERSISTENCIA
  ========================================================= */

  const persist =
    useCallback(
      async (
        position:
          number
      ) => {
        try {
          const data:
            SavedPlayerState = {
            songId:
              currentSong?.id ??
              null,

            position:
              safePosition(
                position
              ),

            queueIds:
              activeQueue.map(
                song =>
                  song.id
              ),

            historyIds:
              historyRef
                .current
                .slice(
                  -MAX_HISTORY_ITEMS
                ),

            shuffle,

            repeatMode,
          };

          await AsyncStorage
            .setItem(
              PLAYER_STATE_KEY,
              JSON.stringify(
                data
              )
            );
        } catch (
          error
        ) {
          console.log(
            'Error guardando estado del reproductor:',
            error
          );
        }
      },
      [
        currentSong,
        activeQueue,
        shuffle,
        repeatMode,
      ]
    );


  /* =========================================================
     RESTAURAR ÚLTIMA SESIÓN
  ========================================================= */

  useEffect(
    () => {
      if (
        !resumeLastSong ||
        restored.current ||
        songs.length === 0
      ) {
        return;
      }

      restored.current =
        true;

      void (
        async () => {
          try {
            const raw =
              await AsyncStorage
                .getItem(
                  PLAYER_STATE_KEY
                );

            if (!raw) {
              return;
            }

            const saved =
              JSON.parse(
                raw
              ) as Partial<
                SavedPlayerState
              >;

            const map =
              new Map(
                songs.map(
                  song => [
                    song.id,
                    song,
                  ]
                )
              );

            const restoredQueue =
              (
                Array.isArray(
                  saved.queueIds
                )
                  ? saved.queueIds
                  : []
              )
                .map(
                  id =>
                    typeof id ===
                    'string'
                      ? map.get(
                          id
                        )
                      : undefined
                )
                .filter(
                  Boolean
                ) as Song[];

            const song =
              typeof saved.songId ===
                'string'
                ? map.get(
                    saved.songId
                  )
                : undefined;

            historyRef.current =
              (
                Array.isArray(
                  saved.historyIds
                )
                  ? saved.historyIds
                  : []
              )
                .filter(
                  (
                    id
                  ): id is string =>
                    typeof id ===
                      'string' &&
                    map.has(
                      id
                    )
                )
                .slice(
                  -MAX_HISTORY_ITEMS
                );

            setShuffle(
              Boolean(
                saved.shuffle
              )
            );

            setRepeatMode(
              isRepeatMode(
                saved.repeatMode
              )
                ? saved.repeatMode
                : 'off'
            );

            if (!song) {
              return;
            }

            const safeQueue =
              restoredQueue.length >
              0
                ? uniqueSongs(
                    restoredQueue
                  )
                : uniqueSongs(
                    songs
                  );

            const queueWithSong =
              safeQueue.some(
                item =>
                  item.id ===
                  song.id
              )
                ? safeQueue
                : uniqueSongs([
                    song,
                    ...safeQueue,
                  ]);

            setQueue(
              queueWithSong
            );

            setCurrentSong(
              song
            );

            previousFinished.current =
              false;

            lastSavedBucket.current =
              -1;

            player.replace(
              song.uri
            );

            activateLockScreen(
              song
            );

            const position =
              safePosition(
                saved.position
              );

            if (
              position >
              0
            ) {
              await player
                .seekTo(
                  position
                );
            }

            setOptimisticPlaying(
              false
            );
          } catch (
            error
          ) {
            console.log(
              'Error restaurando reproductor:',
              error
            );
          }
        }
      )();
    },
    [
      songs,
      resumeLastSong,
      player,
      activateLockScreen,
    ]
  );


  /* =========================================================
     GUARDADO PERIÓDICO
  ========================================================= */

  useEffect(
    () => {
      if (
        !currentSong
      ) {
        return;
      }

      const currentTime =
        status.currentTime ||
        0;

      const bucket =
        Math.floor(
          currentTime /
          SAVE_INTERVAL_SECONDS
        );

      if (
        bucket ===
        lastSavedBucket.current
      ) {
        return;
      }

      lastSavedBucket.current =
        bucket;

      void persist(
        currentTime
      );
    },
    [
      status.currentTime,
      currentSong,
      persist,
    ]
  );


  useEffect(
    () => {
      if (
        !currentSong
      ) {
        return;
      }

      void persist(
        status.currentTime ||
        0
      );
    },
    [
      currentSong?.id,
      queue,
      shuffle,
      repeatMode,
      persist,
    ]
  );


  /* =========================================================
     CARGAR CANCIÓN
  ========================================================= */

  const loadSong =
    useCallback(
      (
        song:
          Song,

        sourceQueue?:
          Song[],

        autoPlay =
          true,

        recordHistory =
          true
      ) => {
        const nextQueue =
          buildQueueForSong(
            song,
            sourceQueue
          );

        if (
          recordHistory &&
          currentSong &&
          currentSong.id !==
            song.id
        ) {
          pushHistory(
            currentSong.id
          );
        }

        previousFinished.current =
          false;

        lastSavedBucket.current =
          -1;

        setQueue(
          nextQueue
        );

        setCurrentSong(
          song
        );

        player.replace(
          song.uri
        );

        activateLockScreen(
          song
        );

        if (
          autoPlay
        ) {
          setOptimisticPlaying(
            true
          );

          player.play();
        } else {
          setOptimisticPlaying(
            false
          );
        }
      },
      [
        buildQueueForSong,
        currentSong,
        pushHistory,
        player,
        activateLockScreen,
      ]
    );


  /* =========================================================
     PLAY SONG
  ========================================================= */

  const playSong =
    useCallback(
      (
        song:
          Song,

        sourceQueue?:
          Song[]
      ) => {
        if (
          currentSong?.id ===
          song.id
        ) {
          if (
            sourceQueue &&
            sourceQueue.length >
              0
          ) {
            setQueue(
              buildQueueForSong(
                song,
                sourceQueue
              )
            );
          }

          if (
            optimisticPlaying
          ) {
            setOptimisticPlaying(
              false
            );

            player.pause();
          } else {
            setOptimisticPlaying(
              true
            );

            activateLockScreen(
              song
            );

            player.play();
          }

          return;
        }

        loadSong(
          song,
          sourceQueue,
          true
        );
      },
      [
        currentSong,
        optimisticPlaying,
        player,
        activateLockScreen,
        loadSong,
        buildQueueForSong,
      ]
    );


  /* =========================================================
     PLAY ALL
  ========================================================= */

  const playAll =
    useCallback(
      (
        sourceQueue:
          Song[],

        startIndex =
          0
      ) => {
        const cleanQueue =
          uniqueSongs(
            sourceQueue
          );

        if (
          cleanQueue.length ===
          0
        ) {
          return;
        }

        const index =
          Math.max(
            0,
            Math.min(
              startIndex,
              cleanQueue.length -
                1
            )
          );

        loadSong(
          cleanQueue[
            index
          ],
          cleanQueue,
          true
        );
      },
      [
        loadSong,
      ]
    );


  /* =========================================================
     PLAY / PAUSE
  ========================================================= */

  const pause =
    useCallback(
      () => {
        setOptimisticPlaying(
          false
        );

        player.pause();
      },
      [
        player,
      ]
    );


  const togglePlayPause =
    useCallback(
      () => {
        if (
          !currentSong
        ) {
          return;
        }

        if (
          optimisticPlaying
        ) {
          pause();

          return;
        }

        setOptimisticPlaying(
          true
        );

        activateLockScreen(
          currentSong
        );

        player.play();
      },
      [
        currentSong,
        optimisticPlaying,
        pause,
        activateLockScreen,
        player,
      ]
    );


  /* =========================================================
     SHUFFLE
  ========================================================= */

  const getRandomIndex =
    useCallback(
      () => {
        if (
          activeQueue.length <=
          1
        ) {
          return 0;
        }

        let result =
          currentIndex;

        while (
          result ===
          currentIndex
        ) {
          result =
            Math.floor(
              Math.random() *
              activeQueue.length
            );
        }

        return result;
      },
      [
        activeQueue.length,
        currentIndex,
      ]
    );


  /* =========================================================
     SIGUIENTE
  ========================================================= */

  const next =
    useCallback(
      () => {
        if (
          !currentSong ||
          activeQueue.length ===
            0
        ) {
          return;
        }

        if (
          shuffle
        ) {
          loadSong(
            activeQueue[
              getRandomIndex()
            ],
            activeQueue,
            true
          );

          return;
        }

        const index =
          currentIndex >=
          activeQueue.length -
            1
            ? 0
            : currentIndex +
              1;

        loadSong(
          activeQueue[
            index
          ],
          activeQueue,
          true
        );
      },
      [
        currentSong,
        activeQueue,
        shuffle,
        currentIndex,
        getRandomIndex,
        loadSong,
      ]
    );


  /* =========================================================
     ANTERIOR
  ========================================================= */

  const previous =
    useCallback(
      async () => {
        if (
          !currentSong ||
          activeQueue.length ===
            0
        ) {
          return;
        }

        if (
          shuffle
        ) {
          const queueIds =
            new Set(
              activeQueue.map(
                song =>
                  song.id
              )
            );

          let previousSong:
            Song | undefined;

          while (
            historyRef.current.length >
              0 &&
            !previousSong
          ) {
            const previousId =
              historyRef.current
                .pop();

            if (
              !previousId ||
              previousId ===
                currentSong.id ||
              !queueIds.has(
                previousId
              )
            ) {
              continue;
            }

            previousSong =
              activeQueue.find(
                song =>
                  song.id ===
                  previousId
              );
          }

          if (
            previousSong
          ) {
            loadSong(
              previousSong,
              activeQueue,
              true,
              false
            );

            return;
          }

          await player
            .seekTo(
              0
            );

          return;
        }

        if (
          currentTimeRef.current >
          PREVIOUS_RESTART_SECONDS
        ) {
          await player
            .seekTo(
              0
            );

          return;
        }

        const index =
          currentIndex <=
          0
            ? activeQueue.length -
              1
            : currentIndex -
              1;

        loadSong(
          activeQueue[
            index
          ],
          activeQueue,
          true
        );
      },
      [
        currentSong,
        activeQueue,
        player,
        shuffle,
        currentIndex,
        loadSong,
      ]
    );


  /* =========================================================
     CONTROLES REMOTOS
  ========================================================= */

  useEffect(
    () => {
      const remotePlayer =
        player as unknown as
          Partial<
            HmusicRemoteAudioPlayer
          >;

      if (
        typeof remotePlayer
          .addListener !==
        'function'
      ) {
        return;
      }

      const nextSubscription =
        remotePlayer
          .addListener(
            'onRemoteNextTrack',
            () => {
              next();
            }
          );

      const previousSubscription =
        remotePlayer
          .addListener(
            'onRemotePreviousTrack',
            () => {
              void previous();
            }
          );

      return () => {
        nextSubscription
          .remove();

        previousSubscription
          .remove();
      };
    },
    [
      player,
      next,
      previous,
    ]
  );


  /* =========================================================
     SEEK
  ========================================================= */

  const seekTo =
    useCallback(
      async (
        seconds:
          number
      ) => {
        if (
          !Number.isFinite(
            seconds
          )
        ) {
          return;
        }

        const max =
          (
            status.duration ||
            currentSong?.duration ||
            0
          ) >
          0
            ? (
                status.duration ||
                currentSong?.duration ||
                0
              )
            : Number.POSITIVE_INFINITY;

        const target =
          Math.min(
            Math.max(
              0,
              seconds
            ),
            max
          );

        await player
          .seekTo(
            target
          );
      },
      [
        player,
        status.duration,
        currentSong?.duration,
      ]
    );


  /* =========================================================
     MODOS
  ========================================================= */

  const toggleShuffle =
    useCallback(
      () => {
        setShuffle(
          current =>
            !current
        );
      },
      []
    );


  const cycleRepeatMode =
    useCallback(
      () => {
        setRepeatMode(
          current =>
            current ===
            'off'
              ? 'all'
              : current ===
                  'all'
                ? 'one'
                : 'off'
        );
      },
      []
    );


  /* =========================================================
     REPRODUCIR DESPUÉS
  ========================================================= */

  const playNext =
    useCallback(
      (
        song:
          Song
      ) => {
        const base =
          activeQueue.length >
          0
            ? [
                ...activeQueue,
              ]
            : [
                ...songs,
              ];

        const filtered =
          base.filter(
            item =>
              item.id !==
              song.id
          );

        const index =
          currentSong
            ? filtered
                .findIndex(
                  item =>
                    item.id ===
                    currentSong.id
                )
            : -1;

        filtered.splice(
          Math.max(
            0,
            index +
              1
          ),
          0,
          song
        );

        setQueue(
          uniqueSongs(
            filtered
          )
        );
      },
      [
        activeQueue,
        songs,
        currentSong,
      ]
    );


  /* =========================================================
     AÑADIR A COLA
  ========================================================= */

  const addToQueue =
    useCallback(
      (
        song:
          Song
      ) => {
        setQueue(
          current => {
            const base =
              current.length >
              0
                ? current
                : activeQueue;

            if (
              base.some(
                item =>
                  item.id ===
                  song.id
              )
            ) {
              return [
                ...base,
              ];
            }

            return uniqueSongs([
              ...base,
              song,
            ]);
          }
        );
      },
      [
        activeQueue,
      ]
    );


  /* =========================================================
     QUITAR DE COLA
  ========================================================= */

  const removeFromQueue =
    useCallback(
      (
        songId:
          string
      ) => {
        if (
          currentSong?.id ===
          songId
        ) {
          return;
        }

        setQueue(
          current => {
            const base =
              current.length >
              0
                ? current
                : activeQueue;

            return base.filter(
              item =>
                item.id !==
                songId
            );
          }
        );
      },
      [
        currentSong,
        activeQueue,
      ]
    );


  /* =========================================================
     MOVER EN COLA
  ========================================================= */

  const moveQueueItem =
    useCallback(
      (
        from:
          number,

        to:
          number
      ) => {
        setQueue(
          current => {
            const base =
              current.length >
              0
                ? [
                    ...current,
                  ]
                : [
                    ...activeQueue,
                  ];

            if (
              from < 0 ||
              to < 0 ||
              from >=
                base.length ||
              to >=
                base.length ||
              from ===
                to
            ) {
              return base;
            }

            const [
              moved,
            ] =
              base.splice(
                from,
                1
              );

            if (!moved) {
              return base;
            }

            base.splice(
              to,
              0,
              moved
            );

            return base;
          }
        );
      },
      [
        activeQueue,
      ]
    );


  /* =========================================================
     LIMPIAR COLA
  ========================================================= */

  const clearQueue =
    useCallback(
      () => {
        setQueue(
          currentSong
            ? [
                currentSong,
              ]
            : []
        );
      },
      [
        currentSong,
      ]
    );


  /* =========================================================
     ECUALIZADOR ANDROID
  ========================================================= */

  const scheduleEqualizerSave =
    useCallback(
      (
        info:
          HmusicEqualizerInfo
      ) => {
        if (
          equalizerSaveTimer.current
        ) {
          clearTimeout(
            equalizerSaveTimer.current
          );
        }

        equalizerSaveTimer.current =
          setTimeout(
            () => {
              const saved:
                SavedEqualizerState = {
                enabled:
                  info.enabled,

                levelsMb:
                  info.bands.map(
                    band =>
                      band.levelMb
                  ),
              };

              void AsyncStorage
                .setItem(
                  EQUALIZER_STATE_KEY,
                  JSON.stringify(
                    saved
                  )
                )
                .catch(
                  error => {
                    console.log(
                      'Error guardando ecualizador:',
                      error
                    );
                  }
                );
            },
            280
          );
      },
      []
    );


  const getEqualizerInfo =
    useCallback(
      async () => {
        return ExpoAudioEqualizer
          .hmusicGetEqualizerInfo(
            player.id
          );
      },
      [
        player.id,
      ]
    );


  const setEqualizerEnabled =
    useCallback(
      async (
        enabled:
          boolean
      ) => {
        ExpoAudioEqualizer
          .hmusicSetEqualizerEnabled(
            player.id,
            enabled
          );

        const info =
          ExpoAudioEqualizer
            .hmusicGetEqualizerInfo(
              player.id
            );

        scheduleEqualizerSave(
          info
        );

        return info;
      },
      [
        player.id,
        scheduleEqualizerSave,
      ]
    );


  const setEqualizerBandLevel =
    useCallback(
      async (
        bandIndex:
          number,

        levelMb:
          number
      ) => {
        ExpoAudioEqualizer
          .hmusicSetEqualizerBandLevel(
            player.id,
            bandIndex,
            levelMb
          );

        const info =
          ExpoAudioEqualizer
            .hmusicGetEqualizerInfo(
              player.id
            );

        scheduleEqualizerSave(
          info
        );

        return info;
      },
      [
        player.id,
        scheduleEqualizerSave,
      ]
    );


  const setEqualizerLevels =
    useCallback(
      async (
        levelsMb:
          number[]
      ) => {
        ExpoAudioEqualizer
          .hmusicSetEqualizerLevels(
            player.id,
            levelsMb
          );

        const info =
          ExpoAudioEqualizer
            .hmusicGetEqualizerInfo(
              player.id
            );

        scheduleEqualizerSave(
          info
        );

        return info;
      },
      [
        player.id,
        scheduleEqualizerSave,
      ]
    );


  const resetEqualizer =
    useCallback(
      async () => {
        ExpoAudioEqualizer
          .hmusicResetEqualizer(
            player.id
          );

        const info =
          ExpoAudioEqualizer
            .hmusicGetEqualizerInfo(
              player.id
            );

        scheduleEqualizerSave(
          info
        );

        return info;
      },
      [
        player.id,
        scheduleEqualizerSave,
      ]
    );


  useEffect(
    () => {
      if (
        equalizerRestored.current ||
        !currentSong ||
        !status.isLoaded
      ) {
        return;
      }

      equalizerRestored.current =
        true;

      void (
        async () => {
          try {
            const raw =
              await AsyncStorage
                .getItem(
                  EQUALIZER_STATE_KEY
                );

            if (!raw) {
              return;
            }

            const saved =
              JSON.parse(
                raw
              ) as Partial<
                SavedEqualizerState
              >;

            if (
              Array.isArray(
                saved.levelsMb
              )
            ) {
              const levels =
                saved.levelsMb
                  .map(
                    value =>
                      Number(
                        value
                      )
                  )
                  .filter(
                    value =>
                      Number.isFinite(
                        value
                      )
                  );

              if (
                levels.length >
                0
              ) {
                ExpoAudioEqualizer
                  .hmusicSetEqualizerLevels(
                    player.id,
                    levels
                  );
              }
            }

            ExpoAudioEqualizer
              .hmusicSetEqualizerEnabled(
                player.id,
                Boolean(
                  saved.enabled
                )
              );
          } catch (
            error
          ) {
            console.log(
              'Ecualizador no restaurado:',
              error
            );
          }
        }
      )();
    },
    [
      currentSong?.id,
      status.isLoaded,
      player.id,
    ]
  );


  useEffect(
    () => {
      return () => {
        if (
          equalizerSaveTimer.current
        ) {
          clearTimeout(
            equalizerSaveTimer.current
          );
        }
      };
    },
    []
  );


  /* =========================================================
     FIN AUTOMÁTICO DE CANCIÓN
  ========================================================= */

  useEffect(
    () => {
      const justFinished =
        Boolean(
          status.didJustFinish
        ) &&
        !previousFinished
          .current;

      previousFinished.current =
        Boolean(
          status.didJustFinish
        );

      if (
        !justFinished ||
        !currentSong ||
        activeQueue.length ===
          0
      ) {
        return;
      }

      if (
        repeatMode ===
        'one'
      ) {
        void player
          .seekTo(
            0
          )
          .then(
            () => {
              setOptimisticPlaying(
                true
              );

              player.play();
            }
          );

        return;
      }

      if (
        shuffle
      ) {
        loadSong(
          activeQueue[
            getRandomIndex()
          ],
          activeQueue,
          true
        );

        return;
      }

      if (
        currentIndex >=
          0 &&
        currentIndex <
          activeQueue.length -
            1
      ) {
        loadSong(
          activeQueue[
            currentIndex +
              1
          ],
          activeQueue,
          true
        );

        return;
      }

      if (
        repeatMode ===
        'all'
      ) {
        loadSong(
          activeQueue[
            0
          ],
          activeQueue,
          true
        );

        return;
      }

      setOptimisticPlaying(
        false
      );
    },
    [
      status.didJustFinish,
      currentSong,
      activeQueue,
      repeatMode,
      shuffle,
      currentIndex,
      player,
      getRandomIndex,
      loadSong,
    ]
  );


  return {
    currentSong,

    queue:
      activeQueue,

    currentIndex,

    isPlaying:
      optimisticPlaying,

    currentTime:
      status.currentTime ||
      0,

    duration:
      status.duration ||
      currentSong?.duration ||
      0,

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
