import {
    requireNativeModule,
  } from 'expo-modules-core';
  
  
  export interface HmusicEqualizerBand {
    index: number;
    centerFrequencyHz: number;
    levelMb: number;
  }
  
  
  export interface HmusicEqualizerInfo {
    supported: boolean;
    enabled: boolean;
  
    audioSessionId: number;
  
    minLevelMb: number;
    maxLevelMb: number;
  
    bands: HmusicEqualizerBand[];
  }
  
  
  interface HmusicEqualizerNativeModule {
  
    getEqualizerInfoAsync:
      () =>
        Promise<HmusicEqualizerInfo>;
  
  
    setEqualizerEnabledAsync:
      (
        enabled: boolean
      ) =>
        Promise<HmusicEqualizerInfo>;
  
  
    setEqualizerBandLevelAsync:
      (
        bandIndex: number,
        levelMb: number
      ) =>
        Promise<HmusicEqualizerInfo>;
  
  
    setEqualizerLevelsAsync:
      (
        levels: number[]
      ) =>
        Promise<HmusicEqualizerInfo>;
  
  
    resetEqualizerAsync:
      () =>
        Promise<HmusicEqualizerInfo>;
  
  
    setAudioSessionIdAsync:
      (
        audioSessionId: number
      ) =>
        Promise<HmusicEqualizerInfo>;
  
  
    releaseEqualizerAsync:
      () =>
        Promise<boolean>;
  }
  
  
  export default requireNativeModule<
    HmusicEqualizerNativeModule
  >(
    'HmusicEqualizer'
  );