import {
    useEffect,
    useMemo,
    useRef,
    useState,
  } from 'react';
  
  import {
    Animated,
    StyleSheet,
    View,
  } from 'react-native';
  
  import {
    getArtworkTheme,
  } from '../utils/artworkTheme';
  
  
  interface Props {
    artwork?: string | null;
  
    seed?: string | null;
  }
  
  
  export default function HomeBackground({
    artwork,
    seed,
  }: Props) {
    const artworkOpacity =
      useRef(
        new Animated.Value(0)
      ).current;
  
  
    const [
      imageLoaded,
      setImageLoaded,
    ] =
      useState(false);
  
  
    const [
      imageFailed,
      setImageFailed,
    ] =
      useState(false);
  
  
    const normalizedArtwork =
      typeof artwork === 'string'
        ? artwork.trim()
        : '';
  
  
    const hasArtwork =
      normalizedArtwork.length > 0;
  
  
    const theme =
      useMemo(
        () =>
          getArtworkTheme(seed),
  
        [seed]
      );
  
  
    useEffect(
      () => {
        artworkOpacity.setValue(0);
  
        setImageLoaded(false);
  
        setImageFailed(false);
      },
  
      [
        normalizedArtwork,
        artworkOpacity,
      ]
    );
  
  
    useEffect(
      () => {
        if (!imageLoaded) {
          return;
        }
  
  
        artworkOpacity.setValue(0);
  
  
        Animated.timing(
          artworkOpacity,
          {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }
        ).start();
      },
  
      [
        imageLoaded,
        artworkOpacity,
      ]
    );
  
  
    return (
      <View
        pointerEvents="none"
        style={styles.container}
      >
        {/* ===============================================
            FONDO DE LA VARIANTE
  
            Si la canción no tiene portada, estos colores
            serán el ambiente principal.
        =============================================== */}
  
        <View
          style={[
            styles.base,
  
            {
              backgroundColor:
                seed
                  ? theme.background
                  : '#090811',
            },
          ]}
        />
  
  
        {/* ===============================================
            GLOW PRINCIPAL
        =============================================== */}
  
        <View
          style={[
            styles.glowOne,
  
            {
              backgroundColor:
                seed
                  ? theme.glow1
                  : '#8B5CF6',
            },
          ]}
        />
  
  
        {/* ===============================================
            GLOW SECUNDARIO
        =============================================== */}
  
        <View
          style={[
            styles.glowTwo,
  
            {
              backgroundColor:
                seed
                  ? theme.glow2
                  : '#3B82F6',
            },
          ]}
        />
  
  
        {/* ===============================================
            TERCER GLOW SUAVE
        =============================================== */}
  
        <View
          style={[
            styles.glowThree,
  
            {
              backgroundColor:
                seed
                  ? theme.glow1
                  : '#EC4899',
            },
          ]}
        />
  
  
        {/* ===============================================
            PORTADA REAL
  
            Solo queda visible si realmente carga.
        =============================================== */}
  
        {hasArtwork &&
        !imageFailed ? (
          <Animated.Image
            key={normalizedArtwork}
  
            source={{
              uri:
                normalizedArtwork,
            }}
  
            resizeMode="cover"
  
            blurRadius={75}
  
            onLoad={() => {
              setImageLoaded(true);
            }}
  
            onError={() => {
              setImageLoaded(false);
  
              setImageFailed(true);
            }}
  
            style={[
              styles.artworkBackground,
  
              {
                opacity:
                  artworkOpacity,
              },
            ]}
          />
        ) : null}
  
  
        {/* ===============================================
            OSCURECIMIENTO
  
            Con portada real oscurecemos un poco más.
            Con color generado dejamos que se vea más.
        =============================================== */}
  
        <View
          style={[
            styles.overlay,
  
            imageLoaded
              ? styles.overlayWithArtwork
              : styles.overlayGenerated,
          ]}
        />
      </View>
    );
  }
  
  
  const styles =
    StyleSheet.create({
      container: {
        position: 'absolute',
  
        top: 0,
  
        left: 0,
  
        right: 0,
  
        bottom: 0,
  
        overflow: 'hidden',
      },
  
  
      base: {
        position: 'absolute',
  
        top: 0,
  
        left: 0,
  
        right: 0,
  
        bottom: 0,
      },
  
  
      glowOne: {
        position: 'absolute',
  
        width: 560,
  
        height: 560,
  
        borderRadius: 280,
  
        top: -270,
  
        right: -240,
  
        opacity: 0.33,
      },
  
  
      glowTwo: {
        position: 'absolute',
  
        width: 520,
  
        height: 520,
  
        borderRadius: 260,
  
        top: 240,
  
        left: -330,
  
        opacity: 0.24,
      },
  
  
      glowThree: {
        position: 'absolute',
  
        width: 430,
  
        height: 430,
  
        borderRadius: 215,
  
        bottom: -250,
  
        right: -210,
  
        opacity: 0.16,
      },
  
  
      artworkBackground: {
        position: 'absolute',
  
        top: -120,
  
        left: -120,
  
        right: -120,
  
        bottom: -120,
  
        transform: [
          {
            scale: 1.18,
          },
        ],
      },
  
  
      overlay: {
        position: 'absolute',
  
        top: 0,
  
        left: 0,
  
        right: 0,
  
        bottom: 0,
      },
  
  
      overlayGenerated: {
        backgroundColor:
          'rgba(7,7,12,0.42)',
      },
  
  
      overlayWithArtwork: {
        backgroundColor:
          'rgba(7,7,12,0.60)',
      },
    });