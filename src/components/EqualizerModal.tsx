import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import {
  useApp,
} from '../context/AppContext';
import type {
  HmusicEqualizerBand,
  HmusicEqualizerInfo,
} from '../hooks/useMusicPlayer';
interface Props {
  visible:
    boolean;
  onClose:
    () => void;
}
type PresetName =
  | 'Normal'
  | 'Bass'
  | 'Rock'
  | 'Pop'
  | 'Treble';
const PRESETS:
  PresetName[] = [
    'Normal',
    'Bass',
    'Rock',
    'Pop',
    'Treble',
  ];
function formatFrequency(
  hz:
    number
) {
  if (
    hz >=
    1000
  ) {
    const value =
      hz /
      1000;
    return `${
      value >= 10
        ? Math.round(
            value
          )
        : value.toFixed(
            1
          )
    }k`;
  }
  return `${
    Math.round(
      hz
    )
  }`;
}
function mbToDb(
  value:
    number
) {
  return value /
    100;
}
function formatDb(
  valueMb:
    number
) {
  const db =
    mbToDb(
      valueMb
    );
  if (
    Math.abs(
      db
    ) <
    0.05
  ) {
    return '0 dB';
  }
  return `${
    db > 0
      ? '+'
      : ''
  }${
    db.toFixed(
      1
    )
  } dB`;
}
function clamp(
  value:
    number,
  min:
    number,
  max:
    number
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}
function getPresetDb(
  preset:
    PresetName,
  frequencyHz:
    number
) {
  switch (
    preset
  ) {
    case 'Bass':
      if (
        frequencyHz <=
        120
      ) {
        return 6;
      }
      if (
        frequencyHz <=
        300
      ) {
        return 4;
      }
      if (
        frequencyHz <=
        1000
      ) {
        return 1.5;
      }
      return 0;
    case 'Rock':
      if (
        frequencyHz <=
        120
      ) {
        return 4.5;
      }
      if (
        frequencyHz <=
        400
      ) {
        return 2;
      }
      if (
        frequencyHz <=
        1500
      ) {
        return -1;
      }
      if (
        frequencyHz <=
        6000
      ) {
        return 3;
      }
      return 4;
    case 'Pop':
      if (
        frequencyHz <=
        200
      ) {
        return 2;
      }
      if (
        frequencyHz <=
        1200
      ) {
        return 3;
      }
      if (
        frequencyHz <=
        6000
      ) {
        return 2.5;
      }
      return 1.5;
    case 'Treble':
      if (
        frequencyHz <
        1000
      ) {
        return 0;
      }
      if (
        frequencyHz <
        4000
      ) {
        return 2;
      }
      return 5.5;
    default:
      return 0;
  }
}
interface BandSliderProps {
  band: HmusicEqualizerBand;
  min: number;
  max: number;
  disabled: boolean;
  onChange: (bandIndex: number, levelMb: number) => void;
  onChangeComplete: (bandIndex: number, levelMb: number) => void;
}
function BandSlider({
  band,
  min,
  max,
  disabled,
  onChange,
  onChangeComplete,
}: BandSliderProps) {
  const trackRef = useRef<View | null>(null);
  const trackWidth = useRef(1);
  const trackLeft = useRef(0);
  const lastValue = useRef(band.levelMb);
  useEffect(() => {
    lastValue.current = band.levelMb;
  }, [band.levelMb]);
  const measureTrack = useCallback((callback?: () => void) => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackLeft.current = x;
      trackWidth.current = Math.max(width, 1);
      callback?.();
    });
  }, []);
  const updateFromPageX = useCallback(
    (pageX: number) => {
      if (disabled) {
        return;
      }
      const localX = pageX - trackLeft.current;
      const ratio = clamp(
        localX / Math.max(1, trackWidth.current),
        0,
        1
      );
      const raw = min + (max - min) * ratio;
      const stepped = Math.round(raw / 50) * 50;
      const value = clamp(stepped, min, max);
      lastValue.current = value;
      onChange(band.index, value);
    },
    [band.index, disabled, min, max, onChange]
  );
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: event => {
          const pageX = event.nativeEvent.pageX;
          measureTrack(() => {
            updateFromPageX(pageX);
          });
        },
        onPanResponderMove: (_event, gestureState) => {
          updateFromPageX(gestureState.moveX);
        },
        onPanResponderRelease: () => {
          onChangeComplete(band.index, lastValue.current);
        },
        onPanResponderTerminate: () => {
          onChangeComplete(band.index, lastValue.current);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [
      band.index,
      disabled,
      measureTrack,
      onChangeComplete,
      updateFromPageX,
    ]
  );
  const ratio =
    max === min
      ? 0.5
      : clamp((band.levelMb - min) / (max - min), 0, 1);
  return (
    <View style={styles.bandCard}>
      <View style={styles.bandHeader}>
        <View>
          <Text style={styles.bandFrequency}>
            {formatFrequency(band.centerFrequencyHz)} Hz
          </Text>
          <Text style={styles.bandKind}>
            Banda {band.index + 1}
          </Text>
        </View>
        <Text style={styles.bandValue}>
          {formatDb(band.levelMb)}
        </Text>
      </View>
      <View
        style={styles.sliderTouchArea}
        {...panResponder.panHandlers}
      >
        <View
          ref={trackRef}
          style={[
            styles.sliderTrack,
            disabled && styles.sliderTrackDisabled,
          ]}
          onLayout={event => {
            trackWidth.current = event.nativeEvent.layout.width;
            measureTrack();
          }}
        >
          <View
            pointerEvents="none"
            style={[
              styles.sliderFill,
              { width: `${ratio * 100}%` },
            ]}
          />

          <View
            pointerEvents="none"
            style={[
              styles.sliderThumb,
              { left: `${ratio * 100}%` },
              disabled && styles.sliderThumbDisabled,
            ]}
          />
        </View>
      </View>

      <View style={styles.sliderScale}>
        <Text style={styles.sliderScaleText}>{formatDb(min)}</Text>
        <Text style={styles.sliderScaleText}>0 dB</Text>
        <Text style={styles.sliderScaleText}>{formatDb(max)}</Text>
      </View>
    </View>
  );
}
function EqualizerModal({
  visible,
  onClose,
}: Props) {
  const {
    player,
  } =
    useApp();
  const [
    info,
    setInfo,
  ] =
    useState<
      HmusicEqualizerInfo | null
    >(
      null
    );
  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );
  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );
  const [
    preset,
    setPreset,
  ] =
    useState<
      PresetName | null
    >(
      null
    );
  const load =
    useCallback(
      async () => {
        setLoading(
          true
        );
        setError(
          null
        );
        try {
          const next =
            await player
              .getEqualizerInfo();
          setInfo(
            next
          );
        } catch (
          loadError
        ) {
          const message =
            loadError instanceof
              Error
              ? loadError.message
              : 'No se pudo abrir el ecualizador. Reproduce una canción e inténtalo otra vez.';
          setError(
            message
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        player
          .getEqualizerInfo,
      ]
    );
  useEffect(
    () => {
      if (
        visible
      ) {
        void load();
      }
    },
    [
      visible,
      load,
    ]
  );
  const toggleEnabled =
    useCallback(
      async (
        enabled:
          boolean
      ) => {
        try {
          const next =
            await player
              .setEqualizerEnabled(
                enabled
              );
          setInfo(
            next
          );
        } catch (
          toggleError
        ) {
          setError(
            toggleError instanceof
              Error
              ? toggleError.message
              : 'No se pudo cambiar el estado del ecualizador.'
          );
        }
      },
      [
        player
          .setEqualizerEnabled,
      ]
    );
  const changeBand =
    useCallback(
      (bandIndex: number, levelMb: number) => {
        setPreset(null);
        setInfo(current => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            bands: current.bands.map(band =>
              band.index === bandIndex
                ? { ...band, levelMb }
                : band
            ),
          };
        });
      },
      []
    );
  const commitBand =
    useCallback(
      async (bandIndex: number, levelMb: number) => {
        try {
          setError(null);
          await player.setEqualizerBandLevel(bandIndex, levelMb);
        } catch (bandError) {
          setError(
            bandError instanceof Error
              ? bandError.message
              : 'No se pudo ajustar la banda.'
          );
        }
      },
      [player.setEqualizerBandLevel]
    );
  const applyPreset =
    useCallback(
      async (
        name:
          PresetName
      ) => {
        if (
          !info
        ) {
          return;
        }
        const levels =
          info.bands.map(
            band => {
              const requestedMb =
                Math.round(
                  getPresetDb(
                    name,
                    band.centerFrequencyHz
                  ) *
                  100
                );
              return clamp(
                requestedMb,
                info.minLevelMb,
                info.maxLevelMb
              );
            }
          );
        try {
          const next =
            await player
              .setEqualizerLevels(
                levels
              );
          setInfo(
            next
          );
          setPreset(
            name
          );
          if (
            !next.enabled
          ) {
            const enabledInfo =
              await player
                .setEqualizerEnabled(
                  true
                );
            setInfo(
              enabledInfo
            );
          }
        } catch (
          presetError
        ) {
          setError(
            presetError instanceof
              Error
              ? presetError.message
              : 'No se pudo aplicar el preset.'
          );
        }
      },
      [
        info,
        player
          .setEqualizerLevels,
        player
          .setEqualizerEnabled,
      ]
    );
  const reset =
    useCallback(
      async () => {
        try {
          const next =
            await player
              .resetEqualizer();
          setInfo(
            next
          );
          setPreset(
            'Normal'
          );
        } catch (
          resetError
        ) {
          setError(
            resetError instanceof
              Error
              ? resetError.message
              : 'No se pudo restablecer el ecualizador.'
          );
        }
      },
      [
        player
          .resetEqualizer,
      ]
    );
  return (
    <Modal
      visible={
        visible
      }
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={
        onClose
      }
    >
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            style={
              styles.headerButton
            }
            activeOpacity={
              0.72
            }
            onPress={
              onClose
            }
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={29}
              color={
                COLORS.white
              }
            />
          </TouchableOpacity>
          <View
            style={
              styles.headerCenter
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              Ecualizador
            </Text>
            <Text
              style={
                styles.headerSubtitle
              }
            >
              Hmusic Audio
            </Text>
          </View>
          <TouchableOpacity
            style={
              styles.headerButton
            }
            activeOpacity={
              0.72
            }
            onPress={
              reset
            }
            disabled={
              !info
            }
          >
            <MaterialCommunityIcons
              name="restore"
              size={22}
              color={
                COLORS.white
              }
            />
          </TouchableOpacity>
        </View>
        {
          loading
            ? (
              <View
                style={
                  styles.centerState
                }
              >
                <ActivityIndicator
                  size="large"
                  color={
                    COLORS.purpleLight
                  }
                />
                <Text
                  style={
                    styles.stateText
                  }
                >
                  Conectando con el audio...
                </Text>
              </View>
            )
            : error &&
              !info
              ? (
                <View
                  style={
                    styles.centerState
                  }
                >
                  <MaterialCommunityIcons
                    name="equalizer"
                    size={52}
                    color="#A9A9B4"
                  />
                  <Text
                    style={
                      styles.errorTitle
                    }
                  >
                    Ecualizador no disponible
                  </Text>
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {error}
                  </Text>
                  <TouchableOpacity
                    style={
                      styles.retryButton
                    }
                    activeOpacity={
                      0.78
                    }
                    onPress={
                      load
                    }
                  >
                    <Text
                      style={
                        styles.retryText
                      }
                    >
                      Reintentar
                    </Text>
                  </TouchableOpacity>
                </View>
              )
              : info
                ? (
                  <ScrollView
                    contentContainerStyle={
                      styles.content
                    }
                    showsVerticalScrollIndicator={
                      false
                    }
                  >
                    <View
                      style={
                        styles.powerCard
                      }
                    >
                      <View
                        style={
                          styles.powerIcon
                        }
                      >
                        <MaterialCommunityIcons
                          name="equalizer"
                          size={25}
                          color={
                            info.enabled
                              ? COLORS.purpleLight
                              : '#A4A4AE'
                          }
                        />
                      </View>
                      <View
                        style={
                          styles.powerText
                        }
                      >
                        <Text
                          style={
                            styles.powerTitle
                          }
                        >
                          Ecualizador
                        </Text>
                        <Text
                          style={
                            styles.powerSubtitle
                          }
                        >
                          {
                            info.enabled
                              ? 'Procesando el audio en tiempo real'
                              : 'El sonido se reproduce sin modificaciones'
                          }
                        </Text>
                      </View>
                      <Switch
                        value={
                          info.enabled
                        }
                        onValueChange={
                          toggleEnabled
                        }
                      />
                    </View>
                    <Text
                      style={
                        styles.sectionLabel
                      }
                    >
                      PRESETS
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={
                        false
                      }
                      contentContainerStyle={
                        styles.presets
                      }
                    >
                      {
                        PRESETS.map(
                          name => (
                            <Pressable
                              key={
                                name
                              }
                              style={[
                                styles.presetChip,
                                preset ===
                                  name &&
                                  styles.presetChipActive,
                              ]}
                              onPress={
                                () =>
                                  applyPreset(
                                    name
                                  )
                              }
                            >
                              <Text
                                style={[
                                  styles.presetText,
                                  preset ===
                                    name &&
                                    styles.presetTextActive,
                                ]}
                              >
                                {name}
                              </Text>
                            </Pressable>
                          )
                        )
                      }
                    </ScrollView>
                    <View
                      style={
                        styles.rangeRow
                      }
                    >
                      <Text
                        style={
                          styles.sectionLabel
                        }
                      >
                        BANDAS
                      </Text>
                      <Text
                        style={
                          styles.rangeText
                        }
                      >
                        {
                          formatDb(
                            info.minLevelMb
                          )
                        } a {
                          formatDb(
                            info.maxLevelMb
                          )
                        }
                      </Text>
                    </View>
                    {
                      info.bands.map(
                        band => (
                          <BandSlider
                            key={
                              band.index
                            }
                            band={
                              band
                            }
                            min={
                              info.minLevelMb
                            }
                            max={
                              info.maxLevelMb
                            }
                            disabled={
                              !info.enabled
                            }
                            onChange={
                              changeBand
                            }
                            onChangeComplete={
                              commitBand
                            }
                          />
                        )
                      )
                    }
                    {
                      error
                        ? (
                          <Text
                            style={
                              styles.inlineError
                            }
                          >
                            {error}
                          </Text>
                        )
                        : null
                    }
                    <View
                      style={
                        styles.tipCard
                      }
                    >
                      <MaterialCommunityIcons
                        name="information-outline"
                        size={19}
                        color="#B9B9C4"
                      />
                      <Text
                        style={
                          styles.tipText
                        }
                      >
                        Los valores y frecuencias son los que ofrece el ecualizador real de tu teléfono. Los cambios se guardan automáticamente.
                      </Text>
                    </View>
                  </ScrollView>
                )
                : null
        }
      </SafeAreaView>
    </Modal>
  );
}
export default memo(
  EqualizerModal
);
const styles =
  StyleSheet.create({
    container: {
      flex:
        1,
      backgroundColor:
        '#0B0B12',
    },
    header: {
      height:
        62,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal:
        14,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        'rgba(255,255,255,0.10)',
    },
    headerButton: {
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
    headerCenter: {
      flex:
        1,
      alignItems:
        'center',
    },
    headerTitle: {
      color:
        COLORS.white,
      fontSize:
        17,
      fontWeight:
        '700',
    },
    headerSubtitle: {
      color:
        '#8F8F9A',
      fontSize:
        9,
      marginTop:
        2,
      letterSpacing:
        1.1,
      textTransform:
        'uppercase',
    },
    centerState: {
      flex:
        1,
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal:
        28,
    },
    stateText: {
      color:
        '#B4B4BE',
      fontSize:
        12,
      marginTop:
        14,
    },
    errorTitle: {
      color:
        COLORS.white,
      fontSize:
        18,
      fontWeight:
        '700',
      marginTop:
        16,
    },
    errorText: {
      color:
        '#A9A9B4',
      fontSize:
        12,
      lineHeight:
        19,
      textAlign:
        'center',
      marginTop:
        8,
    },
    retryButton: {
      marginTop:
        20,
      minWidth:
        120,
      height:
        42,
      borderRadius:
        14,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        COLORS.purple,
    },
    retryText: {
      color:
        COLORS.white,
      fontSize:
        12,
      fontWeight:
        '700',
    },
    content: {
      padding:
        16,
      paddingBottom:
        34,
    },
    powerCard: {
      minHeight:
        76,
      borderRadius:
        20,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal:
        14,
      backgroundColor:
        'rgba(255,255,255,0.065)',
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor:
        'rgba(255,255,255,0.11)',
    },
    powerIcon: {
      width:
        46,
      height:
        46,
      borderRadius:
        15,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(139,92,246,0.15)',
    },
    powerText: {
      flex:
        1,
      paddingHorizontal:
        12,
    },
    powerTitle: {
      color:
        COLORS.white,
      fontSize:
        14,
      fontWeight:
        '700',
    },
    powerSubtitle: {
      color:
        '#9D9DA8',
      fontSize:
        10,
      lineHeight:
        15,
      marginTop:
        3,
    },
    sectionLabel: {
      color:
        '#8E8E99',
      fontSize:
        9,
      fontWeight:
        '700',
      letterSpacing:
        1.2,
      marginTop:
        21,
      marginBottom:
        10,
    },
    presets: {
      gap:
        8,
      paddingRight:
        12,
    },
    presetChip: {
      minWidth:
        74,
      height:
        38,
      borderRadius:
        13,
      paddingHorizontal:
        14,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(255,255,255,0.065)',
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor:
        'rgba(255,255,255,0.12)',
    },
    presetChipActive: {
      backgroundColor:
        'rgba(139,92,246,0.22)',
      borderColor:
        'rgba(167,139,250,0.40)',
    },
    presetText: {
      color:
        '#D1D1D8',
      fontSize:
        11,
      fontWeight:
        '600',
    },
    presetTextActive: {
      color:
        COLORS.purpleLight,
    },
    rangeRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },
    rangeText: {
      color:
        '#85858F',
      fontSize:
        9,
      marginTop:
        13,
    },
    bandCard: {
      borderRadius:
        18,
      paddingHorizontal:
        14,
      paddingTop:
        13,
      paddingBottom:
        12,
      marginBottom:
        10,
      backgroundColor:
        'rgba(255,255,255,0.052)',
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor:
        'rgba(255,255,255,0.09)',
    },
    bandHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },
    bandFrequency: {
      color:
        COLORS.white,
      fontSize:
        13,
      fontWeight:
        '700',
    },
    bandKind: {
      color:
        '#7F7F89',
      fontSize:
        9,
      marginTop:
        2,
    },
    bandValue: {
      color:
        COLORS.purpleLight,
      fontSize:
        12,
      fontWeight:
        '700',
    },
    sliderTouchArea: {
      height: 42,
      justifyContent: 'center',
      marginTop: 4,
    },

    sliderTrack: {
      height: 9,
      borderRadius: 5,
      backgroundColor: 'rgba(255,255,255,0.10)',
      position: 'relative',
      justifyContent: 'center',
    },

    sliderTrackDisabled: {
      opacity:
        0.45,
    },
    sliderFill: {
      position:
        'absolute',
      left:
        0,
      top:
        0,
      bottom:
        0,
      borderRadius:
        5,
      backgroundColor:
        COLORS.purple,
    },
    sliderThumb: {
      position:
        'absolute',
      width:
        20,
      height:
        20,
      marginLeft:
        -10,
      borderRadius:
        10,
      backgroundColor:
        COLORS.white,
      borderWidth:
        4,
      borderColor:
        COLORS.purple,
    },
    sliderThumbDisabled: {
      borderColor:
        '#686872',
    },
    sliderScale: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      marginTop:
        9,
    },
    sliderScaleText: {
      color:
        '#777782',
      fontSize:
        8,
    },
    inlineError: {
      color:
        '#FCA5A5',
      fontSize:
        10,
      lineHeight:
        16,
      marginTop:
        8,
    },
    tipCard: {
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      gap:
        9,
      borderRadius:
        16,
      padding:
        13,
      marginTop:
        8,
      backgroundColor:
        'rgba(255,255,255,0.045)',
    },
    tipText: {
      flex:
        1,
      color:
        '#94949E',
      fontSize:
        10,
      lineHeight:
        16,
    },
  });
