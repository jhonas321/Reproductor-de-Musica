import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  useCallback,
  useMemo,
} from 'react';

import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import Artwork
  from '../components/Artwork';

import ScreenHeader
  from '../components/ScreenHeader';

import {
  COLORS,
} from '../constants/colors';

import {
  useApp,
} from '../context/AppContext';

import type {
  Song,
} from '../types/Song';


export default function QueueScreen() {
  const {
    player,
  } =
    useApp();


  const queue =
    player.queue;


  const currentSongId =
    player
      .currentSong
      ?.id ??
    null;


  const upcomingCount =
    useMemo(
      () => {
        if (
          player.currentIndex <
          0
        ) {
          return queue.length;
        }

        return Math.max(
          0,
          queue.length -
            player.currentIndex -
            1
        );
      },
      [
        queue.length,
        player.currentIndex,
      ]
    );


  const confirmClearQueue =
    useCallback(
      () => {
        if (
          queue.length <=
          (
            player.currentSong
              ? 1
              : 0
          )
        ) {
          return;
        }

        Alert.alert(
          'Limpiar cola',
          player.currentSong
            ? 'Se quitarán todas las canciones excepto la que está sonando.'
            : 'Se quitarán todas las canciones de la cola.',
          [
            {
              text:
                'Cancelar',

              style:
                'cancel',
            },
            {
              text:
                'Limpiar',

              style:
                'destructive',

              onPress:
                player.clearQueue,
            },
          ]
        );
      },
      [
        queue.length,
        player.currentSong,
        player.clearQueue,
      ]
    );


  const renderSong =
    useCallback(
      ({
        item,
        index,
      }: {
        item:
          Song;

        index:
          number;
      }) => {
        const active =
          currentSongId ===
          item.id;

        const canMoveUp =
          index >
          0;

        const canMoveDown =
          index <
          queue.length -
            1;

        return (
          <View
            style={[
              styles.row,
              active &&
                styles.activeRow,
            ]}
          >
            <TouchableOpacity
              activeOpacity={
                0.78
              }
              style={
                styles.songArea
              }
              onPress={() =>
                player.playSong(
                  item,
                  queue
                )
              }
            >
              <View
                style={
                  styles.artworkWrapper
                }
              >
                <Artwork
                  uri={
                    item.artwork
                  }
                  seed={
                    item.id
                  }
                  size={
                    54
                  }
                  radius={
                    14
                  }
                  iconSize={
                    24
                  }
                />

                {active ? (
                  <View
                    style={
                      styles.playingBadge
                    }
                  >
                    <MaterialCommunityIcons
                      name={
                        player.isPlaying
                          ? 'volume-high'
                          : 'pause'
                      }
                      size={
                        11
                      }
                      color={
                        COLORS.white
                      }
                    />
                  </View>
                ) : (
                  <View
                    style={
                      styles.positionBadge
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
                )}
              </View>


              <View
                style={
                  styles.info
                }
              >
                <Text
                  style={[
                    styles.title,
                    active &&
                      styles.activeTitle,
                  ]}
                  numberOfLines={
                    1
                  }
                >
                  {item.title}
                </Text>

                <Text
                  style={
                    styles.artist
                  }
                  numberOfLines={
                    1
                  }
                >
                  {item.artist}
                </Text>

                {active ? (
                  <Text
                    style={
                      styles.nowPlaying
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {player.isPlaying
                      ? 'Reproduciendo ahora'
                      : 'En pausa'}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>


            <View
              style={
                styles.actions
              }
            >
              <TouchableOpacity
                disabled={
                  !canMoveUp
                }
                style={[
                  styles.actionButton,
                  !canMoveUp &&
                    styles.actionDisabled,
                ]}
                activeOpacity={
                  0.7
                }
                onPress={() =>
                  player.moveQueueItem(
                    index,
                    index - 1
                  )
                }
              >
                <MaterialCommunityIcons
                  name=
                    "chevron-up"
                  size={
                    22
                  }
                  color={
                    canMoveUp
                      ? COLORS.textSecondary
                      : COLORS.line
                  }
                />
              </TouchableOpacity>


              <TouchableOpacity
                disabled={
                  !canMoveDown
                }
                style={[
                  styles.actionButton,
                  !canMoveDown &&
                    styles.actionDisabled,
                ]}
                activeOpacity={
                  0.7
                }
                onPress={() =>
                  player.moveQueueItem(
                    index,
                    index + 1
                  )
                }
              >
                <MaterialCommunityIcons
                  name=
                    "chevron-down"
                  size={
                    22
                  }
                  color={
                    canMoveDown
                      ? COLORS.textSecondary
                      : COLORS.line
                  }
                />
              </TouchableOpacity>


              <TouchableOpacity
                disabled={
                  active
                }
                style={[
                  styles.actionButton,
                  active &&
                    styles.actionDisabled,
                ]}
                activeOpacity={
                  0.7
                }
                onPress={() =>
                  player.removeFromQueue(
                    item.id
                  )
                }
              >
                <MaterialCommunityIcons
                  name=
                    "close"
                  size={
                    20
                  }
                  color={
                    active
                      ? COLORS.line
                      : COLORS.pink
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        );
      },
      [
        currentSongId,
        queue,
        player.isPlaying,
        player.playSong,
        player.moveQueueItem,
        player.removeFromQueue,
      ]
    );


  const emptyComponent =
    (
      <View
        style={
          styles.empty
        }
      >
        <View
          style={
            styles.emptyIcon
          }
        >
          <MaterialCommunityIcons
            name=
              "playlist-music-outline"
            size={
              42
            }
            color={
              COLORS.purpleLight
            }
          />
        </View>

        <Text
          style={
            styles.emptyTitle
          }
        >
          La cola está vacía
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Reproduce una canción o añade canciones a la cola para verlas aquí.
        </Text>
      </View>
    );


  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScreenHeader
        title=
          "Cola"

        subtitle={
          queue.length ===
          1
            ? '1 canción'
            : `${queue.length} canciones`
        }

        rightIcon=
          "playlist-remove"

        onRightPress={
          confirmClearQueue
        }
      />


      <View
        style={
          styles.summary
        }
      >
        <View
          style={
            styles.summaryItem
          }
        >
          <MaterialCommunityIcons
            name=
              "music-circle-outline"
            size={
              18
            }
            color={
              COLORS.purpleLight
            }
          />

          <View>
            <Text
              style={
                styles.summaryLabel
              }
            >
              Sonando
            </Text>

            <Text
              style={
                styles.summaryValue
              }
              numberOfLines={
                1
              }
            >
              {player.currentSong
                ?.title ??
                'Ninguna'}
            </Text>
          </View>
        </View>


        <View
          style={
            styles.summaryDivider
          }
        />


        <View
          style={
            styles.summaryItem
          }
        >
          <MaterialCommunityIcons
            name=
              "playlist-play"
            size={
              20
            }
            color={
              COLORS.purpleLight
            }
          />

          <View>
            <Text
              style={
                styles.summaryLabel
              }
            >
              Después
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              {upcomingCount ===
              1
                ? '1 canción'
                : `${upcomingCount} canciones`}
            </Text>
          </View>
        </View>
      </View>


      <FlatList
        data={
          queue
        }

        keyExtractor={
          item =>
            item.id
        }

        renderItem={
          renderSong
        }

        ListEmptyComponent={
          emptyComponent
        }

        contentContainerStyle={[
          styles.content,
          queue.length ===
            0 &&
            styles.emptyContent,
        ]}

        showsVerticalScrollIndicator={
          false
        }

        removeClippedSubviews

        initialNumToRender={
          12
        }

        maxToRenderPerBatch={
          10
        }

        windowSize={
          7
        }
      />
    </SafeAreaView>
  );
}


const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      backgroundColor:
        COLORS.background,
    },


    summary: {
      marginHorizontal:
        20,

      marginTop:
        4,

      marginBottom:
        14,

      minHeight:
        68,

      borderRadius:
        18,

      backgroundColor:
        '#17151E',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.09)',

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        14,
    },


    summaryItem: {
      flex:
        1,

      minWidth:
        0,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        9,
    },


    summaryDivider: {
      width:
        StyleSheet.hairlineWidth,

      alignSelf:
        'stretch',

      marginVertical:
        13,

      marginHorizontal:
        12,

      backgroundColor:
        'rgba(255,255,255,0.10)',
    },


    summaryLabel: {
      color:
        COLORS.textMuted,

      fontSize:
        9,

      fontWeight:
        '600',
    },


    summaryValue: {
      color:
        COLORS.white,

      fontSize:
        11,

      fontWeight:
        '700',

      marginTop:
        2,
    },


    content: {
      paddingHorizontal:
        16,

      paddingBottom:
        130,
    },


    emptyContent: {
      flexGrow:
        1,
    },


    row: {
      minHeight:
        76,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderRadius:
        18,

      marginBottom:
        5,

      paddingHorizontal:
        8,

      backgroundColor:
        'rgba(255,255,255,0.018)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'transparent',
    },


    activeRow: {
      backgroundColor:
        'rgba(139,92,246,0.10)',

      borderColor:
        'rgba(167,139,250,0.24)',
    },


    songArea: {
      flex:
        1,

      minWidth:
        0,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingVertical:
        8,
    },


    artworkWrapper: {
      position:
        'relative',
    },


    positionBadge: {
      position:
        'absolute',

      left:
        -4,

      bottom:
        -4,

      minWidth:
        20,

      height:
        20,

      paddingHorizontal:
        5,

      borderRadius:
        10,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#26232F',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.14)',
    },


    positionText: {
      color:
        COLORS.textSecondary,

      fontSize:
        8,

      fontWeight:
        '800',
    },


    playingBadge: {
      position:
        'absolute',

      left:
        -4,

      bottom:
        -4,

      width:
        22,

      height:
        22,

      borderRadius:
        11,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.purple,

      borderWidth:
        2,

      borderColor:
        COLORS.background,
    },


    info: {
      flex:
        1,

      minWidth:
        0,

      marginLeft:
        12,
    },


    title: {
      color:
        COLORS.white,

      fontSize:
        13,

      fontWeight:
        '600',
    },


    activeTitle: {
      color:
        COLORS.purpleLight,
    },


    artist: {
      color:
        COLORS.textMuted,

      fontSize:
        10,

      marginTop:
        4,
    },


    nowPlaying: {
      color:
        COLORS.purpleLight,

      fontSize:
        8,

      fontWeight:
        '700',

      marginTop:
        3,
    },


    actions: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginLeft:
        6,

      gap:
        2,
    },


    actionButton: {
      width:
        32,

      height:
        42,

      borderRadius:
        12,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    actionDisabled: {
      opacity:
        0.45,
    },


    empty: {
      flex:
        1,

      minHeight:
        360,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        32,
    },


    emptyIcon: {
      width:
        80,

      height:
        80,

      borderRadius:
        40,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(139,92,246,0.10)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(167,139,250,0.22)',
    },


    emptyTitle: {
      color:
        COLORS.white,

      fontSize:
        17,

      fontWeight:
        '700',

      marginTop:
        18,
    },


    emptyText: {
      color:
        COLORS.textMuted,

      fontSize:
        11,

      lineHeight:
        18,

      textAlign:
        'center',

      marginTop:
        8,
    },
  });
