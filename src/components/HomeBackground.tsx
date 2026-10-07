import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Image,
  StyleSheet,
  View,
} from 'react-native';

import {
  getArtworkTheme,
} from '../utils/artworkTheme';


interface Props {
  artwork?:
    string | null;

  seed?:
    string | null;
}


export default function HomeBackground({
  artwork,

  seed,
}: Props) {
  /*
   * =========================================================
   * URI ACTUAL
   * =========================================================
   */

  const normalizedArtwork =
    typeof artwork ===
      'string'
      ? artwork.trim()
      : '';


  /*
   * =========================================================
   * CARÁTULA QUE YA ESTÁ VISIBLE
   * =========================================================
   *
   * IMPORTANTE:
   *
   * No eliminamos esta carátula inmediatamente cuando
   * cambia la canción.
   *
   * Se conserva hasta que la nueva portada termine
   * de cargar.
   */

  const [
    visibleArtworkUri,
    setVisibleArtworkUri,
  ] =
    useState<
      string | null
    >(
      normalizedArtwork ||
        null
    );


  /*
   * =========================================================
   * NUEVA CARÁTULA QUE ESTÁ CARGANDO
   * =========================================================
   */

  const [
    pendingArtworkUri,
    setPendingArtworkUri,
  ] =
    useState<
      string | null
    >(
      null
    );


  /*
   * =========================================================
   * PORTADA QUE FALLÓ
   * =========================================================
   */

  const [
    failedArtworkUri,
    setFailedArtworkUri,
  ] =
    useState<
      string | null
    >(
      null
    );


  /*
   * =========================================================
   * ANIMACIÓN ENTRE PORTADAS
   * =========================================================
   */

  const fade =
    useRef(
      new Animated.Value(
        0
      )
    ).current;


  /*
   * Siempre conserva la URI más reciente.
   *
   * Sirve para ignorar eventos onLoad de una portada vieja
   * si el usuario cambia muy rápido de canción.
   */

  const latestArtworkRef =
    useRef(
      normalizedArtwork
    );


  latestArtworkRef.current =
    normalizedArtwork;


  /*
   * =========================================================
   * TEMA GENERADO
   * =========================================================
   */

  const theme =
    useMemo(
      () =>
        getArtworkTheme(
          seed
        ),
      [
        seed,
      ]
    );


  /*
   * =========================================================
   * LIMPIAR ERROR ANTERIOR
   * =========================================================
   *
   * Si una portada falló y después cambiamos de canción,
   * ese error NO debe afectar a la portada siguiente.
   */

  useEffect(
    () => {
      if (
        failedArtworkUri &&
        failedArtworkUri !==
          normalizedArtwork
      ) {
        setFailedArtworkUri(
          null
        );
      }
    },
    [
      normalizedArtwork,
      failedArtworkUri,
    ]
  );


  /*
   * =========================================================
   * DETECTAR CAMBIO DE CARÁTULA
   * =========================================================
   */

  useEffect(
    () => {
      /*
       * Canción sin portada.
       *
       * Aquí sí dejamos de mostrar la portada anterior
       * y usamos el fondo generado.
       */

      if (
        !normalizedArtwork
      ) {
        fade.stopAnimation();

        fade.setValue(
          0
        );


        setPendingArtworkUri(
          null
        );


        setVisibleArtworkUri(
          null
        );


        setFailedArtworkUri(
          null
        );


        return;
      }


      /*
       * Android ya intentó cargar esta portada
       * y realmente falló.
       */

      if (
        failedArtworkUri ===
          normalizedArtwork
      ) {
        setPendingArtworkUri(
          null
        );


        setVisibleArtworkUri(
          null
        );


        return;
      }


      /*
       * Esta portada ya está siendo mostrada.
       */

      if (
        visibleArtworkUri ===
          normalizedArtwork
      ) {
        return;
      }


      /*
       * Esta portada ya está cargando.
       */

      if (
        pendingArtworkUri ===
          normalizedArtwork
      ) {
        return;
      }


      /*
       * ===============================================
       * IMPORTANTE
       * ===============================================
       *
       * NO hacemos:
       *
       * setVisibleArtworkUri(null)
       *
       * porque eso produciría:
       *
       * carátula 1
       * → fondo generado
       * → carátula 2
       *
       * En su lugar conservamos la carátula anterior
       * mientras la nueva carga.
       */

      fade.stopAnimation();


      fade.setValue(
        0
      );


      setPendingArtworkUri(
        normalizedArtwork
      );
    },
    [
      normalizedArtwork,

      visibleArtworkUri,

      pendingArtworkUri,

      failedArtworkUri,

      fade,
    ]
  );


  /*
   * =========================================================
   * NUEVA CARÁTULA TERMINÓ DE CARGAR
   * =========================================================
   */

  const handlePendingLoad =
    () => {
      const uri =
        pendingArtworkUri;


      if (
        !uri
      ) {
        return;
      }


      /*
       * Si mientras cargaba esta portada el usuario
       * cambió otra vez de canción, la ignoramos.
       */

      if (
        latestArtworkRef.current !==
          uri
      ) {
        return;
      }


      /*
       * Hacemos un crossfade pequeño.
       *
       * La portada anterior sigue debajo.
       */

      Animated.timing(
        fade,
        {
          toValue:
            1,
      
          duration:
            140,
      
          useNativeDriver:
            true,
        }
      ).start(
        ({
          finished,
        }) => {
          if (
            !finished
          ) {
            return;
          }
      
      
          if (
            latestArtworkRef.current !==
              uri
          ) {
            return;
          }
      
      
          setVisibleArtworkUri(
            uri
          );
      
      
          setPendingArtworkUri(
            current =>
              current ===
                uri
                ? null
                : current
          );
      
      
          fade.setValue(
            0
          );
        }
      );
    };


  /*
   * =========================================================
   * NUEVA CARÁTULA FALLÓ
   * =========================================================
   */

  const handlePendingError =
    () => {
      const uri =
        pendingArtworkUri;


      if (
        !uri
      ) {
        return;
      }


      setPendingArtworkUri(
        current =>
          current ===
            uri
            ? null
            : current
      );


      /*
       * Solo afectamos el fondo si esta sigue siendo
       * la canción actual.
       */

      if (
        latestArtworkRef.current ===
          uri
      ) {
        setFailedArtworkUri(
          uri
        );


        setVisibleArtworkUri(
          null
        );
      }


      fade.setValue(
        0
      );
    };


  /*
   * ¿Tenemos actualmente una portada real visible?
   */

  const hasVisibleArtwork =
    Boolean(
      visibleArtworkUri
    );


  return (
    <View
      pointerEvents="none"

      style={
        styles.container
      }
    >
      {/* =====================================================
          FONDO GENERADO
      =====================================================

          Siempre permanece debajo.

          Solo será visible cuando:
          - la canción no tenga portada
          - o la portada realmente falle
      ===================================================== */}

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


      {/* =====================================================
          CARÁTULA ACTUAL
      =====================================================

          Esta NO desaparece mientras carga la siguiente.
      ===================================================== */}

      {visibleArtworkUri ? (
        <Image
          key={
            `visible-${visibleArtworkUri}`
          }

          source={{
            uri:
              visibleArtworkUri,
          }}

          resizeMode=
            "cover"

          blurRadius={
            55
          }

          fadeDuration={
            0
          }

          style={
            styles.artworkBackground
          }
        />
      ) : null}


      {/* =====================================================
          NUEVA CARÁTULA
      =====================================================

          Se carga encima de la anterior.

          Empieza invisible.
          Cuando onLoad confirma que ya existe en memoria,
          hacemos la transición.
      ===================================================== */}

      {pendingArtworkUri ? (
        <Animated.Image
          key={
            `pending-${pendingArtworkUri}`
          }

          source={{
            uri:
              pendingArtworkUri,
          }}

          resizeMode=
            "cover"

          blurRadius={
            55
          }

          fadeDuration={
            0
          }

          onLoad={
            handlePendingLoad
          }

          onError={
            handlePendingError
          }

          style={[
            styles.artworkBackground,

            {
              opacity:
                fade,
            },
          ]}
        />
      ) : null}


      {/* =====================================================
          OSCURECIMIENTO
      ===================================================== */}

      <View
        style={[
          styles.overlay,

          hasVisibleArtwork
            ? styles
                .overlayWithArtwork
            : styles
                .overlayGenerated,
        ]}
      />
    </View>
  );
}


const styles =
  StyleSheet.create({
    container: {
      position:
        'absolute',

      top:
        0,

      left:
        0,

      right:
        0,

      bottom:
        0,

      overflow:
        'hidden',
    },


    /*
     * =====================================================
     * BASE
     * =====================================================
     */

    base: {
      position:
        'absolute',

      top:
        0,

      left:
        0,

      right:
        0,

      bottom:
        0,
    },


    /*
     * =====================================================
     * COLORES GENERADOS
     * =====================================================
     */

    glowOne: {
      position:
        'absolute',

      width:
        560,

      height:
        560,

      borderRadius:
        280,

      top:
        -270,

      right:
        -240,

      opacity:
        0.33,
    },


    glowTwo: {
      position:
        'absolute',

      width:
        520,

      height:
        520,

      borderRadius:
        260,

      top:
        240,

      left:
        -330,

      opacity:
        0.24,
    },


    glowThree: {
      position:
        'absolute',

      width:
        430,

      height:
        430,

      borderRadius:
        215,

      bottom:
        -250,

      right:
        -210,

      opacity:
        0.16,
    },


    /*
     * =====================================================
     * PORTADAS
     * =====================================================
     */

    artworkBackground: {
      position:
        'absolute',

      top:
        -110,

      left:
        -110,

      right:
        -110,

      bottom:
        -110,

      transform: [
        {
          scale:
            1.16,
        },
      ],
    },


    /*
     * =====================================================
     * OSCURECIMIENTO
     * =====================================================
     */

    overlay: {
      position:
        'absolute',

      top:
        0,

      left:
        0,

      right:
        0,

      bottom:
        0,
    },


    overlayGenerated: {
      backgroundColor:
        'rgba(7,7,12,0.38)',
    },


    overlayWithArtwork: {
      backgroundColor:
        'rgba(7,7,12,0.50)',
    },
  });