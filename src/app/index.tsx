import {

  MaterialCommunityIcons,

} from '@expo/vector-icons';



import {

  router,

} from 'expo-router';



import {

  useCallback,

  useMemo,

  useRef,

  useState,

} from 'react';



import {

  ActivityIndicator,

  Alert,

  FlatList,

  RefreshControl,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,

} from 'react-native';



import {

  SafeAreaView,

} from 'react-native-safe-area-context';





import AddToPlaylistModal from '../components/AddToPlaylistModal';



import HomeBackground from '../components/HomeBackground';



import HomeSongCarousel from '../components/HomeSongCarousel';



import LibraryGrid from '../components/LibraryGrid';



import SongItem from '../components/SongItem';



import SongMenuModal from '../components/SongMenuModal';



import SortSongsModal from '../components/SortSongsModal';



import TrackInfoModal from '../components/TrackInfoModal';





import {

  COLORS,

} from '../constants/colors';



import {

  useApp,

} from '../context/AppContext';



import {

  useNavigationLock,

} from '../hooks/useNavigationLock';



import {

  useLibrarySort,

} from '../hooks/useLibrarySort';



import {

  deleteSongsFromDevice,

  shareMultipleSongFiles,

} from '../services/androidMediaActions';



import type {

  Song,

} from '../types/Song';



import {

  normalizeSearchText,

} from '../utils/music';





/* =========================================================

   TIPO AUXILIAR PARA ESTADÍSTICAS

========================================================= */



type StatsLike = {

  recentIds?: string[];



  playCounts?:

    Record<string, number>;



  counts?:

    Record<string, number>;



  plays?:

    Record<string, number>;



  playCountById?:

    Record<string, number>;



  getPlayCount?:

    (

      songId: string

    ) => number;

};





/* =========================================================

   OBTENER REPRODUCCIONES

========================================================= */



function getPlayCount(

  stats: StatsLike,

  songId: string,

  recentIds: string[]

) {

  const direct =

    stats.getPlayCount?.(

      songId

    )

    ??

    stats.playCounts?.[

      songId

    ]

    ??

    stats.counts?.[

      songId

    ]

    ??

    stats.plays?.[

      songId

    ]

    ??

    stats.playCountById?.[

      songId

    ];





  if (

    typeof direct ===

      'number'

    &&

    Number.isFinite(

      direct

    )

  ) {

    return direct;

  }





  /*

   * Fallback:

   * si recentIds conserva repeticiones,

   * contamos cuántas veces aparece.

   */



  return recentIds.reduce(

    (

      total,

      id

    ) =>

      id === songId

        ? total + 1

        : total,

    0

  );

}





/* =========================================================

   BOTÓN DE SELECCIÓN MÚLTIPLE

========================================================= */



interface SelectionActionProps {

  icon:

    keyof typeof MaterialCommunityIcons.glyphMap;



  label:

    string;



  danger?:

    boolean;



  disabled?:

    boolean;



  onPress:

    () => void;

}





function SelectionAction({

  icon,

  label,

  danger = false,

  disabled = false,

  onPress,

}: SelectionActionProps) {

  return (

    <TouchableOpacity

      style={[

        styles.selectionAction,



        disabled &&

          styles.selectionActionDisabled,

      ]}

      activeOpacity={0.7}

      disabled={disabled}

      onPress={onPress}

    >

      <View

        style={[

          styles.selectionActionIcon,



          danger &&

            styles.selectionActionIconDanger,

        ]}

      >

        <MaterialCommunityIcons

          name={icon}

          size={21}

          color={

            danger

              ? COLORS.pink

              : COLORS.white

          }

        />

      </View>





      <Text

        style={[

          styles.selectionActionText,



          danger &&

            styles.selectionActionTextDanger,

        ]}

        numberOfLines={1}

      >

        {label}

      </Text>

    </TouchableOpacity>

  );

}





/* =========================================================

   HOME

========================================================= */



export default function HomeScreen() {

  const {

    library,

    favorites,

    playlists,

    stats,

    player,

  } =

    useApp();





  const navigateOnce =

    useNavigationLock();





  const {

    songs,

    loading,

    error,

    refresh,

  } =

    library;





  /* =======================================================

     ESTADOS

  ======================================================= */



  const [

    favoritesOnly,

    setFavoritesOnly,

  ] =

    useState(

      false

    );





  const [

    searchText,

    setSearchText,

  ] =

    useState(

      ''

    );





  const [

    menuSong,

    setMenuSong,

  ] =

    useState<

      Song | null

    >(

      null

    );





  const [

    playlistSongs,

    setPlaylistSongs,

  ] =

    useState<

      Song[]

    >(

      []

    );





  const [

    infoSong,

    setInfoSong,

  ] =

    useState<

      Song | null

    >(

      null

    );





  const [

    selectedIds,

    setSelectedIds,

  ] =

    useState<

      Set<string>

    >(

      new Set()

    );





  const [

    sortModalOpen,

    setSortModalOpen,

  ] =

    useState(

      false

    );





  /* =======================================================

     VOLVER ARRIBA

  ======================================================= */



  const listRef =

    useRef<

      FlatList<Song>

    >(null);





  const songsSectionYRef =

    useRef(

      0

    );





  const [

    showScrollTop,

    setShowScrollTop,

  ] =

    useState(

      false

    );





  const handleListScroll =

    useCallback(

      (

        event:

          any

      ) => {

        const offsetY =

          event

            .nativeEvent

            .contentOffset

            .y;





        const shouldShow =

          offsetY >

          220;





        setShowScrollTop(

          current =>

            current ===

              shouldShow

              ? current

              : shouldShow

        );

      },

      []

    );





  const scrollToTop =

    useCallback(

      () => {

        listRef.current

          ?.scrollToOffset({

            offset: 0,



            animated: true,

          });

      },

      []

    );





  const scrollToSongs =

    useCallback(

      () => {

        setTimeout(

          () => {

            listRef.current

              ?.scrollToOffset({

                offset:

                  Math.max(

                    0,

                    songsSectionYRef

                      .current -

                      12

                  ),



                animated: true,

              });

          },

          100

        );

      },

      []

    );





  /* =======================================================

     FILTRO FAVORITOS

  ======================================================= */



  const baseSongs =

    useMemo(

      () => {

        if (

          !favoritesOnly

        ) {

          return songs;

        }





        const favoriteSet =

          new Set(

            favorites

              .favorites

          );





        return songs.filter(

          song =>

            favoriteSet.has(

              song.id

            )

        );

      },

      [

        songs,

        favorites.favorites,

        favoritesOnly,

      ]

    );





  /* =======================================================

     ORDENAMIENTO DE BIBLIOTECA

  ======================================================= */



  const {

    orderedSongs,

    settings: sortSettings,

    setSortBy,

    setDirection,

    resetSort,

  } =

    useLibrarySort(

      baseSongs

    );





  /* =======================================================

     BÚSQUEDA

  ======================================================= */



  const displayedSongs =

    useMemo(

      () => {

        const query =

          normalizeSearchText(

            searchText

          );





        if (!query) {

          return orderedSongs;

        }





        return orderedSongs.filter(

          song =>

            normalizeSearchText(

              song.title

            ).includes(

              query

            )

            ||

            normalizeSearchText(

              song.artist

            ).includes(

              query

            )

            ||

            normalizeSearchText(

              song.album

            ).includes(

              query

            )

        );

      },

      [

        orderedSongs,

        searchText,

      ]

    );





  /*

   * Mantiene la lista actual accesible para onPress

   * sin recrear renderSong cuando solo cambia el orden.

   */

  const displayedSongsRef =

    useRef<Song[]>(

      displayedSongs

    );





  displayedSongsRef.current =

    displayedSongs;





  /* =======================================================

     CONTADORES

  ======================================================= */



  const albumCount =

    useMemo(

      () =>

        new Set(

          songs.map(

            song =>

              song.album

          )

        ).size,

      [

        songs,

      ]

    );





  const artistCount =

    useMemo(

      () =>

        new Set(

          songs.map(

            song =>

              song.artist

          )

        ).size,

      [

        songs,

      ]

    );





  /* =======================================================

     MAPA DE CANCIONES

  ======================================================= */



  const songById =

    useMemo(

      () =>

        new Map(

          songs.map(

            song => [

              song.id,

              song,

            ]

          )

        ),

      [

        songs,

      ]

    );





  /* =======================================================

     RECIENTES

  ======================================================= */



  const recentIds =

    stats.recentIds ??

    [];





  const recentSongs =

    useMemo(

      () => {

        const result:

          Song[] = [];





        const used =

          new Set<string>();





        recentIds.forEach(

          id => {

            if (

              used.has(

                id

              )

            ) {

              return;

            }





            const song =

              songById.get(

                id

              );





            if (!song) {

              return;

            }





            used.add(

              id

            );





            result.push(

              song

            );

          }

        );





        return result.slice(

          0,

          10

        );

      },

      [

        recentIds,

        songById,

      ]

    );





  /* =======================================================

     MÁS ESCUCHADAS

  ======================================================= */



  const topSongs =

    useMemo(

      () => {

        const statsLike =

          stats as unknown as

            StatsLike;





        const ranked =

          songs

            .map(

              song => ({

                song,



                count:

                  getPlayCount(

                    statsLike,

                    song.id,

                    recentIds

                  ),

              })

            )

            .filter(

              item =>

                item.count >

                0

            )

            .sort(

              (

                a,

                b

              ) =>

                b.count -

                a.count

            );





        return ranked

          .slice(

            0,

            10

          )

          .map(

            item =>

              item.song

          );

      },

      [

        songs,

        stats,

        recentIds,

      ]

    );





  /* =======================================================

     NAVEGACIÓN

  ======================================================= */



  const go =

    useCallback(

      (

        path:

          | '/albums'

          | '/artists'

          | '/folders'

          | '/playlists'

          | '/recent'

          | '/top'

          | '/settings'

      ) => {

        navigateOnce(

          () =>

            router.push(

              path

            )

        );

      },

      [

        navigateOnce,

      ]

    );





  /* =======================================================

     SELECCIÓN MÚLTIPLE

  ======================================================= */



  const selectionMode =

    selectedIds.size >

    0;





  const selectedSongs =

    useMemo(

      () =>

        displayedSongs.filter(

          song =>

            selectedIds.has(

              song.id

            )

        ),

      [

        displayedSongs,

        selectedIds,

      ]

    );





  const allDisplayedSelected =

    displayedSongs.length >

      0

    &&

    displayedSongs.every(

      song =>

        selectedIds.has(

          song.id

        )

    );





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

          new Set([

            song.id,

          ])

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

          current => {

            const next =

              new Set(

                current

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

          allDisplayedSelected

        ) {

          setSelectedIds(

            new Set()

          );



          return;

        }





        setSelectedIds(

          new Set(

            displayedSongs.map(

              song =>

                song.id

            )

          )

        );

      },

      [

        allDisplayedSelected,

        displayedSongs,

      ]

    );





  /* =======================================================

     ACCIONES MÚLTIPLES

  ======================================================= */



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





        Alert.alert(

          'Añadidas a la cola',

          selectedSongs.length ===

            1

            ? '1 canción fue añadida a la cola.'

            : `${selectedSongs.length} canciones fueron añadidas a la cola.`

        );





        exitSelection();

      },

      [

        selectedSongs,

        player.addToQueue,

        exitSelection,

      ]

    );





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

        } catch (err) {

          console.log(

            'Error compartiendo canciones:',

            err

          );





          Alert.alert(

            'No se pudo compartir',

            'No fue posible compartir los archivos seleccionados.'

          );

        }

      },

      [

        selectedSongs,

        exitSelection,

      ]

    );





  const deleteSelected =

    useCallback(

      async () => {

        if (

          selectedSongs.length ===

          0

        ) {

          return;

        }





        try {

          const currentId =

            player

              .currentSong

              ?.id;





          if (

            currentId

            &&

            selectedSongs.some(

              song =>

                song.id ===

                currentId

            )

          ) {

            player.pause();

          }





          const result =

            await deleteSongsFromDevice(

              selectedSongs

            );





          if (

            result.status ===

            'requested'

          ) {

            /*

             * Android mostrará su

             * confirmación oficial.

             */



            exitSelection();



            return;

          }





          if (

            result.status ===

            'deleted'

          ) {

            await library.refresh();



            exitSelection();



            return;

          }





          Alert.alert(

            'No se eliminaron',

            'Android no pudo eliminar los archivos seleccionados.'

          );

        } catch (err) {

          console.log(

            'Error eliminando canciones:',

            err

          );





          Alert.alert(

            'No se pudo eliminar',

            'Ocurrió un problema al intentar eliminar las canciones.'

          );

        }

      },

      [

        selectedSongs,

        player.currentSong?.id,

        player.pause,

        library.refresh,

        exitSelection,

      ]

    );





  const confirmDeleteSelected =

    useCallback(

      () => {

        if (

          selectedSongs.length ===

          0

        ) {

          return;

        }





        Alert.alert(

          'Eliminar del dispositivo',

          selectedSongs.length ===

            1

            ? `¿Quieres eliminar "${selectedSongs[0].title}" del teléfono?`

            : `¿Quieres eliminar ${selectedSongs.length} canciones del teléfono?`,

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





  /* =======================================================

     REPRODUCIR DESDE CARRUSEL

  ======================================================= */



  const playRecentSong =

    useCallback(

      (

        song: Song

      ) => {

        player.playSong(

          song,

          recentSongs

        );

      },

      [

        player.playSong,

        recentSongs,

      ]

    );





  const playTopSong =

    useCallback(

      (

        song: Song

      ) => {

        player.playSong(

          song,

          topSongs

        );

      },

      [

        player.playSong,

        topSongs,

      ]

    );





  const playRandomSongs =

    useCallback(

      async () => {

        const source = [

          ...displayedSongsRef.current,

        ];



        if (

          source.length === 0

        ) {

          return;

        }



        /*
         * Elegimos una canción inicial aleatoria para que
         * nunca empiece obligatoriamente por la canción 1.
         */
        const randomIndex =

          Math.floor(

            Math.random() *

              source.length

          );



        const firstSong =

          source[randomIndex];



        /*
         * Dejamos Shuffle activado también en RNTP.
         * Así, después de la primera canción, Siguiente
         * continúa reproduciendo aleatoriamente.
         */
        if (

          !player.shuffle

        ) {

          await player.toggleShuffle();

        }



        await player.playSong(

          firstSong,

          source

        );

      },

      [

        player.shuffle,

        player.toggleShuffle,

        player.playSong,

      ]

    );





  /* =======================================================

     RENDER CANCIÓN

  ======================================================= */



  const renderSong =

    useCallback(

      ({

        item,

      }: {

        item: Song;

      }) => {

        const active =

          player

            .currentSong

            ?.id ===

          item.id;





        const selected =

          selectedIds.has(

            item.id

          );





        return (

          <SongItem

            song={item}



            active={active}



            playing={

              active &&

              player.isPlaying

            }



            favorite={

              favorites

                .isFavorite(

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

                  displayedSongsRef.current

                );

              }

            }



            onLongPress={

              startSelection

            }



            onFavoritePress={

              favorites

                .toggleFavorite

            }



            onOptionsPress={

              setMenuSong

            }

          />

        );

      },

      [

        player.currentSong?.id,

        player.isPlaying,

        player.playSong,

        favorites.isFavorite,

        favorites.toggleFavorite,

        selectedIds,

        selectionMode,

        toggleSelection,

        startSelection,

      ]

    );





  /* =======================================================

     HEADER NORMAL

  ======================================================= */



  const normalHeader =

    !selectionMode ? (

      <>

        {/* ===============================================

            ENCABEZADO

        =============================================== */}



        <View

          style={

            styles.header

          }

        >

          <View>

            <Text

              style={

                styles.greeting

              }

            >

              Bienvenido

            </Text>





            <Text

              style={

                styles.mainTitle

              }

            >

              Mi Música

            </Text>





            <Text

              style={

                styles.description

              }

            >

              Tu biblioteca sin conexión

            </Text>

          </View>





          <TouchableOpacity

            style={

              styles.settings

            }

            activeOpacity={0.75}

            onPress={() =>

              go(

                '/settings'

              )

            }

          >

            <MaterialCommunityIcons

              name="cog-outline"

              size={24}

              color={

                COLORS.white

              }

            />

          </TouchableOpacity>

        </View>





        {/* ===============================================

            BUSCADOR

        =============================================== */}



        <View

          style={[

            styles.search,



            searchText.length >

              0

            &&

            styles.searchActive,

          ]}

        >

          <MaterialCommunityIcons

            name="magnify"

            size={22}

            color={

              searchText.length >

                0

                ? COLORS.purpleLight

                : COLORS.textMuted

            }

          />





          <TextInput

            value={

              searchText

            }



            onChangeText={

              setSearchText

            }



            placeholder=

              "Buscar canción, artista o álbum..."



            placeholderTextColor=

              "#73737E"



            style={

              styles.searchInput

            }



            selectionColor={

              COLORS.purpleLight

            }



            autoCorrect={

              false

            }



            autoCapitalize=

              "none"



            returnKeyType=

              "search"

          />





          {searchText.length >

          0 ? (

            <TouchableOpacity

              style={

                styles.clearSearch

              }

              onPress={() =>

                setSearchText(

                  ''

                )

              }

            >

              <MaterialCommunityIcons

                name="close-circle"

                size={20}

                color={

                  COLORS.textSecondary

                }

              />

            </TouchableOpacity>

          ) : null}

        </View>





        {/* ===============================================

            RESULTADOS DE BÚSQUEDA

        =============================================== */}



        {searchText.trim()

          .length > 0 ? (

          <View

            style={

              styles.searchResult

            }

          >

            <MaterialCommunityIcons

              name="music-box-multiple-outline"

              size={15}

              color={

                COLORS.purpleLight

              }

            />





            <Text

              style={

                styles.searchResultText

              }

            >

              {displayedSongs.length ===

              1

                ? '1 resultado'

                : `${displayedSongs.length} resultados`}

            </Text>

          </View>

        ) : null}





        {/* ===============================================

            BIBLIOTECA

        =============================================== */}



        <Text

          style={

            styles.sectionTitle

          }

        >

          Tu biblioteca

        </Text>





        <LibraryGrid

          songCount={

            songs.length

          }



          albumCount={

            albumCount

          }



          artistCount={

            artistCount

          }



          playlistCount={

            playlists

              .playlists

              .length

          }



          favoriteCount={

            favorites

              .favorites

              .length

          }



          recentCount={

            recentIds.length

          }



          favoritesOnly={

            favoritesOnly

          }



          onSongsPress={() => {

            setFavoritesOnly(

              false

            );



            setSearchText(

              ''

            );



            if (

              songs.length >

              0

            ) {

              scrollToSongs();

            }

          }}



          onAlbumsPress={() =>

            go(

              '/albums'

            )

          }



          onArtistsPress={() =>

            go(

              '/artists'

            )

          }



          onFoldersPress={() =>

            go(

              '/folders'

            )

          }



          onPlaylistsPress={() =>

            go(

              '/playlists'

            )

          }



          onFavoritesPress={() => {

            setFavoritesOnly(

              true

            );



            setSearchText(

              ''

            );

          }}



          onRecentPress={() =>

            go(

              '/recent'

            )

          }



          onTopPress={() =>

            go(

              '/top'

            )

          }

        />





        {/* ===============================================

            CARRUSELES

            Solo aparecen en Inicio normal.

        =============================================== */}



        {!favoritesOnly &&

        !searchText.trim() ? (

          <>

            <HomeSongCarousel

              title=

                "Escuchado recientemente"



              subtitle=

                "Vuelve rápidamente a tus últimas canciones"



              songs={

                recentSongs

              }



              currentSongId={

                player

                  .currentSong

                  ?.id

              }



              playing={

                player.isPlaying

              }



              onSongPress={

                playRecentSong

              }



              onSeeAll={() =>

                go(

                  '/recent'

                )

              }

            />





            <HomeSongCarousel

              title=

                "Más escuchadas"



              subtitle=

                "Las canciones que más reproduces"



              songs={

                topSongs

              }



              currentSongId={

                player

                  .currentSong

                  ?.id

              }



              playing={

                player.isPlaying

              }



              onSongPress={

                playTopSong

              }



              onSeeAll={() =>

                go(

                  '/top'

                )

              }

            />

          </>

        ) : null}





        {/* ===============================================

            TÍTULO DE LISTA

        =============================================== */}



        <View

          style={

            styles.listTitleRow

          }

          onLayout={

            event => {

              songsSectionYRef.current =

                event.nativeEvent.layout.y;

            }

          }

        >

          <View

            style={

              styles.listTitleLeft

            }

          >

            <Text

              style={

                styles.sectionTitleNoMargin

              }

            >

              {searchText.trim()

                ? 'Resultados'

                : favoritesOnly

                  ? 'Favoritos'

                  : 'Tus canciones'}

            </Text>





            {displayedSongs.length >

            0 ? (

              <View

                style={

                  styles.badge

                }

              >

                <Text

                  style={

                    styles.badgeText

                  }

                >

                  {

                    displayedSongs.length

                  }

                </Text>

              </View>

            ) : null}



            {!favoritesOnly &&

            !searchText.trim() &&

            displayedSongs.length >

              0 ? (

              <TouchableOpacity

                style={

                  styles.randomPlayButton

                }

                activeOpacity={

                  0.72

                }

                onPress={() => {

                  void playRandomSongs();

                }}

                accessibilityRole="button"

                accessibilityLabel="Reproducir canciones aleatoriamente"

              >

                <MaterialCommunityIcons

                  name="shuffle-variant"

                  size={20}

                  color={

                    COLORS.white

                  }

                />

              </TouchableOpacity>

            ) : null}

          </View>





          {displayedSongs.length >

          0 ? (

            <TouchableOpacity

              style={

                styles.sortButton

              }

              activeOpacity={

                0.72

              }

              onPress={() =>

                setSortModalOpen(

                  true

                )

              }

            >

              <MaterialCommunityIcons

                name={

                  sortSettings.direction ===

                  'asc'

                    ? 'sort-ascending'

                    : 'sort-descending'

                }

                size={19}

                color={

                  COLORS.purpleLight

                }

              />





              <Text

                style={

                  styles.sortButtonText

                }

              >

                Ordenar

              </Text>

            </TouchableOpacity>

          ) : null}

        </View>

      </>

    ) : null;





  /* =======================================================

     VACÍO

  ======================================================= */



  const empty =

    loading ? (

      <View

        style={

          styles.empty

        }

      >

        <ActivityIndicator

          size="large"

          color={

            COLORS.purple

          }

        />





        <Text

          style={

            styles.emptyText

          }

        >

          Leyendo tu biblioteca...

        </Text>

      </View>

    ) : (

      <View

        style={

          styles.empty

        }

      >

        <MaterialCommunityIcons

          name={

            searchText

              ? 'magnify-close'

              : favoritesOnly

                ? 'heart-outline'

                : 'folder-music-outline'

          }



          size={52}



          color={

            COLORS.purpleLight

          }

        />





        <Text

          style={

            styles.emptyTitle

          }

        >

          {searchText

            ? 'No encontramos resultados'

            : favoritesOnly

              ? 'Aún no tienes favoritos'

              : 'No encontramos música'}

        </Text>





        <Text

          style={

            styles.emptyText

          }

        >

          {searchText

            ? `No hay coincidencias para "${searchText}".`

            : favoritesOnly

              ? 'Toca el corazón de una canción para guardarla.'

              : error ??

                'Agrega música al teléfono e intenta nuevamente.'}

        </Text>





        {searchText ? (

          <TouchableOpacity

            style={

              styles.retry

            }

            onPress={() =>

              setSearchText(

                ''

              )

            }

          >

            <MaterialCommunityIcons

              name="close"

              size={19}

              color={

                COLORS.white

              }

            />





            <Text

              style={

                styles.retryText

              }

            >

              Limpiar búsqueda

            </Text>

          </TouchableOpacity>

        ) : null}





        {!searchText &&

        !favoritesOnly ? (

          <TouchableOpacity

            style={

              styles.retry

            }

            onPress={

              refresh

            }

          >

            <MaterialCommunityIcons

              name="refresh"

              size={20}

              color={

                COLORS.white

              }

            />





            <Text

              style={

                styles.retryText

              }

            >

              Buscar nuevamente

            </Text>

          </TouchableOpacity>

        ) : null}

      </View>

    );





  /* =======================================================

     UI

  ======================================================= */



  return (

    <View

      style={

        styles.container

      }

    >

      {/* ===============================================

          FONDO DINÁMICO DE INICIO



          Sin canción:

          fondo propio violeta/azulado.



          Con canción:

          carátula actual difuminada.

      =============================================== */}



<HomeBackground

  artwork={

    player

      .currentSong

      ?.artwork

  }

  seed={

    player

      .currentSong

      ?.id

  }

/>





      <SafeAreaView

        style={

          styles.safeArea

        }

      >

        {/* ===============================================

            CABECERA DE SELECCIÓN

        =============================================== */}



      {selectionMode ? (

        <>

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

                size={26}

                color={

                  COLORS.white

                }

              />

            </TouchableOpacity>





            <View

              style={

                styles.selectionHeaderText

              }

            >

              <Text

                style={

                  styles.selectionTitle

                }

              >

                {selectedIds.size} seleccionada

                {selectedIds.size ===

                1

                  ? ''

                  : 's'}

              </Text>





              <Text

                style={

                  styles.selectionSubtitle

                }

              >

                {searchText.trim()

                  ? 'Resultados de búsqueda'

                  : favoritesOnly

                    ? 'Favoritos'

                    : 'Tus canciones'}

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

                  allDisplayedSelected

                    ? 'checkbox-marked-circle'

                    : 'checkbox-multiple-blank-circle-outline'

                }

                size={22}

                color={

                  COLORS.purpleLight

                }

              />





              <Text

                style={

                  styles.selectAllText

                }

              >

                {allDisplayedSelected

                  ? 'Ninguna'

                  : 'Todas'}

              </Text>

            </TouchableOpacity>

          </View>





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

              onPress={

                addSelectedToPlaylist

              }

            />





            <SelectionAction

              icon="share-variant-outline"

              label="Compartir"

              onPress={() => {

                void shareSelected();

              }}

            />





            <SelectionAction

              icon="trash-can-outline"

              label="Eliminar"

              danger

              onPress={

                confirmDeleteSelected

              }

            />

          </View>

        </>

      ) : null}





      {/* ===============================================

          LISTA

      =============================================== */}



      <FlatList

        ref={

          listRef

        }



        data={

          displayedSongs

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

          normalHeader

        }



        ListEmptyComponent={

          empty

        }



        contentContainerStyle={

          styles.content

        }



        showsVerticalScrollIndicator={

          false

        }



        onScroll={

          handleListScroll

        }



        scrollEventThrottle={

          32

        }



        keyboardShouldPersistTaps=

          "handled"



        keyboardDismissMode=

          "on-drag"



        removeClippedSubviews={

          true

        }



        initialNumToRender={

          12

        }



        maxToRenderPerBatch={

          10

        }



        updateCellsBatchingPeriod={

          40

        }



        windowSize={

          7

        }



        refreshControl={

          <RefreshControl

            refreshing={

              loading

            }



            onRefresh={

              refresh

            }



            tintColor={

              COLORS.purple

            }



            colors={[

              COLORS.purple,

            ]}

          />

        }

      />





      {showScrollTop &&

      !selectionMode ? (

        <TouchableOpacity

          style={

            styles.scrollTopButton

          }



          activeOpacity={

            0.82

          }



          onPress={

            scrollToTop

          }

        >

          <MaterialCommunityIcons

            name="arrow-up"

            size={24}

            color={

              COLORS.white

            }

          />

        </TouchableOpacity>

      ) : null}





      {/* ===============================================

          MENÚ DE CANCIÓN

      =============================================== */}



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

            ? favorites

                .isFavorite(

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

              displayedSongs

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

            setPlaylistSongs([

              menuSong,

            ]);

          }

        }}



        onAlbum={() => {

          if (

            !menuSong

          ) {

            return;

          }





          const song =

            menuSong;





          navigateOnce(

            () =>

              router.push({

                pathname:

                  '/album',



                params: {

                  name:

                    song.album,

                },

              })

          );

        }}



        onArtist={() => {

          if (

            !menuSong

          ) {

            return;

          }





          const song =

            menuSong;





          navigateOnce(

            () =>

              router.push({

                pathname:

                  '/artist',



                params: {

                  name:

                    song.artist,

                },

              })

          );

        }}



        onFavorite={() => {

          if (

            menuSong

          ) {

            favorites

              .toggleFavorite(

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





      {/* ===============================================

          PLAYLIST

      =============================================== */}



      <AddToPlaylistModal

        visible={

          playlistSongs.length >

          0

        }



        playlists={

          playlists

            .playlists

        }



        onClose={() =>

          setPlaylistSongs(

            []

          )

        }



        onCreate={

          playlists

            .createPlaylist

        }



        onSelect={

          playlistId => {

            playlistSongs.forEach(

              song => {

                playlists.addSong(

                  playlistId,

                  song.id

                );

              }

            );





            const count =

              playlistSongs.length;





            setPlaylistSongs(

              []

            );





            exitSelection();





            if (

              count >

              1

            ) {

              Alert.alert(

                'Playlist actualizada',

                `${count} canciones fueron añadidas a la playlist.`

              );

            }

          }

        }

      />





      {/* ===============================================

          INFORMACIÓN

      =============================================== */}



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





      {/* ===============================================

          ORDENAR CANCIONES

      =============================================== */}



      <SortSongsModal

        visible={

          sortModalOpen

        }



        settings={

          sortSettings

        }



        onSortBy={

          setSortBy

        }



        onDirection={

          setDirection

        }



        onReset={

          resetSort

        }



        onClose={() =>

          setSortModalOpen(

            false

          )

        }

      />

      </SafeAreaView>

    </View>

  );

}





/* =========================================================

   ESTILOS

========================================================= */



const styles =

  StyleSheet.create({

    container: {

      flex: 1,



      backgroundColor:

        '#09070F',

    },





    safeArea: {

      flex: 1,



      backgroundColor:

        'transparent',

    },





    content: {

      paddingHorizontal:

        20,



      paddingTop:

        8,



      paddingBottom:

        130,



      flexGrow:

        1,

    },





    scrollTopButton: {

      position:

        'absolute',



      right:

        18,



      bottom:

        122,



      width:

        48,



      height:

        48,



      borderRadius:

        24,



      backgroundColor:

        'rgba(70, 50, 100, 0.92)',



      borderWidth:

        StyleSheet.hairlineWidth,



      borderColor:

        'rgba(255,255,255,0.18)',



      justifyContent:

        'center',



      alignItems:

        'center',



      zIndex:

        999,



      elevation:

        20,



      shadowColor:

        '#000',



      shadowOpacity:

        0.28,



      shadowRadius:

        8,



      shadowOffset: {

        width: 0,



        height: 4,

      },

    },





    /* =====================================================

       HEADER

    ===================================================== */



    header: {

      flexDirection:

        'row',



      justifyContent:

        'space-between',



      alignItems:

        'center',



      marginBottom:

        20,

    },





    greeting: {

      color:

        COLORS.textSecondary,



      fontSize:

        13,

    },





    mainTitle: {

      color:

        COLORS.white,



      fontSize:

        30,



      fontWeight:

        '700',



      marginTop:

        2,

    },





    description: {

      color:

        COLORS.textMuted,



      fontSize:

        11,



      marginTop:

        4,

    },





    settings: {

      width:

        46,



      height:

        46,



      borderRadius:

        16,



      backgroundColor:

        'rgba(24,22,33,0.72)',



      justifyContent:

        'center',



      alignItems:

        'center',



      borderWidth:

        StyleSheet.hairlineWidth,



      borderColor:

        'rgba(255,255,255,0.11)',

    },





    /* =====================================================

       BUSCADOR

    ===================================================== */



    search: {

      height:

        54,



      borderRadius:

        18,



      backgroundColor:

        'rgba(24,22,33,0.74)',



      flexDirection:

        'row',



      alignItems:

        'center',



      paddingHorizontal:

        15,



      marginBottom:

        20,



      borderWidth:

        1,



      borderColor:

        'transparent',

    },





    searchActive: {

      borderColor:

        'rgba(139,92,246,0.55)',



      backgroundColor:

        'rgba(31,27,43,0.88)',

    },





    searchInput: {

      flex:

        1,



      height:

        '100%',



      marginLeft:

        10,



      paddingVertical:

        0,



      color:

        COLORS.white,



      fontSize:

        14,

    },





    clearSearch: {

      width:

        36,



      height:

        46,



      justifyContent:

        'center',



      alignItems:

        'flex-end',

    },





    searchResult: {

      flexDirection:

        'row',



      alignItems:

        'center',



      gap:

        6,



      marginTop:

        -9,



      marginBottom:

        18,



      paddingHorizontal:

        3,

    },





    searchResultText: {

      color:

        COLORS.textSecondary,



      fontSize:

        11,

    },





    /* =====================================================

       SECCIONES

    ===================================================== */



    sectionTitle: {

      color:

        COLORS.white,



      fontSize:

        19,



      fontWeight:

        '700',



      marginBottom:

        14,

    },





    sectionTitleNoMargin: {

      color:

        COLORS.white,



      fontSize:

        19,



      fontWeight:

        '700',

    },





    listTitleRow: {

      flexDirection:

        'row',



      alignItems:

        'center',



      justifyContent:

        'space-between',



      gap:

        12,



      marginTop:

        3,



      marginBottom:

        14,

    },





    listTitleLeft: {

      flex:

        1,



      flexDirection:

        'row',



      alignItems:

        'center',



      gap:

        9,



      minWidth:

        0,

    },





    randomPlayButton: {

      width:

        38,



      height:

        38,



      borderRadius:

        19,



      alignItems:

        'center',



      justifyContent:

        'center',



      backgroundColor:

        'rgba(139,92,246,0.28)',



      borderWidth:

        StyleSheet.hairlineWidth,



      borderColor:

        'rgba(196,181,253,0.42)',

    },





    sortButton: {

      height:

        38,



      paddingHorizontal:

        12,



      borderRadius:

        14,



      flexDirection:

        'row',



      alignItems:

        'center',



      justifyContent:

        'center',



      gap:

        6,



      backgroundColor:

        'rgba(139,92,246,0.13)',



      borderWidth:

        StyleSheet.hairlineWidth,



      borderColor:

        'rgba(167,139,250,0.28)',

    },





    sortButtonText: {

      color:

        '#E4DFFF',



      fontSize:

        11,



      fontWeight:

        '700',

    },





    badge: {

      minWidth:

        27,



      height:

        23,



      paddingHorizontal:

        8,



      borderRadius:

        12,



      backgroundColor:

        '#292132',



      justifyContent:

        'center',



      alignItems:

        'center',

    },





    badgeText: {

      color:

        COLORS.purpleLight,



      fontSize:

        10,



      fontWeight:

        '700',

    },





    /* =====================================================

       VACÍO

    ===================================================== */



    empty: {

      minHeight:

        240,



      borderRadius:

        24,



      padding:

        30,



      backgroundColor:

        'rgba(24,22,33,0.76)',



      borderWidth:

        StyleSheet.hairlineWidth,



      borderColor:

        'rgba(255,255,255,0.09)',



      justifyContent:

        'center',



      alignItems:

        'center',



      marginBottom:

        20,

    },





    emptyTitle: {

      color:

        COLORS.white,



      fontSize:

        17,



      fontWeight:

        '700',



      textAlign:

        'center',



      marginTop:

        15,

    },





    emptyText: {

      color:

        COLORS.textSecondary,



      fontSize:

        12,



      lineHeight:

        19,



      textAlign:

        'center',



      marginTop:

        8,

    },





    retry: {

      flexDirection:

        'row',



      alignItems:

        'center',



      gap:

        7,



      backgroundColor:

        COLORS.purple,



      paddingHorizontal:

        20,



      paddingVertical:

        12,



      borderRadius:

        24,



      marginTop:

        20,

    },





    retryText: {

      color:

        COLORS.white,



      fontSize:

        12,



      fontWeight:

        '700',

    },





    /* =====================================================

       SELECCIÓN

    ===================================================== */



    selectionHeader: {

      minHeight:

        67,



      flexDirection:

        'row',



      alignItems:

        'center',



      paddingHorizontal:

        14,



      borderBottomWidth:

        StyleSheet.hairlineWidth,



      borderBottomColor:

        COLORS.line,



      backgroundColor:

        'rgba(11,9,18,0.94)',

    },





    selectionClose: {

      width:

        44,



      height:

        44,



      borderRadius:

        22,



      justifyContent:

        'center',



      alignItems:

        'center',

    },





    selectionHeaderText: {

      flex:

        1,



      paddingHorizontal:

        6,

    },





    selectionTitle: {

      color:

        COLORS.white,



      fontSize:

        16,



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

      minWidth:

        66,



      minHeight:

        44,



      alignItems:

        'center',



      justifyContent:

        'center',

    },





    selectAllText: {

      color:

        COLORS.purpleLight,



      fontSize:

        9,



      fontWeight:

        '600',



      marginTop:

        2,

    },





    selectionActions: {

      flexDirection:

        'row',



      alignItems:

        'center',



      paddingHorizontal:

        12,



      paddingVertical:

        10,



      backgroundColor:

        'rgba(24,22,33,0.94)',



      borderBottomWidth:

        StyleSheet.hairlineWidth,



      borderBottomColor:

        'rgba(255,255,255,0.10)',

    },





    selectionAction: {

      flex:

        1,



      alignItems:

        'center',



      justifyContent:

        'center',



      minHeight:

        60,

    },





    selectionActionDisabled: {

      opacity:

        0.4,

    },





    selectionActionIcon: {

      width:

        35,



      height:

        35,



      borderRadius:

        18,



      backgroundColor:

        COLORS.surfaceLight,



      alignItems:

        'center',



      justifyContent:

        'center',

    },





    selectionActionIconDanger: {

      backgroundColor:

        'rgba(236,72,153,0.12)',

    },





    selectionActionText: {

      color:

        COLORS.textSecondary,



      fontSize:

        9,



      fontWeight:

        '600',



      marginTop:

        5,

    },





    selectionActionTextDanger: {

      color:

        COLORS.pink,

    },

  });