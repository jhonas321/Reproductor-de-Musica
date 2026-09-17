import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  memo,
  useRef,
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  COLORS,
} from '../constants/colors';

import type {
  Song,
} from '../types/Song';

import {
  formatDuration,
} from '../utils/music';

import Artwork
  from './Artwork';


interface Props {
  song: Song;

  active: boolean;

  playing: boolean;

  favorite: boolean;

  selected?: boolean;

  selectionMode?: boolean;

  onPress:
    (
      song: Song
    ) => void;

  onLongPress?:
    (
      song: Song
    ) => void;

  onFavoritePress:
    (
      songId: string
    ) => void;

  onOptionsPress?:
    (
      song: Song
    ) => void;
}


function SongItem({
  song,

  active,

  playing,

  favorite,

  selected = false,

  selectionMode = false,

  onPress,

  onLongPress,

  onFavoritePress,

  onOptionsPress,
}: Props) {
  /*
   * Evita que después de mantener
   * pulsada una canción se ejecute
   * también el onPress normal.
   */
  const longPressTriggered =
    useRef(false);


  const handlePress =
    () => {
      if (
        longPressTriggered.current
      ) {
        longPressTriggered.current =
          false;

        return;
      }


      onPress(
        song
      );
    };


  const handleLongPress =
    () => {
      if (
        !onLongPress
      ) {
        return;
      }


      longPressTriggered.current =
        true;


      onLongPress(
        song
      );
    };


  return (
    <TouchableOpacity
      activeOpacity={
        0.72
      }
      onPress={
        handlePress
      }
      onLongPress={
        handleLongPress
      }
      delayLongPress={
        350
      }
      style={[
        styles.container,

        selected &&
          styles.selectedContainer,
      ]}
    >
      {/* CARÁTULA */}

      <View
        style={[
          styles.artworkContainer,

          active &&
            styles.activeArtwork,

          selected &&
            styles.selectedArtwork,
        ]}
      >
        <Artwork
          uri={
            song.artwork
          }
          seed={
            song.id
          }
          size={52}
          radius={13}
          iconSize={24}
        />


        {active &&
        !selectionMode && (
          <View
            style={
              styles.playingBadge
            }
          >
            <MaterialCommunityIcons
              name={
                playing
                  ? 'volume-high'
                  : 'pause'
              }
              size={13}
              color={
                COLORS.white
              }
            />
          </View>
        )}


        {selectionMode &&
        selected && (
          <View
            style={
              styles.selectedBadge
            }
          >
            <MaterialCommunityIcons
              name="check"
              size={14}
              color={
                COLORS.white
              }
            />
          </View>
        )}
      </View>


      {/* INFORMACIÓN */}

      <View
        style={
          styles.information
        }
      >
        <Text
          style={[
            styles.title,

            active &&
              styles.activeTitle,

            selected &&
              styles.selectedTitle,
          ]}
          numberOfLines={
            1
          }
        >
          {song.title}
        </Text>


        <Text
          style={
            styles.subtitle
          }
          numberOfLines={
            1
          }
        >
          {song.artist}

          {'  •  '}

          {formatDuration(
            song.duration
          )}
        </Text>
      </View>


      {/* MODO SELECCIÓN */}

      {selectionMode ? (
        <View
          style={
            styles.selectionButton
          }
        >
          <MaterialCommunityIcons
            name={
              selected
                ? 'checkbox-marked-circle'
                : 'checkbox-blank-circle-outline'
            }
            size={25}
            color={
              selected
                ? COLORS.purpleLight
                : COLORS.textMuted
            }
          />
        </View>
      ) : (
        <>
          {/* FAVORITO */}

          <TouchableOpacity
            style={
              styles.iconButton
            }
            onPress={() =>
              onFavoritePress(
                song.id
              )
            }
          >
            <MaterialCommunityIcons
              name={
                favorite
                  ? 'heart'
                  : 'heart-outline'
              }
              size={21}
              color={
                favorite
                  ? COLORS.pink
                  : COLORS.textMuted
              }
            />
          </TouchableOpacity>


          {/* MENÚ */}

          {onOptionsPress && (
            <TouchableOpacity
              style={
                styles.iconButton
              }
              onPress={() =>
                onOptionsPress(
                  song
                )
              }
            >
              <MaterialCommunityIcons
                name="dots-vertical"
                size={22}
                color={
                  COLORS.textMuted
                }
              />
            </TouchableOpacity>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}


export default memo(
  SongItem
);


const styles =
  StyleSheet.create({
    container: {
      minHeight: 68,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingVertical: 7,

      paddingHorizontal: 4,

      borderRadius: 15,
    },


    selectedContainer: {
      backgroundColor:
        'rgba(139, 92, 246, 0.11)',
    },


    artworkContainer: {
      borderRadius: 15,

      borderWidth: 2,

      borderColor:
        'transparent',

      position:
        'relative',
    },


    activeArtwork: {
      borderColor:
        COLORS.purple,
    },


    selectedArtwork: {
      borderColor:
        COLORS.purpleLight,
    },


    playingBadge: {
      position:
        'absolute',

      right: -4,

      bottom: -4,

      width: 23,

      height: 23,

      borderRadius: 12,

      backgroundColor:
        COLORS.purple,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    selectedBadge: {
      position:
        'absolute',

      right: -4,

      bottom: -4,

      width: 23,

      height: 23,

      borderRadius: 12,

      backgroundColor:
        COLORS.purple,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    information: {
      flex: 1,

      marginLeft: 13,
    },


    title: {
      color:
        COLORS.white,

      fontSize: 14,

      fontWeight:
        '600',
    },


    activeTitle: {
      color:
        COLORS.purpleLight,
    },


    selectedTitle: {
      color:
        COLORS.purpleLight,
    },


    subtitle: {
      color:
        COLORS.textMuted,

      fontSize: 12,

      marginTop: 5,
    },


    iconButton: {
      width: 36,

      height: 42,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    selectionButton: {
      width: 44,

      height: 48,

      justifyContent:
        'center',

      alignItems:
        'center',
    },
  });
