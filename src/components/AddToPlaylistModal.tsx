import {
    MaterialCommunityIcons,
  } from '@expo/vector-icons';
  
  import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
  } from 'react-native';
  
  import {
    useState,
  } from 'react';
  
  import {
    COLORS,
  } from '../constants/colors';
  
  import {
    Playlist,
  } from '../types/Song';
  
  
  interface Props {
  
    visible:
      boolean;
  
    playlists:
      Playlist[];
  
    onClose:
      () => void;
  
    onSelect:
      (
        playlistId:
          string
      ) => void;
  
    onCreate:
      (
        name:
          string
      ) =>
        Playlist | null;
  
  }
  
  
  export default function AddToPlaylistModal({
  
    visible,
  
    playlists,
  
    onClose,
  
    onSelect,
  
    onCreate,
  
  }: Props) {
  
    const [
      name,
      setName,
    ] =
      useState('');
  
  
    const create =
      () => {
  
        const playlist =
          onCreate(
            name
          );
  
  
        if (!playlist) {
  
          return;
  
        }
  
  
        setName(
          ''
        );
  
  
        onSelect(
          playlist.id
        );
  
  
        onClose();
  
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
                Añadir a playlist
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
                  "Nueva playlist..."
  
                placeholderTextColor={
                  COLORS.textMuted
                }
  
                style={
                  styles.input
                }
  
                selectionColor={
                  COLORS.purpleLight
                }
  
              />
  
  
              <TouchableOpacity
                style={
                  styles.add
                }
                onPress={
                  create
                }
              >
  
                <MaterialCommunityIcons
                  name="plus"
                  size={24}
                  color={
                    COLORS.white
                  }
                />
  
              </TouchableOpacity>
  
            </View>
  
  
            <ScrollView
              style={{
                maxHeight:
                  330,
              }}
            >
  
              {playlists.map(
                playlist => (
  
                  <TouchableOpacity
  
                    key={
                      playlist.id
                    }
  
                    style={
                      styles.playlist
                    }
  
                    onPress={() => {
  
                      onSelect(
                        playlist.id
                      );
  
  
                      onClose();
  
                    }}
                  >
  
                    <MaterialCommunityIcons
                      name="playlist-music"
                      size={24}
                      color={
                        COLORS.purpleLight
                      }
                    />
  
  
                    <View
                      style={{
                        flex:
                          1,
                      }}
                    >
  
                      <Text
                        style={
                          styles.playlistName
                        }
                      >
                        {playlist.name}
                      </Text>
  
  
                      <Text
                        style={
                          styles.playlistCount
                        }
                      >
                        {playlist.songIds.length} canciones
                      </Text>
  
                    </View>
  
  
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={23}
                      color={
                        COLORS.textMuted
                      }
                    />
  
                  </TouchableOpacity>
  
                )
              )}
  
            </ScrollView>
  
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
          18,
  
      },
  
  
      title: {
  
        color:
          COLORS.white,
  
        fontSize:
          20,
  
        fontWeight:
          '700',
  
      },
  
  
      createRow: {
  
        flexDirection:
          'row',
  
        gap:
          10,
  
        marginBottom:
          14,
  
      },
  
  
      input: {
  
        flex:
          1,
  
        height:
          48,
  
        borderRadius:
          15,
  
        backgroundColor:
          COLORS.surfaceLight,
  
        color:
          COLORS.white,
  
        paddingHorizontal:
          14,
  
      },
  
  
      add: {
  
        width:
          48,
  
        height:
          48,
  
        borderRadius:
          15,
  
        backgroundColor:
          COLORS.purple,
  
        justifyContent:
          'center',
  
        alignItems:
          'center',
  
      },
  
  
      playlist: {
  
        minHeight:
          62,
  
        flexDirection:
          'row',
  
        alignItems:
          'center',
  
        gap:
          12,
  
        borderBottomWidth:
          StyleSheet
            .hairlineWidth,
  
        borderBottomColor:
          '#31313A',
  
      },
  
  
      playlistName: {
  
        color:
          COLORS.white,
  
        fontSize:
          14,
  
        fontWeight:
          '600',
  
      },
  
  
      playlistCount: {
  
        color:
          COLORS.textMuted,
  
        fontSize:
          11,
  
        marginTop:
          3,
  
      },
  
    });