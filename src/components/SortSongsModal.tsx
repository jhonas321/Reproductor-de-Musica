import {
    MaterialCommunityIcons,
  } from '@expo/vector-icons';
  
  import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  } from 'react-native';
  
  import {
    SafeAreaView,
  } from 'react-native-safe-area-context';
  
  import {
    COLORS,
  } from '../constants/colors';
  
  type SongSortBy =
    | 'title'
    | 'artist'
    | 'album'
    | 'createdAt'
    | 'duration';
  
  
  type SongSortDirection =
    | 'asc'
    | 'desc';
  
  
  interface SongSortSettings {
    sortBy:
      SongSortBy;
  
    direction:
      SongSortDirection;
  }
  
  
  interface Props {
    visible:
      boolean;
  
    settings:
      SongSortSettings;
  
    onSortBy:
      (
        value: SongSortBy
      ) => void;
  
    onDirection:
      (
        value:
          SongSortDirection
      ) => void;
  
    onReset:
      () => void;
  
    onClose:
      () => void;
  }
  
  
  const SORT_OPTIONS: {
    value:
      SongSortBy;
  
    label:
      string;
  
    icon:
      keyof typeof MaterialCommunityIcons.glyphMap;
  }[] = [
    {
      value:
        'title',
  
      label:
        'Título',
  
      icon:
        'format-title',
    },
  
    {
      value:
        'artist',
  
      label:
        'Artista',
  
      icon:
        'account-music-outline',
    },
  
    {
      value:
        'album',
  
      label:
        'Álbum',
  
      icon:
        'album',
    },
  
    {
      value:
        'createdAt',
  
      label:
        'Fecha agregada',
  
      icon:
        'calendar-clock-outline',
    },
  
    {
      value:
        'duration',
  
      label:
        'Duración',
  
      icon:
        'clock-outline',
    },
  ];
  
  
  function getDirectionLabel(
    sortBy:
      SongSortBy,
    direction:
      SongSortDirection
  ) {
    if (
      sortBy ===
      'createdAt'
    ) {
      return direction ===
        'desc'
  
        ? 'Más recientes'
  
        : 'Más antiguas';
    }
  
  
    if (
      sortBy ===
      'duration'
    ) {
      return direction ===
        'desc'
  
        ? 'Más largas'
  
        : 'Más cortas';
    }
  
  
    return direction ===
      'asc'
  
      ? 'Ascendente'
  
      : 'Descendente';
  }
  
  
  export default function SortSongsModal({
    visible,
    settings,
    onSortBy,
    onDirection,
    onReset,
    onClose,
  }: Props) {
    return (
      <Modal
        visible={
          visible
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={
          onClose
        }
      >
        <Pressable
          style={
            styles.backdrop
          }
          onPress={
            onClose
          }
        >
          <Pressable
            style={
              styles.sheetWrapper
            }
            onPress={() => {}}
          >
            <SafeAreaView
              edges={[
                'bottom',
              ]}
              style={
                styles.sheet
              }
            >
              <View
                style={
                  styles.header
                }
              >
                <View>
                  <Text
                    style={
                      styles.title
                    }
                  >
                    Ordenar canciones
                  </Text>
  
  
                  <Text
                    style={
                      styles.subtitle
                    }
                  >
                    Elige cómo quieres ver tu biblioteca
                  </Text>
                </View>
  
  
                <TouchableOpacity
                  style={
                    styles.closeButton
                  }
                  activeOpacity={
                    0.7
                  }
                  onPress={
                    onClose
                  }
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color={
                      COLORS.white
                    }
                  />
                </TouchableOpacity>
              </View>
  
  
              <Text
                style={
                  styles.sectionLabel
                }
              >
                ORDENAR POR
              </Text>
  
  
              <View
                style={
                  styles.options
                }
              >
                {SORT_OPTIONS.map(
                  option => {
                    const active =
                      settings.sortBy ===
                      option.value;
  
  
                    return (
                      <TouchableOpacity
                        key={
                          option.value
                        }
                        style={[
                          styles.option,
  
                          active &&
                            styles.optionActive,
                        ]}
                        activeOpacity={
                          0.72
                        }
                        onPress={() =>
                          onSortBy(
                            option.value
                          )
                        }
                      >
                        <View
                          style={[
                            styles.optionIcon,
  
                            active &&
                              styles.optionIconActive,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              option.icon
                            }
                            size={21}
                            color={
                              active
                                ? COLORS.purpleLight
                                : COLORS.white
                            }
                          />
                        </View>
  
  
                        <Text
                          style={[
                            styles.optionText,
  
                            active &&
                              styles.optionTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
  
  
                        {active ? (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={20}
                            color={
                              COLORS.purpleLight
                            }
                          />
                        ) : null}
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
  
  
              <Text
                style={[
                  styles.sectionLabel,
                  styles.directionSection,
                ]}
              >
                DIRECCIÓN
              </Text>
  
  
              <View
                style={
                  styles.directionRow
                }
              >
                {(
                  [
                    'asc',
                    'desc',
                  ] as
                    SongSortDirection[]
                ).map(
                  direction => {
                    const active =
                      settings.direction ===
                      direction;
  
  
                    return (
                      <TouchableOpacity
                        key={
                          direction
                        }
                        style={[
                          styles.directionButton,
  
                          active &&
                            styles.directionButtonActive,
                        ]}
                        activeOpacity={
                          0.72
                        }
                        onPress={() =>
                          onDirection(
                            direction
                          )
                        }
                      >
                        <MaterialCommunityIcons
                          name={
                            direction ===
                            'asc'
  
                              ? 'sort-ascending'
  
                              : 'sort-descending'
                          }
                          size={21}
                          color={
                            active
                              ? COLORS.purpleLight
                              : '#D0D0D8'
                          }
                        />
  
  
                        <Text
                          style={[
                            styles.directionText,
  
                            active &&
                              styles.directionTextActive,
                          ]}
                        >
                          {getDirectionLabel(
                            settings.sortBy,
                            direction
                          )}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
  
  
              <View
                style={
                  styles.actions
                }
              >
                <TouchableOpacity
                  style={
                    styles.resetButton
                  }
                  activeOpacity={
                    0.72
                  }
                  onPress={
                    onReset
                  }
                >
                  <MaterialCommunityIcons
                    name="restore"
                    size={19}
                    color={
                      '#D5D5DC'
                    }
                  />
  
  
                  <Text
                    style={
                      styles.resetText
                    }
                  >
                    Restablecer
                  </Text>
                </TouchableOpacity>
  
  
                <TouchableOpacity
                  style={
                    styles.doneButton
                  }
                  activeOpacity={
                    0.8
                  }
                  onPress={
                    onClose
                  }
                >
                  <Text
                    style={
                      styles.doneText
                    }
                  >
                    Listo
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }
  
  
  const styles =
    StyleSheet.create({
      backdrop: {
        flex:
          1,
  
        backgroundColor:
          'rgba(0,0,0,0.62)',
  
        justifyContent:
          'flex-end',
      },
  
  
      sheetWrapper: {
        width:
          '100%',
      },
  
  
      sheet: {
        backgroundColor:
          '#17171E',
  
        borderTopLeftRadius:
          28,
  
        borderTopRightRadius:
          28,
  
        paddingHorizontal:
          20,
  
        paddingTop:
          18,
  
        paddingBottom:
          8,
  
        borderWidth:
          StyleSheet.hairlineWidth,
  
        borderColor:
          'rgba(255,255,255,0.10)',
      },
  
  
      header: {
        flexDirection:
          'row',
  
        justifyContent:
          'space-between',
  
        alignItems:
          'center',
  
        marginBottom:
          22,
      },
  
  
      title: {
        color:
          COLORS.white,
  
        fontSize:
          22,
  
        fontWeight:
          '800',
      },
  
  
      subtitle: {
        color:
          COLORS.textSecondary,
  
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
  
        borderRadius:
          21,
  
        alignItems:
          'center',
  
        justifyContent:
          'center',
  
        backgroundColor:
          'rgba(255,255,255,0.08)',
      },
  
  
      sectionLabel: {
        color:
          '#90909B',
  
        fontSize:
          10,
  
        fontWeight:
          '800',
  
        letterSpacing:
          1.2,
  
        marginBottom:
          10,
      },
  
  
      options: {
        gap:
          8,
      },
  
  
      option: {
        height:
          54,
  
        borderRadius:
          16,
  
        paddingHorizontal:
          13,
  
        flexDirection:
          'row',
  
        alignItems:
          'center',
  
        backgroundColor:
          'rgba(255,255,255,0.055)',
  
        borderWidth:
          StyleSheet.hairlineWidth,
  
        borderColor:
          'rgba(255,255,255,0.09)',
      },
  
  
      optionActive: {
        backgroundColor:
          'rgba(139,92,246,0.15)',
  
        borderColor:
          'rgba(167,139,250,0.32)',
      },
  
  
      optionIcon: {
        width:
          34,
  
        height:
          34,
  
        borderRadius:
          11,
  
        alignItems:
          'center',
  
        justifyContent:
          'center',
  
        marginRight:
          11,
  
        backgroundColor:
          'rgba(255,255,255,0.06)',
      },
  
  
      optionIconActive: {
        backgroundColor:
          'rgba(139,92,246,0.18)',
      },
  
  
      optionText: {
        flex:
          1,
  
        color:
          '#E0E0E6',
  
        fontSize:
          14,
  
        fontWeight:
          '600',
      },
  
  
      optionTextActive: {
        color:
          COLORS.white,
      },
  
  
      directionSection: {
        marginTop:
          20,
      },
  
  
      directionRow: {
        flexDirection:
          'row',
  
        gap:
          10,
      },
  
  
      directionButton: {
        flex:
          1,
  
        minHeight:
          52,
  
        borderRadius:
          16,
  
        paddingHorizontal:
          12,
  
        flexDirection:
          'row',
  
        alignItems:
          'center',
  
        justifyContent:
          'center',
  
        gap:
          8,
  
        backgroundColor:
          'rgba(255,255,255,0.055)',
  
        borderWidth:
          StyleSheet.hairlineWidth,
  
        borderColor:
          'rgba(255,255,255,0.09)',
      },
  
  
      directionButtonActive: {
        backgroundColor:
          'rgba(139,92,246,0.15)',
  
        borderColor:
          'rgba(167,139,250,0.32)',
      },
  
  
      directionText: {
        color:
          '#D0D0D8',
  
        fontSize:
          12,
  
        fontWeight:
          '600',
      },
  
  
      directionTextActive: {
        color:
          COLORS.white,
      },
  
  
      actions: {
        flexDirection:
          'row',
  
        gap:
          10,
  
        marginTop:
          22,
      },
  
  
      resetButton: {
        flex:
          1,
  
        height:
          50,
  
        borderRadius:
          16,
  
        flexDirection:
          'row',
  
        alignItems:
          'center',
  
        justifyContent:
          'center',
  
        gap:
          7,
  
        backgroundColor:
          'rgba(255,255,255,0.06)',
      },
  
  
      resetText: {
        color:
          '#D5D5DC',
  
        fontSize:
          13,
  
        fontWeight:
          '600',
      },
  
  
      doneButton: {
        flex:
          1,
  
        height:
          50,
  
        borderRadius:
          16,
  
        alignItems:
          'center',
  
        justifyContent:
          'center',
  
        backgroundColor:
          COLORS.purple,
      },
  
  
      doneText: {
        color:
          COLORS.white,
  
        fontSize:
          14,
  
        fontWeight:
          '800',
      },
    });
  