import {
  router,
} from 'expo-router';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useApp,
  usePlayerProgress,
} from '../context/AppContext';

import MiniPlayer
  from './MiniPlayer';

import PlayerModal
  from './PlayerModal';

import SleepTimerModal
  from './SleepTimerModal';


interface MiniPlayerConnectedProps {
  song:
    NonNullable<
      ReturnType<
        typeof useApp
      >['player']['currentSong']
    >;

  playing:
    boolean;

  onOpen:
    () => void;

  onPrevious:
    () => void;

  onPlayPause:
    () => void;

  onNext:
    () => void;
}


function MiniPlayerConnected({
  song,
  playing,
  onOpen,
  onPrevious,
  onPlayPause,
  onNext,
}: MiniPlayerConnectedProps) {
  const {
    currentTime,
    duration,
  } =
    usePlayerProgress();

  return (
    <MiniPlayer
      song={
        song
      }

      playing={
        playing
      }

      currentTime={
        currentTime
      }

      duration={
        duration
      }

      onOpen={
        onOpen
      }

      onPrevious={
        onPrevious
      }

      onPlayPause={
        onPlayPause
      }

      onNext={
        onNext
      }
    />
  );
}


export default function GlobalPlayer() {
  const {
    player,
    favorites,
    sleepTimer,
  } =
    useApp();

  const [
    playerOpen,
    setPlayerOpen,
  ] =
    useState(
      false
    );

  const [
    sleepOpen,
    setSleepOpen,
  ] =
    useState(
      false
    );

  const song =
    player.currentSong;


  /*
   * Si por cualquier motivo ya no existe una canción activa,
   * cerramos los modales para no dejar estados visuales viejos.
   */
  useEffect(
    () => {
      if (
        song
      ) {
        return;
      }

      setPlayerOpen(
        false
      );

      setSleepOpen(
        false
      );
    },
    [
      song,
    ]
  );


  const openPlayer =
    useCallback(
      () => {
        if (
          !player.currentSong
        ) {
          return;
        }

        setPlayerOpen(
          true
        );
      },
      [
        player.currentSong,
      ]
    );


  const closePlayer =
    useCallback(
      () => {
        setPlayerOpen(
          false
        );
      },
      []
    );


  const openQueue =
    useCallback(
      () => {
        setSleepOpen(
          false
        );

        setPlayerOpen(
          false
        );

        router.push(
          '/queue'
        );
      },
      []
    );


  const openSleepTimer =
    useCallback(
      () => {
        setSleepOpen(
          true
        );
      },
      []
    );


  const closeSleepTimer =
    useCallback(
      () => {
        setSleepOpen(
          false
        );
      },
      []
    );


  const toggleFavorite =
    useCallback(
      () => {
        if (
          !song
        ) {
          return;
        }

        favorites
          .toggleFavorite(
            song.id
          );
      },
      [
        song,
        favorites.toggleFavorite,
      ]
    );


  if (
    !song
  ) {
    return null;
  }


  const favorite =
    favorites
      .isFavorite(
        song.id
      );


  return (
    <>
      {!playerOpen ? (
        <MiniPlayerConnected
          song={
            song
          }

          playing={
            player.isPlaying
          }

          onOpen={
            openPlayer
          }

          onPrevious={
            player.previous
          }

          onPlayPause={
            player
              .togglePlayPause
          }

          onNext={
            player.next
          }
        />
      ) : null}


      <PlayerModal
        visible={
          playerOpen
        }

        song={
          song
        }

        playing={
          player.isPlaying
        }

        shuffle={
          player.shuffle
        }

        repeatMode={
          player.repeatMode
        }

        favorite={
          favorite
        }

        onClose={
          closePlayer
        }

        onPrevious={
          player.previous
        }

        onPlayPause={
          player
            .togglePlayPause
        }

        onNext={
          player.next
        }

        onShuffle={
          player
            .toggleShuffle
        }

        onRepeat={
          player
            .cycleRepeatMode
        }

        onFavorite={
          toggleFavorite
        }

        onSeek={
          player.seekTo
        }

        onQueue={
          openQueue
        }

        onSleepTimer={
          openSleepTimer
        }

      />


      <SleepTimerModal
        visible={
          sleepOpen
        }

        endsAt={
          sleepTimer.endsAt
        }

        onClose={
          closeSleepTimer
        }

        onStart={
          sleepTimer.start
        }

        onCancel={
          sleepTimer.cancel
        }
      />
    </>
  );
}
