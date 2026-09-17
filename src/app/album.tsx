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
  
  
  export default function AlbumScreen() {
  
    const {
      name,
    } =
      useLocalSearchParams<{
        name?:
          string;
      }>();
  
  
    const albumName =
      name ??
      'Álbum';
  
  
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
                song.album ===
                albumName
            ),
        [
          library.songs,
          albumName,
        ]
      );
  
  
    return (
  
      <SongCollectionScreen
  
        title={
          albumName
        }
  
        subtitle={
          songs[0]
            ?.artist
        }
  
        songs={
          songs
        }
  
        artwork={
          songs[0]
            ?.artwork
        }
  
      />
  
    );
  }