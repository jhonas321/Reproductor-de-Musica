import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';


import {
  memo,
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


import Artwork
  from './Artwork';


interface Props {

  song:
    Song | null;

  playing:
    boolean;

  currentTime:
    number;

  duration:
    number;

  onOpen:
    () => void;

  onPrevious:
    () => void;

  onPlayPause:
    () => void;

  onNext:
    () => void;

}


function MiniPlayer({

  song,

  playing,

  currentTime,

  duration,

  onOpen,

  onPrevious,

  onPlayPause,

  onNext,

}: Props) {

  if (!song) {

    return null;

  }


  const percentage =

    duration > 0

      ? Math.min(
          100,
          Math.max(
            0,
            (
              currentTime /
              duration
            ) *
            100
          )
        )

      : 0;


  return (

    <View
      style={
        styles.container
      }
    >

      <View
        style={
          styles.progressTrack
        }
      >

        <View
          style={[

            styles.progress,

            {
              width:
                `${percentage}%`,
            },

          ]}
        />

      </View>


      <TouchableOpacity
        activeOpacity={
          0.85
        }
        style={
          styles.songArea
        }
        onPress={
          onOpen
        }
      >

        <Artwork
          uri={
            song.artwork
          }
          seed={
            song.id
          }
          size={50}
          radius={13}
          iconSize={24}
        />


        <View
          style={
            styles.information
          }
        >

          <Text
            style={
              styles.title
            }
            numberOfLines={1}
          >
            {song.title}
          </Text>


          <Text
            style={
              styles.artist
            }
            numberOfLines={1}
          >
            {song.artist}
          </Text>

        </View>

      </TouchableOpacity>


      <View
        style={
          styles.controls
        }
      >

        <TouchableOpacity
          onPress={
            onPrevious
          }
          style={
            styles.control
          }
        >

          <MaterialCommunityIcons
            name="skip-previous"
            size={24}
            color={
              COLORS.white
            }
          />

        </TouchableOpacity>


        <TouchableOpacity
          onPress={
            onPlayPause
          }
          style={
            styles.play
          }
        >

          <MaterialCommunityIcons
            name={
              playing
                ? 'pause'
                : 'play'
            }
            size={27}
            color={
              COLORS.white
            }
          />

        </TouchableOpacity>


        <TouchableOpacity
          onPress={
            onNext
          }
          style={
            styles.control
          }
        >

          <MaterialCommunityIcons
            name="skip-next"
            size={24}
            color={
              COLORS.white
            }
          />

        </TouchableOpacity>

      </View>

    </View>

  );
}


export default memo(
  MiniPlayer
);


const styles =
  StyleSheet.create({

    container: {

      position:
        'absolute',

      left:
        10,

      right:
        10,

      bottom:
        8,

      minHeight:
        74,

      borderRadius:
        19,

      backgroundColor:
        '#292930',

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        9,

      paddingVertical:
        8,

      overflow:
        'hidden',

    },


    progressTrack: {

      position:
        'absolute',

      left:
        15,

      right:
        15,

      top:
        0,

      height:
        2,

      backgroundColor:
        '#50505A',

    },


    progress: {

      height:
        2,

      backgroundColor:
        COLORS.purpleLight,

    },


    songArea: {

      flex:
        1,

      flexDirection:
        'row',

      alignItems:
        'center',

    },


    information: {

      flex:
        1,

      marginLeft:
        10,

    },


    title: {

      color:
        COLORS.white,

      fontSize:
        13,

      fontWeight:
        '600',

    },


    artist: {

      color:
        COLORS.textMuted,

      fontSize:
        11,

      marginTop:
        4,

    },


    controls: {

      flexDirection:
        'row',

      alignItems:
        'center',

    },


    control: {

      width:
        32,

      height:
        44,

      justifyContent:
        'center',

      alignItems:
        'center',

    },


    play: {

      width:
        42,

      height:
        42,

      borderRadius:
        21,

      backgroundColor:
        COLORS.purple,

      justifyContent:
        'center',

      alignItems:
        'center',

    },

  });
