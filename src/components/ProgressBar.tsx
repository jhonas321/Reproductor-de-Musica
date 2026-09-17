import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Slider from '@react-native-community/slider';

import {
  COLORS,
} from '../constants/colors';

import {
  formatDuration,
} from '../utils/music';


interface Props {
  currentTime:
    number;

  duration:
    number;

  onSeek:
    (
      seconds:
        number
    ) => void;

  onScrubbingChange?:
    (
      active:
        boolean
    ) => void;
}


function clamp(
  value:
    number,

  min:
    number,

  max:
    number
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}


export default function ProgressBar({
  currentTime,
  duration,
  onSeek,
  onScrubbingChange,
}: Props) {
  const safeDuration =
    Number.isFinite(
      duration
    ) &&
    duration >
      0
      ? duration
      : 0;


  const safeCurrentTime =
    safeDuration >
      0
      ? clamp(
          Number.isFinite(
            currentTime
          )
            ? currentTime
            : 0,
          0,
          safeDuration
        )
      : 0;


  const [
    sliding,
    setSliding,
  ] =
    useState(
      false
    );


  const [
    previewTime,
    setPreviewTime,
  ] =
    useState(
      safeCurrentTime
    );


  /*
   * Evita el salto visual:
   * destino -> tiempo viejo -> destino
   * mientras expo-audio confirma el seek.
   */
  const [
    pendingSeek,
    setPendingSeek,
  ] =
    useState<
      number | null
    >(
      null
    );


  const pendingTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(
      null
    );


  useEffect(
    () => {
      if (
        sliding
      ) {
        return;
      }


      if (
        pendingSeek !==
        null
      ) {
        if (
          Math.abs(
            safeCurrentTime -
            pendingSeek
          ) <=
          0.8
        ) {
          setPendingSeek(
            null
          );

          setPreviewTime(
            safeCurrentTime
          );
        }

        return;
      }


      setPreviewTime(
        safeCurrentTime
      );
    },
    [
      safeCurrentTime,
      sliding,
      pendingSeek,
    ]
  );


  useEffect(
    () => {
      return () => {
        if (
          pendingTimerRef.current
        ) {
          clearTimeout(
            pendingTimerRef.current
          );
        }
      };
    },
    []
  );


  const displayedTime =
    sliding
      ? previewTime
      : pendingSeek !== null
        ? pendingSeek
        : safeCurrentTime;


  const handleSlidingStart =
    () => {
      if (
        pendingTimerRef.current
      ) {
        clearTimeout(
          pendingTimerRef.current
        );

        pendingTimerRef.current =
          null;
      }

      setPendingSeek(
        null
      );

      setPreviewTime(
        safeCurrentTime
      );

      setSliding(
        true
      );

      onScrubbingChange?.(
        true
      );
    };


  const handleValueChange =
    (
      value:
        number
    ) => {
      /*
       * Esto solo actualiza el texto.
       * El movimiento físico del thumb y la pista
       * lo realiza el componente nativo.
       */
      setPreviewTime(
        value
      );
    };


  const handleSlidingComplete =
    (
      value:
        number
    ) => {
      const target =
        clamp(
          value,
          0,
          safeDuration
        );


      setPreviewTime(
        target
      );

      setSliding(
        false
      );

      setPendingSeek(
        target
      );


      onSeek(
        target
      );


      onScrubbingChange?.(
        false
      );


      /*
       * Fallback por si el estado de expo-audio tarda
       * demasiado en reflejar la nueva posición.
       */
      pendingTimerRef.current =
        setTimeout(
          () => {
            setPendingSeek(
              null
            );

            pendingTimerRef.current =
              null;
          },
          2000
        );
    };


  return (
    <View
      style={
        styles.container
      }
    >
      <Slider
        style={
          styles.slider
        }

        minimumValue={
          0
        }

        maximumValue={
          safeDuration >
            0
            ? safeDuration
            : 1
        }

        value={
          displayedTime
        }

        step={
          0
        }

        disabled={
          safeDuration <=
          0
        }

        minimumTrackTintColor={
          COLORS.purpleLight
        }

        maximumTrackTintColor=
          "rgba(255,255,255,0.20)"

        thumbTintColor={
          COLORS.white
        }

        onSlidingStart={
          handleSlidingStart
        }

        onValueChange={
          handleValueChange
        }

        onSlidingComplete={
          handleSlidingComplete
        }

        accessibilityLabel=
          "Progreso de reproducción"
      />


      <View
        pointerEvents=
          "none"

        style={
          styles.timeRow
        }
      >
        <Text
          style={
            styles.timeText
          }
        >
          {formatDuration(
            displayedTime
          )}
        </Text>

        <Text
          style={
            styles.timeText
          }
        >
          {formatDuration(
            safeDuration
          )}
        </Text>
      </View>
    </View>
  );
}


const styles =
  StyleSheet.create({
    container: {
      width:
        '100%',
    },


    slider: {
      width:
        '108%',

      alignSelf:
        'center',

      height:
        48,

      marginHorizontal:
        0,

      paddingHorizontal:
        0,

    },


    timeRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginTop:
        -6,
    },


    timeText: {
      color:
        'rgba(255,255,255,0.66)',

      fontSize:
        10,

      fontWeight:
        '500',
    },
  });
