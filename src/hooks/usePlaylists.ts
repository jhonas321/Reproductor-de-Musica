import AsyncStorage
  from '@react-native-async-storage/async-storage';


import {
  useCallback,
  useEffect,
  useState,
} from 'react';


import type {
  Playlist,
} from '../types/Song';


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const KEY =
  '@musicplayer/playlists';


function makeId() {
  return `${Date.now()}-${Math
    .random()
    .toString(36)
    .slice(2, 8)}`;
}


function normalizeName(
  value:
    string
) {
  return value
    .trim()
    .replace(
      /\s+/g,
      ' '
    );
}


function sanitizePlaylists(
  value:
    unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }


  const now =
    Date.now();


  return value
    .filter(
      item =>
        item &&
        typeof item ===
          'object'
    )
    .map(
      item => {
        const raw =
          item as
            Partial<
              Playlist
            >;


        const songIds =
          Array.isArray(
            raw.songIds
          )
            ? Array.from(
                new Set(
                  raw.songIds.filter(
                    id =>
                      typeof id ===
                        'string'
                      &&
                      id.length >
                        0
                  )
                )
              )
            : [];


        return {
          id:
            typeof raw.id ===
              'string'
            &&
            raw.id.length >
              0

              ? raw.id

              : makeId(),

          name:
            typeof raw.name ===
              'string'
            &&
            normalizeName(
              raw.name
            )

              ? normalizeName(
                  raw.name
                )

              : 'Playlist',

          songIds,

          createdAt:
            typeof raw.createdAt ===
              'number'

              ? raw.createdAt

              : now,

          updatedAt:
            typeof raw.updatedAt ===
              'number'

              ? raw.updatedAt

              : now,
        } as
          Playlist;
      }
    );
}


/* =========================================================
   HOOK
========================================================= */

export function usePlaylists() {
  const [
    playlists,
    setPlaylists,
  ] =
    useState<
      Playlist[]
    >([]);


  const [
    loaded,
    setLoaded,
  ] =
    useState(
      false
    );


  /* =======================================================
     CARGAR
  ======================================================= */

  useEffect(
    () => {
      let mounted =
        true;


      void (
        async () => {
          try {
            const raw =
              await AsyncStorage
                .getItem(
                  KEY
                );


            if (
              !mounted
            ) {
              return;
            }


            if (
              raw
            ) {
              const parsed =
                JSON.parse(
                  raw
                );


              setPlaylists(
                sanitizePlaylists(
                  parsed
                )
              );
            }
          } catch (
            error
          ) {
            console.log(
              'Error cargando playlists:',
              error
            );
          } finally {
            if (
              mounted
            ) {
              setLoaded(
                true
              );
            }
          }
        }
      )();


      return () => {
        mounted =
          false;
      };
    },
    []
  );


  /* =======================================================
     GUARDAR
  ======================================================= */

  useEffect(
    () => {
      if (
        !loaded
      ) {
        return;
      }


      void AsyncStorage
        .setItem(
          KEY,
          JSON.stringify(
            playlists
          )
        )
        .catch(
          error => {
            console.log(
              'Error guardando playlists:',
              error
            );
          }
        );
    },
    [
      playlists,
      loaded,
    ]
  );


  /* =======================================================
     CREAR PLAYLIST
  ======================================================= */

  const createPlaylist =
    useCallback(
      (
        name:
          string
      ) => {
        const clean =
          normalizeName(
            name
          );


        if (
          !clean
        ) {
          return null;
        }


        const duplicated =
          playlists.some(
            item =>
              item.name
                .toLocaleLowerCase() ===
              clean
                .toLocaleLowerCase()
          );


        if (
          duplicated
        ) {
          return null;
        }


        const now =
          Date.now();


        const playlist:
          Playlist = {
            id:
              makeId(),

            name:
              clean,

            songIds:
              [],

            createdAt:
              now,

            updatedAt:
              now,
          };


        setPlaylists(
          current => [
            playlist,
            ...current,
          ]
        );


        return playlist;
      },
      [
        playlists,
      ]
    );


  /* =======================================================
     RENOMBRAR
  ======================================================= */

  const renamePlaylist =
    useCallback(
      (
        playlistId:
          string,

        name:
          string
      ) => {
        const clean =
          normalizeName(
            name
          );


        if (
          !clean
        ) {
          return false;
        }


        let changed =
          false;


        setPlaylists(
          current => {
            const duplicated =
              current.some(
                item =>
                  item.id !==
                    playlistId
                  &&
                  item.name
                    .toLocaleLowerCase() ===
                  clean
                    .toLocaleLowerCase()
              );


            if (
              duplicated
            ) {
              return current;
            }


            return current.map(
              item => {
                if (
                  item.id !==
                    playlistId
                ) {
                  return item;
                }


                changed =
                  true;


                return {
                  ...item,

                  name:
                    clean,

                  updatedAt:
                    Date.now(),
                };
              }
            );
          }
        );


        return changed;
      },
      []
    );


  /* =======================================================
     ELIMINAR PLAYLIST
  ======================================================= */

  const deletePlaylist =
    useCallback(
      (
        playlistId:
          string
      ) => {
        setPlaylists(
          current =>
            current.filter(
              item =>
                item.id !==
                  playlistId
            )
        );
      },
      []
    );


  /* =======================================================
     AÑADIR UNA CANCIÓN
  ======================================================= */

  const addSong =
    useCallback(
      (
        playlistId:
          string,

        songId:
          string
      ) => {
        setPlaylists(
          current =>
            current.map(
              item => {
                if (
                  item.id !==
                    playlistId
                ) {
                  return item;
                }


                if (
                  item.songIds
                    .includes(
                      songId
                    )
                ) {
                  return item;
                }


                return {
                  ...item,

                  songIds: [
                    ...item.songIds,
                    songId,
                  ],

                  updatedAt:
                    Date.now(),
                };
              }
            )
        );
      },
      []
    );


  /* =======================================================
     AÑADIR VARIAS CANCIONES

     - evita duplicados
     - conserva el orden recibido
  ======================================================= */

  const addSongs =
    useCallback(
      (
        playlistId:
          string,

        songIds:
          string[]
      ) => {
        const cleanIds =
          Array.from(
            new Set(
              songIds.filter(
                Boolean
              )
            )
          );


        if (
          cleanIds.length ===
            0
        ) {
          return;
        }


        setPlaylists(
          current =>
            current.map(
              item => {
                if (
                  item.id !==
                    playlistId
                ) {
                  return item;
                }


                const existing =
                  new Set(
                    item.songIds
                  );


                const newIds =
                  cleanIds.filter(
                    id =>
                      !existing.has(
                        id
                      )
                  );


                if (
                  newIds.length ===
                    0
                ) {
                  return item;
                }


                return {
                  ...item,

                  songIds: [
                    ...item.songIds,
                    ...newIds,
                  ],

                  updatedAt:
                    Date.now(),
                };
              }
            )
        );
      },
      []
    );


  /* =======================================================
     QUITAR CANCIÓN
  ======================================================= */

  const removeSong =
    useCallback(
      (
        playlistId:
          string,

        songId:
          string
      ) => {
        setPlaylists(
          current =>
            current.map(
              item => {
                if (
                  item.id !==
                    playlistId
                ) {
                  return item;
                }


                const nextIds =
                  item.songIds.filter(
                    id =>
                      id !==
                        songId
                  );


                if (
                  nextIds.length ===
                    item.songIds.length
                ) {
                  return item;
                }


                return {
                  ...item,

                  songIds:
                    nextIds,

                  updatedAt:
                    Date.now(),
                };
              }
            )
        );
      },
      []
    );


  /* =======================================================
     REORDENAR CANCIÓN
  ======================================================= */

  const moveSong =
    useCallback(
      (
        playlistId:
          string,

        fromIndex:
          number,

        toIndex:
          number
      ) => {
        setPlaylists(
          current =>
            current.map(
              item => {
                if (
                  item.id !==
                    playlistId
                ) {
                  return item;
                }


                if (
                  fromIndex <
                    0
                  ||
                  toIndex <
                    0
                  ||
                  fromIndex >=
                    item.songIds.length
                  ||
                  toIndex >=
                    item.songIds.length
                  ||
                  fromIndex ===
                    toIndex
                ) {
                  return item;
                }


                const next =
                  [
                    ...item.songIds,
                  ];


                const [
                  moved,
                ] =
                  next.splice(
                    fromIndex,
                    1
                  );


                next.splice(
                  toIndex,
                  0,
                  moved
                );


                return {
                  ...item,

                  songIds:
                    next,

                  updatedAt:
                    Date.now(),
                };
              }
            )
        );
      },
      []
    );


  /* =======================================================
     VACIAR PLAYLIST
  ======================================================= */

  const clearPlaylist =
    useCallback(
      (
        playlistId:
          string
      ) => {
        setPlaylists(
          current =>
            current.map(
              item => {
                if (
                  item.id !==
                    playlistId
                  ||
                  item.songIds.length ===
                    0
                ) {
                  return item;
                }


                return {
                  ...item,

                  songIds:
                    [],

                  updatedAt:
                    Date.now(),
                };
              }
            )
        );
      },
      []
    );


  return {
    playlists,

    createPlaylist,

    renamePlaylist,

    deletePlaylist,

    addSong,

    addSongs,

    removeSong,

    moveSong,

    clearPlaylist,
  };
}
