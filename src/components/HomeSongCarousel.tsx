import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

import type {
  Song,
} from '../types/Song';

import {
  COLORS,
} from '../constants/colors';

import Artwork
  from './Artwork';


interface Props {
  title: string;

  subtitle?: string;

  songs: Song[];

  currentSongId?:
    string | null;

  playing?:
    boolean;

  onSongPress:
    (
      song: Song
    ) => void;

  onSeeAll?:
    () => void;
}


/*
 * Animación suave cuando las tarjetas cambian de posición.
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


function getOrderKey(
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


export default function HomeSongCarousel({
  title,

  subtitle,

  songs,

  currentSongId =
    null,

  playing =
    false,

  onSongPress,

  onSeeAll,
}: Props) {
  /*
   * Conservamos una copia visual.
   *
   * Cuando cambia el orden, configuramos la animación antes de
   * reemplazar la lista visual. Así cada tarjeta se desplaza
   * suavemente hacia su nueva posición.
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
      getOrderKey(
        songs
      )
    );


  useEffect(
    () => {
      const nextOrder =
        getOrderKey(
          songs
        );


      const orderChanged =
        nextOrder !==
          previousOrderRef
            .current;


      if (
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
    ]
  );


  if (
    displayedSongs.length ===
    0
  ) {
    return null;
  }


  return (
    <View
      style={
        styles.container
      }
    >
      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      <View
        style={
          styles.header
        }
      >
        <View
          style={
            styles.headerText
          }
        >
          <Text
            style={
              styles.title
            }
          >
            {title}
          </Text>


          {subtitle ? (
            <Text
              style={
                styles.subtitle
              }
            >
              {subtitle}
            </Text>
          ) : null}
        </View>


        {onSeeAll ? (
          <TouchableOpacity
            style={
              styles.seeAllButton
            }

            activeOpacity={
              0.7
            }

            onPress={
              onSeeAll
            }
          >
            <Text
              style={
                styles.seeAllText
              }
            >
              Ver todo
            </Text>


            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={
                COLORS.purpleLight
              }
            />
          </TouchableOpacity>
        ) : null}
      </View>


      {/* =====================================================
          CARRUSEL
      ===================================================== */}

      <ScrollView
        horizontal

        showsHorizontalScrollIndicator={
          false
        }

        contentContainerStyle={
          styles.list
        }
      >
        {displayedSongs.map(
          item => {
            const active =
              item.id ===
              currentSongId;


            return (
              <TouchableOpacity
                key={
                  item.id
                }

                style={
                  styles.card
                }

                activeOpacity={
                  0.78
                }

                onPress={() =>
                  onSongPress(
                    item
                  )
                }
              >
                {/* ===========================================
                    CARÁTULA
                =========================================== */}

                <View
                  style={
                    styles.artworkWrapper
                  }
                >
                  <Artwork
                    uri={
                      item.artwork
                    }

                    size={
                      132
                    }

                    radius={
                      18
                    }

                    iconSize={
                      45
                    }
                  />


                  {/* PLAY */}

                  <View
                    style={[
                      styles.playOverlay,

                      active &&
                        styles.playOverlayActive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        active &&
                        playing
                          ? 'pause'
                          : 'play'
                      }

                      size={22}

                      color={
                        COLORS.white
                      }
                    />
                  </View>


                  {/* CANCIÓN ACTUAL */}

                  {active ? (
                    <View
                      style={
                        styles.activeBadge
                      }
                    >
                      <MaterialCommunityIcons
                        name="music-note"
                        size={12}
                        color={
                          COLORS.white
                        }
                      />


                      <Text
                        style={
                          styles.activeText
                        }
                      >
                        Sonando
                      </Text>
                    </View>
                  ) : null}
                </View>


                {/* ===========================================
                    INFORMACIÓN
                =========================================== */}

                <Text
                  style={[
                    styles.songTitle,

                    active &&
                      styles.songTitleActive,
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
              </TouchableOpacity>
            );
          }
        )}
      </ScrollView>
    </View>
  );
}


const styles =
  StyleSheet.create({
    container: {
      marginTop: 7,

      marginBottom: 27,
    },


    /* =====================================================
       ENCABEZADO
    ===================================================== */

    header: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom: 14,
    },


    headerText: {
      flex: 1,

      paddingRight: 10,
    },


    title: {
      color:
        COLORS.white,

      fontSize: 19,

      fontWeight:
        '700',
    },


    subtitle: {
      color:
        COLORS.textMuted,

      fontSize: 10,

      marginTop: 4,
    },


    seeAllButton: {
      minHeight: 38,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingLeft: 12,
    },


    seeAllText: {
      color:
        COLORS.purpleLight,

      fontSize: 11,

      fontWeight:
        '600',
    },


    /* =====================================================
       LISTA
    ===================================================== */

    list: {
      paddingRight: 6,
    },


    card: {
      width: 132,

      marginRight: 14,
    },


    /* =====================================================
       CARÁTULA
    ===================================================== */

    artworkWrapper: {
      width: 132,

      height: 132,

      position:
        'relative',

      marginBottom: 10,
    },


    playOverlay: {
      position:
        'absolute',

      right: 8,

      bottom: 8,

      width: 38,

      height: 38,

      borderRadius: 19,

      backgroundColor:
        'rgba(13,13,18,0.82)',

      justifyContent:
        'center',

      alignItems:
        'center',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.16)',
    },


    playOverlayActive: {
      backgroundColor:
        COLORS.purple,

      borderColor:
        COLORS.purpleLight,
    },


    activeBadge: {
      position:
        'absolute',

      top: 8,

      left: 8,

      height: 24,

      borderRadius: 12,

      paddingHorizontal: 8,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 4,

      backgroundColor:
        'rgba(139,92,246,0.92)',
    },


    activeText: {
      color:
        COLORS.white,

      fontSize: 9,

      fontWeight:
        '700',
    },


    /* =====================================================
       INFORMACIÓN
    ===================================================== */

    songTitle: {
      color:
        COLORS.white,

      fontSize: 13,

      fontWeight:
        '600',
    },


    songTitleActive: {
      color:
        COLORS.purpleLight,
    },


    artist: {
      color:
        COLORS.textMuted,

      fontSize: 10,

      marginTop: 4,
    },
  });