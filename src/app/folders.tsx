import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  router,
} from 'expo-router';

import {
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
  useMemo,
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

import {
  getSongFolderPath,
} from '../utils/music';

import ScreenHeader
  from '../components/ScreenHeader';


interface RootFolder {
  name: string;

  path: string;

  songCount: number;

  directSongCount: number;

  subfolderCount: number;
}


export default function FoldersScreen() {
  const {
    library,
  } =
    useApp();

  const navigateOnce =
    useNavigationLock();


  const folders =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            {
              songCount:
                number;

              directSongCount:
                number;

              subfolders:
                Set<string>;
            }
          >();


        library.songs.forEach(
          song => {
            const fullPath =
              getSongFolderPath(
                song
              );

            const parts =
              fullPath
                .split('/')
                .filter(
                  Boolean
                );

            const root =
              parts[0] ??
              'Otros';


            if (
              !map.has(root)
            ) {
              map.set(
                root,
                {
                  songCount: 0,

                  directSongCount:
                    0,

                  subfolders:
                    new Set(),
                }
              );
            }


            const current =
              map.get(root)!;

            current.songCount +=
              1;


            if (
              parts.length ===
              1
            ) {
              current.directSongCount +=
                1;
            }


            if (
              parts.length >
              1
            ) {
              current.subfolders.add(
                parts[1]
              );
            }
          }
        );


        const result:
          RootFolder[] =
          Array.from(
            map.entries()
          )
            .map(
              ([
                name,
                data,
              ]) => ({
                name,

                path:
                  name,

                songCount:
                  data.songCount,

                directSongCount:
                  data.directSongCount,

                subfolderCount:
                  data
                    .subfolders
                    .size,
              })
            )
            .sort(
              (
                a,
                b
              ) => {
                /*
                 * "Otros" siempre abajo.
                 */
                if (
                  a.name ===
                  'Otros'
                ) {
                  return 1;
                }

                if (
                  b.name ===
                  'Otros'
                ) {
                  return -1;
                }

                return a.name
                  .localeCompare(
                    b.name,
                    undefined,
                    {
                      sensitivity:
                        'base',
                    }
                  );
              }
            );


        return result;
      },
      [
        library.songs,
      ]
    );


  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScreenHeader
        title="Carpetas"
        subtitle={`${folders.length} carpetas principales`}
      />


      <FlatList
        data={
          folders
        }
        keyExtractor={
          item =>
            item.path
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
        ListEmptyComponent={
          <View
            style={
              styles.empty
            }
          >
            <MaterialCommunityIcons
              name="folder-music-outline"
              size={55}
              color={
                COLORS.textMuted
              }
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No hay carpetas
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Android todavía no ha proporcionado información de ubicación para tu música.
            </Text>
          </View>
        }
        renderItem={({
          item,
        }) => (
          <TouchableOpacity
            activeOpacity={
              0.75
            }
            style={
              styles.folder
            }
            onPress={() =>
              navigateOnce(
                () =>
                  router.push({
                    pathname:
                      '/folder',

                    params: {
                      path:
                        item.path,

                      name:
                        item.name,
                    },
                  })
              )
            }
          >
            <View
              style={
                styles.icon
              }
            >
              <MaterialCommunityIcons
                name={
                  item.name ===
                  'Otros'
                    ? 'folder-question-outline'
                    : 'folder-music'
                }
                size={30}
                color={
                  item.name ===
                  'Otros'
                    ? COLORS.orange
                    : COLORS.green
                }
              />
            </View>


            <View
              style={
                styles.info
              }
            >
              <Text
                style={
                  styles.name
                }
                numberOfLines={1}
              >
                {item.name}
              </Text>


              <Text
                style={
                  styles.subtitle
                }
                numberOfLines={1}
              >
                {item.songCount} canciones

                {item.subfolderCount >
                  0
                  ? ` • ${item.subfolderCount} subcarpetas`
                  : ''
                }
              </Text>


              {item.directSongCount >
                0 &&
              item.subfolderCount >
                0 ? (
                <Text
                  style={
                    styles.directCount
                  }
                >
                  {item.directSongCount} directamente en esta carpeta
                </Text>
              ) : null}
            </View>


            <MaterialCommunityIcons
              name="chevron-right"
              size={27}
              color={
                COLORS.textMuted
              }
            />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}


const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },


    content: {
      paddingHorizontal:
        20,

      paddingBottom:
        120,

      flexGrow: 1,
    },


    folder: {
      minHeight: 82,

      flexDirection:
        'row',

      alignItems:
        'center',
    },


    icon: {
      width: 58,

      height: 58,

      borderRadius: 18,

      backgroundColor:
        COLORS.surface,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    info: {
      flex: 1,

      marginLeft: 14,
    },


    name: {
      color:
        COLORS.white,

      fontSize: 15,

      fontWeight:
        '600',
    },


    subtitle: {
      color:
        COLORS.textMuted,

      fontSize: 11,

      marginTop: 5,
    },


    directCount: {
      color:
        COLORS.textSecondary,

      fontSize: 9,

      marginTop: 3,
    },


    empty: {
      minHeight: 350,

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal:
        30,
    },


    emptyTitle: {
      color:
        COLORS.white,

      fontSize: 17,

      fontWeight:
        '700',

      marginTop: 14,
    },


    emptyText: {
      color:
        COLORS.textMuted,

      fontSize: 12,

      lineHeight: 18,

      textAlign:
        'center',

      marginTop: 7,
    },
  });