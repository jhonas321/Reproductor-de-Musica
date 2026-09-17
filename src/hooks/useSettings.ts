import AsyncStorage
  from '@react-native-async-storage/async-storage';


import {
  useCallback,
  useEffect,
  useState,
} from 'react';


import type {
  AppSettings,
} from '../types/Song';


/* =========================================================
   TIPOS
========================================================= */

export type ExtendedAppSettings =
  AppSettings & {
    excludedFolders:
      string[];
  };


export type LibrarySettingsSnapshot = {
  minDuration:
    number;

  excludedFolders:
    string[];
};


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const KEY =
  '@musicplayer/settings';


const DEFAULTS:
  ExtendedAppSettings = {
    minDuration:
      0,

    /*
     * Los conservamos por compatibilidad
     * con versiones anteriores de Hmusic.
     *
     * El ordenamiento visual nuevo se
     * controla desde "Tus canciones".
     */
    sortKey:
      'title',

    sortAscending:
      true,

    resumeLastSong:
      true,

    excludedFolders:
      [],
  };


/* =========================================================
   SINCRONIZACIÓN CON LA BIBLIOTECA
========================================================= */

let currentLibrarySettings:
  LibrarySettingsSnapshot = {
    minDuration:
      DEFAULTS.minDuration,

    excludedFolders:
      DEFAULTS.excludedFolders,
  };


const librarySettingsListeners =
  new Set<
    (
      settings:
        LibrarySettingsSnapshot
    ) => void
  >();


function normalizeExcludedFolders(
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


  return Array.from(
    new Set(
      value
        .filter(
          item =>
            typeof item ===
              'string'
        )
        .map(
          item =>
            item
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
              .trim()
        )
        .filter(
          Boolean
        )
    )
  );
}


function emitLibrarySettings(
  settings:
    ExtendedAppSettings
) {
  currentLibrarySettings = {
    minDuration:
      Number(
        settings.minDuration
      ) || 0,

    excludedFolders:
      normalizeExcludedFolders(
        settings.excludedFolders
      ),
  };


  librarySettingsListeners.forEach(
    listener => {
      listener(
        currentLibrarySettings
      );
    }
  );
}


export function getLibrarySettingsSnapshot():
  LibrarySettingsSnapshot {
  return {
    minDuration:
      currentLibrarySettings.minDuration,

    excludedFolders:
      [
        ...currentLibrarySettings
          .excludedFolders,
      ],
  };
}


export function subscribeLibrarySettings(
  listener:
    (
      settings:
        LibrarySettingsSnapshot
    ) => void
) {
  librarySettingsListeners.add(
    listener
  );


  return () => {
    librarySettingsListeners.delete(
      listener
    );
  };
}


/* =========================================================
   HOOK
========================================================= */

export function useSettings() {
  const [
    settings,
    setSettings,
  ] =
    useState<
      ExtendedAppSettings
    >(
      DEFAULTS
    );


  const [
    loaded,
    setLoaded,
  ] =
    useState(
      false
    );


  /* =======================================================
     CARGAR AJUSTES
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
                ) as
                  Partial<
                    ExtendedAppSettings
                  >;


              const next:
                ExtendedAppSettings = {
                  ...DEFAULTS,

                  ...parsed,

                  excludedFolders:
                    normalizeExcludedFolders(
                      parsed.excludedFolders
                    ),
                };


              setSettings(
                next
              );


              emitLibrarySettings(
                next
              );
            } else {
              emitLibrarySettings(
                DEFAULTS
              );
            }
          } catch (
            error
          ) {
            console.log(
              'Error cargando ajustes:',
              error
            );


            emitLibrarySettings(
              DEFAULTS
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
     GUARDAR AJUSTES
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
            settings
          )
        )
        .catch(
          error => {
            console.log(
              'Error guardando ajustes:',
              error
            );
          }
        );
    },
    [
      settings,
      loaded,
    ]
  );


  /* =======================================================
     ACTUALIZAR AJUSTES
  ======================================================= */

  const updateSettings =
    useCallback(
      (
        patch:
          Partial<
            ExtendedAppSettings
          >
      ) => {
        setSettings(
          current => {
            const next:
              ExtendedAppSettings = {
                ...current,

                ...patch,

                excludedFolders:
                  patch.excludedFolders !==
                    undefined

                    ? normalizeExcludedFolders(
                        patch.excludedFolders
                      )

                    : current
                        .excludedFolders,
              };


            /*
             * Avisamos inmediatamente a
             * useMusicLibrary.
             *
             * Así no necesitamos cerrar la
             * pantalla ni volver a abrir Hmusic.
             */
            emitLibrarySettings(
              next
            );


            return next;
          }
        );
      },
      []
    );


  return {
    settings,

    updateSettings,
  };
}
