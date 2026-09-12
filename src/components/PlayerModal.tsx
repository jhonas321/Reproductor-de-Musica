import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  COLORS,
} from '../constants/colors';

import {
  useApp,
  usePlayerProgress,
} from '../context/AppContext';

import {
  getArtworkTheme,
} from '../utils/artworkTheme';

import type {
  RepeatMode,
  Song,
} from '../types/Song';

import Artwork from './Artwork';
import EqualizerModal from './EqualizerModal';
import LyricsModal from './LyricsModal';
import ProgressBar from './ProgressBar';


interface Props {
  visible: boolean;

  song: Song;

  playing: boolean;

  shuffle: boolean;

  repeatMode: RepeatMode;

  favorite: boolean;

  onClose: () => void;

  onPrevious: () => void;

  onPlayPause: () => void;

  onNext: () => void;

  onShuffle: () => void;

  onRepeat: () => void;

  onFavorite: () => void;

  onSeek: (
    seconds: number
  ) => void;

  onQueue: () => void;

  onSleepTimer: () => void;
}


interface FooterActionProps {
  icon:
    keyof typeof MaterialCommunityIcons.glyphMap;

  label:
    string;

  active?:
    boolean;

  compact?:
    boolean;

  onPress:
    () => void;
}


function FooterAction({
  icon,
  label,
  active = false,
  compact = false,
  onPress,
}: FooterActionProps) {
  return (
    <TouchableOpacity
      style={[
        styles.footerAction,

        compact &&
          styles.footerActionCompact,

        active &&
          styles.footerActionActive,
      ]}
      activeOpacity={0.72}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.footerIcon,

          compact &&
            styles.footerIconCompact,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={
            compact
              ? 19
              : 22
          }
          color={
            active
              ? COLORS.purpleLight
              : COLORS.white
          }
        />
      </View>

      <Text
        style={[
          styles.footerText,

          compact &&
            styles.footerTextCompact,

          active &&
            styles.footerTextActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}


interface PlayerProgressConnectedProps {
  onSeek:
    (
      seconds:
        number
    ) => void;
}


function PlayerProgressConnected({
  onSeek,
}: PlayerProgressConnectedProps) {
  const {
    currentTime,
    duration,
  } =
    usePlayerProgress();

  return (
    <ProgressBar
      currentTime={
        currentTime
      }

      duration={
        duration
      }

      onSeek={
        onSeek
      }
    />
  );
}


interface LyricsModalConnectedProps {
  visible:
    boolean;

  song:
    Song;

  onClose:
    () => void;
}


function LyricsModalConnected({
  visible,
  song,
  onClose,
}: LyricsModalConnectedProps) {
  const {
    currentTime,
  } =
    usePlayerProgress();

  return (
    <LyricsModal
      visible={
        visible
      }

      song={
        song
      }

      currentTime={
        currentTime
      }

      onClose={
        onClose
      }
    />
  );
}


function PlayerModal({
  visible,
  song,
  playing,
  shuffle,
  repeatMode,
  favorite,
  onClose,
  onPrevious,
  onPlayPause,
  onNext,
  onShuffle,
  onRepeat,
  onFavorite,
  onSeek,
  onQueue,
  onSleepTimer,
}: Props) {
  const {
    width,
    height,
  } =
    useWindowDimensions();


  const {
    playlists,
  } =
    useApp();


  const [
    playlistOpen,
    setPlaylistOpen,
  ] =
    useState(
      false
    );


  const [
    equalizerOpen,
    setEqualizerOpen,
  ] =
    useState(
      false
    );


  /*
   * =====================================================
   * RESPONSIVE
   * =====================================================
   *
   * Ya no dependemos de tamaños gigantes fijos.
   *
   * Tenemos tres escenarios:
   *
   * 1. Pantalla pequeña
   * 2. Pantalla normal
   * 3. Pantalla grande
   */

  const veryNarrow =
    width < 360;

  const narrow =
    width < 390;

  const shortScreen =
    height < 760;

  const veryShortScreen =
    height < 680;


  /*
   * La portada depende tanto del ancho como
   * de la altura disponible.
   *
   * Esto evita que en teléfonos altos o angostos
   * la portada empuje los controles fuera.
   */

  const horizontalSpace =
    veryNarrow
      ? 22
      : narrow
        ? 26
        : 30;


  const artworkByWidth =
    width -
    horizontalSpace;


  const artworkHeightRatio =
    veryShortScreen
      ? 0.325
      : shortScreen
        ? 0.37
        : 0.41;


  const artworkByHeight =
    height *
    artworkHeightRatio;


  const artworkSize =
    Math.max(
      210,

      Math.min(
        artworkByWidth,
        artworkByHeight,
        390
      )
    );


  const artworkRadius =
    narrow
      ? 24
      : 28;


  const artworkIconSize =
    Math.round(
      artworkSize *
      0.30
    );


  /*
   * Tamaños de botones.
   */

  const playButtonSize =
    veryNarrow
      ? 62
      : shortScreen
        ? 66
        : 70;


  const playIconSize =
    veryNarrow
      ? 38
      : 42;


  const secondaryButtonSize =
    narrow
      ? 42
      : 45;


  const skipIconSize =
    narrow
      ? 34
      : 38;


  /*
   * Textos.
   */

  const titleFontSize =
    veryNarrow
      ? 19
      : narrow
        ? 20
        : 22;


  const titleLineHeight =
    titleFontSize +
    5;


  const compactFooter =
    shortScreen ||
    veryNarrow;


  const [
    lyricsOpen,
    setLyricsOpen,
  ] =
    useState(
      false
    );


  useEffect(
    () => {
      setLyricsOpen(
        false
      );

      setPlaylistOpen(
        false
      );

      setEqualizerOpen(
        false
      );
    },
    [
      song.id,
    ]
  );


  /*
   * =====================================================
   * FONDO DINÁMICO
   * =====================================================
   */

  const [
    failedBackgroundUri,
    setFailedBackgroundUri,
  ] =
    useState<
      string | null
    >(
      null
    );


  const normalizedArtwork =
    typeof song.artwork ===
      'string'

      ? song.artwork.trim()

      : '';


  const backgroundArtworkFailed =
    normalizedArtwork.length >
      0
    &&
    failedBackgroundUri ===
      normalizedArtwork;


  const hasRealBackground =
    normalizedArtwork.length >
      0
    &&
    !backgroundArtworkFailed;


  const artworkTheme =
    getArtworkTheme(
      song.id
    );


  const handleClose =
    useCallback(
      () => {
        setLyricsOpen(
          false
        );

        setPlaylistOpen(
          false
        );

        setEqualizerOpen(
          false
        );

        onClose();
      },
      [
        onClose,
      ]
    );


  const addCurrentSongToPlaylist =
    useCallback(
      (
        playlistId:
          string
      ) => {
        playlists
          .addSong(
            playlistId,
            song.id
          );
      },
      [
        playlists,
        song.id,
      ]
    );


  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <View
          style={styles.container}
        >
          {/* =========================
              FONDO
          ========================= */}

          {!hasRealBackground ? (
            <>
              <View
                style={[
                  styles.generatedBackground,

                  {
                    backgroundColor:
                      artworkTheme.background,
                  },
                ]}
              />

              <View
                style={[
                  styles.generatedGlowOne,

                  {
                    backgroundColor:
                      artworkTheme.glow1,
                  },
                ]}
              />

              <View
                style={[
                  styles.generatedGlowTwo,

                  {
                    backgroundColor:
                      artworkTheme.glow2,
                  },
                ]}
              />

              <View
                style={[
                  styles.generatedGlowThree,

                  {
                    backgroundColor:
                      artworkTheme.glow1,
                  },
                ]}
              />
            </>
          ) : (
            <View
              style={
                styles.neutralBackground
              }
            />
          )}


          {hasRealBackground ? (
            <Image
              key={
                normalizedArtwork
              }

              source={{
                uri:
                  normalizedArtwork,
              }}

              blurRadius={45}

              resizeMode="cover"

              fadeDuration={0}

              onError={() => {
                setFailedBackgroundUri(
                  normalizedArtwork
                );
              }}

              style={
                styles.backgroundImage
              }
            />
          ) : null}


          <View
            style={[
              styles.darkOverlay,

              hasRealBackground
                ? styles.darkOverlayWithArtwork
                : styles.darkOverlayGenerated,
            ]}
          />


          <SafeAreaView
            style={[
              styles.safeArea,

              {
                paddingHorizontal:
                  veryNarrow
                    ? 10
                    : 16,
              },
            ]}
          >
            {/* =========================
                CABECERA
            ========================= */}

            <View
              style={[
                styles.topBar,

                {
                  height:
                    shortScreen
                      ? 54
                      : 58,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.topButton,

                  narrow &&
                    styles.topButtonCompact,
                ]}
                activeOpacity={0.70}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Cerrar reproductor"
              >
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={
                    narrow
                      ? 27
                      : 30
                  }
                  color={COLORS.white}
                />
              </TouchableOpacity>


              <View
                style={styles.topCenter}
              >
                <Text
                  style={styles.nowPlayingLabel}
                  numberOfLines={1}
                >
                  REPRODUCIENDO
                </Text>

                <Text
                  style={[
                    styles.nowPlayingArtist,

                    {
                      maxWidth:
                        Math.max(
                          130,
                          width - 150
                        ),
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {song.artist}
                </Text>
              </View>


              <TouchableOpacity
                style={[
                  styles.topButton,

                  narrow &&
                    styles.topButtonCompact,

                  favorite &&
                    styles.favoriteButtonActive,
                ]}
                activeOpacity={0.70}
                onPress={onFavorite}
                accessibilityRole="button"
                accessibilityLabel={
                  favorite
                    ? 'Quitar de favoritos'
                    : 'Añadir a favoritos'
                }
              >
                <MaterialCommunityIcons
                  name={
                    favorite
                      ? 'heart'
                      : 'heart-outline'
                  }
                  size={
                    narrow
                      ? 22
                      : 24
                  }
                  color={
                    favorite
                      ? COLORS.pink
                      : COLORS.white
                  }
                />
              </TouchableOpacity>
            </View>


            {/* =========================
                CONTENIDO PRINCIPAL
            ========================= */}

            <View
              style={[
                styles.mainContent,

                {
                  paddingTop:
                    veryShortScreen
                      ? 2
                      : shortScreen
                        ? 4
                        : 7,
                },
              ]}
            >
              {/* =======================
                  CARÁTULA
              ======================= */}

              <View
                style={[
                  styles.artworkStage,

                  {
                    height:
                      artworkSize,

                    marginBottom:
                      veryShortScreen
                        ? 8
                        : shortScreen
                          ? 10
                          : 14,
                  },
                ]}
              >
                <View
                  style={[
                    styles.artworkShell,

                    {
                      width:
                        artworkSize,

                      height:
                        artworkSize,

                      borderRadius:
                        artworkRadius,
                    },
                  ]}
                >
                  <Artwork
                    key={song.id}
                    uri={song.artwork}
                    seed={song.id}
                    size={artworkSize}
                    radius={artworkRadius}
                    iconSize={artworkIconSize}
                  />
                </View>
              </View>


              {/* =======================
                  INFORMACIÓN
              ======================= */}

              <View
                style={[
                  styles.songInfo,

                  {
                    paddingHorizontal:
                      narrow
                        ? 8
                        : 12,

                    minHeight:
                      shortScreen
                        ? 68
                        : 74,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.title,

                    {
                      fontSize:
                        titleFontSize,

                      lineHeight:
                        titleLineHeight,
                    },
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {song.title}
                </Text>


                <Text
                  style={[
                    styles.artist,

                    {
                      fontSize:
                        narrow
                          ? 12
                          : 13,

                      marginTop:
                        shortScreen
                          ? 4
                          : 6,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {song.artist}
                </Text>


                <View
                  style={[
                    styles.albumRow,

                    {
                      marginTop:
                        shortScreen
                          ? 2
                          : 4,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="album"
                    size={13}
                    color="#B6B6BE"
                  />

                  <Text
                    style={styles.album}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {song.album}
                  </Text>
                </View>
              </View>


              {/* =======================
                  PROGRESO
              ======================= */}

              <View
                style={[
                  styles.progressArea,

                  {
                    marginHorizontal:
                      narrow
                        ? 8
                        : 12,

                    marginTop:
                      veryShortScreen
                        ? 3
                        : shortScreen
                          ? 5
                          : 7,
                  },
                ]}
              >
                <PlayerProgressConnected
                  onSeek={
                    onSeek
                  }
                />
              </View>


              {/* =======================
                  CONTROLES
              ======================= */}

              <View
                style={[
                  styles.controls,

                  {
                    height:
                      shortScreen
                        ? 64
                        : 70,

                    marginHorizontal:
                      narrow
                        ? 4
                        : 10,

                    marginTop:
                      veryShortScreen
                        ? 2
                        : shortScreen
                          ? 4
                          : 6,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.secondaryControl,

                    {
                      width:
                        secondaryButtonSize,

                      height:
                        secondaryButtonSize,

                      borderRadius:
                        secondaryButtonSize /
                        2,
                    },

                    shuffle &&
                      styles.secondaryControlActive,
                  ]}
                  activeOpacity={0.70}
                  onPress={onShuffle}
                  accessibilityRole="button"
                  accessibilityLabel={
                    shuffle
                      ? 'Desactivar reproducción aleatoria'
                      : 'Activar reproducción aleatoria'
                  }
                >
                  <MaterialCommunityIcons
                    name="shuffle-variant"
                    size={
                      narrow
                        ? 21
                        : 23
                    }
                    color={
                      shuffle
                        ? COLORS.purpleLight
                        : '#DADAE0'
                    }
                  />

                  {shuffle ? (
                    <View
                      style={styles.activeDot}
                    />
                  ) : null}
                </TouchableOpacity>


                <TouchableOpacity
                  style={[
                    styles.skipButton,

                    {
                      width:
                        narrow
                          ? 48
                          : 54,

                      height:
                        narrow
                          ? 52
                          : 56,
                    },
                  ]}
                  activeOpacity={0.68}
                  onPress={onPrevious}
                  accessibilityRole="button"
                  accessibilityLabel="Canción anterior"
                >
                  <MaterialCommunityIcons
                    name="skip-previous"
                    size={
                      skipIconSize
                    }
                    color={COLORS.white}
                  />
                </TouchableOpacity>


                <TouchableOpacity
                  style={[
                    styles.playButton,

                    {
                      width:
                        playButtonSize,

                      height:
                        playButtonSize,

                      borderRadius:
                        playButtonSize /
                        2,
                    },
                  ]}
                  activeOpacity={0.82}
                  onPress={onPlayPause}
                  accessibilityRole="button"
                  accessibilityLabel={
                    playing
                      ? 'Pausar'
                      : 'Reproducir'
                  }
                >
                  <MaterialCommunityIcons
                    name={
                      playing
                        ? 'pause'
                        : 'play'
                    }
                    size={
                      playIconSize
                    }
                    color={COLORS.white}
                  />
                </TouchableOpacity>


                <TouchableOpacity
                  style={[
                    styles.skipButton,

                    {
                      width:
                        narrow
                          ? 48
                          : 54,

                      height:
                        narrow
                          ? 52
                          : 56,
                    },
                  ]}
                  activeOpacity={0.68}
                  onPress={onNext}
                  accessibilityRole="button"
                  accessibilityLabel="Siguiente canción"
                >
                  <MaterialCommunityIcons
                    name="skip-next"
                    size={
                      skipIconSize
                    }
                    color={COLORS.white}
                  />
                </TouchableOpacity>


                <TouchableOpacity
                  style={[
                    styles.secondaryControl,

                    {
                      width:
                        secondaryButtonSize,

                      height:
                        secondaryButtonSize,

                      borderRadius:
                        secondaryButtonSize /
                        2,
                    },

                    repeatMode !== 'off' &&
                      styles.secondaryControlActive,
                  ]}
                  activeOpacity={0.70}
                  onPress={onRepeat}
                  accessibilityRole="button"
                  accessibilityLabel={
                    repeatMode === 'off'
                      ? 'Activar repetición'
                      : repeatMode === 'all'
                        ? 'Repetir una canción'
                        : 'Desactivar repetición'
                  }
                >
                  <MaterialCommunityIcons
                    name={
                      repeatMode === 'one'
                        ? 'repeat-once'
                        : 'repeat'
                    }
                    size={
                      narrow
                        ? 21
                        : 23
                    }
                    color={
                      repeatMode === 'off'
                        ? '#DADAE0'
                        : COLORS.purpleLight
                    }
                  />

                  {repeatMode !== 'off' ? (
                    <View
                      style={styles.activeDot}
                    />
                  ) : null}
                </TouchableOpacity>
              </View>
            </View>


            {/* =========================
                FOOTER
            ========================= */}

            <View
              style={[
                styles.footer,

                {
                  gap:
                    veryNarrow
                      ? 6
                      : 9,

                  paddingHorizontal:
                    veryNarrow
                      ? 4
                      : 10,

                  paddingTop:
                    shortScreen
                      ? 2
                      : 4,

                  paddingBottom:
                    shortScreen
                      ? 5
                      : 7,
                },
              ]}
            >
              <FooterAction
                icon="playlist-play"
                label="Cola"
                compact={compactFooter}
                onPress={onQueue}
              />

              <FooterAction
                icon="playlist-plus"
                label="Playlist"
                compact={compactFooter}
                onPress={() =>
                  setPlaylistOpen(
                    true
                  )
                }
              />

              <FooterAction
                icon="equalizer"
                label="EQ"
                compact={compactFooter}
                onPress={() =>
                  setEqualizerOpen(
                    true
                  )
                }
              />

              <FooterAction
                icon="text-box-outline"
                label="Letras"
                compact={compactFooter}
                active
                onPress={() =>
                  setLyricsOpen(
                    true
                  )
                }
              />

              <FooterAction
                icon="timer-outline"
                label="Temporizador"
                compact={compactFooter}
                onPress={onSleepTimer}
              />
            </View>


            {/* =========================
                AGREGAR A PLAYLIST
            ========================= */}

            {playlistOpen ? (
              <View
                style={
                  styles.playlistOverlay
                }
              >
                <Pressable
                  style={
                    styles.playlistBackdrop
                  }
                  onPress={() =>
                    setPlaylistOpen(
                      false
                    )
                  }
                />

                <View
                  style={
                    styles.playlistSheet
                  }
                >
                  <View
                    style={
                      styles.playlistHandle
                    }
                  />

                  <View
                    style={
                      styles.playlistHeader
                    }
                  >
                    <View
                      style={
                        styles.playlistHeaderText
                      }
                    >
                      <Text
                        style={
                          styles.playlistTitle
                        }
                      >
                        Agregar a playlist
                      </Text>

                      <Text
                        style={
                          styles.playlistSubtitle
                        }
                        numberOfLines={1}
                      >
                        {song.title}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={
                        styles.playlistClose
                      }
                      activeOpacity={0.72}
                      onPress={() =>
                        setPlaylistOpen(
                          false
                        )
                      }
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={22}
                        color={COLORS.white}
                      />
                    </TouchableOpacity>
                  </View>


                  {playlists
                    .playlists
                    .length === 0 ? (
                    <View
                      style={
                        styles.playlistEmpty
                      }
                    >
                      <MaterialCommunityIcons
                        name="playlist-music-outline"
                        size={42}
                        color="#A7A7B2"
                      />

                      <Text
                        style={
                          styles.playlistEmptyTitle
                        }
                      >
                        No tienes playlists
                      </Text>

                      <Text
                        style={
                          styles.playlistEmptyText
                        }
                      >
                        Crea una desde la sección Playlists y luego podrás agregar esta canción aquí.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      style={
                        styles.playlistList
                      }
                      contentContainerStyle={
                        styles.playlistListContent
                      }
                      showsVerticalScrollIndicator={
                        false
                      }
                    >
                      {playlists
                        .playlists
                        .map(
                          playlist => {
                            const alreadyAdded =
                              playlist
                                .songIds
                                .includes(
                                  song.id
                                );

                            return (
                              <TouchableOpacity
                                key={
                                  playlist.id
                                }
                                style={[
                                  styles.playlistRow,

                                  alreadyAdded &&
                                    styles.playlistRowAdded,
                                ]}
                                activeOpacity={0.72}
                                onPress={() =>
                                  addCurrentSongToPlaylist(
                                    playlist.id
                                  )
                                }
                              >
                                <View
                                  style={
                                    styles.playlistRowIcon
                                  }
                                >
                                  <MaterialCommunityIcons
                                    name="playlist-music"
                                    size={23}
                                    color={
                                      alreadyAdded
                                        ? COLORS.purpleLight
                                        : COLORS.white
                                    }
                                  />
                                </View>

                                <View
                                  style={
                                    styles.playlistRowText
                                  }
                                >
                                  <Text
                                    style={
                                      styles.playlistRowTitle
                                    }
                                    numberOfLines={1}
                                  >
                                    {playlist.name}
                                  </Text>

                                  <Text
                                    style={
                                      styles.playlistRowSubtitle
                                    }
                                  >
                                    {
                                      playlist
                                        .songIds
                                        .length
                                    } {
                                      playlist
                                        .songIds
                                        .length === 1
                                        ? 'canción'
                                        : 'canciones'
                                    }
                                  </Text>
                                </View>

                                <MaterialCommunityIcons
                                  name={
                                    alreadyAdded
                                      ? 'check-circle'
                                      : 'plus-circle-outline'
                                  }
                                  size={24}
                                  color={
                                    alreadyAdded
                                      ? COLORS.purpleLight
                                      : '#CFCFD6'
                                  }
                                />
                              </TouchableOpacity>
                            );
                          }
                        )}
                    </ScrollView>
                  )}
                </View>
              </View>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>


      {lyricsOpen ? (
        <LyricsModalConnected
          visible={
            lyricsOpen
          }

          song={
            song
          }

          onClose={() =>
            setLyricsOpen(
              false
            )
          }
        />
      ) : null}


      {equalizerOpen ? (
        <EqualizerModal
          visible={
            equalizerOpen
          }

          onClose={() =>
            setEqualizerOpen(
              false
            )
          }
        />
      ) : null}
    </>
  );
}


export default memo(
  PlayerModal
);


const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },


    safeArea: {
      flex: 1,
    },


    /*
     * =====================================================
     * FONDO
     * =====================================================
     */

    generatedBackground: {
      position: 'absolute',

      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },


    neutralBackground: {
      position: 'absolute',

      top: 0,
      left: 0,
      right: 0,
      bottom: 0,

      backgroundColor:
        '#09090F',
    },


    generatedGlowOne: {
      position:
        'absolute',

      width:
        620,

      height:
        620,

      borderRadius:
        310,

      top:
        -320,

      right:
        -270,

      opacity:
        0.40,
    },


    generatedGlowTwo: {
      position:
        'absolute',

      width:
        560,

      height:
        560,

      borderRadius:
        280,

      bottom:
        -300,

      left:
        -310,

      opacity:
        0.30,
    },


    generatedGlowThree: {
      position:
        'absolute',

      width:
        390,

      height:
        390,

      borderRadius:
        195,

      top:
        280,

      right:
        -240,

      opacity:
        0.14,
    },


    backgroundImage: {
      position:
        'absolute',

      top:
        -45,

      left:
        -45,

      right:
        -45,

      bottom:
        -45,
    },


    darkOverlay: {
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
    },


    darkOverlayGenerated: {
      backgroundColor:
        'rgba(8,8,12,0.42)',
    },


    darkOverlayWithArtwork: {
      backgroundColor:
        'rgba(8,8,12,0.52)',
    },


    /*
     * =====================================================
     * HEADER
     * =====================================================
     */

    topBar: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      zIndex:
        10,
    },


    topButton: {
      width:
        44,

      height:
        44,

      borderRadius:
        22,

      backgroundColor:
        'rgba(255,255,255,0.11)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.18)',

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    topButtonCompact: {
      width:
        40,

      height:
        40,

      borderRadius:
        20,
    },


    favoriteButtonActive: {
      backgroundColor:
        'rgba(236,72,153,0.18)',

      borderColor:
        'rgba(236,72,153,0.35)',
    },


    topCenter: {
      flex:
        1,

      alignItems:
        'center',

      paddingHorizontal:
        8,
    },


    nowPlayingLabel: {
      color:
        'rgba(255,255,255,0.68)',

      fontSize:
        8,

      fontWeight:
        '700',

      letterSpacing:
        1.6,
    },


    nowPlayingArtist: {
      color:
        COLORS.white,

      fontSize:
        11,

      fontWeight:
        '600',

      marginTop:
        3,

      textAlign:
        'center',
    },


    /*
     * =====================================================
     * CONTENIDO
     * =====================================================
     */

    mainContent: {
      flex:
        1,

      paddingHorizontal:
        2,

      justifyContent:
        'flex-start',

      minHeight:
        0,
    },


    /*
     * =====================================================
     * CARÁTULA
     * =====================================================
     */

    artworkStage: {
      width:
        '100%',

      alignItems:
        'center',

      justifyContent:
        'center',

      flexShrink:
        0,
    },


    artworkShell: {
      overflow:
        'hidden',

      backgroundColor:
        COLORS.surface,

      borderWidth:
        1,

      borderColor:
        'rgba(255,255,255,0.17)',

      elevation:
        12,
    },


    /*
     * =====================================================
     * INFORMACIÓN
     * =====================================================
     */

    songInfo: {
      flexShrink:
        0,
    },


    title: {
      color:
        COLORS.white,

      fontWeight:
        '700',

      letterSpacing:
        -0.25,
    },


    artist: {
      color:
        '#E2E2E8',

      lineHeight:
        18,

      fontWeight:
        '500',
    },


    albumRow: {
      minHeight:
        17,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        5,
    },


    album: {
      flex:
        1,

      color:
        '#B6B6BE',

      fontSize:
        10,
    },


    /*
     * =====================================================
     * PROGRESO
     * =====================================================
     */

    progressArea: {
      flexShrink:
        0,

      marginBottom:
        0,
    },


    /*
     * =====================================================
     * CONTROLES
     * =====================================================
     */

    controls: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      flexShrink:
        0,
    },


    secondaryControl: {
      backgroundColor:
        'rgba(255,255,255,0.075)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.12)',

      alignItems:
        'center',

      justifyContent:
        'center',

      position:
        'relative',
    },


    secondaryControlActive: {
      backgroundColor:
        'rgba(139,92,246,0.20)',

      borderColor:
        'rgba(167,139,250,0.35)',
    },


    activeDot: {
      position:
        'absolute',

      bottom:
        4,

      width:
        4,

      height:
        4,

      borderRadius:
        2,

      backgroundColor:
        COLORS.purpleLight,
    },


    skipButton: {
      justifyContent:
        'center',

      alignItems:
        'center',
    },


    playButton: {
      backgroundColor:
        COLORS.purple,

      justifyContent:
        'center',

      alignItems:
        'center',

      elevation:
        10,

      borderWidth:
        1,

      borderColor:
        'rgba(255,255,255,0.24)',
    },


    /*
     * =====================================================
     * FOOTER
     * =====================================================
     */

    footer: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginTop:
        'auto',

      flexShrink:
        0,
    },


    footerAction: {
      flex:
        1,

      height:
        54,

      borderRadius:
        17,

      backgroundColor:
        'rgba(255,255,255,0.095)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.14)',

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal:
        4,
    },


    footerActionCompact: {
      height:
        49,

      borderRadius:
        15,
    },


    footerActionActive: {
      backgroundColor:
        'rgba(139,92,246,0.20)',

      borderColor:
        'rgba(167,139,250,0.34)',
    },


    footerIcon: {
      height:
        23,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    footerIconCompact: {
      height:
        20,
    },


    footerText: {
      color:
        '#D5D5DC',

      fontSize:
        9,

      fontWeight:
        '600',

      textAlign:
        'center',

      marginTop:
        3,
    },


    footerTextCompact: {
      fontSize:
        8,

      marginTop:
        2,
    },


    footerTextActive: {
      color:
        COLORS.purpleLight,
    },


    /*
     * =====================================================
     * PLAYLIST SHEET
     * =====================================================
     */

    playlistOverlay: {
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

      justifyContent:
        'flex-end',

      zIndex:
        50,
    },


    playlistBackdrop: {
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
        'rgba(0,0,0,0.58)',
    },


    playlistSheet: {
      maxHeight:
        '58%',

      minHeight:
        220,

      backgroundColor:
        '#17171F',

      borderTopLeftRadius:
        26,

      borderTopRightRadius:
        26,

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.13)',

      paddingTop:
        8,

      paddingHorizontal:
        16,

      paddingBottom:
        18,

      elevation:
        20,
    },


    playlistHandle: {
      alignSelf:
        'center',

      width:
        42,

      height:
        4,

      borderRadius:
        2,

      backgroundColor:
        'rgba(255,255,255,0.25)',

      marginBottom:
        12,
    },


    playlistHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom:
        12,
    },


    playlistHeaderText: {
      flex:
        1,

      paddingRight:
        12,
    },


    playlistTitle: {
      color:
        COLORS.white,

      fontSize:
        18,

      fontWeight:
        '700',
    },


    playlistSubtitle: {
      color:
        '#AAAAAF',

      fontSize:
        11,

      marginTop:
        3,
    },


    playlistClose: {
      width:
        38,

      height:
        38,

      borderRadius:
        19,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(255,255,255,0.08)',
    },


    playlistList: {
      flexGrow:
        0,
    },


    playlistListContent: {
      paddingBottom:
        4,
    },


    playlistRow: {
      minHeight:
        62,

      borderRadius:
        16,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        12,

      marginBottom:
        8,

      backgroundColor:
        'rgba(255,255,255,0.065)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.10)',
    },


    playlistRowAdded: {
      backgroundColor:
        'rgba(139,92,246,0.13)',

      borderColor:
        'rgba(167,139,250,0.28)',
    },


    playlistRowIcon: {
      width:
        40,

      height:
        40,

      borderRadius:
        12,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        10,

      backgroundColor:
        'rgba(255,255,255,0.075)',
    },


    playlistRowText: {
      flex:
        1,

      paddingRight:
        10,
    },


    playlistRowTitle: {
      color:
        COLORS.white,

      fontSize:
        13,

      fontWeight:
        '600',
    },


    playlistRowSubtitle: {
      color:
        '#A9A9B1',

      fontSize:
        10,

      marginTop:
        3,
    },


    playlistEmpty: {
      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        20,

      paddingVertical:
        24,
    },


    playlistEmptyTitle: {
      color:
        COLORS.white,

      fontSize:
        15,

      fontWeight:
        '700',

      marginTop:
        10,
    },


    playlistEmptyText: {
      color:
        '#A8A8B0',

      fontSize:
        11,

      lineHeight:
        17,

      textAlign:
        'center',

      marginTop:
        6,
    },
  });