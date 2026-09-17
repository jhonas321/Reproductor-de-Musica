import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useMemo,
  useState,
} from 'react';

import {
  useApp,
} from '../context/AppContext';

import {
  useNavigationLock,
} from '../hooks/useNavigationLock';

import {
  COLORS,
} from '../constants/colors';

import ScreenHeader
  from '../components/ScreenHeader';

import RenamePlaylistModal
  from '../components/RenamePlaylistModal';

import type {
  Playlist,
} from '../types/Song';


/* =========================================================
   DURACIÓN
========================================================= */

function formatDuration(
  seconds:
    number
) {
  const total =
    Math.max(
      0,
      Math.round(
        seconds
      )
    );


  const hours =
    Math.floor(
      total /
      3600
    );


  const minutes =
    Math.floor(
      (
        total %
        3600
      ) /
      60
    );


  if (
    hours >
      0
  ) {
    return minutes >
      0

      ? `${hours} h ${minutes} min`

      : `${hours} h`;
  }


  return `${minutes} min`;
}


/* =========================================================
   PANTALLA
========================================================= */

export default function PlaylistsScreen() {
  const {
    library,
    playlists,
  } =
    useApp();


  const navigateOnce =
    useNavigationLock();


  const [
    name,
    setName,
  ] =
    useState(
      ''
    );


  const [
    renameTarget,
    setRenameTarget,
  ] =
    useState<
      Playlist | null
    >(
      null
    );


  const songMap =
    useMemo(
      () =>
        new Map(
          library.songs.map(
            song => [
              song.id,
              song,
            ]
          )
        ),
      [
        library.songs,
      ]
    );


  const playlistDurations =
    useMemo(
      () => {
        const result =
          new Map<
            string,
            number
          >();


        playlists
          .playlists
          .forEach(
            playlist => {
              const total =
                playlist
                  .songIds
                  .reduce(
                    (
                      sum,
                      songId
                    ) => {
                      const song =
                        songMap.get(
                          songId
                        );


                      return sum +
                        (
                          Number(
                            song?.duration
                          ) || 0
                        );
                    },
                    0
                  );


              result.set(
                playlist.id,
                total
              );
            }
          );


        return result;
      },
      [
        playlists.playlists,
        songMap,
      ]
    );


  const create =
    () => {
      const result =
        playlists
          .createPlaylist(
            name
          );


      if (
        result
      ) {
        setName(
          ''
        );

        return;
      }


      if (
        name.trim()
      ) {
        Alert.alert(
          'No se pudo crear',
          'Usa un nombre diferente para la playlist.'
        );
      }
    };


  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScreenHeader
        title=
          "Playlists"

        subtitle={
          playlists
            .playlists
            .length ===
          1

            ? '1 lista'

            : `${playlists.playlists.length} listas`
        }
      />


      {/* ===============================================
          CREAR
      =============================================== */}

      <View
        style={
          styles.createRow
        }
      >
        <TextInput
          value={
            name
          }

          onChangeText={
            setName
          }

          placeholder=
            "Nombre de nueva playlist"

          placeholderTextColor={
            COLORS.textMuted
          }

          style={
            styles.input
          }

          selectionColor={
            COLORS.purpleLight
          }

          returnKeyType=
            "done"

          onSubmitEditing={
            create
          }
        />


        <TouchableOpacity
          style={[
            styles.add,

            !name.trim()
            &&
            styles.addDisabled,
          ]}
          activeOpacity={
            0.78
          }
          disabled={
            !name.trim()
          }
          onPress={
            create
          }
        >
          <MaterialCommunityIcons
            name=
              "plus"

            size={
              25
            }

            color={
              COLORS.white
            }
          />
        </TouchableOpacity>
      </View>


      {/* ===============================================
          LISTA
      =============================================== */}

      <FlatList
        data={
          playlists
            .playlists
        }

        keyExtractor={
          item =>
            item.id
        }

        contentContainerStyle={
          styles.content
        }

        showsVerticalScrollIndicator={
          false
        }

        ListEmptyComponent={
          <View
            style={
              styles.empty
            }
          >
            <MaterialCommunityIcons
              name=
                "playlist-music-outline"

              size={
                54
              }

              color={
                COLORS.textMuted
              }
            />


            <Text
              style={
                styles.emptyTitle
              }
            >
              Todavía no tienes playlists
            </Text>


            <Text
              style={
                styles.emptyText
              }
            >
              Crea una para organizar tus canciones favoritas.
            </Text>
          </View>
        }

        renderItem={({
          item,
        }) => {
          const totalDuration =
            playlistDurations.get(
              item.id
            ) ??
            0;


          return (
            <View
              style={
                styles.row
              }
            >
              <TouchableOpacity
                activeOpacity={
                  0.75
                }

                style={
                  styles.rowMain
                }

                onPress={() =>
                  navigateOnce(
                    () =>
                      router.push({
                        pathname:
                          '/playlist',

                        params: {
                          id:
                            item.id,
                        },
                      })
                  )
                }
              >
                <View
                  style={
                    styles.icon
                  }
                >
                  <MaterialCommunityIcons
                    name=
                      "playlist-music"

                    size={
                      28
                    }

                    color={
                      COLORS.purpleLight
                    }
                  />
                </View>


                <View
                  style={
                    styles.textArea
                  }
                >
                  <Text
                    style={
                      styles.name
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {item.name}
                  </Text>


                  <Text
                    style={
                      styles.count
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {item.songIds.length ===
                    1
                      ? `1 canción · ${formatDuration(
                          totalDuration
                        )}`
                      : `${item.songIds.length} canciones · ${formatDuration(
                          totalDuration
                        )}`}
                  </Text>
                </View>
              </TouchableOpacity>


              <TouchableOpacity
                style={
                  styles.smallButton
                }
                activeOpacity={
                  0.7
                }
                onPress={() =>
                  setRenameTarget(
                    item
                  )
                }
              >
                <MaterialCommunityIcons
                  name=
                    "pencil-outline"

                  size={
                    21
                  }

                  color={
                    COLORS.textSecondary
                  }
                />
              </TouchableOpacity>


              <TouchableOpacity
                style={
                  styles.smallButton
                }
                activeOpacity={
                  0.7
                }
                onPress={() =>
                  Alert.alert(
                    item.name,
                    '¿Eliminar esta playlist?',
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
                          () =>
                            playlists
                              .deletePlaylist(
                                item.id
                              ),
                      },
                    ]
                  )
                }
              >
                <MaterialCommunityIcons
                  name=
                    "trash-can-outline"

                  size={
                    21
                  }

                  color={
                    COLORS.pink
                  }
                />
              </TouchableOpacity>
            </View>
          );
        }}
      />


      {/* ===============================================
          RENOMBRAR
      =============================================== */}

      <RenamePlaylistModal
        visible={
          Boolean(
            renameTarget
          )
        }

        initialName={
          renameTarget
            ?.name ??
          ''
        }

        onClose={() =>
          setRenameTarget(
            null
          )
        }

        onSave={
          newName => {
            if (
              !renameTarget
            ) {
              return;
            }


            const renamed =
              playlists
                .renamePlaylist(
                  renameTarget.id,
                  newName
                );


            if (
              renamed ===
                false
            ) {
              Alert.alert(
                'No se pudo renombrar',
                'Usa un nombre diferente para la playlist.'
              );
            }
          }
        }
      />
    </SafeAreaView>
  );
}


/* =========================================================
   ESTILOS
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      backgroundColor:
        COLORS.background,
    },


    createRow: {
      flexDirection:
        'row',

      gap:
        10,

      paddingHorizontal:
        20,

      marginBottom:
        12,
    },


    input: {
      flex:
        1,

      height:
        49,

      borderRadius:
        16,

      backgroundColor:
        COLORS.surface,

      color:
        COLORS.white,

      paddingHorizontal:
        14,

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.08)',
    },


    add: {
      width:
        49,

      height:
        49,

      borderRadius:
        16,

      backgroundColor:
        COLORS.purple,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    addDisabled: {
      opacity:
        0.45,
    },


    content: {
      paddingHorizontal:
        20,

      paddingBottom:
        120,

      flexGrow:
        1,
    },


    row: {
      minHeight:
        78,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        'rgba(255,255,255,0.06)',
    },


    rowMain: {
      flex:
        1,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        13,

      minWidth:
        0,
    },


    icon: {
      width:
        55,

      height:
        55,

      borderRadius:
        17,

      backgroundColor:
        COLORS.surface,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    textArea: {
      flex:
        1,

      minWidth:
        0,
    },


    name: {
      color:
        COLORS.white,

      fontSize:
        15,

      fontWeight:
        '600',
    },


    count: {
      color:
        COLORS.textMuted,

      fontSize:
        11,

      marginTop:
        4,
    },


    smallButton: {
      width:
        38,

      height:
        42,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    empty: {
      flex:
        1,

      justifyContent:
        'center',

      alignItems:
        'center',

      minHeight:
        300,

      paddingHorizontal:
        30,
    },


    emptyTitle: {
      color:
        COLORS.white,

      fontSize:
        15,

      fontWeight:
        '700',

      marginTop:
        14,
    },


    emptyText: {
      color:
        COLORS.textMuted,

      fontSize:
        12,

      lineHeight:
        18,

      textAlign:
        'center',

      marginTop:
        7,
    },
  });
