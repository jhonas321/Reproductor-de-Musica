import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useMemo,
  useState,
} from "react";

import {
  useApp,
} from "../context/AppContext";

import {
  COLORS,
} from "../constants/colors";

import ScreenHeader
  from "../components/ScreenHeader";


const DURATIONS = [
  0,
  15,
  30,
  60,
];


function normalizeFolder(
  value:
    string
) {
  return value
    .replace(
      /\\/g,
      "/"
    )
    .replace(
      /\/+/g,
      "/"
    )
    .replace(
      /^\/+|\/+$/g,
      ""
    )
    .trim();
}


export default function SettingsScreen() {
  const {
    library,
    settings,
    stats,
  } =
    useApp();


  const {
    settings:
      value,

    updateSettings,
  } =
    settings;


  const [
    foldersOpen,
    setFoldersOpen,
  ] =
    useState(
      false
    );


  const excludedFolders =
    value.excludedFolders ??
    [];


  const excludedSet =
    useMemo(
      () =>
        new Set(
          excludedFolders.map(
            folder =>
              normalizeFolder(
                folder
              ).toLocaleLowerCase()
          )
        ),
      [
        excludedFolders,
      ]
    );


  const toggleFolder =
    (
      folder:
        string
    ) => {
      const normalized =
        normalizeFolder(
          folder
        );


      const key =
        normalized
          .toLocaleLowerCase();


      const exists =
        excludedSet.has(
          key
        );


      const next =
        exists

          ? excludedFolders.filter(
              item =>
                normalizeFolder(
                  item
                ).toLocaleLowerCase() !==
                key
            )

          : [
              ...excludedFolders,
              normalized,
            ];


      updateSettings({
        excludedFolders:
          next,
      });
    };


  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScreenHeader
        title=
          "Configuración"

        subtitle=
          "Biblioteca y reproducción"
      />


      <ScrollView
        contentContainerStyle={
          styles.content
        }

        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ===============================================
            BIBLIOTECA
        =============================================== */}

        <Text
          style={
            styles.section
          }
        >
          Biblioteca
        </Text>


        <Text
          style={
            styles.label
          }
        >
          Ocultar audios menores de:
        </Text>


        <View
          style={
            styles.chips
          }
        >
          {DURATIONS.map(
            seconds => (
              <TouchableOpacity
                key={
                  seconds
                }

                style={[
                  styles.chip,

                  value.minDuration ===
                    seconds
                  &&
                  styles.chipActive,
                ]}

                onPress={() =>
                  updateSettings({
                    minDuration:
                      seconds,
                  })
                }
              >
                <Text
                  style={[
                    styles.chipText,

                    value.minDuration ===
                      seconds
                    && {
                      color:
                        COLORS.white,
                    },
                  ]}
                >
                  {seconds ===
                  0
                    ? "No filtrar"
                    : `${seconds}s`}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>


        {/* CARPETAS EXCLUIDAS */}

        <TouchableOpacity
          style={
            styles.row
          }

          activeOpacity={
            0.72
          }

          onPress={() =>
            setFoldersOpen(
              true
            )
          }
        >
          <MaterialCommunityIcons
            name=
              "folder-remove-outline"

            size={
              22
            }

            color={
              COLORS.purpleLight
            }
          />


          <View
            style={
              styles.rowText
            }
          >
            <Text
              style={
                styles.rowTitle
              }
            >
              Carpetas excluidas
            </Text>


            <Text
              style={
                styles.rowSubtitle
              }
            >
              {excludedFolders.length ===
              0
                ? "No hay carpetas excluidas"
                : excludedFolders.length ===
                    1
                  ? "1 carpeta excluida"
                  : `${excludedFolders.length} carpetas excluidas`}
            </Text>
          </View>


          <MaterialCommunityIcons
            name=
              "chevron-right"

            size={
              23
            }

            color={
              COLORS.textMuted
            }
          />
        </TouchableOpacity>


        {/* REESCANEAR */}

        <TouchableOpacity
          style={
            styles.row
          }

          activeOpacity={
            0.72
          }

          onPress={
            library.refresh
          }
        >
          <MaterialCommunityIcons
            name=
              "refresh"

            size={
              22
            }

            color={
              COLORS.purpleLight
            }
          />


          <View
            style={
              styles.rowText
            }
          >
            <Text
              style={
                styles.rowTitle
              }
            >
              Volver a escanear
            </Text>


            <Text
              style={
                styles.rowSubtitle
              }
            >
              Actualiza la biblioteca del teléfono
            </Text>
          </View>
        </TouchableOpacity>


        {/* ===============================================
            REPRODUCCIÓN
        =============================================== */}

        <Text
          style={
            styles.section
          }
        >
          Reproducción
        </Text>


        <View
          style={
            styles.row
          }
        >
          <MaterialCommunityIcons
            name=
              "backup-restore"

            size={
              22
            }

            color={
              COLORS.purpleLight
            }
          />


          <View
            style={
              styles.rowText
            }
          >
            <Text
              style={
                styles.rowTitle
              }
            >
              Recordar última canción
            </Text>


            <Text
              style={
                styles.rowSubtitle
              }
            >
              Restaura canción, cola y posición al abrir
            </Text>
          </View>


          <Switch
            value={
              value.resumeLastSong
            }

            onValueChange={
              next =>
                updateSettings({
                  resumeLastSong:
                    next,
                })
            }

            trackColor={{
              false:
                COLORS.line,

              true:
                COLORS.purple,
            }}
          />
        </View>


        {/* ===============================================
            HISTORIAL
        =============================================== */}

        <Text
          style={
            styles.section
          }
        >
          Historial
        </Text>


        <TouchableOpacity
          style={
            styles.row
          }

          activeOpacity={
            0.72
          }

          onPress={
            stats.clearHistory
          }
        >
          <MaterialCommunityIcons
            name=
              "history"

            size={
              22
            }

            color={
              COLORS.pink
            }
          />


          <View
            style={
              styles.rowText
            }
          >
            <Text
              style={[
                styles.rowTitle,

                {
                  color:
                    COLORS.pink,
                },
              ]}
            >
              Limpiar recientes
            </Text>


            <Text
              style={
                styles.rowSubtitle
              }
            >
              No borra tus archivos ni favoritos
            </Text>
          </View>
        </TouchableOpacity>


        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>


      {/* ===============================================
          MODAL DE CARPETAS EXCLUIDAS
      =============================================== */}

      <Modal
        visible={
          foldersOpen
        }

        transparent

        animationType=
          "slide"

        statusBarTranslucent

        onRequestClose={() =>
          setFoldersOpen(
            false
          )
        }
      >
        <Pressable
          style={
            styles.modalBackdrop
          }

          onPress={() =>
            setFoldersOpen(
              false
            )
          }
        >
          <Pressable
            style={
              styles.modalSheet
            }

            onPress={() => {}}
          >
            <SafeAreaView
              edges={[
                "bottom",
              ]}

              style={
                styles.modalSafeArea
              }
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <View
                  style={
                    styles.modalHeaderText
                  }
                >
                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Excluir carpetas
                  </Text>


                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Las canciones seguirán en tu teléfono, pero Hmusic no las mostrará.
                  </Text>
                </View>


                <TouchableOpacity
                  style={
                    styles.modalClose
                  }

                  activeOpacity={
                    0.72
                  }

                  onPress={() =>
                    setFoldersOpen(
                      false
                    )
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


              <ScrollView
                style={
                  styles.folderList
                }

                contentContainerStyle={
                  styles.folderListContent
                }

                showsVerticalScrollIndicator={
                  false
                }
              >
                {library
                  .availableFolders
                  .length >
                0 ? (
                  library
                    .availableFolders
                    .map(
                      folder => {
                        const selected =
                          excludedSet.has(
                            normalizeFolder(
                              folder
                            ).toLocaleLowerCase()
                          );


                        return (
                          <TouchableOpacity
                            key={
                              folder
                            }

                            style={[
                              styles.folderRow,

                              selected &&
                                styles.folderRowSelected,
                            ]}

                            activeOpacity={
                              0.72
                            }

                            onPress={() =>
                              toggleFolder(
                                folder
                              )
                            }
                          >
                            <View
                              style={[
                                styles.folderIcon,

                                selected &&
                                  styles.folderIconSelected,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={
                                  selected
                                    ? "folder-remove"
                                    : "folder-outline"
                                }

                                size={
                                  21
                                }

                                color={
                                  selected
                                    ? COLORS.purpleLight
                                    : COLORS.white
                                }
                              />
                            </View>


                            <Text
                              style={[
                                styles.folderText,

                                selected &&
                                  styles.folderTextSelected,
                              ]}

                              numberOfLines={
                                2
                              }
                            >
                              {folder}
                            </Text>


                            <MaterialCommunityIcons
                              name={
                                selected
                                  ? "checkbox-marked-circle"
                                  : "checkbox-blank-circle-outline"
                              }

                              size={
                                22
                              }

                              color={
                                selected
                                  ? COLORS.purpleLight
                                  : COLORS.textMuted
                              }
                            />
                          </TouchableOpacity>
                        );
                      }
                    )
                ) : (
                  <View
                    style={
                      styles.noFolders
                    }
                  >
                    <MaterialCommunityIcons
                      name=
                        "folder-search-outline"

                      size={
                        42
                      }

                      color={
                        COLORS.purpleLight
                      }
                    />


                    <Text
                      style={
                        styles.noFoldersTitle
                      }
                    >
                      No encontramos carpetas
                    </Text>


                    <Text
                      style={
                        styles.noFoldersText
                      }
                    >
                      Vuelve a escanear la biblioteca e inténtalo nuevamente.
                    </Text>
                  </View>
                )}
              </ScrollView>


              <View
                style={
                  styles.modalActions
                }
              >
                <TouchableOpacity
                  style={[
                    styles.resetFoldersButton,

                    excludedFolders.length ===
                      0
                    &&
                    styles.resetFoldersDisabled,
                  ]}

                  activeOpacity={
                    0.72
                  }

                  disabled={
                    excludedFolders.length ===
                    0
                  }

                  onPress={() =>
                    updateSettings({
                      excludedFolders:
                        [],
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name=
                      "restore"

                    size={
                      19
                    }

                    color={
                      COLORS.textSecondary
                    }
                  />


                  <Text
                    style={
                      styles.resetFoldersText
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

                  onPress={() =>
                    setFoldersOpen(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.doneButtonText
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
    </SafeAreaView>
  );
}


/* =========================================================
   ESTILOS
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      backgroundColor:
        COLORS.background,
    },


    content: {
      paddingHorizontal:
        20,

      paddingBottom:
        120,
    },


    section: {
      color:
        COLORS.white,

      fontSize:
        17,

      fontWeight:
        "700",

      marginTop:
        18,

      marginBottom:
        12,
    },


    label: {
      color:
        COLORS.textSecondary,

      fontSize:
        12,

      marginBottom:
        10,
    },


    chips: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,

      marginBottom:
        12,
    },


    chip: {
      paddingHorizontal:
        13,

      paddingVertical:
        9,

      borderRadius:
        18,

      backgroundColor:
        COLORS.surface,

      borderWidth:
        1,

      borderColor:
        "transparent",
    },


    chipActive: {
      borderColor:
        COLORS.purple,

      backgroundColor:
        "#272132",
    },


    chipText: {
      color:
        COLORS.textSecondary,

      fontSize:
        11,
    },


    row: {
      minHeight:
        68,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        13,

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        "#2B2B33",
    },


    rowText: {
      flex:
        1,
    },


    rowTitle: {
      color:
        COLORS.white,

      fontSize:
        13,

      fontWeight:
        "600",
    },


    rowSubtitle: {
      color:
        COLORS.textMuted,

      fontSize:
        10,

      marginTop:
        4,
    },


    bottomSpace: {
      height:
        30,
    },


    /* =====================================================
       MODAL
    ===================================================== */

    modalBackdrop: {
      flex:
        1,

      justifyContent:
        "flex-end",

      backgroundColor:
        "rgba(0,0,0,0.64)",
    },


    modalSheet: {
      width:
        "100%",

      maxHeight:
        "82%",

      borderTopLeftRadius:
        28,

      borderTopRightRadius:
        28,

      overflow:
        "hidden",

      backgroundColor:
        "#17171E",

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        "rgba(255,255,255,0.10)",
    },


    modalSafeArea: {
      maxHeight:
        "100%",
    },


    modalHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      paddingHorizontal:
        20,

      paddingTop:
        19,

      paddingBottom:
        15,
    },


    modalHeaderText: {
      flex:
        1,

      paddingRight:
        14,
    },


    modalTitle: {
      color:
        COLORS.white,

      fontSize:
        21,

      fontWeight:
        "800",
    },


    modalSubtitle: {
      color:
        COLORS.textSecondary,

      fontSize:
        11,

      lineHeight:
        17,

      marginTop:
        5,
    },


    modalClose: {
      width:
        42,

      height:
        42,

      borderRadius:
        21,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(255,255,255,0.08)",
    },


    folderList: {
      flexGrow:
        0,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderTopColor:
        "rgba(255,255,255,0.08)",

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        "rgba(255,255,255,0.08)",
    },


    folderListContent: {
      paddingHorizontal:
        14,

      paddingVertical:
        10,
    },


    folderRow: {
      minHeight:
        58,

      borderRadius:
        16,

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingHorizontal:
        12,

      marginVertical:
        3,

      backgroundColor:
        "rgba(255,255,255,0.045)",

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        "rgba(255,255,255,0.07)",
    },


    folderRowSelected: {
      backgroundColor:
        "rgba(139,92,246,0.13)",

      borderColor:
        "rgba(167,139,250,0.28)",
    },


    folderIcon: {
      width:
        36,

      height:
        36,

      borderRadius:
        12,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight:
        11,

      backgroundColor:
        "rgba(255,255,255,0.06)",
    },


    folderIconSelected: {
      backgroundColor:
        "rgba(139,92,246,0.17)",
    },


    folderText: {
      flex:
        1,

      color:
        "#D8D8DF",

      fontSize:
        12,

      lineHeight:
        17,

      paddingRight:
        10,
    },


    folderTextSelected: {
      color:
        COLORS.white,

      fontWeight:
        "600",
    },


    noFolders: {
      minHeight:
        220,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        34,
    },


    noFoldersTitle: {
      color:
        COLORS.white,

      fontSize:
        15,

      fontWeight:
        "700",

      marginTop:
        12,
    },


    noFoldersText: {
      color:
        COLORS.textSecondary,

      fontSize:
        11,

      lineHeight:
        17,

      textAlign:
        "center",

      marginTop:
        6,
    },


    modalActions: {
      flexDirection:
        "row",

      gap:
        10,

      paddingHorizontal:
        20,

      paddingTop:
        14,

      paddingBottom:
        8,
    },


    resetFoldersButton: {
      flex:
        1,

      height:
        50,

      borderRadius:
        16,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        7,

      backgroundColor:
        "rgba(255,255,255,0.06)",
    },


    resetFoldersDisabled: {
      opacity:
        0.4,
    },


    resetFoldersText: {
      color:
        COLORS.textSecondary,

      fontSize:
        12,

      fontWeight:
        "600",
    },


    doneButton: {
      flex:
        1,

      height:
        50,

      borderRadius:
        16,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        COLORS.purple,
    },


    doneButtonText: {
      color:
        COLORS.white,

      fontSize:
        13,

      fontWeight:
        "800",
    },
  });
