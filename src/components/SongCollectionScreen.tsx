import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  router,
} from 'expo-router';

import {
  Alert,
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useApp,
} from '../context/AppContext';

import {
  COLORS,
} from '../constants/colors';

import type {
  Song,
} from '../types/Song';

import {
  deleteSongsFromDevice,
  shareMultipleSongFiles,
} from '../services/androidMediaActions';

import Artwork from './Artwork';

import AddToPlaylistModal from './AddToPlaylistModal';

import ScreenHeader from './ScreenHeader';

import HomeBackground from './HomeBackground';

import SongItem from './SongItem';

import SongMenuModal from './SongMenuModal';

import TrackInfoModal from './TrackInfoModal';


interface Props {
  title: string;

  subtitle?: string;

  songs: Song[];

  artwork?:
    string | null;

  artworkCircle?:
    boolean;

  emptyText?:
    string;

  animateReorder?:
    boolean;

  onRemoveSong?:
    (
      songId: string
    ) => void;
}


interface SelectionActionProps {
  icon:
    keyof typeof
      MaterialCommunityIcons.glyphMap;

  label:
    string;

  color?:
    string;

  disabled?:
    boolean;

  onPress:
    () => void;
}


function SelectionAction({
  icon,

  label,

  color =
    COLORS.white,

  disabled =
    false,

  onPress,
}: SelectionActionProps) {
  return (
    <TouchableOpacity
      style={[
        styles.selectionAction,

        disabled &&
          styles.selectionActionDisabled,
      ]}
      activeOpacity={
        0.7
      }
      disabled={
        disabled
      }
      onPress={
        onPress
      }
    >
      <MaterialCommunityIcons
        name={
          icon
        }
        size={23}
        color={
          disabled
            ? COLORS.textMuted
            : color
        }
      />


      <Text
        style={[
          styles.selectionActionText,

          {
            color:
              disabled
                ? COLORS.textMuted
                : color,
          },
        ]}
        numberOfLines={
          1
        }
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}


/*
 * Animación de reordenamiento para colecciones que cambian
 * de posición, como "Escuchado recientemente".
 */
if (
  Platform.OS ===
    'android' &&
  UIManager
    .setLayoutAnimationEnabledExperimental
) {
  try {
    UIManager
      .setLayoutAnimationEnabledExperimental(
        true
      );
  } catch {
    /*
     * En algunas versiones / arquitecturas nuevas
     * no hace falta habilitarlo manualmente.
     */
  }
}


const REORDER_ANIMATION = {
  duration: 230,

  create: {
    type:
      LayoutAnimation.Types
        .easeInEaseOut,

    property:
      LayoutAnimation.Properties
        .opacity,
  },

  update: {
    type:
      LayoutAnimation.Types
        .easeInEaseOut,
  },

  delete: {
    type:
      LayoutAnimation.Types
        .easeInEaseOut,

    property:
      LayoutAnimation.Properties
        .opacity,
  },
};


function getSongOrderKey(
  songs:
    Song[]
) {
  return songs
    .map(
      song =>
        song.id
    )
    .join(
      '|'
    );
}




export default function SongCollectionScreen({
  title,

  subtitle,

  songs,

  artwork,

  artworkCircle =
    false,

  emptyText =
    'No hay canciones aquí.',

  animateReorder =
    false,

  onRemoveSong,
}: Props) {
  const {
    player,

    favorites,

    playlists,

    library,
  } =
    useApp();


  /*
   * =========================================================
   * LISTA VISUAL ANIMADA
   * =========================================================
   *
   * Solo se activa cuando animateReorder=true.
   *
   * La lista real puede cambiar de orden instantáneamente.
   * Conservamos una copia visual y la reemplazamos justo
   * después de preparar LayoutAnimation.
   */
  const [
    displayedSongs,
    setDisplayedSongs,
  ] =
    useState<Song[]>(
      songs
    );


  const previousOrderRef =
    useRef(
      getSongOrderKey(
        songs
      )
    );


  useEffect(
    () => {
      const nextOrder =
        getSongOrderKey(
          songs
        );


      const orderChanged =
        nextOrder !==
          previousOrderRef
            .current;


      if (
        animateReorder &&
        orderChanged
      ) {
        LayoutAnimation
          .configureNext(
            REORDER_ANIMATION
          );
      }


      previousOrderRef.current =
        nextOrder;


      setDisplayedSongs(
        songs
      );
    },
    [
      songs,
      animateReorder,
    ]
  );


  const listSongs =
    animateReorder
      ? displayedSongs
      : songs;


  /* =========================================================
     MENÚ NORMAL
  ========================================================= */

  const [
    menuSong,
    setMenuSong,
  ] =
    useState<
      Song | null
    >(null);


  const [
    infoSong,
    setInfoSong,
  ] =
    useState<
      Song | null
    >(null);


  /*
   * Sirve tanto para una sola canción
   * como para varias canciones.
   */
  const [
    playlistSongs,
    setPlaylistSongs,
  ] =
    useState<
      Song[]
    >([]);


  /* =========================================================
     SELECCIÓN MÚLTIPLE
  ========================================================= */

  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState<
      Set<string>
    >(
      () =>
        new Set()
    );


  const selectionMode =
    selectedIds.size >
    0;


  const selectedSongs =
    useMemo(
      () =>
        songs.filter(
          song =>
            selectedIds.has(
              song.id
            )
        ),
      [
        songs,
        selectedIds,
      ]
    );


  /* =========================================================
     SALIR DE SELECCIÓN
  ========================================================= */

  const exitSelection =
    useCallback(
      () => {
        setSelectedIds(
          new Set()
        );
      },
      []
    );


  /* =========================================================
     INICIAR SELECCIÓN
  ========================================================= */

  const startSelection =
    useCallback(
      (
        song: Song
      ) => {
        setSelectedIds(
          previous => {
            const next =
              new Set(
                previous
              );


            next.add(
              song.id
            );


            return next;
          }
        );
      },
      []
    );


  /* =========================================================
     SELECCIONAR / DESELECCIONAR
  ========================================================= */

  const toggleSelection =
    useCallback(
      (
        song: Song
      ) => {
        setSelectedIds(
          previous => {
            const next =
              new Set(
                previous
              );


            if (
              next.has(
                song.id
              )
            ) {
              next.delete(
                song.id
              );
            } else {
              next.add(
                song.id
              );
            }


            return next;
          }
        );
      },
      []
    );


  /* =========================================================
     SELECCIONAR TODO
  ========================================================= */

  const toggleSelectAll =
    useCallback(
      () => {
        if (
          selectedIds.size ===
          songs.length
        ) {
          exitSelection();

          return;
        }


        setSelectedIds(
          new Set(
            songs.map(
              song =>
                song.id
            )
          )
        );
      },
      [
        selectedIds.size,
        songs,
        exitSelection,
      ]
    );


  /* =========================================================
     AÑADIR SELECCIONADAS A COLA
  ========================================================= */

  const addSelectedToQueue =
    useCallback(
      () => {
        if (
          selectedSongs.length ===
          0
        ) {
          return;
        }


        selectedSongs.forEach(
          song => {
            player.addToQueue(
              song
            );
          }
        );


        exitSelection();


        Alert.alert(
          'Cola',
          `${selectedSongs.length} ${
            selectedSongs.length === 1
              ? 'canción añadida'
              : 'canciones añadidas'
          } a la cola.`
        );
      },
      [
        selectedSongs,
        player.addToQueue,
        exitSelection,
      ]
    );


  /* =========================================================
     AÑADIR SELECCIONADAS A PLAYLIST
  ========================================================= */

  const addSelectedToPlaylist =
    useCallback(
      () => {
        if (
          selectedSongs.length ===
          0
        ) {
          return;
        }


        setPlaylistSongs(
          selectedSongs
        );
      },
      [
        selectedSongs,
      ]
    );


  /* =========================================================
     COMPARTIR SELECCIONADAS
  ========================================================= */

  const shareSelected =
    useCallback(
      async () => {
        if (
          selectedSongs.length ===
          0
        ) {
          return;
        }


        try {
          await shareMultipleSongFiles(
            selectedSongs
          );


          exitSelection();

        } catch (error) {
          console.log(
            'Error compartiendo canciones:',
            error
          );


          Alert.alert(
            'Compartir canciones',
            'No se pudieron compartir las canciones seleccionadas.'
          );
        }
      },
      [
        selectedSongs,
        exitSelection,
      ]
    );


  /* =========================================================
     ELIMINAR SELECCIONADAS
  ========================================================= */

  const deleteSelected =
    useCallback(
      async () => {
        if (
          selectedSongs.length ===
          0
        ) {
          return;
        }


        /*
         * Si la canción que se eliminará
         * está sonando, la pausamos.
         */
        const currentSongId =
          player.currentSong
            ?.id;


        if (
          currentSongId &&
          selectedIds.has(
            currentSongId
          )
        ) {
          player.pause();
        }


        try {
          const result =
            await deleteSongsFromDevice(
              selectedSongs
            );


          if (
            result.status ===
            'requested'
          ) {
            /*
             * Android mostrará su
             * confirmación oficial.
             */

            exitSelection();

            return;
          }


          if (
            result.status ===
            'deleted'
          ) {
            exitSelection();


            await library.refresh();

            return;
          }


          Alert.alert(
            'Eliminar canciones',
            'No se pudieron eliminar los archivos.'
          );

        } catch (error) {
          console.log(
            'Error eliminando canciones:',
            error
          );


          Alert.alert(
            'Eliminar canciones',
            'No se pudo solicitar la eliminación de las canciones.'
          );
        }
      },
      [
        selectedSongs,
        selectedIds,
        player.currentSong?.id,
        player.pause,
        library.refresh,
        exitSelection,
      ]
    );


  /* =========================================================
     CONFIRMAR ELIMINACIÓN MÚLTIPLE
  ========================================================= */

  const confirmDeleteSelected =
    useCallback(
      () => {
        if (
          selectedSongs.length ===
          0
        ) {
          return;
        }


        const count =
          selectedSongs.length;


        Alert.alert(
          'Eliminar del dispositivo',

          count === 1
            ? `Se eliminará permanentemente "${selectedSongs[0].title}" del teléfono.`
            : `Se eliminarán permanentemente ${count} canciones del almacenamiento del teléfono.`,

          [
            {
              text:
                'Cancelar',

              style:
                'cancel',
            },

            {
              text:
                'Eliminar',

              style:
                'destructive',

              onPress:
                () => {
                  void deleteSelected();
                },
            },
          ]
        );
      },
      [
        selectedSongs,
        deleteSelected,
      ]
    );


  /* =========================================================
     RENDER CANCIÓN
  ========================================================= */

  const renderSong =
    useCallback(
      ({
        item,
      }: {
        item: Song;
      }) => {
        const active =
          player.currentSong
            ?.id ===
          item.id;


        const selected =
          selectedIds.has(
            item.id
          );


        return (
          <SongItem
            song={
              item
            }

            active={
              active
            }

            playing={
              active &&
              player.isPlaying
            }

            favorite={
              favorites.isFavorite(
                item.id
              )
            }

            selected={
              selected
            }

            selectionMode={
              selectionMode
            }

            onPress={
              song => {
                if (
                  selectionMode
                ) {
                  toggleSelection(
                    song
                  );

                  return;
                }


                player.playSong(
                  song,
                  songs
                );
              }
            }

            onLongPress={
              startSelection
            }

            onFavoritePress={
              favorites.toggleFavorite
            }

            onOptionsPress={
              setMenuSong
            }
          />
        );
      },
      [
        songs,

        selectedIds,

        selectionMode,

        toggleSelection,

        startSelection,

        player.currentSong?.id,

        player.isPlaying,

        player.playSong,

        favorites.isFavorite,

        favorites.toggleFavorite,
      ]
    );


  /* =========================================================
     INTERFAZ
  ========================================================= */

  const backgroundArtwork =
    player.currentSong
      ?.artwork ??
    artwork ??
    songs[0]
      ?.artwork ??
    null;


  const backgroundSeed =
    player.currentSong
      ?.id ??
    songs[0]
      ?.id ??
    title;


  return (
    <View
      style={
        styles.screen
      }
    >
      <HomeBackground
        artwork={
          backgroundArtwork
        }

        seed={
          backgroundSeed
        }
      />


      <SafeAreaView
        style={
          styles.container
        }
      >
      {/* =====================================
          CABECERA
      ===================================== */}

      {selectionMode ? (
        <View
          style={
            styles.selectionHeader
          }
        >
          <TouchableOpacity
            style={
              styles.selectionClose
            }
            onPress={
              exitSelection
            }
          >
            <MaterialCommunityIcons
              name="close"
              size={25}
              color={
                COLORS.white
              }
            />
          </TouchableOpacity>


          <View
            style={
              styles.selectionTitleContainer
            }
          >
            <Text
              style={
                styles.selectionTitle
              }
            >
              {selectedIds.size} {
                selectedIds.size === 1
                  ? 'seleccionada'
                  : 'seleccionadas'
              }
            </Text>


            <Text
              style={
                styles.selectionSubtitle
              }
            >
              Mantén pulsada o toca otras canciones
            </Text>
          </View>


          <TouchableOpacity
            style={
              styles.selectAllButton
            }
            onPress={
              toggleSelectAll
            }
          >
            <MaterialCommunityIcons
              name={
                selectedIds.size ===
                songs.length
                  ? 'checkbox-multiple-marked'
                  : 'select-all'
              }
              size={25}
              color={
                COLORS.purpleLight
              }
            />
          </TouchableOpacity>
        </View>
      ) : (
        <ScreenHeader
          title={
            title
          }

          subtitle={
            subtitle ??
            `${songs.length} canciones`
          }
        />
      )}


      {/* =====================================
          ACCIONES DE SELECCIÓN
      ===================================== */}

      {selectionMode && (
        <View
          style={
            styles.selectionActions
          }
        >
          <SelectionAction
            icon="playlist-plus"
            label="Cola"
            onPress={
              addSelectedToQueue
            }
          />


          <SelectionAction
            icon="playlist-music-outline"
            label="Playlist"
            color={
              COLORS.purpleLight
            }
            onPress={
              addSelectedToPlaylist
            }
          />


          <SelectionAction
            icon="share-variant-outline"
            label="Compartir"
            color={
              COLORS.blue
            }
            onPress={() => {
              void shareSelected();
            }}
          />


          <SelectionAction
            icon="delete-outline"
            label="Eliminar"
            color={
              COLORS.pink
            }
            onPress={
              confirmDeleteSelected
            }
          />
        </View>
      )}


      {/* =====================================
          LISTA
      ===================================== */}

      <FlatList
        data={
          listSongs
        }

        keyExtractor={
          item =>
            item.id
        }

        renderItem={
          renderSong
        }

        ListHeaderComponent={
          artwork ||
          listSongs.length >
            0 ? (
            <View
              style={
                styles.hero
              }
            >
              <Artwork
                uri={
                  artwork ??
                  listSongs[0]
                    ?.artwork
                }

                size={
                  artworkCircle
                    ? 175
                    : 190
                }

                radius={
                  artworkCircle
                    ? 88
                    : 25
                }

                iconSize={
                  65
                }
              />


              <Text
                style={
                  styles.heroTitle
                }
                numberOfLines={
                  2
                }
              >
                {title}
              </Text>


              <Text
                style={
                  styles.heroSubtitle
                }
              >
                {listSongs.length} canciones
              </Text>


              {!selectionMode &&
              listSongs.length >
                0 && (
                <View
                  style={
                    styles.heroButtons
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.secondary
                    }
                    onPress={
                      player.toggleShuffle
                    }
                  >
                    <MaterialCommunityIcons
                      name="shuffle-variant"
                      size={24}
                      color={
                        player.shuffle
                          ? COLORS.purpleLight
                          : COLORS.white
                      }
                    />
                  </TouchableOpacity>


                  <TouchableOpacity
                    style={
                      styles.playAll
                    }
                    onPress={() =>
                      player.playAll(
                        songs
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="play"
                      size={31}
                      color={
                        COLORS.white
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null
        }

        ListEmptyComponent={
          <View
            style={
              styles.empty
            }
          >
            <MaterialCommunityIcons
              name="music-note-off-outline"
              size={50}
              color={
                COLORS.textMuted
              }
            />


            <Text
              style={
                styles.emptyText
              }
            >
              {emptyText}
            </Text>
          </View>
        }

        contentContainerStyle={
          styles.content
        }

        showsVerticalScrollIndicator={
          false
        }

        removeClippedSubviews={
          !animateReorder
        }

        initialNumToRender={
          12
        }

        maxToRenderPerBatch={
          10
        }

        windowSize={
          6
        }

        extraData={
          selectedIds
        }
      />


      {/* =====================================
          MENÚ DE UNA CANCIÓN
      ===================================== */}

      <SongMenuModal
        visible={
          Boolean(
            menuSong
          )
        }

        song={
          menuSong
        }

        favorite={
          menuSong
            ? favorites.isFavorite(
                menuSong.id
              )
            : false
        }

        extraActionLabel={
          onRemoveSong
            ? 'Quitar de esta lista'
            : undefined
        }

        onExtraAction={
          onRemoveSong &&
          menuSong
            ? () =>
                onRemoveSong(
                  menuSong.id
                )
            : undefined
        }

        onClose={() =>
          setMenuSong(
            null
          )
        }

        onPlay={() => {
          if (
            menuSong
          ) {
            player.playSong(
              menuSong,
              songs
            );
          }
        }}

        onPlayNext={() => {
          if (
            menuSong
          ) {
            player.playNext(
              menuSong
            );
          }
        }}

        onAddQueue={() => {
          if (
            menuSong
          ) {
            player.addToQueue(
              menuSong
            );
          }
        }}

        onAddPlaylist={() => {
          if (
            menuSong
          ) {
            setPlaylistSongs(
              [
                menuSong,
              ]
            );
          }
        }}

        onAlbum={() => {
          if (
            menuSong
          ) {
            router.push({
              pathname:
                '/album',

              params: {
                name:
                  menuSong.album,
              },
            });
          }
        }}

        onArtist={() => {
          if (
            menuSong
          ) {
            router.push({
              pathname:
                '/artist',

              params: {
                name:
                  menuSong.artist,
              },
            });
          }
        }}

        onFavorite={() => {
          if (
            menuSong
          ) {
            favorites.toggleFavorite(
              menuSong.id
            );
          }
        }}

        onInfo={() =>
          setInfoSong(
            menuSong
          )
        }
      />


      {/* =====================================
          PLAYLIST
      ===================================== */}

      <AddToPlaylistModal
        visible={
          playlistSongs.length >
          0
        }

        playlists={
          playlists.playlists
        }

        onClose={() =>
          setPlaylistSongs(
            []
          )
        }

        onCreate={
          playlists.createPlaylist
        }

        onSelect={
          playlistId => {
            playlistSongs.forEach(
              song => {
                playlists.addSong(
                  playlistId,
                  song.id
                );
              }
            );


            const addedCount =
              playlistSongs.length;


            setPlaylistSongs(
              []
            );


            if (
              selectionMode
            ) {
              exitSelection();
            }


            if (
              addedCount >
              1
            ) {
              Alert.alert(
                'Playlist',
                `${addedCount} canciones añadidas a la playlist.`
              );
            }
          }
        }
      />


      {/* =====================================
          INFORMACIÓN
      ===================================== */}

      <TrackInfoModal
        visible={
          Boolean(
            infoSong
          )
        }

        song={
          infoSong
        }

        onClose={() =>
          setInfoSong(
            null
          )
        }
      />
      </SafeAreaView>
    </View>
  );
}


const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        '#090811',
    },


    container: {
      flex: 1,

      backgroundColor:
        'transparent',
    },


    content: {
      paddingHorizontal:
        20,

      paddingBottom:
        120,

      flexGrow: 1,
    },


    /* =====================================
       SELECCIÓN
    ===================================== */

    selectionHeader: {
      minHeight: 64,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        14,

      paddingVertical:
        8,
    },


    selectionClose: {
      width: 44,

      height: 44,

      borderRadius:
        22,

      justifyContent:
        'center',

      alignItems:
        'center',

      backgroundColor:
        COLORS.surface,
    },


    selectionTitleContainer: {
      flex: 1,

      marginLeft:
        13,
    },


    selectionTitle: {
      color:
        COLORS.white,

      fontSize: 18,

      fontWeight:
        '700',
    },


    selectionSubtitle: {
      color:
        COLORS.textMuted,

      fontSize: 10,

      marginTop: 3,
    },


    selectAllButton: {
      width: 46,

      height: 46,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    selectionActions: {
      marginHorizontal:
        18,

      marginTop: 3,

      marginBottom:
        6,

      minHeight: 68,

      borderRadius:
        20,

      backgroundColor:
        COLORS.surface,

      flexDirection:
        'row',

      justifyContent:
        'space-around',

      alignItems:
        'center',

      paddingHorizontal:
        5,
    },


    selectionAction: {
      flex: 1,

      minHeight: 58,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    selectionActionDisabled: {
      opacity: 0.4,
    },


    selectionActionText: {
      fontSize: 9,

      marginTop: 4,

      fontWeight:
        '500',
    },


    /* =====================================
       HERO
    ===================================== */

    hero: {
      alignItems:
        'center',

      paddingTop:
        8,

      paddingBottom:
        26,
    },


    heroTitle: {
      color:
        COLORS.white,

      fontSize: 23,

      fontWeight:
        '700',

      textAlign:
        'center',

      marginTop:
        15,
    },


    heroSubtitle: {
      color:
        COLORS.textMuted,

      fontSize: 11,

      marginTop:
        5,
    },


    heroButtons: {
      alignSelf:
        'stretch',

      flexDirection:
        'row',

      justifyContent:
        'flex-end',

      gap: 12,

      marginTop:
        18,
    },


    secondary: {
      width: 52,

      height: 52,

      borderRadius:
        26,

      backgroundColor:
        COLORS.surfaceLight,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    playAll: {
      width: 58,

      height: 58,

      borderRadius:
        29,

      backgroundColor:
        COLORS.purple,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    /* =====================================
       VACÍO
    ===================================== */

    empty: {
      minHeight: 250,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    emptyText: {
      color:
        COLORS.textMuted,

      fontSize: 13,

      textAlign:
        'center',

      marginTop:
        12,
    },
  });