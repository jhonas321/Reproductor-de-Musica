import AsyncStorage
  from '@react-native-async-storage/async-storage';


import {
  useCallback,
  useEffect,
  useState,
} from 'react';


const KEY =
  '@musicplayer/listening-stats';


interface Stats {

  recentIds:
    string[];

  playCounts:
    Record<
      string,
      number
    >;

}


const INITIAL:
  Stats = {

  recentIds:
    [],

  playCounts:
    {},

};


export function useListeningStats() {

  const [
    stats,
    setStats,
  ] =
    useState<Stats>(
      INITIAL
    );


  const [
    loaded,
    setLoaded,
  ] =
    useState(
      false
    );


  useEffect(() => {

    (
      async () => {

        try {

          const raw =
            await AsyncStorage
              .getItem(
                KEY
              );


          if (raw) {

            const parsed =
              JSON.parse(
                raw
              );


            setStats({

              recentIds:
                Array.isArray(
                  parsed.recentIds
                )
                  ? parsed.recentIds
                  : [],

              playCounts:

                parsed.playCounts &&
                typeof parsed.playCounts ===
                  'object'

                  ? parsed.playCounts

                  : {},

            });

          }

        } catch (
          error
        ) {

          console.log(
            'Error cargando estadísticas:',
            error
          );

        } finally {

          setLoaded(
            true
          );

        }

      }
    )();

  }, []);


  useEffect(() => {

    if (!loaded) {
      return;
    }


    AsyncStorage
      .setItem(
        KEY,
        JSON.stringify(
          stats
        )
      )
      .catch(
        console.log
      );

  }, [
    stats,
    loaded,
  ]);


  const registerPlay =
    useCallback(
      (
        songId:
          string
      ) => {

        setStats(
          current => ({

            recentIds: [

              songId,

              ...current
                .recentIds
                .filter(
                  id =>
                    id !==
                    songId
                ),

            ].slice(
              0,
              50
            ),


            playCounts: {

              ...current
                .playCounts,

              [songId]:
                (
                  current
                    .playCounts[
                    songId
                  ] ??
                  0
                ) + 1,

            },

          })
        );

      },
      []
    );


  const clearHistory =
    useCallback(
      () => {

        setStats(
          current => ({

            ...current,

            recentIds:
              [],

          })
        );

      },
      []
    );


  return {

    recentIds:
      stats.recentIds,

    playCounts:
      stats.playCounts,

    registerPlay,

    clearHistory,

  };
}