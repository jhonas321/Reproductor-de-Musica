import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  DrumPicker,
} from 'react-native-drum-picker';

import {
  COLORS,
} from '../constants/colors';


interface Props {
  visible:
    boolean;

  endsAt:
    number | null;

  onClose:
    () => void;

  onStart:
    (
      totalSeconds:
        number
    ) => void;

  onCancel:
    () => void;
}




const QUICK_OPTIONS =
  [
    15,
    30,
    45,
    60,
  ];


const HOURS =
  Array.from(
    {
      length:
        24,
    },
    (
      _,
      index
    ) =>
      index
  );


const MINUTES =
  Array.from(
    {
      length:
        60,
    },
    (
      _,
      index
    ) =>
      index
  );


const SECONDS =
  Array.from(
    {
      length:
        60,
    },
    (
      _,
      index
    ) =>
      index
  );








function formatRemaining(
  totalSeconds:
    number
) {
  const safe =
    Math.max(
      0,
      Math.floor(
        totalSeconds
      )
    );

  const hours =
    Math.floor(
      safe /
      3600
    );

  const minutes =
    Math.floor(
      (
        safe %
        3600
      ) /
      60
    );

  const seconds =
    safe %
    60;

  return `${String(
    hours
  ).padStart(
    2,
    '0'
  )}:${String(
    minutes
  ).padStart(
    2,
    '0'
  )}:${String(
    seconds
  ).padStart(
    2,
    '0'
  )}`;
}


interface TimeWheelProps {
  label:
    string;

  values:
    number[];

  selected:
    number;

  onChange:
    (
      value:
        number
    ) => void;
}


function TimeWheel({
  label,
  values,
  selected,
  onChange,
}: TimeWheelProps) {
  const items =
    useMemo(
      () =>
        values.map(
          value =>
            String(
              value
            ).padStart(
              2,
              '0'
            )
        ),
      [
        values,
      ]
    );


  const selectedIndex =
    Math.max(
      0,
      values.indexOf(
        selected
      )
    );


  return (
    <View
      style={
        styles.wheelColumn
      }
    >
      <Text
        style={
          styles.wheelLabel
        }
      >
        {label}
      </Text>


      <View
        style={
          styles.wheelShell
        }
      >
        <DrumPicker
          items={
            items
          }

          selectedIndex={
            selectedIndex
          }

          circular={
            true
          }

          itemHeight={
            50
          }

          visibleItemCount={
            5
          }

          enableScrollByTapOnItem={
            true
          }

          hapticFeedback={
            false
          }

          textColor=
            "#777782"

          selectedTextColor={
            COLORS.white
          }

          textSize={
            16
          }

          selectedTextSize={
            22
          }

          showSelectionIndicator={
            false
          }

          style={
            styles.drumPicker
          }

          onChange={(
            event:
              any
          ) => {
            const index =
              Number(
                event
                  ?.nativeEvent
                  ?.index
              );

            if (
              Number.isFinite(
                index
              ) &&
              values[
                index
              ] !==
                undefined
            ) {
              onChange(
                values[
                  index
                ]
              );
            }
          }}
        />


        <View
          pointerEvents=
            "none"

          style={
            styles.selectionOverlay
          }
        />
      </View>
    </View>
  );
}


export default function SleepTimerModal({
  visible,
  endsAt,
  onClose,
  onStart,
  onCancel,
}: Props) {
  const [
    selectedHours,
    setSelectedHours,
  ] =
    useState(
      0
    );


  const [
    selectedMinutes,
    setSelectedMinutes,
  ] =
    useState(
      30
    );


  const [
    selectedSeconds,
    setSelectedSeconds,
  ] =
    useState(
      0
    );


  const [
    now,
    setNow,
  ] =
    useState(
      Date.now()
    );


  useEffect(
    () => {
      if (
        !visible
      ) {
        return;
      }

      setNow(
        Date.now()
      );

      const interval =
        setInterval(
          () => {
            setNow(
              Date.now()
            );
          },
          1000
        );

      return () => {
        clearInterval(
          interval
        );
      };
    },
    [
      visible,
    ]
  );


  const remainingSeconds =
    useMemo(
      () => {
        if (
          !endsAt
        ) {
          return 0;
        }

        return Math.max(
          0,
          Math.ceil(
            (
              endsAt -
              now
            ) /
            1000
          )
        );
      },
      [
        endsAt,
        now,
      ]
    );


  const customTotalSeconds =
    selectedHours *
      3600 +
    selectedMinutes *
      60 +
    selectedSeconds;


  const canStartCustom =
    customTotalSeconds >
    0;


  const startQuick =
    (
      minutes:
        number
    ) => {
      onStart(
        minutes *
        60
      );

      onClose();
    };


  const startCustom =
    () => {
      if (
        !canStartCustom
      ) {
        return;
      }

      onStart(
        customTotalSeconds
      );

      onClose();
    };


  return (
    <Modal
      visible={
        visible
      }

      transparent

      animationType=
        "fade"

      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.overlay
        }
      >
        <Pressable
          style={
            StyleSheet.absoluteFill
          }

          onPress={
            onClose
          }
        />


        <View
          style={
            styles.sheet
          }
        >
          <View
            style={
              styles.handle
            }
          />


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
                Temporizador
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                La música se pausará automáticamente.
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
                name=
                  "close"

                size={
                  22
                }

                color={
                  COLORS.white
                }
              />
            </TouchableOpacity>
          </View>


          {endsAt ? (
            <View
              style={
                styles.activeCard
              }
            >
              <View
                style={
                  styles.activeIcon
                }
              >
                <MaterialCommunityIcons
                  name=
                    "timer-sand"

                  size={
                    22
                  }

                  color={
                    COLORS.purpleLight
                  }
                />
              </View>


              <View
                style={
                  styles.activeInfo
                }
              >
                <Text
                  style={
                    styles.activeLabel
                  }
                >
                  Temporizador activo
                </Text>

                <Text
                  style={
                    styles.remaining
                  }
                >
                  {formatRemaining(
                    remainingSeconds
                  )}
                </Text>
              </View>


              <TouchableOpacity
                style={
                  styles.cancelCompact
                }

                activeOpacity={
                  0.72
                }

                onPress={
                  onCancel
                }
              >
                <Text
                  style={
                    styles.cancelCompactText
                  }
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}


          <Text
            style={
              styles.sectionTitle
            }
          >
            Tiempo rápido
          </Text>


          <View
            style={
              styles.quickGrid
            }
          >
            {QUICK_OPTIONS.map(
              minutes => (
                <TouchableOpacity
                  key={
                    minutes
                  }

                  style={
                    styles.quickOption
                  }

                  activeOpacity={
                    0.75
                  }

                  onPress={() =>
                    startQuick(
                      minutes
                    )
                  }
                >
                  <MaterialCommunityIcons
                    name=
                      "timer-outline"

                    size={
                      18
                    }

                    color={
                      COLORS.purpleLight
                    }
                  />

                  <Text
                    style={
                      styles.quickValue
                    }
                  >
                    {minutes}
                  </Text>

                  <Text
                    style={
                      styles.quickUnit
                    }
                  >
                    min
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>


          <Text
            style={
              styles.sectionTitle
            }
          >
            Tiempo personalizado
          </Text>


          <View
            style={
              styles.customCard
            }
          >
            <Text
              style={
                styles.dragHint
              }
            >
              Desliza las ruedas
            </Text>


            <View
              style={
                styles.wheelsRow
              }
            >
              <TimeWheel
                label=
                  "HORAS"

                values={
                  HOURS
                }

                selected={
                  selectedHours
                }

                onChange={
                  setSelectedHours
                }
              />


              <Text
                style={
                  styles.colon
                }
              >
                :
              </Text>


              <TimeWheel
                label=
                  "MIN"

                values={
                  MINUTES
                }

                selected={
                  selectedMinutes
                }

                onChange={
                  setSelectedMinutes
                }
              />


              <Text
                style={
                  styles.colon
                }
              >
                :
              </Text>


              <TimeWheel
                label=
                  "SEG"

                values={
                  SECONDS
                }

                selected={
                  selectedSeconds
                }

                onChange={
                  setSelectedSeconds
                }
              />
            </View>


            <View
              style={
                styles.selectedSummary
              }
            >
              <MaterialCommunityIcons
                name=
                  "clock-outline"

                size={
                  17
                }

                color={
                  COLORS.purpleLight
                }
              />

              <Text
                style={
                  styles.selectedSummaryText
                }
              >
                {String(
                  selectedHours
                ).padStart(
                  2,
                  '0'
                )}
                :
                {String(
                  selectedMinutes
                ).padStart(
                  2,
                  '0'
                )}
                :
                {String(
                  selectedSeconds
                ).padStart(
                  2,
                  '0'
                )}
              </Text>
            </View>


            <TouchableOpacity
              style={[
                styles.startButton,

                !canStartCustom &&
                  styles.startButtonDisabled,
              ]}

              activeOpacity={
                0.78
              }

              disabled={
                !canStartCustom
              }

              onPress={
                startCustom
              }
            >
              <MaterialCommunityIcons
                name=
                  "timer-play-outline"

                size={
                  20
                }

                color={
                  canStartCustom
                    ? COLORS.white
                    : '#777782'
                }
              />

              <Text
                style={[
                  styles.startButtonText,

                  !canStartCustom &&
                    styles.startButtonTextDisabled,
                ]}
              >
                Iniciar temporizador
              </Text>
            </TouchableOpacity>
          </View>


          {endsAt ? (
            <TouchableOpacity
              style={
                styles.cancelButton
              }

              activeOpacity={
                0.72
              }

              onPress={() => {
                onCancel();
                onClose();
              }}
            >
              <MaterialCommunityIcons
                name=
                  "timer-off-outline"

                size={
                  21
                }

                color={
                  COLORS.pink
                }
              />

              <Text
                style={
                  styles.cancelText
                }
              >
                Cancelar temporizador
              </Text>
            </TouchableOpacity>
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
        'rgba(0,0,0,0.64)',

      justifyContent:
        'flex-end',
    },


    sheet: {
      backgroundColor:
        '#18181F',

      borderTopLeftRadius:
        28,

      borderTopRightRadius:
        28,

      paddingHorizontal:
        18,

      paddingTop:
        10,

      paddingBottom:
        24,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.12)',
    },


    handle: {
      width:
        42,

      height:
        4,

      borderRadius:
        2,

      alignSelf:
        'center',

      backgroundColor:
        '#4B4B55',

      marginBottom:
        15,
    },


    header: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      gap:
        12,

      marginBottom:
        16,
    },


    headerText: {
      flex:
        1,
    },


    title: {
      color:
        COLORS.white,

      fontSize:
        22,

      fontWeight:
        '700',
    },


    subtitle: {
      color:
        '#A7A7B0',

      fontSize:
        12,

      marginTop:
        4,
    },


    closeButton: {
      width:
        40,

      height:
        40,

      borderRadius:
        20,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(255,255,255,0.08)',
    },


    activeCard: {
      flexDirection:
        'row',

      alignItems:
        'center',

      padding:
        12,

      borderRadius:
        18,

      backgroundColor:
        'rgba(139,92,246,0.13)',

      borderWidth:
        1,

      borderColor:
        'rgba(167,139,250,0.24)',

      marginBottom:
        16,
    },


    activeIcon: {
      width:
        40,

      height:
        40,

      borderRadius:
        20,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(139,92,246,0.18)',
    },


    activeInfo: {
      flex:
        1,

      marginLeft:
        10,
    },


    activeLabel: {
      color:
        '#C9C9D0',

      fontSize:
        11,

      fontWeight:
        '600',
    },


    remaining: {
      color:
        COLORS.white,

      fontSize:
        20,

      fontWeight:
        '700',

      marginTop:
        1,

      fontVariant:
        [
          'tabular-nums',
        ],
    },


    cancelCompact: {
      paddingHorizontal:
        11,

      paddingVertical:
        8,

      borderRadius:
        12,

      backgroundColor:
        'rgba(236,72,153,0.12)',
    },


    cancelCompactText: {
      color:
        COLORS.pink,

      fontSize:
        11,

      fontWeight:
        '700',
    },


    sectionTitle: {
      color:
        '#D5D5DC',

      fontSize:
        12,

      fontWeight:
        '700',

      marginBottom:
        9,
    },


    quickGrid: {
      flexDirection:
        'row',

      gap:
        7,

      marginBottom:
        16,
    },


    quickOption: {
      flex:
        1,

      minHeight:
        64,

      borderRadius:
        16,

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


    quickValue: {
      color:
        COLORS.white,

      fontSize:
        16,

      fontWeight:
        '700',

      marginTop:
        2,
    },


    quickUnit: {
      color:
        '#92929D',

      fontSize:
        9,
    },


    customCard: {
      borderRadius:
        20,

      paddingVertical:
        14,

      paddingHorizontal:
        14,

      backgroundColor:
        'rgba(255,255,255,0.055)',

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.12)',
    },


    dragHint: {
      color:
        '#858590',

      fontSize:
        10,

      textAlign:
        'center',

      marginBottom:
        7,
    },


    wheelsRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      paddingHorizontal:
        18,
    },


    wheelColumn: {
      width:
        76,

      alignItems:
        'center',
    },


    wheelLabel: {
      color:
        '#9696A0',

      fontSize:
        8,

      fontWeight:
        '700',

      letterSpacing:
        0.8,

      marginBottom:
        7,
    },


    wheelShell: {
      width:
        76,

      height:
        250,

      overflow:
        'hidden',

      borderRadius:
        15,

      backgroundColor:
        'rgba(0,0,0,0.18)',

      position:
        'relative',

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    drumPicker: {
      width:
        76,

      height:
        250,
    },


    selectionOverlay: {
      position:
        'absolute',

      left:
        4,

      right:
        4,

      top:
        100,

      height:
        50,

      borderRadius:
        12,

      backgroundColor:
        'rgba(139,92,246,0.14)',

      borderWidth:
        1,

      borderColor:
        'rgba(167,139,250,0.30)',
    },


    colon: {
      color:
        '#DADAE0',

      fontSize:
        22,

      fontWeight:
        '700',

      marginTop:
        19,

      marginHorizontal:
        5,

      opacity:
        0.82,
    },


    selectedSummary: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        7,

      marginTop:
        10,
    },


    selectedSummaryText: {
      color:
        '#D9D9E0',

      fontSize:
        13,

      fontWeight:
        '700',

      fontVariant:
        [
          'tabular-nums',
        ],
    },


    startButton: {
      height:
        46,

      borderRadius:
        15,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        8,

      backgroundColor:
        COLORS.purple,

      marginTop:
        11,
    },


    startButtonDisabled: {
      backgroundColor:
        'rgba(255,255,255,0.07)',
    },


    startButtonText: {
      color:
        COLORS.white,

      fontSize:
        13,

      fontWeight:
        '700',
    },


    startButtonTextDisabled: {
      color:
        '#777782',
    },


    cancelButton: {
      minHeight:
        44,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        8,

      marginTop:
        8,
    },


    cancelText: {
      color:
        COLORS.pink,

      fontSize:
        13,

      fontWeight:
        '600',
    },
  });
