import AsyncStorage
  from '@react-native-async-storage/async-storage';


import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';


const KEY =
  '@musicplayer/favorites';


export function useFavorites() {

  const [
    favorites,
    setFavorites,
  ] =
    useState<
      string[]
    >([]);


  const loaded =
    useRef(
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


            if (
              Array.isArray(
                parsed
              )
            ) {

              setFavorites(
                parsed
              );

            }

          }

        } catch (
          error
        ) {

          console.log(
            'Error cargando favoritos:',
            error
          );

        } finally {

          loaded.current =
            true;

        }

      }
    )();

  }, []);


  useEffect(() => {

    if (
      !loaded.current
    ) {
      return;
    }


    AsyncStorage
      .setItem(
        KEY,
        JSON.stringify(
          favorites
        )
      )
      .catch(
        console.log
      );

  }, [
    favorites,
  ]);


  const favoriteSet =
    useMemo(
      () =>
        new Set(
          favorites
        ),
      [
        favorites,
      ]
    );


  const isFavorite =
    useCallback(
      (
        songId:
          string
      ) =>

        favoriteSet.has(
          songId
        ),

      [
        favoriteSet,
      ]
    );


  const toggleFavorite =
    useCallback(
      (
        songId:
          string
      ) => {

        setFavorites(
          current =>

            current.includes(
              songId
            )

              ? current.filter(
                  id =>
                    id !==
                    songId
                )

              : [
                  ...current,
                  songId,
                ]
        );

      },
      []
    );


  return {

    favorites,

    isFavorite,

    toggleFavorite,

  };
}