import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AppState,
  type AppStateStatus,
} from 'react-native';

import type {
  Song,
} from '../types/Song';

import {
  getLocalSongs,
  MusicPermissionError,
} from '../services/musicLibrary';

import {
  addDeleteResultListener,
} from '../services/androidMediaActions';

import {
  getLibrarySettingsSnapshot,
  subscribeLibrarySettings,
  type LibrarySettingsSnapshot,
} from './useSettings';


/* =========================================================
   NORMALIZAR RUTA
========================================================= */

function normalizeFolderPath(
  value:
    string | null | undefined
) {
  return (
    value ?? ''
  )
    .replace(
      /\\/g,
      '/'
    )
    .replace(
      /\/+/g,
      '/'
    )
    .replace(
      /^\/+|\/+$/g,
      ''
    )
    .trim();
}


/* =========================================================
   VERIFICAR CARPETA EXCLUIDA
========================================================= */

function isExcludedFolder(
  folderPath:
    string | null | undefined,

  excludedFolders:
    string[]
) {
  const normalized =
    normalizeFolderPath(
      folderPath
    ).toLocaleLowerCase();


  if (
    !normalized
  ) {
    return false;
  }


  return excludedFolders.some(
    folder => {
      const excluded =
        normalizeFolderPath(
          folder
        ).toLocaleLowerCase();


      if (
        !excluded
      ) {
        return false;
      }


      /*
       * Excluir una carpeta también excluye
       * todas sus subcarpetas.
       */
      return (
        normalized ===
          excluded
        ||
        normalized.startsWith(
          `${excluded}/`
        )
      );
    }
  );
}


/* =========================================================
   HOOK
========================================================= */

export function useMusicLibrary() {
  /*
   * Biblioteca completa obtenida de Android.
   *
   * La conservamos sin filtros para poder
   * seguir mostrando carpetas excluidas en
   * Configuración y permitir reactivarlas.
   */
  const [
    sourceSongs,
    setSourceSongs,
  ] =
    useState<
      Song[]
    >(
      []
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );


  const [
    librarySettings,
    setLibrarySettings,
  ] =
    useState<
      LibrarySettingsSnapshot
    >(
      getLibrarySettingsSnapshot()
    );


  /*
   * Evita varias actualizaciones
   * simultáneas.
   */
  const refreshingRef =
    useRef(
      false
    );


  /*
   * Sabemos si ya hicimos
   * la carga inicial.
   */
  const initializedRef =
    useRef(
      false
    );


  /*
   * Estado anterior de la app.
   */
  const appStateRef =
    useRef<
      AppStateStatus
    >(
      AppState.currentState
    );


  /* =========================================================
     ESCUCHAR CAMBIOS DE CONFIGURACIÓN
  ========================================================= */

  useEffect(
    () => {
      const unsubscribe =
        subscribeLibrarySettings(
          next => {
            setLibrarySettings({
              minDuration:
                next.minDuration,

              excludedFolders:
                [
                  ...next
                    .excludedFolders,
                ],
            });
          }
        );


      /*
       * Sincronizamos también el valor
       * actual por si useSettings terminó
       * de cargar antes.
       */
      setLibrarySettings(
        getLibrarySettingsSnapshot()
      );


      return unsubscribe;
    },
    []
  );


  /* =========================================================
     FILTRAR BIBLIOTECA
  ========================================================= */

  const songs =
    useMemo(
      () => {
        const minimum =
          Math.max(
            0,
            Number(
              librarySettings
                .minDuration
            ) || 0
          );


        return sourceSongs.filter(
          song => {
            const duration =
              Number(
                song.duration
              ) || 0;


            if (
              minimum >
                0
              &&
              duration <
                minimum
            ) {
              return false;
            }


            if (
              isExcludedFolder(
                song.folderPath,
                librarySettings
                  .excludedFolders
              )
            ) {
              return false;
            }


            return true;
          }
        );
      },
      [
        sourceSongs,
        librarySettings,
      ]
    );


  /* =========================================================
     CARPETAS DISPONIBLES
  ========================================================= */

  const availableFolders =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            string
          >();


        sourceSongs.forEach(
          song => {
            const folder =
              normalizeFolderPath(
                song.folderPath
              );


            if (
              !folder
            ) {
              return;
            }


            const key =
              folder
                .toLocaleLowerCase();


            if (
              !map.has(
                key
              )
            ) {
              map.set(
                key,
                folder
              );
            }
          }
        );


        return Array.from(
          map.values()
        ).sort(
          (
            first,
            second
          ) =>
            first.localeCompare(
              second,
              'es',
              {
                sensitivity:
                  'base',

                numeric:
                  true,
              }
            )
        );
      },
      [
        sourceSongs,
      ]
    );


  /* =========================================================
     CARGAR BIBLIOTECA
  ========================================================= */

  const refresh =
    useCallback(
      async (
        silent =
          false,
        forceRefresh =
          true
      ) => {
        /*
         * No ejecutamos dos escaneos
         * al mismo tiempo.
         */
        if (
          refreshingRef.current
        ) {
          return;
        }


        refreshingRef.current =
          true;


        try {
          if (
            !silent
          ) {
            setLoading(
              true
            );
          }


          setError(
            null
          );


          const result =
            await getLocalSongs({
              forceRefresh,
            });


          setSourceSongs(
            result
          );


          initializedRef.current =
            true;

        } catch (
          err
        ) {
          console.log(
            'Error cargando biblioteca:',
            err
          );


          if (
            err instanceof
              MusicPermissionError
          ) {
            setError(
              err.message
            );
          } else {
            setError(
              'No se pudo cargar la música del dispositivo.'
            );
          }

        } finally {
          refreshingRef.current =
            false;


          if (
            !silent
          ) {
            setLoading(
              false
            );
          }
        }
      },
      []
    );


  /* =========================================================
     PRIMER ESCANEO
  ========================================================= */

  useEffect(
    () => {
      let cancelled =
        false;

      /*
       * 1. Mostramos rápidamente el caché si existe.
       * 2. Enseguida hacemos un escaneo real y silencioso.
       *
       * Así Hmusic abre rápido, pero una canción descargada
       * mientras la app estaba cerrada también aparece sin
       * esperar a que caduque el caché de 15 minutos.
       */
      const loadLibrary =
        async () => {
          await refresh(
            false,
            false
          );

          if (
            !cancelled
          ) {
            await refresh(
              true,
              true
            );
          }
        };

      void loadLibrary();

      return () => {
        cancelled =
          true;
      };
    },
    [
      refresh,
    ]
  );


  /* =========================================================
     ACTUALIZAR AL VOLVER A HMUSIC
  ========================================================= */

  useEffect(
    () => {
      const subscription =
        AppState.addEventListener(
          'change',
          nextState => {
            const previousState =
              appStateRef.current;


            appStateRef.current =
              nextState;


            const returningToApp =
              (
                previousState ===
                  'background'
                ||
                previousState ===
                  'inactive'
              )
              &&
              nextState ===
                'active';


            if (
              returningToApp
              &&
              initializedRef.current
            ) {
              /*
               * Actualización silenciosa:
               * no mostramos otra vez la
               * pantalla de carga.
               */
              void refresh(
                true,
                true
              );
            }
          }
        );


      return () => {
        subscription.remove();
      };
    },
    [
      refresh,
    ]
  );


  /* =========================================================
     ACTUALIZAR DESPUÉS DE ELIMINAR
  ========================================================= */

  useEffect(
    () => {
      const subscription =
        addDeleteResultListener(
          event => {
            if (
              !event.confirmed
            ) {
              return;
            }


            /*
             * Damos un pequeño margen
             * para que MediaStore refleje
             * los archivos eliminados.
             */
            setTimeout(
              () => {
                void refresh(
                  true
                );
              },
              300
            );
          }
        );


      return () => {
        subscription.remove();
      };
    },
    [
      refresh,
    ]
  );


  /*
   * IMPORTANTE PARA RENDIMIENTO
   * ---------------------------
   * Antes se devolvía:
   *
   *   refresh: () => refresh(false)
   *
   * Esa función nueva se creaba en CADA render de AppProvider.
   * Como useMusicPlayer actualiza su estado con frecuencia,
   * AppContext veía una referencia distinta de library.refresh
   * varias veces por segundo y propagaba renders a toda la app.
   *
   * Este callback es estable y, cuando el usuario actualiza,
   * fuerza un escaneo real ignorando el caché.
   */
  const publicRefresh =
    useCallback(
      () =>
        refresh(
          false,
          true
        ),
      [
        refresh,
      ]
    );


  return {
    /*
     * Canciones visibles después de aplicar:
     * - duración mínima
     * - carpetas excluidas
     */
    songs,

    /*
     * Lista completa de carpetas detectadas.
     * Incluye también las excluidas para que
     * puedan volver a habilitarse.
     */
    availableFolders,

    loading,

    error,

    refresh:
      publicRefresh,
  };
}
