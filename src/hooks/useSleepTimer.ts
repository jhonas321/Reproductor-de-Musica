import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';


const MAX_SECONDS =
  24 *
  60 *
  60;


export function useSleepTimer(
  pause:
    () => void
) {
  const timerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(
      null
    );


  const [
    endsAt,
    setEndsAt,
  ] =
    useState<
      number | null
    >(
      null
    );


  const cancel =
    useCallback(
      () => {
        if (
          timerRef.current
        ) {
          clearTimeout(
            timerRef.current
          );
        }

        timerRef.current =
          null;

        setEndsAt(
          null
        );
      },
      []
    );


  /*
   * start() ahora recibe SEGUNDOS TOTALES.
   *
   * Ejemplos:
   * 30 segundos  -> start(30)
   * 5 minutos    -> start(300)
   * 1h 20m 10s   -> start(4810)
   */
  const start =
    useCallback(
      (
        totalSeconds:
          number
      ) => {
        const normalizedSeconds =
          Math.min(
            MAX_SECONDS,
            Math.max(
              1,
              Math.floor(
                Number.isFinite(
                  totalSeconds
                )
                  ? totalSeconds
                  : 1
              )
            )
          );


        cancel();


        const ms =
          normalizedSeconds *
          1000;


        const target =
          Date.now() +
          ms;


        setEndsAt(
          target
        );


        timerRef.current =
          setTimeout(
            () => {
              pause();

              setEndsAt(
                null
              );

              timerRef.current =
                null;
            },
            ms
          );
      },
      [
        pause,
        cancel,
      ]
    );


  useEffect(
    () =>
      cancel,
    [
      cancel,
    ]
  );


  return {
    endsAt,
    start,
    cancel,
  };
}
