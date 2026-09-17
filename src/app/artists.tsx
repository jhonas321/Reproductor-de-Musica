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
  
  import Artwork
    from '../components/Artwork';
  
  import ScreenHeader
    from '../components/ScreenHeader';
  
  
  interface ArtistItem {
  
    name:
      string;
  
    artwork:
      string | null;
  
    count:
      number;
  
    albums:
      number;
  
  }
  
  
  export default function ArtistsScreen() {
  
    const {
      library,
    } =
      useApp();
  
  
    const navigateOnce =
      useNavigationLock();
  
  
    const artists =
      useMemo(
        () => {
  
          const map =
            new Map<
              string,
              {
                name:
                  string;
  
                artwork:
                  string | null;
  
                count:
                  number;
  
                albums:
                  Set<string>;
              }
            >();
  
  
          library.songs
            .forEach(
              song => {
  
                const current =
                  map.get(
                    song.artist
                  );
  
  
                if (
                  current
                ) {
  
                  current.count +=
                    1;
  
  
                  current.albums
                    .add(
                      song.album
                    );
  
  
                  if (
                    !current.artwork &&
                    song.artwork
                  ) {
  
                    current.artwork =
                      song.artwork;
  
                  }
  
                } else {
  
                  map.set(
                    song.artist,
                    {
  
                      name:
                        song.artist,
  
                      artwork:
                        song.artwork,
  
                      count:
                        1,
  
                      albums:
                        new Set([
                          song.album,
                        ]),
  
                    }
                  );
  
                }
  
              }
            );
  
  
          return Array.from(
            map.values()
          )
            .map(
              item => ({
  
                name:
                  item.name,
  
                artwork:
                  item.artwork,
  
                count:
                  item.count,
  
                albums:
                  item.albums.size,
  
              })
            )
            .sort(
              (
                a,
                b
              ) =>
                a.name.localeCompare(
                  b.name
                )
            );
  
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
          title="Artistas"
          subtitle={`${artists.length} artistas`}
        />
  
  
        <FlatList
  
          data={
            artists
          }
  
          keyExtractor={
            item =>
              item.name
          }
  
          contentContainerStyle={
            styles.content
          }
  
          removeClippedSubviews
  
          initialNumToRender={
            12
          }
  
          renderItem={({
            item,
          }) => (
  
            <TouchableOpacity
  
              activeOpacity={
                0.75
              }
  
              style={
                styles.row
              }
  
              onPress={() =>
  
                navigateOnce(
                  () =>
  
                    router.push({
  
                      pathname:
                        '/artist',
  
                      params: {
                        name:
                          item.name,
                      },
  
                    })
                )
  
              }
            >
  
              <Artwork
                uri={
                  item.artwork
                }
                size={64}
                radius={32}
                iconSize={28}
              />
  
  
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
                >
                  {item.count} canciones
                  {' • '}
                  {item.albums} álbumes
                </Text>
  
              </View>
  
  
              <MaterialCommunityIcons
                name="chevron-right"
                size={25}
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
  
  
      row: {
  
        minHeight:
          80,
  
        flexDirection:
          'row',
  
        alignItems:
          'center',
  
      },
  
  
      info: {
  
        flex:
          1,
  
        marginLeft:
          14,
  
      },
  
  
      name: {
  
        color:
          COLORS.white,
  
        fontSize:
          15,
  
        fontWeight:
          '600',
  
      },
  
  
      subtitle: {
  
        color:
          COLORS.textMuted,
  
        fontSize:
          11,
  
        marginTop:
          4,
  
      },
  
    });