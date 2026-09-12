import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../constants/colors';

import { getSongDetails } from '../services/musicLibrary';

import {
  addLyricsFolderResultListener,
  findSidecarLyrics,
  getLyricsFolder,
  requestLyricsFolder,
} from '../services/lyricsFiles';

import type {
  Song,
  TrackDetails,
} from '../types/Song';


/* =========================================================
   PROPS
========================================================= */

interface Props {
  visible: boolean;

  song: Song;

  currentTime: number;

  onClose: () => void;
}


/* =========================================================
   LÍNEA SINCRONIZADA
========================================================= */

interface TimedLyricLine {
  time: number;

  text: string;
}


/* =========================================================
   ORIGEN DE LA LETRA
========================================================= */

type LyricsSource =
  | {
      kind: 'embedded';

      content: string;

      label: string;
    }
  | {
      kind: 'lrc';

      content: string;

      label: string;
    }
  | {
      kind: 'txt';

      content: string;

      label: string;
    };


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalizeLyricsText(
  value: string
) {
  return value
    .replace(
      /\r\n/g,
      '\n'
    )
    .replace(
      /\r/g,
      '\n'
    )
    .replace(
      /\n{3,}/g,
      '\n\n'
    )
    .trim();
}


/* =========================================================
   PARSEAR LRC
========================================================= */

function parseLrc(
  content: string
): TimedLyricLine[] {
  const lines =
    normalizeLyricsText(
      content
    ).split(
      '\n'
    );


  const result:
    TimedLyricLine[] =
      [];


  /*
   * Soporta:
   *
   * [00:12]Texto
   * [00:12.5]Texto
   * [00:12.50]Texto
   * [00:12.500]Texto
   * [00:12,500]Texto
   * [00:12:500]Texto
   */

  const timestampRegex =
    /\[(\d{1,3}):(\d{1,2})(?:[.,:](\d{1,3}))?\]/g;


  for (
    const originalLine
    of lines
  ) {
    const timestamps:
      number[] =
        [];


    timestampRegex.lastIndex =
      0;


    let match:
      RegExpExecArray | null;


    while (
      (
        match =
          timestampRegex.exec(
            originalLine
          )
      ) !==
      null
    ) {
      const minutes =
        Number(
          match[1]
        );


      const seconds =
        Number(
          match[2]
        );


      const fractionRaw =
        match[3] ??
        '';


      let fraction =
        0;


      if (
        fractionRaw.length ===
        1
      ) {
        fraction =
          Number(
            fractionRaw
          ) / 10;
      }

      else if (
        fractionRaw.length ===
        2
      ) {
        fraction =
          Number(
            fractionRaw
          ) / 100;
      }

      else if (
        fractionRaw.length >=
        3
      ) {
        fraction =
          Number(
            fractionRaw.slice(
              0,
              3
            )
          ) / 1000;
      }


      const totalSeconds =
        (
          minutes *
          60
        ) +
        seconds +
        fraction;


      if (
        Number.isFinite(
          totalSeconds
        )
      ) {
        timestamps.push(
          totalSeconds
        );
      }
    }


    timestampRegex.lastIndex =
      0;


    if (
      timestamps.length ===
      0
    ) {
      continue;
    }


    const lyricText =
      originalLine
        .replace(
          timestampRegex,
          ''
        )
        .trim();


    timestampRegex.lastIndex =
      0;


    timestamps.forEach(
      time => {
        result.push({
          time,
          text:
            lyricText,
        });
      }
    );
  }


  return result.sort(
    (
      a,
      b
    ) =>
      a.time -
      b.time
  );
}


/* =========================================================
   QUITAR MARCAS LRC
========================================================= */

function removeLrcMetadata(
  content: string
) {
  return normalizeLyricsText(
    content
  )
    .split(
      '\n'
    )
    .filter(
      line =>
        !/^\[(ar|ti|al|by|offset|re|ve|length):/i
          .test(
            line.trim()
          )
    )
    .map(
      line =>
        line.replace(
          /\[(\d{1,3}):(\d{1,2})(?:[.,:](\d{1,3}))?\]/g,
          ''
        )
    )
    .join(
      '\n'
    )
    .replace(
      /\n{3,}/g,
      '\n\n'
    )
    .trim();
}


/* =========================================================
   LYRICS MODAL
========================================================= */

export default function LyricsModal({
  visible,
  song,
  currentTime,
  onClose,
}: Props) {
  /* =======================================================
     REFERENCIAS
  ======================================================= */

  const syncedListRef =
    useRef<
      ScrollView
    >(
      null
    );


  /*
   * Posición Y real de cada línea sincronizada.
   * Usamos ScrollView para evitar el ciclo interno de
   * VirtualizedList/scrollToIndex que estaba provocando
   * los warnings y el "Maximum update depth exceeded".
   */
  const syncedLinePositions =
    useRef<
      Record<
        number,
        number
      >
    >({});


  const syncedListPositioned =
    useRef(
      false
    );


  const staticScrollRef =
    useRef<
      ScrollView
    >(
      null
    );


  /* =======================================================
     AUTO SCROLL SINCRONIZADO
  ======================================================= */

  const lastSyncedIndex =
    useRef(
      -1
    );


  /* =======================================================
     AUTO SCROLL APROXIMADO
  ======================================================= */

  const staticContentHeight =
    useRef(
      0
    );


  const staticViewportHeight =
    useRef(
      0
    );


  const lastApproxSecond =
    useRef(
      -1
    );


  /*
   * Si el usuario mueve manualmente
   * la letra, dejamos de seguirla
   * durante unos segundos.
   */

  const manualScrollUntil =
    useRef(
      0
    );


  /*
   * Evita que loadLyrics se vuelva a crear solo porque el
   * objeto song cambie de referencia manteniendo el mismo id.
   */
  const songRef =
    useRef(
      song
    );

  songRef.current =
    song;


  /*
   * Invalida cargas viejas si se cambia de canción o se
   * dispara otra búsqueda antes de que termine la anterior.
   */
  const lyricsRequestId =
    useRef(
      0
    );


  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    source,
    setSource,
  ] =
    useState<
      LyricsSource | null
    >(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      false
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
    folderConfigured,
    setFolderConfigured,
  ] =
    useState(
      false
    );


  const [
    folderName,
    setFolderName,
  ] =
    useState<
      string | null
    >(
      null
    );


  const [
    selectingFolder,
    setSelectingFolder,
  ] =
    useState(
      false
    );


  /* =======================================================
     DURACIÓN
  ======================================================= */

  const songDuration =
    Number.isFinite(
      song.duration
    ) &&
    song.duration >
      0

      ? song.duration

      : 0;


  /* =======================================================
     CARGAR LETRAS
  ======================================================= */

  const loadLyrics =
    useCallback(
      async () => {
        const requestId =
          lyricsRequestId.current +
          1;

        lyricsRequestId.current =
          requestId;

        const songSnapshot =
          songRef.current;


        try {
          setLoading(
            true
          );


          setError(
            null
          );


          setSource(
            null
          );


          lastSyncedIndex.current =
            -1;


          syncedListPositioned.current =
            false;


          syncedLinePositions.current =
            {};


          lastApproxSecond.current =
            -1;


          staticContentHeight.current =
            0;


          staticViewportHeight.current =
            0;


          /* =================================================
             1. LETRA EMBEBIDA
          ================================================= */

          let details:
            TrackDetails | null =
              null;


          try {
            details =
              await getSongDetails(
                songSnapshot.id
              );
          }

          catch (
            metadataError
          ) {
            console.log(
              'No se pudo leer la letra embebida:',
              metadataError
            );
          }


          const embedded =
            details
              ?.lyrics
              ?.trim();


          if (
            embedded
          ) {
            setSource({
              kind:
                'embedded',

              content:
                normalizeLyricsText(
                  embedded
                ),

              label:
                'Letra embebida en el archivo de audio',
            });


            const folder =
              await getLyricsFolder();


            setFolderConfigured(
              Boolean(
                folder
              )
            );


            setFolderName(
              folder?.name ??
              null
            );


            return;
          }


          /* =================================================
             2. CARPETA AUTORIZADA
          ================================================= */

          const folder =
            await getLyricsFolder();


          setFolderConfigured(
            Boolean(
              folder
            )
          );


          setFolderName(
            folder?.name ??
            null
          );


          if (
            !folder
          ) {
            return;
          }


          /* =================================================
             3. .LRC / .TXT
          ================================================= */

          const sidecar =
            await findSidecarLyrics(
              songSnapshot
            );


          if (
            !sidecar
          ) {
            return;
          }


          setSource({
            kind:
              sidecar.format,

            content:
              normalizeLyricsText(
                sidecar.content
              ),

            label:
              sidecar.format ===
                'lrc'

                ? `Archivo LRC: ${sidecar.fileName}`

                : `Archivo de letras: ${sidecar.fileName}`,
          });
        }

        catch (
          err
        ) {
          console.log(
            'Error cargando letras:',
            err
          );


          setError(
            'No se pudieron cargar las letras de esta canción.'
          );
        }

        finally {
          if (
            lyricsRequestId.current ===
            requestId
          ) {
            setLoading(
              false
            );
          }
        }
      },

      [
        song.id,
      ]
    );


  /* =======================================================
     ABRIR MODAL
  ======================================================= */

  useEffect(
    () => {
      if (
        !visible
      ) {
        return;
      }


      void loadLyrics();
    },

    [
      visible,
      loadLyrics,
    ]
  );


  useEffect(
    () => {
      if (
        visible
      ) {
        return;
      }

      lyricsRequestId.current +=
        1;
    },
    [
      visible,
    ]
  );


  /* =======================================================
     RESPUESTA DEL SELECTOR
  ======================================================= */

  useEffect(
    () => {
      const subscription =
        addLyricsFolderResultListener(
          event => {
            setSelectingFolder(
              false
            );


            if (
              !event.granted
            ) {
              return;
            }


            setFolderConfigured(
              true
            );


            setFolderName(
              event.name ??
              'Carpeta de letras'
            );


            void loadLyrics();
          }
        );


      return () => {
        subscription.remove();
      };
    },

    [
      loadLyrics,
    ]
  );


  /* =======================================================
     SELECCIONAR CARPETA
  ======================================================= */

  const chooseLyricsFolder =
    useCallback(
      async () => {
        try {
          setSelectingFolder(
            true
          );


          await requestLyricsFolder();
        }

        catch (
          err
        ) {
          console.log(
            'Error abriendo selector de carpeta:',
            err
          );


          setSelectingFolder(
            false
          );


          setError(
            'No se pudo abrir el selector de carpetas.'
          );
        }
      },

      []
    );


  /* =======================================================
     LRC
  ======================================================= */

  const timedLines =
    useMemo(
      () => {
        if (
          !source
        ) {
          return [];
        }


        return parseLrc(
          source.content
        );
      },

      [
        source,
      ]
    );


  const hasTimedLyrics =
    timedLines.length >
    0;


  /* =======================================================
     LÍNEA ACTUAL
  ======================================================= */

  const activeLineIndex =
    useMemo(
      () => {
        if (
          timedLines.length ===
          0
        ) {
          return -1;
        }


        let active =
          -1;


        for (
          let index =
            0;

          index <
          timedLines.length;

          index++
        ) {
          if (
            timedLines[
              index
            ].time <=
            currentTime +
              0.1
          ) {
            active =
              index;
          }

          else {
            break;
          }
        }


        return active;
      },

      [
        currentTime,
        timedLines,
      ]
    );


  /* =======================================================
     AUTO SCROLL LRC REAL

     ScrollView simple:
     - sin VirtualizedList
     - sin scrollToIndex
     - sin reintentos internos
     - solo se mueve cuando cambia de línea
  ======================================================= */

  useEffect(
    () => {
      if (
        !visible ||
        !hasTimedLyrics ||
        activeLineIndex <
          0
      ) {
        return;
      }


      if (
        lastSyncedIndex.current ===
        activeLineIndex
      ) {
        return;
      }


      const y =
        syncedLinePositions
          .current[
            activeLineIndex
          ];


      /*
       * Si la línea todavía no ha terminado de medir,
       * esperamos al siguiente cambio/render. No forzamos
       * ningún scroll ni generamos reintentos.
       */
      if (
        typeof y !==
        'number'
      ) {
        return;
      }


      lastSyncedIndex.current =
        activeLineIndex;


      const shouldAnimate =
        syncedListPositioned.current;

      syncedListPositioned.current =
        true;


      syncedListRef.current
        ?.scrollTo({
          y:
            Math.max(
              0,
              y -
                150
            ),

          /*
           * Al abrir una canción avanzada vamos directo
           * a la línea correcta. Las siguientes líneas
           * sí se desplazan suavemente.
           */
          animated:
            shouldAnimate,
        });
    },

    [
      visible,
      hasTimedLyrics,
      activeLineIndex,
    ]
  );


  /* =======================================================
     PROGRESO APROXIMADO
  ======================================================= */

  const approximateProgress =
    useMemo(
      () => {
        if (
          songDuration <=
          0
        ) {
          return 0;
        }


        return Math.min(
          1,

          Math.max(
            0,

            currentTime /
              songDuration
          )
        );
      },

      [
        currentTime,
        songDuration,
      ]
    );


  const approximatePercent =
    Math.round(
      approximateProgress *
      100
    );


  /* =======================================================
     AUTO SCROLL PARA LETRAS SIN TIEMPO

     Se mueve aproximadamente una vez
     por segundo según el porcentaje
     de reproducción.
  ======================================================= */

  useEffect(
    () => {
      if (
        !visible ||
        !source ||
        hasTimedLyrics ||
        songDuration <=
          0
      ) {
        return;
      }


      const currentSecond =
        Math.floor(
          currentTime
        );


      if (
        currentSecond ===
        lastApproxSecond.current
      ) {
        return;
      }


      lastApproxSecond.current =
        currentSecond;


      /*
       * Usuario movió la letra:
       * pausamos temporalmente
       * el seguimiento.
       */

      if (
        Date.now() <
        manualScrollUntil.current
      ) {
        return;
      }


      const contentHeight =
        staticContentHeight.current;


      const viewportHeight =
        staticViewportHeight.current;


      const maxScroll =
        Math.max(
          0,

          contentHeight -
          viewportHeight
        );


      if (
        maxScroll <=
        0
      ) {
        return;
      }


      /*
       * El porcentaje de canción
       * determina aproximadamente
       * la posición de la letra.
       */

      const targetY =
        maxScroll *
        approximateProgress;


      staticScrollRef.current
        ?.scrollTo({
          y:
            targetY,

          animated:
            true,
        });
    },

    [
      visible,
      source,
      hasTimedLyrics,
      currentTime,
      songDuration,
      approximateProgress,
    ]
  );


  /* =======================================================
     LETRA ESTÁTICA
  ======================================================= */

  const staticLyrics =
    useMemo(
      () => {
        if (
          !source
        ) {
          return '';
        }


        if (
          source.kind ===
          'lrc'
        ) {
          return removeLrcMetadata(
            source.content
          );
        }


        return normalizeLyricsText(
          source.content
        );
      },

      [
        source,
      ]
    );


  /* =======================================================
     RENDER LÍNEA LRC
  ======================================================= */

  const renderTimedLine =
    useCallback(
      (
        item:
          TimedLyricLine,

        index:
          number
      ) => {
        const active =
          index ===
          activeLineIndex;


        const passed =
          activeLineIndex >
          index;


        const distance =
          activeLineIndex >=
            0

            ? Math.abs(
                index -
                activeLineIndex
              )

            : 999;


        const near =
          !active &&
          distance ===
            1;


        return (
          <View
            key={`${item.time}-${index}`}

            onLayout={
              event => {
                syncedLinePositions
                  .current[
                    index
                  ] =
                  event
                    .nativeEvent
                    .layout
                    .y;
              }
            }

            style={[
              styles.timedLineContainer,

              active &&
                styles.activeLineContainer,
            ]}
          >
            {active ? (
              <View
                style={styles.nowRow}
              >
                <View
                  style={styles.nowDot}
                />


                <Text
                  style={styles.nowText}
                >
                  AHORA
                </Text>
              </View>
            ) : null}


            <Text
              style={[
                styles.timedLine,

                near &&
                  styles.nearTimedLine,

                passed &&
                !near &&
                !active &&
                  styles.passedTimedLine,

                active &&
                  styles.activeTimedLine,
              ]}
            >
              {
                item.text ||
                '♪'
              }
            </Text>
          </View>
        );
      },

      [
        activeLineIndex,
      ]
    );


  /* =======================================================
     INTERFAZ
  ======================================================= */

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={styles.container}
      >
        {/* ===============================================
            FONDO
        =============================================== */}

        {song.artwork ? (
          <Image
            source={{
              uri:
                song.artwork,
            }}
            blurRadius={55}
            resizeMode="cover"
            style={styles.backgroundImage}
          />
        ) : null}


        <View
          style={styles.backgroundOverlay}
        />


        <SafeAreaView
          style={styles.safeArea}
        >
          {/* =============================================
              HEADER
          ============================================= */}

          <View
            style={styles.header}
          >
            <TouchableOpacity
              style={styles.headerButton}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={30}
                color={COLORS.white}
              />
            </TouchableOpacity>


            <View
              style={styles.headerText}
            >
              <Text
                style={styles.headerLabel}
              >
                LETRAS
              </Text>


              <Text
                style={styles.headerTitle}
                numberOfLines={1}
              >
                {song.title}
              </Text>
            </View>


            <TouchableOpacity
              style={[
                styles.headerButton,

                folderConfigured &&
                  styles.folderButtonActive,
              ]}
              activeOpacity={0.7}
              disabled={selectingFolder}
              onPress={() => {
                void chooseLyricsFolder();
              }}
            >
              {selectingFolder ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.purpleLight}
                />
              ) : (
                <MaterialCommunityIcons
                  name="folder-music-outline"
                  size={22}
                  color={
                    folderConfigured
                      ? COLORS.purpleLight
                      : COLORS.white
                  }
                />
              )}
            </TouchableOpacity>
          </View>


          {/* =============================================
              INFORMACIÓN CANCIÓN
          ============================================= */}

          <View
            style={styles.songInfo}
          >
            <View
              style={styles.musicIcon}
            >
              <MaterialCommunityIcons
                name={
                  hasTimedLyrics
                    ? 'music-note-eighth'
                    : 'music-note'
                }
                size={22}
                color={COLORS.purpleLight}
              />
            </View>


            <View
              style={styles.songText}
            >
              <Text
                style={styles.songTitle}
                numberOfLines={1}
              >
                {song.title}
              </Text>


              <Text
                style={styles.artist}
                numberOfLines={1}
              >
                {song.artist}
              </Text>


              {source ? (
                <View
                  style={styles.sourceRow}
                >
                  <MaterialCommunityIcons
                    name={
                      hasTimedLyrics
                        ? 'sync'
                        : 'music-note-outline'
                    }
                    size={12}
                    color={
                      hasTimedLyrics
                        ? COLORS.purpleLight
                        : COLORS.textSecondary
                    }
                  />


                  <Text
                    style={[
                      styles.sourceText,

                      !hasTimedLyrics &&
                        styles.sourceTextStatic,
                    ]}
                    numberOfLines={1}
                  >
                    {
                      hasTimedLyrics

                        ? `${source.label} · sincronización real`

                        : `${source.label} · seguimiento aproximado`
                    }
                  </Text>
                </View>
              ) : folderName ? (
                <Text
                  style={styles.folderName}
                  numberOfLines={1}
                >
                  Buscando en {folderName}
                </Text>
              ) : null}
            </View>
          </View>


          {/* =============================================
              CARGANDO
          ============================================= */}

          {loading ? (
            <View
              style={styles.center}
            >
              <ActivityIndicator
                size="large"
                color={COLORS.purpleLight}
              />


              <Text
                style={styles.loadingText}
              >
                Buscando letras...
              </Text>
            </View>
          ) :


          /* =============================================
             ERROR
          ============================================= */

          error ? (
            <View
              style={styles.center}
            >
              <View
                style={styles.emptyIcon}
              >
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={44}
                  color={COLORS.textSecondary}
                />
              </View>


              <Text
                style={styles.emptyTitle}
              >
                No pudimos cargar las letras
              </Text>


              <Text
                style={styles.emptyDescription}
              >
                {error}
              </Text>


              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.8}
                onPress={() => {
                  void loadLyrics();
                }}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={19}
                  color={COLORS.white}
                />


                <Text
                  style={styles.primaryButtonText}
                >
                  Intentar nuevamente
                </Text>
              </TouchableOpacity>
            </View>
          ) :


          /* =============================================
             LRC CON TIEMPOS
          ============================================= */

          source &&
          hasTimedLyrics ? (
            <ScrollView
              ref={syncedListRef}

              style={styles.list}

              contentContainerStyle={
                styles.syncedLyricsContent
              }

              showsVerticalScrollIndicator={
                false
              }

              onScrollBeginDrag={() => {
                manualScrollUntil.current =
                  Date.now() +
                  4500;
              }}
            >
              <View
                style={styles.syncedHeaderSpace}
              >
                <View
                  style={styles.modeBadge}
                >
                  <View
                    style={styles.modeDot}
                  />

                  <Text
                    style={styles.modeBadgeText}
                  >
                    SINCRONIZACIÓN REAL
                  </Text>
                </View>
              </View>


              {timedLines.map(
                (
                  item,
                  index
                ) =>
                  renderTimedLine(
                    item,
                    index
                  )
              )}


              <View
                style={styles.syncedFooter}
              >
                <MaterialCommunityIcons
                  name="sync"
                  size={16}
                  color={COLORS.purpleLight}
                />


                <Text
                  style={styles.syncedFooterText}
                >
                  La línea sigue las marcas de tiempo del archivo
                </Text>
              </View>
            </ScrollView>
          ) :


          /* =============================================
             LETRA SIN TIEMPOS
          ============================================= */

          source ? (
            <ScrollView
              ref={staticScrollRef}

              style={styles.list}

              contentContainerStyle={
                styles.staticLyricsContent
              }

              showsVerticalScrollIndicator={
                false
              }

              onLayout={
                event => {
                  staticViewportHeight.current =
                    event
                      .nativeEvent
                      .layout
                      .height;
                }
              }

              onContentSizeChange={(
                _width,
                height
              ) => {
                staticContentHeight.current =
                  height;
              }}

              onScrollBeginDrag={() => {
                /*
                 * 7 segundos de libertad
                 * para leer manualmente.
                 */

                manualScrollUntil.current =
                  Date.now() +
                  7000;
              }}

              scrollEventThrottle={16}
            >
              {/* ===========================================
                  MODO APROXIMADO
              =========================================== */}

              <View
                style={styles.approxCard}
              >
                <View
                  style={styles.approxTopRow}
                >
                  <View
                    style={styles.approxTitleRow}
                  >
                    <MaterialCommunityIcons
                      name="music-note-outline"
                      size={18}
                      color={COLORS.purpleLight}
                    />


                    <Text
                      style={styles.approxTitle}
                    >
                      Seguimiento aproximado
                    </Text>
                  </View>


                  <Text
                    style={styles.approxPercent}
                  >
                    {approximatePercent}%
                  </Text>
                </View>


                <Text
                  style={styles.approxDescription}
                >
                  Esta letra no contiene tiempos por línea. Hmusic la desplaza automáticamente según el progreso de la canción.
                </Text>


                <View
                  style={styles.approxTrack}
                >
                  <View
                    style={[
                      styles.approxProgress,

                      {
                        width:
                          `${approximatePercent}%`,
                      },
                    ]}
                  />
                </View>


                <View
                  style={styles.approxHintRow}
                >
                  <MaterialCommunityIcons
                    name="gesture-swipe-vertical"
                    size={15}
                    color={COLORS.textSecondary}
                  />


                  <Text
                    style={styles.approxHint}
                  >
                    Si desplazas manualmente, el seguimiento se pausa unos segundos.
                  </Text>
                </View>
              </View>


              {/* ===========================================
                  LETRA
              =========================================== */}

              <Text
                selectable
                style={styles.staticLyrics}
              >
                {staticLyrics}
              </Text>


              {/* ===========================================
                  FOOTER
              =========================================== */}

              <View
                style={styles.staticFooter}
              >
                <MaterialCommunityIcons
                  name="file-music-outline"
                  size={16}
                  color={COLORS.textMuted}
                />


                <Text
                  style={styles.staticFooterText}
                >
                  {source.label}
                </Text>
              </View>
            </ScrollView>
          ) :


          /* =============================================
             SIN LETRAS
          ============================================= */

          (
            <View
              style={styles.center}
            >
              <View
                style={styles.emptyIconPurple}
              >
                <MaterialCommunityIcons
                  name="text-box-search-outline"
                  size={48}
                  color={COLORS.purpleLight}
                />
              </View>


              <Text
                style={styles.emptyTitle}
              >
                No hay letras disponibles
              </Text>


              <Text
                style={styles.emptyDescription}
              >
                {
                  folderConfigured

                    ? 'No encontramos una letra embebida ni un archivo .lrc o .txt compatible.'

                    : 'Selecciona la carpeta donde guardas los archivos .lrc o .txt.'
                }
              </Text>


              <TouchableOpacity
                style={styles.primaryButton}
                disabled={selectingFolder}
                activeOpacity={0.8}
                onPress={() => {
                  void chooseLyricsFolder();
                }}
              >
                {selectingFolder ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.white}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="folder-open-outline"
                    size={20}
                    color={COLORS.white}
                  />
                )}


                <Text
                  style={styles.primaryButtonText}
                >
                  {
                    folderConfigured

                      ? 'Cambiar carpeta de letras'

                      : 'Seleccionar carpeta de letras'
                  }
                </Text>
              </TouchableOpacity>


              {folderConfigured ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.75}
                  onPress={() => {
                    void loadLyrics();
                  }}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={18}
                    color={COLORS.purpleLight}
                  />


                  <Text
                    style={styles.secondaryButtonText}
                  >
                    Buscar nuevamente
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}


/* =========================================================
   ESTILOS
========================================================= */

const styles =
  StyleSheet.create({
    /* =====================================================
       GENERAL
    ===================================================== */

    container: {
      flex:
        1,

      backgroundColor:
        COLORS.background,
    },


    safeArea: {
      flex:
        1,
    },


    list: {
      flex:
        1,
    },


    /* =====================================================
       FONDO
    ===================================================== */

    backgroundImage: {
      position:
        'absolute',

      top:
        -55,

      left:
        -55,

      right:
        -55,

      bottom:
        -55,

      opacity:
        0.78,
    },


    backgroundOverlay: {
      position:
        'absolute',

      top:
        0,

      left:
        0,

      right:
        0,

      bottom:
        0,

      backgroundColor:
        'rgba(8,8,12,0.68)',
    },


    /* =====================================================
       HEADER
    ===================================================== */

    header: {
      height:
        66,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        16,
    },


    headerButton: {
      width:
        46,

      height:
        46,

      borderRadius:
        23,

      backgroundColor:
        'rgba(255,255,255,0.09)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.14)',

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    folderButtonActive: {
      backgroundColor:
        'rgba(139,92,246,0.14)',

      borderColor:
        'rgba(167,139,250,0.30)',
    },


    headerText: {
      flex:
        1,

      alignItems:
        'center',

      paddingHorizontal:
        12,
    },


    headerLabel: {
      color:
        '#CBCBD2',

      fontSize:
        9,

      letterSpacing:
        1.7,

      fontWeight:
        '800',
    },


    headerTitle: {
      color:
        COLORS.white,

      fontSize:
        13,

      fontWeight:
        '700',

      marginTop:
        4,

      maxWidth:
        240,
    },


    /* =====================================================
       INFO CANCIÓN
    ===================================================== */

    songInfo: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginHorizontal:
        20,

      marginTop:
        7,

      marginBottom:
        6,

      paddingHorizontal:
        13,

      paddingVertical:
        11,

      borderRadius:
        19,

      backgroundColor:
        'rgba(255,255,255,0.075)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.11)',
    },


    musicIcon: {
      width:
        44,

      height:
        44,

      borderRadius:
        14,

      backgroundColor:
        'rgba(139,92,246,0.15)',

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    songText: {
      flex:
        1,

      marginLeft:
        12,
    },


    songTitle: {
      color:
        COLORS.white,

      fontSize:
        14,

      fontWeight:
        '700',
    },


    artist: {
      color:
        '#D0D0D7',

      fontSize:
        11,

      marginTop:
        3,
    },


    sourceRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginTop:
        5,

      gap:
        5,
    },


    sourceText: {
      flex:
        1,

      color:
        COLORS.purpleLight,

      fontSize:
        9,

      fontWeight:
        '600',
    },


    sourceTextStatic: {
      color:
        COLORS.textSecondary,
    },


    folderName: {
      color:
        COLORS.textSecondary,

      fontSize:
        9,

      marginTop:
        5,
    },


    /* =====================================================
       LRC SINCRONIZADO
    ===================================================== */

    syncedLyricsContent: {
      paddingHorizontal:
        18,

      paddingBottom:
        220,
    },


    syncedHeaderSpace: {
      height:
        180,

      justifyContent:
        'flex-end',

      paddingBottom:
        15,
    },


    modeBadge: {
      alignSelf:
        'flex-start',

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        12,

      paddingVertical:
        7,

      borderRadius:
        18,

      backgroundColor:
        'rgba(139,92,246,0.13)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(167,139,250,0.22)',
    },


    modeDot: {
      width:
        5,

      height:
        5,

      borderRadius:
        3,

      backgroundColor:
        COLORS.purpleLight,

      marginRight:
        7,
    },


    modeBadgeText: {
      color:
        COLORS.purpleLight,

      fontSize:
        8,

      fontWeight:
        '800',

      letterSpacing:
        1.1,
    },


    timedLineContainer: {
      paddingHorizontal:
        14,

      paddingVertical:
        15,

      marginVertical:
        3,

      borderRadius:
        21,

      minHeight:
        64,

      justifyContent:
        'center',
    },


    activeLineContainer: {
      backgroundColor:
        'rgba(139,92,246,0.13)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(167,139,250,0.25)',

      paddingVertical:
        17,
    },


    nowRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom:
        7,
    },


    nowDot: {
      width:
        5,

      height:
        5,

      borderRadius:
        3,

      backgroundColor:
        COLORS.purpleLight,

      marginRight:
        6,
    },


    nowText: {
      color:
        COLORS.purpleLight,

      fontSize:
        8,

      fontWeight:
        '800',

      letterSpacing:
        1.3,
    },


    timedLine: {
      color:
        'rgba(255,255,255,0.27)',

      fontSize:
        21,

      lineHeight:
        30,

      fontWeight:
        '600',
    },


    nearTimedLine: {
      color:
        'rgba(255,255,255,0.63)',

      fontSize:
        23,

      lineHeight:
        32,
    },


    passedTimedLine: {
      color:
        'rgba(255,255,255,0.38)',
    },


    activeTimedLine: {
      color:
        COLORS.white,

      fontSize:
        29,

      lineHeight:
        38,

      fontWeight:
        '800',

      letterSpacing:
        -0.2,
    },


    syncedFooter: {
      minHeight:
        220,

      flexDirection:
        'row',

      justifyContent:
        'center',

      alignItems:
        'flex-start',

      gap:
        7,

      paddingTop:
        35,
    },


    syncedFooterText: {
      color:
        COLORS.purpleLight,

      fontSize:
        10,

      fontWeight:
        '600',
    },


    /* =====================================================
       LETRA SIN TIEMPOS
    ===================================================== */

    staticLyricsContent: {
      paddingHorizontal:
        25,

      paddingTop:
        20,

      paddingBottom:
        140,
    },


    approxCard: {
      padding:
        15,

      marginBottom:
        28,

      borderRadius:
        19,

      backgroundColor:
        'rgba(139,92,246,0.10)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(167,139,250,0.20)',
    },


    approxTopRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },


    approxTitleRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        7,
    },


    approxTitle: {
      color:
        COLORS.white,

      fontSize:
        12,

      fontWeight:
        '700',
    },


    approxPercent: {
      color:
        COLORS.purpleLight,

      fontSize:
        11,

      fontWeight:
        '800',
    },


    approxDescription: {
      color:
        '#B9B9C2',

      fontSize:
        10,

      lineHeight:
        16,

      marginTop:
        9,
    },


    approxTrack: {
      height:
        4,

      width:
        '100%',

      borderRadius:
        2,

      overflow:
        'hidden',

      backgroundColor:
        'rgba(255,255,255,0.12)',

      marginTop:
        13,
    },


    approxProgress: {
      height:
        '100%',

      borderRadius:
        2,

      backgroundColor:
        COLORS.purpleLight,
    },


    approxHintRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        6,

      marginTop:
        11,
    },


    approxHint: {
      flex:
        1,

      color:
        COLORS.textMuted,

      fontSize:
        9,

      lineHeight:
        14,
    },


    staticLyrics: {
      color:
        'rgba(255,255,255,0.94)',

      fontSize:
        21,

      lineHeight:
        34,

      fontWeight:
        '600',

      letterSpacing:
        0.05,
    },


    staticFooter: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        7,

      marginTop:
        45,

      paddingTop:
        20,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderTopColor:
        'rgba(255,255,255,0.12)',
    },


    staticFooterText: {
      flex:
        1,

      color:
        COLORS.textMuted,

      fontSize:
        10,

      textAlign:
        'center',
    },


    /* =====================================================
       ESTADOS
    ===================================================== */

    center: {
      flex:
        1,

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal:
        32,

      paddingBottom:
        60,
    },


    loadingText: {
      color:
        COLORS.textSecondary,

      fontSize:
        12,

      marginTop:
        15,
    },


    emptyIcon: {
      width:
        88,

      height:
        88,

      borderRadius:
        44,

      backgroundColor:
        'rgba(255,255,255,0.07)',

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    emptyIconPurple: {
      width:
        88,

      height:
        88,

      borderRadius:
        44,

      backgroundColor:
        'rgba(139,92,246,0.13)',

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    emptyTitle: {
      color:
        COLORS.white,

      fontSize:
        20,

      fontWeight:
        '700',

      textAlign:
        'center',

      marginTop:
        22,
    },


    emptyDescription: {
      color:
        '#C0C0C8',

      fontSize:
        13,

      lineHeight:
        20,

      textAlign:
        'center',

      marginTop:
        9,

      maxWidth:
        340,
    },


    /* =====================================================
       BOTONES
    ===================================================== */

    primaryButton: {
      minHeight:
        48,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        8,

      backgroundColor:
        COLORS.purple,

      paddingHorizontal:
        20,

      paddingVertical:
        12,

      borderRadius:
        24,

      marginTop:
        24,
    },


    primaryButtonText: {
      color:
        COLORS.white,

      fontSize:
        12,

      fontWeight:
        '700',
    },


    secondaryButton: {
      minHeight:
        44,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        7,

      paddingHorizontal:
        17,

      marginTop:
        8,
    },


    secondaryButtonText: {
      color:
        COLORS.purpleLight,

      fontSize:
        11,

      fontWeight:
        '600',
    },
  });