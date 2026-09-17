import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  Alert,
  Modal,
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
  deleteSongFromDevice,
  openSongWithApp,
  shareSongFile,
} from '../services/androidMediaActions';

import {
  useApp,
} from '../context/AppContext';


interface Props {
  visible: boolean;

  song: Song | null;

  favorite: boolean;

  extraActionLabel?: string;

  onExtraAction?: () => void;

  onClose: () => void;

  onPlay: () => void;

  onPlayNext: () => void;

  onAddQueue: () => void;

  onAddPlaylist: () => void;

  onAlbum: () => void;

  onArtist: () => void;

  onFavorite: () => void;

  onInfo: () => void;
}


interface OptionProps {
  icon:
    keyof typeof
      MaterialCommunityIcons.glyphMap;

  title: string;

  color?: string;

  onPress: () => void;
}


function Option({
  icon,
  title,
  color = COLORS.white,
  onPress,
}: OptionProps) {
  return (
    <TouchableOpacity
      style={
        styles.option
      }
      activeOpacity={
        0.7
      }
      onPress={
        onPress
      }
    >
      <MaterialCommunityIcons
        name={
          icon
        }
        size={22}
        color={
          color
        }
      />


      <Text
        style={[
          styles.optionText,
          {
            color,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}


export default function SongMenuModal({
  visible,
  song,
  favorite,

  extraActionLabel,
  onExtraAction,

  onClose,
  onPlay,
  onPlayNext,
  onAddQueue,
  onAddPlaylist,
  onAlbum,
  onArtist,
  onFavorite,
  onInfo,
}: Props) {
  const {
    library,
  } =
    useApp();


  if (!song) {
    return null;
  }


  /* =========================================
     CERRAR MENÚ Y EJECUTAR ACCIÓN
  ========================================= */

  const closeAnd =
    (
      action:
        () => void
    ) => {
      onClose();


      requestAnimationFrame(
        action
      );
    };


  /* =========================================
     ABRIR CON OTRA APLICACIÓN
  ========================================= */

  const handleOpenWith =
    async () => {
      try {
        await openSongWithApp(
          song
        );
      } catch (error) {
        console.log(
          'Error abriendo audio:',
          error
        );


        Alert.alert(
          'Abrir con',
          'No se pudo abrir esta canción con otra aplicación.'
        );
      }
    };


  /* =========================================
     COMPARTIR ARCHIVO REAL
  ========================================= */

  const handleShare =
    async () => {
      try {
        await shareSongFile(
          song
        );
      } catch (error) {
        console.log(
          'Error compartiendo audio:',
          error
        );


        Alert.alert(
          'Compartir audio',
          'No se pudo compartir este archivo de audio.'
        );
      }
    };


  /* =========================================
     ELIMINAR ARCHIVO REAL
  ========================================= */

  const handleDelete =
    async () => {
      try {
        const result =
          await deleteSongFromDevice(
            song
          );


        /*
         * Android 11+:
         *
         * result.status será "requested"
         * porque Android mostrará su
         * confirmación oficial.
         */

        if (
          result.status ===
          'requested'
        ) {
          return;
        }


        /*
         * Android antiguo:
         * puede eliminar directamente.
         */

        if (
          result.status ===
          'deleted'
        ) {
          await library.refresh();

          return;
        }


        if (
          result.status ===
          'not_deleted'
        ) {
          Alert.alert(
            'Eliminar canción',
            'El archivo no pudo ser eliminado.'
          );
        }

      } catch (error) {
        console.log(
          'Error eliminando canción:',
          error
        );


        Alert.alert(
          'Eliminar canción',
          'No se pudo solicitar la eliminación del archivo.'
        );
      }
    };


  /* =========================================
     CONFIRMACIÓN DE HMUSIC
  ========================================= */

  const confirmDelete =
    () => {
      Alert.alert(
        'Eliminar del dispositivo',
        `Se eliminará permanentemente "${song.title}" del almacenamiento del teléfono.`,
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
                void handleDelete();
              },
          },
        ]
      );
    };


  return (
    <Modal
      visible={
        visible
      }
      transparent
      animationType="fade"
      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.overlay
        }
      >
        <TouchableOpacity
          style={
            StyleSheet.absoluteFill
          }
          activeOpacity={1}
          onPress={
            onClose
          }
        />


        <View
          style={
            styles.sheet
          }
        >
          {/* INFORMACIÓN CANCIÓN */}

          <View
            style={
              styles.songInfo
            }
          >
            <View
              style={
                styles.songTextContainer
              }
            >
              <Text
                style={
                  styles.songTitle
                }
                numberOfLines={1}
              >
                {song.title}
              </Text>


              <Text
                style={
                  styles.songArtist
                }
                numberOfLines={1}
              >
                {song.artist}
              </Text>
            </View>


            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={
                onClose
              }
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={
                  COLORS.white
                }
              />
            </TouchableOpacity>
          </View>


          {/* REPRODUCCIÓN */}

          <Option
            icon="play"
            title="Reproducir ahora"
            onPress={() =>
              closeAnd(
                onPlay
              )
            }
          />


          <Option
            icon="playlist-play"
            title="Reproducir después"
            onPress={() =>
              closeAnd(
                onPlayNext
              )
            }
          />


          <Option
            icon="playlist-plus"
            title="Añadir a la cola"
            onPress={() =>
              closeAnd(
                onAddQueue
              )
            }
          />


          <Option
            icon="playlist-music-outline"
            title="Añadir a playlist"
            onPress={() =>
              closeAnd(
                onAddPlaylist
              )
            }
          />


          <View
            style={
              styles.separator
            }
          />


          {/* NAVEGACIÓN */}

          <Option
            icon="album"
            title="Ir al álbum"
            onPress={() =>
              closeAnd(
                onAlbum
              )
            }
          />


          <Option
            icon="account-music-outline"
            title="Ir al artista"
            onPress={() =>
              closeAnd(
                onArtist
              )
            }
          />


          {/* FAVORITOS */}

          <Option
            icon={
              favorite
                ? 'heart'
                : 'heart-outline'
            }
            title={
              favorite
                ? 'Quitar de favoritos'
                : 'Añadir a favoritos'
            }
            color={
              favorite
                ? COLORS.pink
                : COLORS.white
            }
            onPress={() =>
              closeAnd(
                onFavorite
              )
            }
          />


          {/* INFORMACIÓN */}

          <Option
            icon="information-outline"
            title="Información"
            onPress={() =>
              closeAnd(
                onInfo
              )
            }
          />


          {/* ACCIÓN ESPECIAL */}

          {extraActionLabel &&
          onExtraAction ? (
            <Option
              icon="playlist-remove"
              title={
                extraActionLabel
              }
              color={
                COLORS.pink
              }
              onPress={() =>
                closeAnd(
                  onExtraAction
                )
              }
            />
          ) : null}


          <View
            style={
              styles.separator
            }
          />


          {/* ABRIR CON */}

          <Option
            icon="open-in-new"
            title="Abrir con..."
            color={
              COLORS.blue
            }
            onPress={() =>
              closeAnd(
                () => {
                  void handleOpenWith();
                }
              )
            }
          />


          {/* COMPARTIR */}

          <Option
            icon="share-variant-outline"
            title="Compartir archivo de audio"
            color={
              COLORS.purpleLight
            }
            onPress={() =>
              closeAnd(
                () => {
                  void handleShare();
                }
              )
            }
          />


          {/* ELIMINAR */}

          <Option
            icon="delete-outline"
            title="Eliminar del dispositivo"
            color={
              COLORS.pink
            }
            onPress={() =>
              closeAnd(
                confirmDelete
              )
            }
          />
        </View>
      </View>
    </Modal>
  );
}


const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.58)',

      justifyContent:
        'flex-end',
    },


    sheet: {
      backgroundColor:
        '#1A1A21',

      borderTopLeftRadius:
        28,

      borderTopRightRadius:
        28,

      paddingHorizontal:
        22,

      paddingTop:
        20,

      paddingBottom:
        34,

      maxHeight:
        '92%',
    },


    songInfo: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom:
        12,
    },


    songTextContainer: {
      flex: 1,
    },


    songTitle: {
      color:
        COLORS.white,

      fontSize:
        17,

      fontWeight:
        '700',
    },


    songArtist: {
      color:
        COLORS.textMuted,

      fontSize:
        12,

      marginTop:
        4,
    },


    closeButton: {
      width:
        42,

      height:
        42,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    option: {
      minHeight:
        48,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        14,
    },


    optionText: {
      fontSize:
        14,
    },


    separator: {
      height:
        StyleSheet.hairlineWidth,

      backgroundColor:
        '#34343D',

      marginVertical:
        5,
    },
  });