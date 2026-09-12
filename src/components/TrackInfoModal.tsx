import {
    MaterialCommunityIcons,
  } from '@expo/vector-icons';
  
  import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  } from 'react-native';
  
  import {
    useEffect,
    useState,
  } from 'react';
  
  import {
    COLORS,
  } from '../constants/colors';
  
  import {
    getSongDetails,
  } from '../services/musicLibrary';
  
  import {
    Song,
    TrackDetails,
  } from '../types/Song';
  
  import {
    formatBytes,
    formatDuration,
  } from '../utils/music';
  
  
  interface Props {
  
    visible:
      boolean;
  
    song:
      Song | null;
  
    onClose:
      () => void;
  
  }
  
  
  function Row({
  
    label,
  
    value,
  
  }: {
  
    label:
      string;
  
    value:
      string |
      number |
      null |
      undefined;
  
  }) {
  
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
  
      return null;
  
    }
  
  
    return (
  
      <View
        style={
          styles.row
        }
      >
  
        <Text
          style={
            styles.label
          }
        >
          {label}
        </Text>
  
  
        <Text
          style={
            styles.value
          }
          selectable
        >
          {String(
            value
          )}
        </Text>
  
      </View>
  
    );
  }
  
  
  export default function TrackInfoModal({
  
    visible,
  
    song,
  
    onClose,
  
  }: Props) {
  
    const [
      details,
      setDetails,
    ] =
      useState<
        TrackDetails | null
      >(null);
  
  
    const [
      loading,
      setLoading,
    ] =
      useState(
        false
      );
  
  
    useEffect(() => {
  
      if (
        !visible ||
        !song
      ) {
  
        return;
  
      }
  
  
      setDetails(
        null
      );
  
  
      setLoading(
        true
      );
  
  
      getSongDetails(
        song.id
      )
        .then(
          setDetails
        )
        .catch(
          console.log
        )
        .finally(
          () =>
            setLoading(
              false
            )
        );
  
    }, [
      visible,
      song?.id,
    ]);
  
  
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
  
          <View
            style={
              styles.sheet
            }
          >
  
            <View
              style={
                styles.header
              }
            >
  
              <Text
                style={
                  styles.title
                }
              >
                Información
              </Text>
  
  
              <TouchableOpacity
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
  
  
            {song ? (
  
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
              >
  
                <Row
                  label="Título"
                  value={
                    song.title
                  }
                />
  
  
                <Row
                  label="Artista"
                  value={
                    song.artist
                  }
                />
  
  
                <Row
                  label="Álbum"
                  value={
                    song.album
                  }
                />
  
  
                <Row
                  label="Duración"
                  value={
                    formatDuration(
                      song.duration
                    )
                  }
                />
  
  
                <Row
                  label="Tamaño"
                  value={
                    formatBytes(
                      song.fileSize
                    )
                  }
                />
  
  
                <Row
                  label="Ruta / URI"
                  value={
                    song.uri
                  }
                />
  
  
                {loading ? (
  
                  <ActivityIndicator
                    style={{
                      marginTop:
                        20,
                    }}
                    color={
                      COLORS.purple
                    }
                  />
  
                ) : details ? (
  
                  <>
  
                    <Row
                      label="Formato"
                      value={
                        details.format
                      }
                    />
  
  
                    <Row
                      label="Bitrate"
                      value={
                        details.bitrate
                          ? `${details.bitrate} kbps`
                          : null
                      }
                    />
  
  
                    <Row
                      label="Sample rate"
                      value={
                        details.sampleRate
                          ? `${details.sampleRate} Hz`
                          : null
                      }
                    />
  
  
                    <Row
                      label="Canales"
                      value={
                        details.channels
                      }
                    />
  
  
                    <Row
                      label="Año"
                      value={
                        details.year
                      }
                    />
  
  
                    <Row
                      label="Género"
                      value={
                        details.genre
                      }
                    />
  
  
                    <Row
                      label="Pista"
                      value={
                        details.track
                      }
                    />
  
  
                    <Row
                      label="Disco"
                      value={
                        details.disc
                      }
                    />
  
  
                    <Row
                      label="Compositor"
                      value={
                        details.composer
                      }
                    />
  
  
                    <Row
                      label="Artista del álbum"
                      value={
                        details.albumArtist
                      }
                    />
  
  
                    <Row
                      label="Letra"
                      value={
                        details.lyrics
                      }
                    />
  
                  </>
  
                ) : null}
  
              </ScrollView>
  
            ) : null}
  
          </View>
  
        </View>
  
      </Modal>
    );
  }
  
  
  const styles =
    StyleSheet.create({
  
      overlay: {
  
        flex:
          1,
  
        backgroundColor:
          'rgba(0,0,0,0.6)',
  
        justifyContent:
          'flex-end',
  
      },
  
  
      sheet: {
  
        maxHeight:
          '82%',
  
        backgroundColor:
          '#1A1A21',
  
        borderTopLeftRadius:
          28,
  
        borderTopRightRadius:
          28,
  
        padding:
          22,
  
        paddingBottom:
          34,
  
      },
  
  
      header: {
  
        flexDirection:
          'row',
  
        justifyContent:
          'space-between',
  
        alignItems:
          'center',
  
        marginBottom:
          16,
  
      },
  
  
      title: {
  
        color:
          COLORS.white,
  
        fontSize:
          20,
  
        fontWeight:
          '700',
  
      },
  
  
      row: {
  
        paddingVertical:
          11,
  
        borderBottomWidth:
          StyleSheet
            .hairlineWidth,
  
        borderBottomColor:
          '#303039',
  
      },
  
  
      label: {
  
        color:
          COLORS.textMuted,
  
        fontSize:
          10,
  
        textTransform:
          'uppercase',
  
      },
  
  
      value: {
  
        color:
          COLORS.white,
  
        fontSize:
          13,
  
        marginTop:
          4,
  
        lineHeight:
          19,
  
      },
  
    });