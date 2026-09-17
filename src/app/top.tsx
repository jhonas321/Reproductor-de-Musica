import {
    useMemo,
  } from 'react';
  
  import {
    useApp,
  } from '../context/AppContext';
  
  import SongCollectionScreen
    from '../components/SongCollectionScreen';
  
  
  export default function TopScreen() {
  
    const {
  
      library,
  
      stats,
  
    } =
      useApp();
  
  
    const songs =
      useMemo(
        () => {
  
          return [
            ...library.songs,
          ]
            .filter(
              song =>
                (
                  stats.playCounts[
                    song.id
                  ] ??
                  0
                ) >
                0
            )
            .sort(
              (
                a,
                b
              ) =>
                (
                  stats.playCounts[
                    b.id
                  ] ??
                  0
                ) -
                (
                  stats.playCounts[
                    a.id
                  ] ??
                  0
                )
            );
  
        },
        [
          library.songs,
          stats.playCounts,
        ]
      );
  
  
    return (
  
      <SongCollectionScreen
  
        title=
          "Más escuchadas"
  
        subtitle={
          `${songs.length} canciones con reproducciones`
        }
  
        songs={
          songs
        }
  
        emptyText=
          "Tu ranking aparecerá después de reproducir canciones."
  
      />
  
    );
  }