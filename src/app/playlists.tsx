import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  useLocalSearchParams,
} from 'expo-router';

import {
  useMemo,
  useState,
} from 'react';

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useApp,
} from '../context/AppContext';

import {
  COLORS,
} from '../constants/colors';

import SongCollectionScreen
  from '../components/SongCollectionScreen';


/* =========================================================
   FORMATO DE DURACIÓN
========================================================= */

function formatTotalDuration(
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

export default function PlaylistScreen() {
  const {
    id,
  } =
    useLocalSearchParams<{
      id?:
        string;
    }>();


  const {
    library,
    playlists,
  } =
    useApp();


  const [
    reorderOpen,
    setReorderOpen,
  ] =
    useState(
      false
    );


  const playlist =
    playlists
      .playlists
      .find(
        item =>
          item.id ===
            id
      );


  const songs =
    useMemo(
      () => {
        if (
          !playlist
        ) {
          return [];
        }


        const map =
          new Map(
            library.songs
              .map(
                song => [
                  song.id,
                  song,
                ]
              )
          );


        return playlist
          .songIds
          .map(
            songId =>
              map.get(
                songId
              )
          )
          .filter(
            Boolean
          ) as
            typeof library.songs;
      },
      [
        library.songs,
        playlist?.songIds,
      ]
    );


  const totalDuration =
    useMemo(
      () =>
        songs.reduce(
          (
            total,
            song
          ) =>
            total +
            (
              Number(
                song.duration
              ) || 0
            ),
          0
        ),
      [
        songs,
      ]
    );


  const subtitle =
    songs.length ===
      1

      ? `1 canción · ${formatTotalDuration(
          totalDuration
        )}`

      : `${songs.length} canciones · ${formatTotalDuration(
          totalDuration
        )}`;


  return (
    <View
      style={
        styles.container
      }
    >
      <SongCollectionScreen
        title={
          playlist?.name ??
          'Playlist'
        }

        subtitle={
          subtitle
        }

        songs={
          songs
        }

        emptyText=
          "Esta playlist está vacía. Usa el menú de una canción para añadirla."

        onRemoveSong={
          playlist

            ? songId =>
                playlists
                  .removeSong(
                    playlist.id,
                    songId
                  )

            : undefined
        }
      />


      {/* ===============================================
          BOTÓN REORDENAR
      =============================================== */}

      {playlist &&
      songs.length >
        1 ? (
        <TouchableOpacity
          style={
            styles.reorderButton
          }
          activeOpacity={
            0.78
          }
          onPress={() =>
            setReorderOpen(
              true
            )
          }
        >
          <MaterialCommunityIcons
            name=
              "playlist-edit"

            size={
              20
            }

            color={
              COLORS.white
            }
          />


          <Text
            style={
              styles.reorderButtonText
            }
          >
            Ordenar playlist
          </Text>
        </TouchableOpacity>
      ) : null}


      {/* ===============================================
          MODAL REORDENAR
      =============================================== */}

      <Modal
        visible={
          reorderOpen
        }

        transparent

        animationType=
          "slide"

        statusBarTranslucent

        onRequestClose={() =>
          setReorderOpen(
            false
          )
        }
      >
        <Pressable
          style={
            styles.backdrop
          }

          onPress={() =>
            setReorderOpen(
              false
            )
          }
        >
          <Pressable
            style={
              styles.sheet
            }

            onPress={() => {}}
          >
            <SafeAreaView
              edges={[
                'bottom',
              ]}
              style={
                styles.sheetSafe
              }
            >
              <View
                style={
                  styles.sheetHeader
                }
              >
                <View
                  style={
                    styles.sheetHeaderText
                  }
                >
                  <Text
                    style={
                      styles.sheetTitle
                    }
                  >
                    Ordenar playlist
                  </Text>


                  <Text
                    style={
                      styles.sheetSubtitle
                    }
                  >
                    Cambia la posición de las canciones.
                  </Text>
                </View>


                <TouchableOpacity
                  style={
                    styles.closeButton
                  }
                  activeOpacity={
                    0.72
                  }
                  onPress={() =>
                    setReorderOpen(
                      false
                    )
                  }
                >
                  <MaterialCommunityIcons
                    name=
                      "close"

                    size={
                      22
                    }

                    color={
                      COLORS.white
                    }
                  />
                </TouchableOpacity>
              </View>


              <ScrollView
                style={
                  styles.reorderList
                }
                contentContainerStyle={
                  styles.reorderContent
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                {songs.map(
                  (
                    song,
                    index
                  ) => (
                    <View
                      key={
                        song.id
                      }
                      style={
                        styles.songRow
                      }
                    >
                      <View
                        style={
                          styles.position
                        }
                      >
                        <Text
                          style={
                            styles.positionText
                          }
                        >
                          {index + 1}
                        </Text>
                      </View>


                      <View
                        style={
                          styles.songInfo
                        }
                      >
                        <Text
                          style={
                            styles.songTitle
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {song.title}
                        </Text>


                        <Text
                          style={
                            styles.songArtist
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {song.artist}
                        </Text>
                      </View>


                      <TouchableOpacity
                        style={[
                          styles.moveButton,

                          index ===
                            0
                          &&
                          styles.moveButtonDisabled,
                        ]}
                        disabled={
                          index ===
                            0
                        }
                        activeOpacity={
                          0.72
                        }
                        onPress={() => {
                          if (
                            !playlist
                          ) {
                            return;
                          }


                          playlists
                            .moveSong(
                              playlist.id,
                              index,
                              index - 1
                            );
                        }}
                      >
                        <MaterialCommunityIcons
                          name=
                            "chevron-up"

                          size={
                            24
                          }

                          color={
                            index ===
                              0

                              ? COLORS.textMuted

                              : COLORS.white
                          }
                        />
                      </TouchableOpacity>


                      <TouchableOpacity
                        style={[
                          styles.moveButton,

                          index ===
                            songs.length -
                              1
                          &&
                          styles.moveButtonDisabled,
                        ]}
                        disabled={
                          index ===
                            songs.length -
                              1
                        }
                        activeOpacity={
                          0.72
                        }
                        onPress={() => {
                          if (
                            !playlist
                          ) {
                            return;
                          }


                          playlists
                            .moveSong(
                              playlist.id,
                              index,
                              index + 1
                            );
                        }}
                      >
                        <MaterialCommunityIcons
                          name=
                            "chevron-down"

                          size={
                            24
                          }

                          color={
                            index ===
                              songs.length -
                                1

                              ? COLORS.textMuted

                              : COLORS.white
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  )
                )}
              </ScrollView>


              <TouchableOpacity
                style={
                  styles.doneButton
                }
                activeOpacity={
                  0.8
                }
                onPress={() =>
                  setReorderOpen(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.doneButtonText
                  }
                >
                  Listo
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
        'transparent',
    },


    reorderButton: {
      position:
        'absolute',

      right:
        18,

      bottom:
        92,

      minHeight:
        46,

      paddingHorizontal:
        15,

      borderRadius:
        23,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        7,

      backgroundColor:
        COLORS.purple,

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.18)',
    },


    reorderButtonText: {
      color:
        COLORS.white,

      fontSize:
        11,

      fontWeight:
        '700',
    },


    backdrop: {
      flex:
        1,

      justifyContent:
        'flex-end',

      backgroundColor:
        'rgba(0,0,0,0.64)',
    },


    sheet: {
      width:
        '100%',

      maxHeight:
        '82%',

      borderTopLeftRadius:
        28,

      borderTopRightRadius:
        28,

      overflow:
        'hidden',

      backgroundColor:
        '#17171E',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.10)',
    },


    sheetSafe: {
      maxHeight:
        '100%',
    },


    sheetHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        20,

      paddingTop:
        19,

      paddingBottom:
        15,
    },


    sheetHeaderText: {
      flex:
        1,

      paddingRight:
        14,
    },


    sheetTitle: {
      color:
        COLORS.white,

      fontSize:
        21,

      fontWeight:
        '800',
    },


    sheetSubtitle: {
      color:
        COLORS.textSecondary,

      fontSize:
        11,

      marginTop:
        5,
    },


    closeButton: {
      width:
        42,

      height:
        42,

      borderRadius:
        21,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(255,255,255,0.08)',
    },


    reorderList: {
      flexGrow:
        0,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderTopColor:
        'rgba(255,255,255,0.08)',

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        'rgba(255,255,255,0.08)',
    },


    reorderContent: {
      paddingHorizontal:
        14,

      paddingVertical:
        10,
    },


    songRow: {
      minHeight:
        64,

      borderRadius:
        16,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        10,

      marginVertical:
        3,

      backgroundColor:
        'rgba(255,255,255,0.045)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.07)',
    },


    position: {
      width:
        30,

      height:
        30,

      borderRadius:
        10,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        10,

      backgroundColor:
        'rgba(139,92,246,0.14)',
    },


    positionText: {
      color:
        COLORS.purpleLight,

      fontSize:
        11,

      fontWeight:
        '800',
    },


    songInfo: {
      flex:
        1,

      minWidth:
        0,

      paddingRight:
        7,
    },


    songTitle: {
      color:
        COLORS.white,

      fontSize:
        13,

      fontWeight:
        '600',
    },


    songArtist: {
      color:
        COLORS.textMuted,

      fontSize:
        10,

      marginTop:
        4,
    },


    moveButton: {
      width:
        38,

      height:
        42,

      borderRadius:
        12,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(255,255,255,0.055)',

      marginLeft:
        4,
    },


    moveButtonDisabled: {
      opacity:
        0.45,
    },


    doneButton: {
      height:
        50,

      marginHorizontal:
        20,

      marginTop:
        14,

      marginBottom:
        8,

      borderRadius:
        16,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.purple,
    },


    doneButtonText: {
      color:
        COLORS.white,

      fontSize:
        13,

      fontWeight:
        '800',
    },
  });
