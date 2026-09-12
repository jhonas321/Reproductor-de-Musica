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
  
  
  interface AlbumItem {
  
    name:
      string;
  
    artist:
      string;
  
    artwork:
      string | null;
  
    count:
      number;
  
  }
  
  
  export default function AlbumsScreen() {
  
    const {
      library,
    } =
      useApp();
  
  
    const navigateOnce =
      useNavigationLock();
  
  
    const albums =
      useMemo(
        () => {
  
          const map =
            new Map<
              string,
              AlbumItem
            >();
  
  
          library.songs
            .forEach(
              song => {
  
                const current =
                  map.get(
                    song.album
                  );
  
  
                if (
                  current
                ) {
  
                  current.count +=
                    1;
  
  
                  if (
                    !current.artwork &&
                    song.artwork
                  ) {
  
                    current.artwork =
                      song.artwork;
  
                  }
  
                } else {
  
                  map.set(
                    song.album,
                    {
  
                      name:
                        song.album,
  
                      artist:
                        song.artist,
  
                      artwork:
                        song.artwork,
  
                      count:
                        1,
  
                    }
                  );
  
                }
  
              }
            );
  
  
          return Array.from(
            map.values()
          ).sort(
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
          title="Álbumes"
          subtitle={`${albums.length} álbumes`}
        />
  
  
        <FlatList
  
          data={
            albums
          }
  
          numColumns={
            2
          }
  
          keyExtractor={
            item =>
              item.name
          }
  
          columnWrapperStyle={
            styles.row
          }
  
          contentContainerStyle={
            styles.content
          }
  
          showsVerticalScrollIndicator={
            false
          }
  
          removeClippedSubviews
  
          initialNumToRender={
            10
          }
  
          renderItem={({
            item,
          }) => (
  
            <TouchableOpacity
  
              activeOpacity={
                0.78
              }
  
              style={
                styles.card
              }
  
              onPress={() =>
  
                navigateOnce(
                  () =>
  
                    router.push({
  
                      pathname:
                        '/album',
  
                      params: {
                        name:
                          item.name,
                      },
  
                    })
                )
  
              }
            >
  
              <View
                style={
                  styles.artworkWrap
                }
              >
  
                <Artwork
                  uri={
                    item.artwork
                  }
                  size={150}
                  radius={20}
                  iconSize={52}
                />
  
              </View>
  
  
              <Text
                style={
                  styles.title
                }
                numberOfLines={1}
              >
                {item.name}
              </Text>
  
  
              <Text
                style={
                  styles.artist
                }
                numberOfLines={1}
              >
                {item.artist}
              </Text>
  
  
              <Text
                style={
                  styles.count
                }
              >
                {item.count} canciones
              </Text>
  
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
          18,
  
        paddingBottom:
          120,
  
      },
  
  
      row: {
  
        justifyContent:
          'space-between',
  
      },
  
  
      card: {
  
        width:
          '48%',
  
        marginBottom:
          24,
  
      },
  
  
      artworkWrap: {
  
        alignItems:
          'center',
  
      },
  
  
      title: {
  
        color:
          COLORS.white,
  
        fontSize:
          14,
  
        fontWeight:
          '600',
  
        marginTop:
          9,
  
      },
  
  
      artist: {
  
        color:
          COLORS.textSecondary,
  
        fontSize:
          11,
  
        marginTop:
          3,
  
      },
  
  
      count: {
  
        color:
          COLORS.textMuted,
  
        fontSize:
          10,
  
        marginTop:
          3,
  
      },
  
    });