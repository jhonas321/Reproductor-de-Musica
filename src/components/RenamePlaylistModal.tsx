import {
    MaterialCommunityIcons,
  } from '@expo/vector-icons';
  
  import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
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
  
  
  interface Props {
  
    visible:
      boolean;
  
    initialName:
      string;
  
    onClose:
      () => void;
  
    onSave:
      (
        name:
          string
      ) => void;
  
  }
  
  
  export default function RenamePlaylistModal({
  
    visible,
  
    initialName,
  
    onClose,
  
    onSave,
  
  }: Props) {
  
    const [
      name,
      setName,
    ] =
      useState(
        initialName
      );
  
  
    useEffect(() => {
  
      if (
        visible
      ) {
  
        setName(
          initialName
        );
  
      }
  
    }, [
      visible,
      initialName,
    ]);
  
  
    const save =
      () => {
  
        const clean =
          name.trim();
  
  
        if (!clean) {
  
          return;
  
        }
  
  
        onSave(
          clean
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
              styles.card
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
                Renombrar playlist
              </Text>
  
  
              <TouchableOpacity
                onPress={
                  onClose
                }
              >
  
                <MaterialCommunityIcons
                  name="close"
                  size={23}
                  color={
                    COLORS.white
                  }
                />
  
              </TouchableOpacity>
  
            </View>
  
  
            <TextInput
  
              value={
                name
              }
  
              onChangeText={
                setName
              }
  
              style={
                styles.input
              }
  
              placeholder=
                "Nombre de la playlist"
  
              placeholderTextColor={
                COLORS.textMuted
              }
  
              selectionColor={
                COLORS.purpleLight
              }
  
              autoFocus
  
            />
  
  
            <TouchableOpacity
              style={
                styles.save
              }
              onPress={
                save
              }
            >
  
              <Text
                style={
                  styles.saveText
                }
              >
                Guardar
              </Text>
  
            </TouchableOpacity>
  
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
          'rgba(0,0,0,.62)',
  
        justifyContent:
          'center',
  
        paddingHorizontal:
          28,
  
      },
  
  
      card: {
  
        backgroundColor:
          '#1A1A21',
  
        borderRadius:
          24,
  
        padding:
          20,
  
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
          18,
  
        fontWeight:
          '700',
  
      },
  
  
      input: {
  
        height:
          50,
  
        backgroundColor:
          COLORS.surfaceLight,
  
        borderRadius:
          15,
  
        paddingHorizontal:
          14,
  
        color:
          COLORS.white,
  
      },
  
  
      save: {
  
        marginTop:
          14,
  
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
  
  
      saveText: {
  
        color:
          COLORS.white,
  
        fontSize:
          14,
  
        fontWeight:
          '700',
  
      },
  
    });