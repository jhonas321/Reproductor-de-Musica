import {
    useLocalSearchParams,
  } from 'expo-router';
  
  import {
    useMemo,
  } from 'react';
  
  import {
    useApp,
  } from '../context/AppContext';
  
  import SongCollectionScreen
    from '../components/SongCollectionScreen';
  
  
  export default function ArtistScreen() {
  
    const {
      name,
    } =
      useLocalSearchParams<{
        name?:
          string;
      }>();
  
  
    const artistName =
      name ??
      'Artista';
  
  
    const {
      library,
    } =
      useApp();
  
  
    const songs =
      useMemo(
        () =>
          library.songs
            .filter(
              song =>
                song.artist ===
                artistName
            ),
        [
          library.songs,
          artistName,
        ]
      );
  
  
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
  
  
    return (
  
      <SongCollectionScreen
  
        title={
          artistName
        }
  
        subtitle={
          `${songs.length} canciones • ${albumCount} álbumes`
        }
  
        songs={
          songs
        }
  
        artwork={
          songs[0]
            ?.artwork
        }
  
        artworkCircle
  
      />
  
    );
  }