import {
    useMemo,
  } from 'react';
  
  import {
    useApp,
  } from '../context/AppContext';
  
  import SongCollectionScreen
    from '../components/SongCollectionScreen';
  
  
  export default function RecentScreen() {
  
    const {
  
      library,
  
      stats,
  
    } =
      useApp();
  
  
    const songs =
      useMemo(
        () => {
  
          const map =
            new Map(
              library.songs
                .map(
                  song => [
                    song.id,
                    song,
                  ]
                )
            );
  
  
          return stats
            .recentIds
            .map(
              id =>
                map.get(
                  id
                )
            )
            .filter(
              Boolean
            ) as typeof library.songs;
  
        },
        [
          library.songs,
          stats.recentIds,
        ]
      );
  
  
    return (
  
      <SongCollectionScreen
  
        title=
          "Escuchado recientemente"
  
        subtitle={
          `${songs.length} canciones`
        }
  
        songs={
          songs
        }
  
        emptyText=
          "Aún no hay historial de reproducción."
  
      />
  
    );
  }