import {
    useCallback,
    useRef,
  } from 'react';
  
  
  import {
    useFocusEffect,
  } from 'expo-router';
  
  
  export function useNavigationLock() {
  
    const locked =
      useRef(
        false
      );
  
  
    useFocusEffect(
      useCallback(
        () => {
  
          locked.current =
            false;
  
  
          return () => {};
  
        },
        []
      )
    );
  
  
    return useCallback(
      (
        action:
          () => void
      ) => {
  
        if (
          locked.current
        ) {
          return;
        }
  
  
        locked.current =
          true;
  
  
        try {
  
          action();
  
        } catch (
          error
        ) {
  
          locked.current =
            false;
  
  
          throw error;
  
        }
  
      },
      []
    );
  }