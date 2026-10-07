import {

  MaterialCommunityIcons,

} from '@expo/vector-icons';



import {

  router,

  useLocalSearchParams,

} from 'expo-router';



import {

  Alert,

  FlatList,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,

} from 'react-native';



import {

  SafeAreaView,

} from 'react-native-safe-area-context';



import {

  useCallback,

  useMemo,

  useState,

} from 'react';



import {

  useApp,

} from '../context/AppContext';



import {

  useNavigationLock,

} from '../hooks/useNavigationLock';



import {

  COLORS,

} from '../constants/colors';



import type {

  Song,

} from '../types/Song';



import {

  getSongFolderPath,

} from '../utils/music';



import {

  deleteSongsFromDevice,

  shareMultipleSongFiles,

} from '../services/androidMediaActions';



import AddToPlaylistModal

  from '../components/AddToPlaylistModal';



import HomeBackground

  from '../components/HomeBackground';



import ScreenHeader

  from '../components/ScreenHeader';



import SongItem

  from '../components/SongItem';



import SongMenuModal

  from '../components/SongMenuModal';



import TrackInfoModal

  from '../components/TrackInfoModal';





interface ChildFolder {

  name: string;



  path: string;



  songCount: number;

}





interface SelectionActionProps {

  icon:

    keyof typeof

      MaterialCommunityIcons.glyphMap;



  label: string;



  color?: string;



  onPress:

    () => void;

}





function SelectionAction({

  icon,



  label,



  color =

    COLORS.white,



  onPress,

}: SelectionActionProps) {

  return (

    <TouchableOpacity

      style={

        styles.selectionAction

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

        size={23}

        color={

          color

        }

      />



      <Text

        style={[

          styles.selectionActionText,



          {

            color,

          },

        ]}

      >

        {label}

      </Text>

    </TouchableOpacity>

  );

}





export default function FolderScreen() {

  const {

    path,

    name,

  } =

    useLocalSearchParams<{

      path?: string;



      name?: string;

    }>();





  const currentPath =

    (

      path ??

      'Otros'

    )

      .replace(

        /\\/g,

        '/'

      )

      .replace(

        /\/+$/,

        ''

      );





  const {

    library,



    favorites,



    playlists,



    player,

  } =

    useApp();





  const navigateOnce =

    useNavigationLock();





  /* =========================================================

     MENÚ NORMAL

  ========================================================= */



  const [

    menuSong,

    setMenuSong,

  ] =

    useState<

      Song | null

    >(null);





  const [

    infoSong,

    setInfoSong,

  ] =

    useState<

      Song | null

    >(null);





  /*

   \* Puede contener una o varias canciones.

   */

  const [

    playlistSongs,

    setPlaylistSongs,

  ] =

    useState<

      Song[]

    >([]);





  /* =========================================================

     SELECCIÓN MÚLTIPLE

  ========================================================= */



  const [

    selectedIds,

    setSelectedIds,

  ] =

    useState<

      Set<string>

    >(

      () =>

        new Set()

    );





  const selectionMode =

    selectedIds.size >

    0;





  /* =========================================================

     TODAS LAS CANCIONES DE ESTA CARPETA

     Y SUS SUBCARPETAS

  ========================================================= */



  const allSongsInside =

    useMemo(

      () =>

        library.songs.filter(

          song => {

            const songPath =

              getSongFolderPath(

                song

              );





            return (

              songPath ===

                currentPath

              ||

              songPath.startsWith(

                `${currentPath}/`

              )

            );

          }

        ),

      [

        library.songs,

        currentPath,

      ]

    );





  /* =========================================================

     SOLO CANCIONES DIRECTAS DE ESTA CARPETA

  ========================================================= */



  const directSongs =

    useMemo(

      () =>

        allSongsInside.filter(

          song =>

            getSongFolderPath(

              song

            ) ===

            currentPath

        ),

      [

        allSongsInside,

        currentPath,

      ]

    );





  /* =========================================================

     CANCIONES SELECCIONADAS

  ========================================================= */



  const selectedSongs =

    useMemo(

      () =>

        directSongs.filter(

          song =>

            selectedIds.has(

              song.id

            )

        ),

      [

        directSongs,

        selectedIds,

      ]

    );





  /* =========================================================

     SUBCARPETAS

  ========================================================= */



  const childFolders =

    useMemo(

      () => {

        const map =

          new Map<

            string,

            number

          >();





        allSongsInside.forEach(

          song => {

            const songPath =

              getSongFolderPath(

                song

              );





            if (

              songPath ===

              currentPath

            ) {

              return;

            }





            const remaining =

              songPath

                .slice(

                  currentPath.length

                )

                .replace(

                  /^\/+/,

                  ''

                );





            const child =

              remaining

                .split('/')[0];





            if (!child) {

              return;

            }





            map.set(

              child,



              (

                map.get(

                  child

                ) ??

                0

              ) + 1

            );

          }

        );





        return Array.from(

          map.entries()

        )

          .map(

            ([

              childName,

              songCount,

            ]) => ({

              name:

                childName,



              path:

                `${currentPath}/${childName}`,



              songCount,

            })

          )

          .sort(

            (

              a,

              b

            ) =>

              a.name.localeCompare(

                b.name,

                undefined,

                {

                  sensitivity:

                    'base',

                }

              )

          );

      },

      [

        allSongsInside,

        currentPath,

      ]

    );





  /* =========================================================

     SELECCIÓN

  ========================================================= */



  const exitSelection =

    useCallback(

      () => {

        setSelectedIds(

          new Set()

        );

      },

      []

    );





  const startSelection =

    useCallback(

      (

        song: Song

      ) => {

        setSelectedIds(

          previous => {

            const next =

              new Set(

                previous

              );





            next.add(

              song.id

            );





            return next;

          }

        );

      },

      []

    );





  const toggleSelection =

    useCallback(

      (

        song: Song

      ) => {

        setSelectedIds(

          previous => {

            const next =

              new Set(

                previous

              );





            if (

              next.has(

                song.id

              )

            ) {

              next.delete(

                song.id

              );

            } else {

              next.add(

                song.id

              );

            }





            return next;

          }

        );

      },

      []

    );





  const toggleSelectAll =

    useCallback(

      () => {

        if (

          selectedIds.size ===

          directSongs.length

        ) {

          exitSelection();



          return;

        }





        setSelectedIds(

          new Set(

            directSongs.map(

              song =>

                song.id

            )

          )

        );

      },

      [

        selectedIds.size,

        directSongs,

        exitSelection,

      ]

    );





  /* =========================================================

     AÑADIR A COLA

  ========================================================= */



  const addSelectedToQueue =

    useCallback(

      () => {

        if (

          selectedSongs.length ===

          0

        ) {

          return;

        }





        selectedSongs.forEach(

          song => {

            player.addToQueue(

              song

            );

          }

        );





        const count =

          selectedSongs.length;





        exitSelection();





        Alert.alert(

          'Cola',

          `${count} ${

            count === 1

              ? 'canción añadida'

              : 'canciones añadidas'

          } a la cola.`

        );

      },

      [

        selectedSongs,

        player.addToQueue,

        exitSelection,

      ]

    );





  /* =========================================================

     PLAYLIST

  ========================================================= */



  const addSelectedToPlaylist =

    useCallback(

      () => {

        if (

          selectedSongs.length ===

          0

        ) {

          return;

        }





        setPlaylistSongs(

          selectedSongs

        );

      },

      [

        selectedSongs,

      ]

    );





  /* =========================================================

     COMPARTIR VARIAS

  ========================================================= */



  const shareSelected =

    useCallback(

      async () => {

        if (

          selectedSongs.length ===

          0

        ) {

          return;

        }





        try {

          await shareMultipleSongFiles(

            selectedSongs

          );





          exitSelection();



        } catch (error) {

          console.log(

            'Error compartiendo canciones:',

            error

          );





          Alert.alert(

            'Compartir canciones',

            'No se pudieron compartir las canciones seleccionadas.'

          );

        }

      },

      [

        selectedSongs,

        exitSelection,

      ]

    );





  /* =========================================================

     ELIMINAR VARIAS

  ========================================================= */



  const deleteSelected =

    useCallback(

      async () => {

        if (

          selectedSongs.length ===

          0

        ) {

          return;

        }





        const currentSongId =

          player.currentSong

            ?.id;





        if (

          currentSongId &&

          selectedIds.has(

            currentSongId

          )

        ) {

          player.pause();

        }





        try {

          const result =

            await deleteSongsFromDevice(

              selectedSongs

            );





          if (

            result.status ===

            'requested'

          ) {

            exitSelection();



            return;

          }





          if (

            result.status ===

            'deleted'

          ) {

            exitSelection();





            await library.refresh();



            return;

          }





          Alert.alert(

            'Eliminar canciones',

            'No se pudieron eliminar los archivos.'

          );



        } catch (error) {

          console.log(

            'Error eliminando canciones:',

            error

          );





          Alert.alert(

            'Eliminar canciones',

            'No se pudo solicitar la eliminación de las canciones.'

          );

        }

      },

      [

        selectedSongs,

        selectedIds,

        player.currentSong?.id,

        player.pause,

        library.refresh,

        exitSelection,

      ]

    );





  const confirmDeleteSelected =

    useCallback(

      () => {

        const count =

          selectedSongs.length;





        if (

          count ===

          0

        ) {

          return;

        }





        Alert.alert(

          'Eliminar del dispositivo',



          count === 1

            ? `Se eliminará permanentemente "${selectedSongs[0].title}" del teléfono.`

            : `Se eliminarán permanentemente ${count} canciones del almacenamiento del teléfono.`,



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

                  void deleteSelected();

                },

            },

          ]

        );

      },

      [

        selectedSongs,

        deleteSelected,

      ]

    );





  /* =========================================================

     RENDERIZAR CANCIÓN

  ========================================================= */



  const renderSong =

    useCallback(

      ({

        item,

      }: {

        item: Song;

      }) => {

        const active =

          player.currentSong?.id ===

          item.id;





        const selected =

          selectedIds.has(

            item.id

          );





        return (

          <SongItem

            song={

              item

            }



            active={

              active

            }



            playing={

              active &&

              player.isPlaying

            }



            favorite={

              favorites.isFavorite(

                item.id

              )

            }



            selected={

              selected

            }



            selectionMode={

              selectionMode

            }



            onPress={

              song => {

                if (

                  selectionMode

                ) {

                  toggleSelection(

                    song

                  );



                  return;

                }





                player.playSong(

                  song,

                  allSongsInside

                );

              }

            }



            onLongPress={

              startSelection

            }



            onFavoritePress={

              favorites.toggleFavorite

            }



            onOptionsPress={

              setMenuSong

            }

          />

        );

      },

      [

        allSongsInside,



        selectedIds,



        selectionMode,



        toggleSelection,



        startSelection,



        player.currentSong?.id,



        player.isPlaying,



        player.playSong,



        favorites.isFavorite,



        favorites.toggleFavorite,

      ]

    );





  return (

    <View

      style={

        styles.screen

      }

    >

      <HomeBackground

        artwork={

          player.currentSong

            ?.artwork

        }

        seed={

          player.currentSong

            ?.id

        }

      />



      <SafeAreaView

        style={

          styles.container

        }

      >

      {/* =====================================================

          CABECERA

      ===================================================== */}



      {selectionMode ? (

        <View

          style={

            styles.selectionHeader

          }

        >

          <TouchableOpacity

            style={

              styles.selectionClose

            }

            onPress={

              exitSelection

            }

          >

            <MaterialCommunityIcons

              name="close"

              size={25}

              color={

                COLORS.white

              }

            />

          </TouchableOpacity>





          <View

            style={

              styles.selectionHeaderInfo

            }

          >

            <Text

              style={

                styles.selectionTitle

              }

            >

              {selectedIds.size} {

                selectedIds.size === 1

                  ? 'seleccionada'

                  : 'seleccionadas'

              }

            </Text>





            <Text

              style={

                styles.selectionSubtitle

              }

            >

              {name ?? currentPath}

            </Text>

          </View>





          <TouchableOpacity

            style={

              styles.selectAll

            }

            onPress={

              toggleSelectAll

            }

          >

            <MaterialCommunityIcons

              name={

                selectedIds.size ===

                directSongs.length

                  ? 'checkbox-multiple-marked'

                  : 'select-all'

              }

              size={25}

              color={

                COLORS.purpleLight

              }

            />

          </TouchableOpacity>

        </View>

      ) : (

        <ScreenHeader

          title={

            name ??

            currentPath

          }



          subtitle={`${allSongsInside.length} canciones • ${childFolders.length} subcarpetas`}

        />

      )}





      {/* =====================================================

          BARRA DE ACCIONES

      ===================================================== */}



      {selectionMode && (

        <View

          style={

            styles.selectionActions

          }

        >

          <SelectionAction

            icon="playlist-plus"

            label="Cola"

            onPress={

              addSelectedToQueue

            }

          />





          <SelectionAction

            icon="playlist-music-outline"

            label="Playlist"

            color={

              COLORS.purpleLight

            }

            onPress={

              addSelectedToPlaylist

            }

          />





          <SelectionAction

            icon="share-variant-outline"

            label="Compartir"

            color={

              COLORS.blue

            }

            onPress={() => {

              void shareSelected();

            }}

          />





          <SelectionAction

            icon="delete-outline"

            label="Eliminar"

            color={

              COLORS.pink

            }

            onPress={

              confirmDeleteSelected

            }

          />

        </View>

      )}





      {/* =====================================================

          LISTA

      ===================================================== */}



      <FlatList

        data={

          directSongs

        }



        keyExtractor={

          item =>

            item.id

        }



        renderItem={

          renderSong

        }



        extraData={

          selectedIds

        }



        ListHeaderComponent={

          <View>

            {/* SUBCARPETAS */}



            {!selectionMode &&

              childFolders.map(

                folder => (

                  <TouchableOpacity

                    key={

                      folder.path

                    }



                    style={

                      styles.folder

                    }



                    activeOpacity={

                      0.75

                    }



                    onPress={() =>

                      navigateOnce(

                        () =>

                          router.push({

                            pathname:

                              '/folder',



                            params: {

                              path:

                                folder.path,



                              name:

                                folder.name,

                            },

                          })

                      )

                    }

                  >

                    <View

                      style={

                        styles.folderIcon

                      }

                    >

                      <MaterialCommunityIcons

                        name="folder-music"

                        size={28}

                        color={

                          COLORS.green

                        }

                      />

                    </View>





                    <View

                      style={

                        styles.folderInfo

                      }

                    >

                      <Text

                        style={

                          styles.folderName

                        }

                        numberOfLines={

                          1

                        }

                      >

                        {folder.name}

                      </Text>





                      <Text

                        style={

                          styles.folderCount

                        }

                      >

                        {folder.songCount} canciones

                      </Text>

                    </View>





                    <MaterialCommunityIcons

                      name="chevron-right"

                      size={26}

                      color={

                        COLORS.textMuted

                      }

                    />

                  </TouchableOpacity>

                )

              )}





            {directSongs.length >

              0 && (

              <View

                style={

                  styles.songHeader

                }

              >

                <Text

                  style={

                    styles.songHeaderText

                  }

                >

                  {selectionMode

                    ? 'Selecciona canciones'

                    : 'Canciones'}

                </Text>





                {!selectionMode && (

                  <TouchableOpacity

                    style={

                      styles.playAll

                    }

                    onPress={() =>

                      player.playAll(

                        allSongsInside

                      )

                    }

                  >

                    <MaterialCommunityIcons

                      name="play"

                      size={25}

                      color={

                        COLORS.white

                      }

                    />

                  </TouchableOpacity>

                )}

              </View>

            )}

          </View>

        }



        ListEmptyComponent={

          childFolders.length ===

            0 ? (

            <View

              style={

                styles.empty

              }

            >

              <MaterialCommunityIcons

                name="folder-music-outline"

                size={50}

                color={

                  COLORS.textMuted

                }

              />





              <Text

                style={

                  styles.emptyText

                }

              >

                Esta carpeta no contiene canciones.

              </Text>

            </View>

          ) : null

        }



        contentContainerStyle={

          styles.content

        }



        showsVerticalScrollIndicator={

          false

        }



        removeClippedSubviews



        initialNumToRender={

          12

        }



        maxToRenderPerBatch={

          10

        }



        windowSize={

          6

        }

      />





      {/* =====================================================

          MENÚ DE UNA CANCIÓN

      ===================================================== */}



      <SongMenuModal

        visible={

          Boolean(

            menuSong

          )

        }



        song={

          menuSong

        }



        favorite={

          menuSong

            ? favorites.isFavorite(

                menuSong.id

              )

            : false

        }



        onClose={() =>

          setMenuSong(

            null

          )

        }



        onPlay={() => {

          if (

            menuSong

          ) {

            player.playSong(

              menuSong,

              allSongsInside

            );

          }

        }}



        onPlayNext={() => {

          if (

            menuSong

          ) {

            player.playNext(

              menuSong

            );

          }

        }}



        onAddQueue={() => {

          if (

            menuSong

          ) {

            player.addToQueue(

              menuSong

            );

          }

        }}



        onAddPlaylist={() => {

          if (

            menuSong

          ) {

            setPlaylistSongs(

              [

                menuSong,

              ]

            );

          }

        }}



        onAlbum={() => {

          if (

            menuSong

          ) {

            router.push({

              pathname:

                '/album',



              params: {

                name:

                  menuSong.album,

              },

            });

          }

        }}



        onArtist={() => {

          if (

            menuSong

          ) {

            router.push({

              pathname:

                '/artist',



              params: {

                name:

                  menuSong.artist,

              },

            });

          }

        }}



        onFavorite={() => {

          if (

            menuSong

          ) {

            favorites.toggleFavorite(

              menuSong.id

            );

          }

        }}



        onInfo={() =>

          setInfoSong(

            menuSong

          )

        }

      />





      {/* =====================================================

          PLAYLIST

      ===================================================== */}



      <AddToPlaylistModal

        visible={

          playlistSongs.length >

          0

        }



        playlists={

          playlists.playlists

        }



        onClose={() =>

          setPlaylistSongs(

            []

          )

        }



        onCreate={

          playlists.createPlaylist

        }



        onSelect={

          playlistId => {

            const count =

              playlistSongs.length;





            playlistSongs.forEach(

              song => {

                playlists.addSong(

                  playlistId,

                  song.id

                );

              }

            );





            setPlaylistSongs(

              []

            );





            if (

              selectionMode

            ) {

              exitSelection();

            }





            if (

              count >

              1

            ) {

              Alert.alert(

                'Playlist',

                `${count} canciones añadidas a la playlist.`

              );

            }

          }

        }

      />





      {/* =====================================================

          INFORMACIÓN

      ===================================================== */}



      <TrackInfoModal

        visible={

          Boolean(

            infoSong

          )

        }



        song={

          infoSong

        }



        onClose={() =>

          setInfoSong(

            null

          )

        }

      />

      </SafeAreaView>

    </View>

  );

}





const styles =

  StyleSheet.create({

    screen: {

      flex: 1,



      backgroundColor:

        '#090811',

    },





    container: {

      flex: 1,



      backgroundColor:

        'transparent',

    },





    content: {

      paddingHorizontal:

        20,



      paddingBottom:

        120,



      flexGrow: 1,

    },





    /* =====================================================

       SELECCIÓN

    ===================================================== */



    selectionHeader: {

      minHeight:

        64,



      flexDirection:

        'row',



      alignItems:

        'center',



      paddingHorizontal:

        14,



      paddingVertical:

        8,

    },





    selectionClose: {

      width:

        44,



      height:

        44,



      borderRadius:

        22,



      backgroundColor:

        COLORS.surface,



      justifyContent:

        'center',



      alignItems:

        'center',

    },





    selectionHeaderInfo: {

      flex: 1,



      marginLeft:

        13,

    },





    selectionTitle: {

      color:

        COLORS.white,



      fontSize:

        18,



      fontWeight:

        '700',

    },





    selectionSubtitle: {

      color:

        COLORS.textMuted,



      fontSize:

        10,



      marginTop:

        3,

    },





    selectAll: {

      width:

        46,



      height:

        46,



      justifyContent:

        'center',



      alignItems:

        'center',

    },





    selectionActions: {

      marginHorizontal:

        18,



      marginBottom:

        8,



      minHeight:

        68,



      borderRadius:

        20,



      backgroundColor:

        COLORS.surface,



      flexDirection:

        'row',



      alignItems:

        'center',



      justifyContent:

        'space-around',



      paddingHorizontal:

        5,

    },





    selectionAction: {

      flex:

        1,



      minHeight:

        58,



      justifyContent:

        'center',



      alignItems:

        'center',

    },





    selectionActionText: {

      fontSize:

        9,



      marginTop:

        4,



      fontWeight:

        '500',

    },





    /* =====================================================

       CARPETAS

    ===================================================== */



    folder: {

      minHeight:

        72,



      flexDirection:

        'row',



      alignItems:

        'center',

    },





    folderIcon: {

      width:

        51,



      height:

        51,



      borderRadius:

        16,



      backgroundColor:

        COLORS.surface,



      justifyContent:

        'center',



      alignItems:

        'center',

    },





    folderInfo: {

      flex:

        1,



      marginLeft:

        13,

    },





    folderName: {

      color:

        COLORS.white,



      fontSize:

        14,



      fontWeight:

        '600',

    },





    folderCount: {

      color:

        COLORS.textMuted,



      fontSize:

        10,



      marginTop:

        4,

    },





    /* =====================================================

       CANCIONES

    ===================================================== */



    songHeader: {

      flexDirection:

        'row',



      justifyContent:

        'space-between',



      alignItems:

        'center',



      marginTop:

        20,



      marginBottom:

        10,

    },





    songHeaderText: {

      color:

        COLORS.white,



      fontSize:

        18,



      fontWeight:

        '700',

    },





    playAll: {

      width:

        43,



      height:

        43,



      borderRadius:

        22,



      backgroundColor:

        COLORS.purple,



      justifyContent:

        'center',



      alignItems:

        'center',

    },





    empty: {

      minHeight:

        250,



      justifyContent:

        'center',



      alignItems:

        'center',

    },





    emptyText: {

      color:

        COLORS.textMuted,



      fontSize:

        13,



      marginTop:

        12,

    },

  });