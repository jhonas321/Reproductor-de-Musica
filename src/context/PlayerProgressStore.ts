import {
    useSyncExternalStore,
  } from 'react';
  
  
  export interface PlayerProgressSnapshot {
    currentTime:
      number;
  
    duration:
      number;
  }
  
  
  let snapshot:
    PlayerProgressSnapshot = {
      currentTime:
        0,
  
      duration:
        0,
    };
  
  
  const listeners =
    new Set<
      () => void
    >();
  
  
  function subscribe(
    listener:
      () => void
  ) {
    listeners.add(
      listener
    );
  
  
    return () => {
      listeners.delete(
        listener
      );
    };
  }
  
  
  function getSnapshot() {
    return snapshot;
  }
  
  
  export function publishPlayerProgress(
    currentTime:
      number,
  
    duration:
      number
  ) {
    const nextCurrentTime =
      Number.isFinite(
        currentTime
      )
        ? Math.max(
            0,
            currentTime
          )
        : 0;
  
  
    const nextDuration =
      Number.isFinite(
        duration
      )
        ? Math.max(
            0,
            duration
          )
        : 0;
  
  
    if (
      snapshot.currentTime ===
        nextCurrentTime &&
      snapshot.duration ===
        nextDuration
    ) {
      return;
    }
  
  
    snapshot = {
      currentTime:
        nextCurrentTime,
  
      duration:
        nextDuration,
    };
  
  
    listeners.forEach(
      listener => {
        listener();
      }
    );
  }
  
  
  export function usePlayerProgressStore() {
    return useSyncExternalStore(
      subscribe,
      getSnapshot,
      getSnapshot
    );
  }
  