import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  memo,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getArtworkTheme,
} from '../utils/artworkTheme';


interface Props {
  uri?:
    string | null;

  size:
    number;

  radius?:
    number;

  iconSize?:
    number;

  seed?:
    string;
}


/* =========================================================
   ARTWORK

   REGLA IMPORTANTE:

   - Si existe una URI de portada, mostramos directamente
     la imagen real.

   - Si esa URI falla, recién mostramos la portada Hmusic.

   - Si no existe URI, mostramos Hmusic inmediatamente.

   Guardamos la URI que falló, no un booleano global.
   De esta manera el error de la canción anterior nunca se
   arrastra a la siguiente canción.
========================================================= */

function Artwork({
  uri,
  size,
  radius = 14,
  iconSize = 28,
  seed,
}: Props) {
  const [
    failedUri,
    setFailedUri,
  ] =
    useState<
      string | null
    >(
      null
    );


  const normalizedUri =
    typeof uri ===
      'string'

      ? uri.trim()

      : '';


  const imageFailed =
    normalizedUri.length >
      0
    &&
    failedUri ===
      normalizedUri;


  const hasRealArtwork =
    normalizedUri.length >
      0
    &&
    !imageFailed;


  /* =======================================================
     TRANSICIONES SUAVES

     - Las portadas reales aparecen con fade.
     - Las portadas Hmusic aparecen con fade + escala suave.
     - Nunca mostramos Hmusic mientras una portada real
       simplemente está cargando.
  ======================================================= */

  const realOpacity =
    useRef(
      new Animated.Value(0)
    ).current;


  const fallbackOpacity =
    useRef(
      new Animated.Value(0)
    ).current;


  const fallbackScale =
    useRef(
      new Animated.Value(0.985)
    ).current;


  useEffect(
    () => {
      realOpacity.stopAnimation();

      fallbackOpacity.stopAnimation();

      fallbackScale.stopAnimation();


      realOpacity.setValue(
        0
      );


      if (
        hasRealArtwork
      ) {
        fallbackOpacity.setValue(
          0
        );

        fallbackScale.setValue(
          0.985
        );

        return;
      }


      fallbackOpacity.setValue(
        0
      );

      fallbackScale.setValue(
        0.985
      );


      Animated.parallel([
        Animated.timing(
          fallbackOpacity,
          {
            toValue:
              1,

            duration:
              120,

            useNativeDriver:
              true,
          }
        ),

        Animated.timing(
          fallbackScale,
          {
            toValue:
              1,

            duration:
              140,

            useNativeDriver:
              true,
          }
        ),
      ]).start();
    },

    [
      normalizedUri,
      imageFailed,
      seed,
      hasRealArtwork,
      realOpacity,
      fallbackOpacity,
      fallbackScale,
    ]
  );


  const handleRealArtworkLoad =
    () => {
      realOpacity.stopAnimation();

      realOpacity.setValue(
        0
      );


      Animated.timing(
        realOpacity,
        {
          toValue:
            1,

          duration:
            120,

          useNativeDriver:
            true,
        }
      ).start();
    };


  const variant =
    getArtworkTheme(
      seed
    );


  const bigGlowSize =
    size *
    0.90;


  const smallGlowSize =
    size *
    0.72;


  const discSize =
    Math.max(
      28,

      size *
        0.43
    );


  const showBrand =
    size >=
    105;


  const actualIconSize =
    Math.min(
      iconSize,

      discSize *
        0.52
    );


  /* =======================================================
     PORTADA REAL
  ======================================================= */

  if (
    hasRealArtwork
  ) {
    return (
      <View
        style={[
          styles.wrapper,

          {
            width:
              size,

            height:
              size,

            borderRadius:
              radius,
          },
        ]}
      >
        <Animated.Image
          key={
            normalizedUri
          }

          source={{
            uri:
              normalizedUri,
          }}

          resizeMode="cover"

          fadeDuration={0}

          onLoad={
            handleRealArtworkLoad
          }

          onError={() => {
            setFailedUri(
              normalizedUri
            );
          }}

          style={[
            styles.realArtwork,

            {
              width:
                size,

              height:
                size,

              borderRadius:
                radius,

              opacity:
                realOpacity,
            },
          ]}
        />
      </View>
    );
  }


  /* =======================================================
     PORTADA PREDETERMINADA HMUSIC

     Solo llegamos aquí cuando:
     - la canción no tiene URI de portada, o
     - su URI realmente falló al cargar.
  ======================================================= */

  return (
    <Animated.View
      style={[
        styles.wrapper,

        {
          width:
            size,

          height:
            size,

          borderRadius:
            radius,

          backgroundColor:
            variant.background,

          opacity:
            fallbackOpacity,

          transform: [
            {
              scale:
                fallbackScale,
            },
          ],
        },
      ]}
    >
      {/* ===============================================
          LUZ SUPERIOR
      =============================================== */}

      <View
        style={{
          position:
            'absolute',

          width:
            bigGlowSize,

          height:
            bigGlowSize,

          borderRadius:
            bigGlowSize /
            2,

          top:
            -bigGlowSize *
            0.36,

          right:
            -bigGlowSize *
            0.30,

          backgroundColor:
            variant.glow1,

          opacity:
            0.52,
        }}
      />


      {/* ===============================================
          LUZ INFERIOR
      =============================================== */}

      <View
        style={{
          position:
            'absolute',

          width:
            smallGlowSize,

          height:
            smallGlowSize,

          borderRadius:
            smallGlowSize /
            2,

          bottom:
            -smallGlowSize *
            0.34,

          left:
            -smallGlowSize *
            0.28,

          backgroundColor:
            variant.glow2,

          opacity:
            0.42,
        }}
      />


      {/* ===============================================
          CÍRCULO DECORATIVO
      =============================================== */}

      <View
        style={[
          styles.decorCircle,

          {
            width:
              size *
              0.70,

            height:
              size *
              0.70,

            borderRadius:
              size *
              0.35,

            right:
              -size *
              0.22,

            bottom:
              -size *
              0.19,
          },
        ]}
      />


      {/* ===============================================
          LÍNEA DECORATIVA
      =============================================== */}

      <View
        style={[
          styles.decorLine,

          {
            width:
              size *
              0.72,

            right:
              -size *
              0.15,

            top:
              size *
              0.23,
          },
        ]}
      />


      {/* ===============================================
          ICONO CENTRAL

          El icono musical queda exactamente al centro
          de la portada.
      =============================================== */}

      <View
        style={
          styles.centerContent
        }
      >
        <View
          style={[
            styles.disc,

            {
              width:
                discSize,

              height:
                discSize,

              borderRadius:
                discSize /
                2,
            },
          ]}
        >
          <View
            style={[
              styles.discRing,

              {
                width:
                  discSize *
                  0.72,

                height:
                  discSize *
                  0.72,

                borderRadius:
                  discSize *
                  0.36,
              },
            ]}
          />


          <MaterialCommunityIcons
            name="music-note"

            size={
              actualIconSize
            }

            color={
              variant.icon
            }
          />
        </View>
      </View>


      {/* ===============================================
          TEXTO HMUSIC

          Se mantiene abajo, como estaba antes.
      =============================================== */}

      {showBrand ? (
        <View
          style={
            styles.brandArea
          }
        >
          <Text
            style={
              styles.brand
            }
          >
            Hmusic
          </Text>


          <Text
            style={
              styles.brandSubtitle
            }
          >
            OFFLINE MUSIC
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}


export default memo(
  Artwork
);


/* =========================================================
   ESTILOS
========================================================= */

const styles =
  StyleSheet.create({
    wrapper: {
      position:
        'relative',

      overflow:
        'hidden',

      backgroundColor:
        '#121218',

      borderWidth:
        1,

      borderColor:
        'rgba(255,255,255,0.11)',
    },


    realArtwork: {
      position:
        'absolute',

      top:
        0,

      left:
        0,
    },


    decorCircle: {
      position:
        'absolute',

      borderWidth:
        1,

      borderColor:
        'rgba(255,255,255,0.14)',
    },


    decorLine: {
      position:
        'absolute',

      height:
        1,

      backgroundColor:
        'rgba(255,255,255,0.11)',

      transform: [
        {
          rotate:
            '-18deg',
        },
      ],
    },


    disc: {
      backgroundColor:
        'rgba(8,9,16,0.28)',

      justifyContent:
        'center',

      alignItems:
        'center',

      borderWidth:
        1,

      borderColor:
        'rgba(255,255,255,0.25)',
    },


    discRing: {
      position:
        'absolute',

      borderWidth:
        1,

      borderColor:
        'rgba(255,255,255,0.13)',
    },


    centerContent: {
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

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    brandArea: {
      position:
        'absolute',

      left:
        18,

      bottom:
        15,

      alignItems:
        'flex-start',
    },


    brand: {
      color:
        '#FFFFFF',

      fontSize:
        14,

      fontWeight:
        '800',

      letterSpacing:
        0.2,

      textAlign:
        'left',
    },


    brandSubtitle: {
      color:
        'rgba(255,255,255,0.58)',

      fontSize:
        7,

      fontWeight:
        '700',

      letterSpacing:
        1.2,

      marginTop:
        2,

      textAlign:
        'left',
    },
  });
