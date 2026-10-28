import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../constants/colors";

import { useApp, usePlayerProgress } from "../context/AppContext";

import { getArtworkTheme } from "../utils/artworkTheme";

import type { RepeatMode, Song } from "../types/Song";

import Artwork from "./Artwork";

import EqualizerModal from "./EqualizerModal";

import LyricsModal from "./LyricsModal";

import ProgressBar from "./ProgressBar";

interface Props {
  visible: boolean;

  song: Song;

  playing: boolean;

  shuffle: boolean;

  repeatMode: RepeatMode;

  favorite: boolean;

  onClose: () => void;

  onPrevious: () => void;

  onPlayPause: () => void;

  onNext: () => void;

  onShuffle: () => void;

  onRepeat: () => void;

  onFavorite: () => void;

  onSeek: (seconds: number) => void;

  onQueue: () => void;

  onSleepTimer: () => void;
}

interface FooterActionProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;

  label: string;

  active?: boolean;

  compact?: boolean;

  onPress: () => void;
}

function FooterAction({
  icon,

  label,

  active = false,

  compact = false,

  onPress,
}: FooterActionProps) {
  return (
    <TouchableOpacity
      style={[
        styles.footerAction,

        compact && styles.footerActionCompact,

        active && styles.footerActionActive,
      ]}
      activeOpacity={0.72}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.footerIcon, compact && styles.footerIconCompact]}>
        <MaterialCommunityIcons
          name={icon}
          size={compact ? 19 : 22}
          color={active ? COLORS.purpleLight : COLORS.white}
        />
      </View>

      <Text
        style={[
          styles.footerText,

          compact && styles.footerTextCompact,

          active && styles.footerTextActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* =========================================================







   TÍTULO CON MARQUEE















   - Siempre ocupa una sola línea.







   - Si cabe, permanece quieto.







   - Si es largo, se desplaza horizontalmente.







   - Nunca empuja artista, álbum, progreso ni botones.







========================================================= */

interface MarqueeTitleProps {
  text: string;

  fontSize: number;

  lineHeight: number;
}

function MarqueeTitle({ text, fontSize, lineHeight }: MarqueeTitleProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  const [viewportWidth, setViewportWidth] = useState(0);

  const [contentWidth, setContentWidth] = useState(0);

  const overflow = Math.max(0, contentWidth - viewportWidth);

  const shouldScroll = viewportWidth > 0 && overflow > 8;

  useEffect(() => {
    translateX.stopAnimation();

    translateX.setValue(0);

    if (!shouldScroll) {
      return;
    }

    const distance = overflow + 22;

    const forwardDuration = Math.max(3200, Math.round(distance * 34));

    const returnDuration = Math.max(900, Math.round(forwardDuration * 0.32));

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(900),

        Animated.timing(translateX, {
          toValue: -distance,

          duration: forwardDuration,

          easing: Easing.linear,

          useNativeDriver: true,
        }),

        Animated.delay(900),

        Animated.timing(translateX, {
          toValue: 0,

          duration: returnDuration,

          easing: Easing.out(Easing.quad),

          useNativeDriver: true,
        }),

        Animated.delay(700),
      ])
    );

    animation.start();

    return () => {
      animation.stop();

      translateX.stopAnimation();

      translateX.setValue(0);
    };
  }, [overflow, shouldScroll, text, translateX]);

  return (
    <View
      style={[
        styles.titleViewport,

        {
          height: lineHeight,
        },
      ]}
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);

        if (nextWidth > 0 && nextWidth !== viewportWidth) {
          setViewportWidth(nextWidth);
        }
      }}
    >
      {/* Medimos de forma invisible el ancho real del título */}

      <Text
        pointerEvents="none"
        style={[
          styles.title,

          styles.titleMeasure,

          {
            fontSize,

            lineHeight,
          },
        ]}
        numberOfLines={1}
        onTextLayout={(event) => {
          const measured = event.nativeEvent.lines?.[0]?.width ?? 0;

          const nextWidth = Math.ceil(measured);

          if (nextWidth > 0 && nextWidth !== contentWidth) {
            setContentWidth(nextWidth);
          }
        }}
      >
        {text}
      </Text>

      <Animated.Text
        style={[
          styles.title,

          styles.titleMoving,

          {
            fontSize,

            lineHeight,
          },

          shouldScroll
            ? {
                width: contentWidth + 2,

                transform: [
                  {
                    translateX,
                  },
                ],
              }
            : styles.titleStatic,
        ]}
        numberOfLines={1}
        ellipsizeMode={shouldScroll ? "clip" : "tail"}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

interface PlayerProgressConnectedProps {
  onSeek: (seconds: number) => void;
}

function PlayerProgressConnected({ onSeek }: PlayerProgressConnectedProps) {
  const { currentTime, duration } = usePlayerProgress();

  return (
    <ProgressBar
      currentTime={currentTime}
      duration={duration}
      onSeek={onSeek}
    />
  );
}

interface LyricsModalConnectedProps {
  visible: boolean;

  song: Song;

  onClose: () => void;
}

function LyricsModalConnected({
  visible,

  song,

  onClose,
}: LyricsModalConnectedProps) {
  const { currentTime } = usePlayerProgress();

  return (
    <LyricsModal
      visible={visible}
      song={song}
      currentTime={currentTime}
      onClose={onClose}
    />
  );
}

interface CarouselArtworkProps {
  song: Song;

  size: number;

  radius: number;

  iconSize: number;
}

/*



 * =========================================================



 * CARÁTULA DEL CARRUSEL SIN FADE



 * =========================================================



 *



 * Artwork.tsx puede aplicar transiciones cuando una imagen



 * se monta/carga. En el carrusel eso se nota como un flash



 * de LA MISMA portada cuando la portada vecina pasa a ser



 * la portada central.



 *



 * Aquí las portadas reales se dibujan directamente con Image:



 * - sin Animated.Image



 * - sin opacity 0 -> 1



 * - sin fade



 *



 * El componente Artwork normal queda como fallback si la



 * canción no tiene portada o la imagen realmente falla.



 */

const CarouselArtwork = memo(function CarouselArtwork({
  song,

  size,

  radius,

  iconSize,
}: CarouselArtworkProps) {
  const normalizedUri =
    typeof song.artwork === "string" ? song.artwork.trim() : "";

  const [failedUri, setFailedUri] = useState<string | null>(null);

  useEffect(() => {
    if (failedUri && failedUri !== normalizedUri) {
      setFailedUri(null);
    }
  }, [normalizedUri, failedUri]);

  const showRealArtwork =
    normalizedUri.length > 0 && failedUri !== normalizedUri;

  if (showRealArtwork) {
    return (
      <View
        style={{
          width: size,

          height: size,

          borderRadius: radius,

          overflow: "hidden",

          backgroundColor: "#121218",
        }}
      >
        <Image
          key={normalizedUri}
          source={{
            uri: normalizedUri,
          }}
          resizeMode="cover"
          fadeDuration={0}
          onError={() => setFailedUri(normalizedUri)}
          style={{
            width: size,

            height: size,
          }}
        />
      </View>
    );
  }

  return (
    <Artwork
      uri={song.artwork}
      seed={song.id}
      size={size}
      radius={radius}
      iconSize={iconSize}
    />
  );
});

function PlayerModal({
  visible,

  song,

  playing,

  shuffle,

  repeatMode,

  favorite,

  onClose,

  onPrevious,

  onPlayPause,

  onNext,

  onShuffle,

  onRepeat,

  onFavorite,

  onSeek,

  onQueue,

  onSleepTimer,
}: Props) {
  const { width, height } = useWindowDimensions();

  const { playlists, player } = useApp();

  const [playlistOpen, setPlaylistOpen] = useState(false);

  const [equalizerOpen, setEqualizerOpen] = useState(false);

  /*
   * =====================================================
   * PLAY / PAUSE VISUAL SIN PARPADEO AL CAMBIAR CANCIÓN
   * =====================================================
   *
   * RNTP puede informar `playing = false` durante unos instantes
   * mientras cambia o bufferiza una pista. Si usamos ese valor
   * directamente, el botón puede hacer PAUSE -> PLAY -> PAUSE.
   *
   * Cuando el usuario cambia de canción mientras está reproduciendo,
   * mantenemos visualmente PAUSE durante un margen corto. Si pulsa
   * manualmente play/pause, cancelamos ese margen inmediatamente.
   */
  const [keepPauseIcon, setKeepPauseIcon] = useState(false);

  const keepPauseIconTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const clearKeepPauseIconTimeout = useCallback(() => {
    if (keepPauseIconTimeoutRef.current) {
      clearTimeout(keepPauseIconTimeoutRef.current);
      keepPauseIconTimeoutRef.current = null;
    }
  }, []);

  const beginTrackChangeVisual = useCallback(() => {
    if (!playing) {
      return;
    }

    clearKeepPauseIconTimeout();
    setKeepPauseIcon(true);

    keepPauseIconTimeoutRef.current = setTimeout(() => {
      setKeepPauseIcon(false);
      keepPauseIconTimeoutRef.current = null;
    }, 1200);
  }, [playing, clearKeepPauseIconTimeout]);

  useEffect(() => {
    return () => {
      clearKeepPauseIconTimeout();
    };
  }, [clearKeepPauseIconTimeout]);

  const visualPlaying = playing || keepPauseIcon;

  const handlePreviousPress = useCallback(() => {
    beginTrackChangeVisual();
    onPrevious();
  }, [beginTrackChangeVisual, onPrevious]);

  const handleNextPress = useCallback(() => {
    beginTrackChangeVisual();
    onNext();
  }, [beginTrackChangeVisual, onNext]);

  const handleShufflePress = useCallback(() => {
    void player.toggleShuffle();
  }, [player.toggleShuffle]);

  const handlePlayPausePress = useCallback(() => {
    clearKeepPauseIconTimeout();
    setKeepPauseIcon(false);
    onPlayPause();
  }, [clearKeepPauseIconTimeout, onPlayPause]);

  const artworkTranslateX = useRef(new Animated.Value(0)).current;

  /*



   * =====================================================



   * CARRUSEL DE CARÁTULAS



   * =====================================================



   *



   * anterior | actual | siguiente



   *



   * Las tres portadas se mueven juntas. Por eso,



   * mientras la actual sale, la vecina entra desde



   * el costado en el mismo gesto.



   */

  const carouselQueue = player.queue;

  /*



   * =====================================================



   * ESTADO VISUAL DEL CARRUSEL



   * =====================================================



   *



   * El reproductor puede tardar unos milisegundos en reflejar



   * la nueva canción. Para evitar el flash entre dos renders,



   * el carrusel mantiene su propio centro visual.



   */

  const [visualSongId, setVisualSongId] = useState(song.id);

  /*



   * =====================================================



   * SINCRONIZACIÓN ANTI-RACE



   * =====================================================



   *



   * Antes, cada cambio tardío de song.id proveniente de RNTP



   * podía pisar nuestro estado visual y mostrar una portada



   * vieja durante un frame.



   *



   * Guardamos el destino que el carrusel ya decidió mostrar.



   * Mientras RNTP todavía no lo confirme, ignoramos estados



   * atrasados del reproductor.



   */

  const pendingVisualSongIdRef = useRef<string | null>(null);

  const visualSongIdRef = useRef(song.id);

  useEffect(() => {
    visualSongIdRef.current = visualSongId;
  }, [visualSongId]);

  const pendingVisualTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const clearPendingVisualTimeout = useCallback(() => {
    if (pendingVisualTimeoutRef.current) {
      clearTimeout(pendingVisualTimeoutRef.current);

      pendingVisualTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingVisualTimeout();
    };
  }, [clearPendingVisualTimeout]);

  useEffect(() => {
    const pendingId = pendingVisualSongIdRef.current;

    /*



     * RNTP confirmó exactamente la canción que ya mostramos.



     * No cambiamos nada visualmente; solo cerramos el pending.



     */

    if (pendingId && song.id === pendingId) {
      pendingVisualSongIdRef.current = null;

      clearPendingVisualTimeout();

      return;
    }

    /*



     * Hay un swipe visual pendiente y RNTP todavía informa



     * una canción anterior. Ese valor es obsoleto para la UI:



     * NO lo copiamos a visualSongId.



     */

    if (pendingId && song.id !== pendingId) {
      return;
    }

    /*



     * Si no hay transición pendiente, entonces sí aceptamos



     * cambios externos: botones, notificación, lockscreen, etc.



     */

    if (song.id !== visualSongIdRef.current) {
      setVisualSongId(song.id);
    }
  }, [song.id, clearPendingVisualTimeout]);

  /*



   * RE-CENTRADO SIN FLASH



   *



   * IMPORTANTE:



   * useLayoutEffect corre después de que React ya cambió



   * las portadas del carrusel, pero antes de que la pantalla



   * pinte ese nuevo frame.



   *



   * Así evitamos hacer translateX=0 mientras todavía están



   * montadas las portadas antiguas.



   */

  useLayoutEffect(() => {
    artworkTranslateX.stopAnimation();

    artworkTranslateX.setValue(0);
  }, [visualSongId, artworkTranslateX]);

  /*

   * =====================================================

   * CANCIÓN VISUAL RESUELTA SIN RETARDO

   * =====================================================

   *

   * Si NO estamos en medio de un swipe optimista, usamos

   * directamente `song.id` en este mismo render.

   *

   * Antes el fondo ya recibía el nuevo `song`, pero la carátula

   * esperaba a que el useEffect copiara song.id -> visualSongId.

   * Eso podía hacer que el fondo cambiara primero y la portada

   * pareciera llegar tarde.

   *

   * Durante un swipe pendiente sí conservamos visualSongId,

   * porque ahí queremos mostrar inmediatamente la canción destino

   * aunque RNTP todavía no la haya confirmado.

   */

  const resolvedVisualSongId = pendingVisualSongIdRef.current
    ? visualSongId
    : song.id;

  const visualCarouselIndex = carouselQueue.findIndex(
    (item) => item.id === resolvedVisualSongId
  );

  useEffect(() => {
    if (visualCarouselIndex < 0 && !pendingVisualSongIdRef.current) {
      /*

       * No forzamos un cambio visual aquí.

       *

       * visualCurrentSong ya cae en `song`, así que cambiar

       * visualSongId en este instante podía provocar un render

       * extra y un pequeño flash. La sincronización normal de

       * song.id se encargará del siguiente estado estable.

       */

      return;
    }
  }, [visualCarouselIndex]);

  const canWrapCarousel = repeatMode === "all" && carouselQueue.length > 1;

  const visualCurrentSong =
    visualCarouselIndex >= 0 ? carouselQueue[visualCarouselIndex] : song;

  /*
   * =====================================================
   * VECINOS DEL CARRUSEL EN MODO ALEATORIO
   * =====================================================
   *
   * Cuando Shuffle está activo no mostramos simplemente
   * la canción anterior/siguiente del orden normal.
   *
   * Generamos dos candidatos aleatorios ESTABLES para la
   * canción visual actual. Así la portada que aparece al
   * costado es exactamente la que se reproducirá al hacer
   * swipe.
   *
   * useMemo evita que cambien por renders normales.
   * Solo se recalculan cuando cambia:
   * - la canción visual actual
   * - el estado de shuffle
   * - la cola
   */
  const shuffleCarouselNeighbors = useMemo(() => {
    if (!player.shuffle || carouselQueue.length <= 1) {
      return {
        previous: null as Song | null,
        next: null as Song | null,
      };
    }

    const candidates = carouselQueue.filter(
      (item) => item.id !== visualCurrentSong.id
    );

    if (candidates.length === 0) {
      return {
        previous: null as Song | null,
        next: null as Song | null,
      };
    }

    const nextIndex = Math.floor(Math.random() * candidates.length);
    const next = candidates[nextIndex] ?? null;

    const previousCandidates =
      candidates.length > 1
        ? candidates.filter((item) => item.id !== next?.id)
        : candidates;

    const previousIndex =
      previousCandidates.length > 0
        ? Math.floor(Math.random() * previousCandidates.length)
        : 0;

    const previous = previousCandidates[previousIndex] ?? next ?? null;

    return {
      previous,
      next,
    };
  }, [player.shuffle, carouselQueue, visualCurrentSong.id]);

  const previousCarouselSong = player.shuffle
    ? shuffleCarouselNeighbors.previous
    : visualCarouselIndex > 0
    ? carouselQueue[visualCarouselIndex - 1]
    : canWrapCarousel
    ? carouselQueue[carouselQueue.length - 1]
    : null;

  const nextCarouselSong = player.shuffle
    ? shuffleCarouselNeighbors.next
    : visualCarouselIndex >= 0 && visualCarouselIndex < carouselQueue.length - 1
    ? carouselQueue[visualCarouselIndex + 1]
    : canWrapCarousel && carouselQueue.length > 0
    ? carouselQueue[0]
    : null;

  /*















   * =====================================================















   * RESPONSIVE















   * =====================================================















   *















   * Ya no dependemos de tamaños gigantes fijos.















   *















   * Tenemos tres escenarios:















   *















   * 1. Pantalla pequeña















   * 2. Pantalla normal















   * 3. Pantalla grande















   */

  const veryNarrow = width < 360;

  const narrow = width < 390;

  const shortScreen = height < 760;

  const veryShortScreen = height < 680;

  /*















   * La portada depende tanto del ancho como















   * de la altura disponible.















   *















   * Esto evita que en teléfonos altos o angostos















   * la portada empuje los controles fuera.















   */

  const horizontalSpace = veryNarrow ? 22 : narrow ? 26 : 30;

  const artworkByWidth = width - horizontalSpace;

  const artworkHeightRatio = veryShortScreen
    ? 0.325
    : shortScreen
    ? 0.37
    : 0.41;

  const artworkByHeight = height * artworkHeightRatio;

  const artworkSize = Math.max(
    210,

    Math.min(artworkByWidth, artworkByHeight, 390)
  );

  const artworkRadius = narrow ? 24 : 28;

  const artworkIconSize = Math.round(artworkSize * 0.3);

  /*















   * Tamaños de botones.















   */

  const playButtonSize = veryNarrow ? 62 : shortScreen ? 66 : 70;

  const playIconSize = veryNarrow ? 38 : 42;

  const secondaryButtonSize = narrow ? 42 : 45;

  const skipIconSize = narrow ? 34 : 38;

  /*















   * Textos.















   */

  const titleFontSize = veryNarrow ? 19 : narrow ? 20 : 22;

  const titleLineHeight = titleFontSize + 5;

  const compactFooter = shortScreen || veryNarrow;

  const [lyricsOpen, setLyricsOpen] = useState(false);

  /*

   * =====================================================

   * FONDO SIMPLE / ESTABLE

   * =====================================================

   *

   * Volvemos al comportamiento de la versión que funcionaba bien:

   * el fondo depende SOLO de `song` (la canción real confirmada),

   * no del estado visual optimista del carrusel.

   *

   * Así el carrusel puede ser fluido sin que el fondo haga

   * buffers, precargas, dobles capas ni carreras de onLoad.

   */

  const [failedBackgroundUri, setFailedBackgroundUri] = useState<string | null>(
    null
  );

  const normalizedBackgroundArtwork =
    typeof song.artwork === "string" ? song.artwork.trim() : "";

  const backgroundArtworkFailed =
    normalizedBackgroundArtwork.length > 0 &&
    failedBackgroundUri === normalizedBackgroundArtwork;

  const hasRealBackground =
    normalizedBackgroundArtwork.length > 0 && !backgroundArtworkFailed;

  const backgroundTheme = getArtworkTheme(song.id);

  useEffect(() => {
    setLyricsOpen(false);

    setPlaylistOpen(false);

    setEqualizerOpen(false);
  }, [song.id]);

  /*















   * =====================================================















   * FONDO DINÁMICO















   * =====================================================















   */

  const handleClose = useCallback(() => {
    setLyricsOpen(false);

    setPlaylistOpen(false);

    setEqualizerOpen(false);

    onClose();
  }, [onClose]);

  /*



   * =====================================================



   * GESTO SOBRE LA CARÁTULA



   * =====================================================



   *



   * Deslizar a la izquierda  -> siguiente canción



   * Deslizar a la derecha    -> canción anterior



   *



   * Exigimos un movimiento horizontal claro para que



   * pequeños toques o movimientos verticales no cambien



   * de canción accidentalmente.



   */

  const artworkSwipeDistance = Math.min(
    82,

    Math.max(
      48,

      width * 0.14
    )
  );

  const artworkCarouselGap = veryNarrow ? 12 : 16;

  const artworkPageDistance = artworkSize + artworkCarouselGap;

  const previousArtworkScale = artworkTranslateX.interpolate({
    inputRange: [-artworkPageDistance, 0, artworkPageDistance],

    outputRange: [0.9, 0.94, 1],

    extrapolate: "clamp",
  });

  const currentArtworkScale = artworkTranslateX.interpolate({
    inputRange: [-artworkPageDistance, 0, artworkPageDistance],

    outputRange: [0.94, 1, 0.94],

    extrapolate: "clamp",
  });

  const nextArtworkScale = artworkTranslateX.interpolate({
    inputRange: [-artworkPageDistance, 0, artworkPageDistance],

    outputRange: [1, 0.94, 0.9],

    extrapolate: "clamp",
  });

  const previousArtworkOpacity = artworkTranslateX.interpolate({
    inputRange: [-artworkPageDistance, 0, artworkPageDistance],

    outputRange: [0.3, 0.72, 1],

    extrapolate: "clamp",
  });

  const currentArtworkOpacity = artworkTranslateX.interpolate({
    inputRange: [-artworkPageDistance, 0, artworkPageDistance],

    outputRange: [0.72, 1, 0.72],

    extrapolate: "clamp",
  });

  const nextArtworkOpacity = artworkTranslateX.interpolate({
    inputRange: [-artworkPageDistance, 0, artworkPageDistance],

    outputRange: [1, 0.72, 0.3],

    extrapolate: "clamp",
  });

  const animateArtworkBack = useCallback(() => {
    Animated.spring(
      artworkTranslateX,

      {
        toValue: 0,

        useNativeDriver: true,

        speed: 22,

        bounciness: 5,
      }
    ).start();
  }, [artworkTranslateX]);

  const finishArtworkSwipe = useCallback(
    (direction: "next" | "previous") => {
      const targetSong =
        direction === "next" ? nextCarouselSong : previousCarouselSong;

      if (!targetSong) {
        animateArtworkBack();

        return;
      }

      beginTrackChangeVisual();

      Animated.timing(
        artworkTranslateX,

        {
          toValue:
            direction === "next" ? -artworkPageDistance : artworkPageDistance,

          duration: 170,

          easing: Easing.out(Easing.quad),

          useNativeDriver: true,
        }
      ).start(() => {
        /*



         * HANDOFF SIN FLASH



         *



         * La portada vecina ya está centrada al terminar



         * la animación. Ahora convertimos esa misma canción



         * en el centro visual y devolvemos la pista a 0



         * antes de pedirle a RNTP que cambie.



         *



         * Visualmente no hay cambio: es la misma portada



         * ocupando exactamente el mismo lugar.



         */

        /*



         * Marcamos primero el destino esperado.



         * Si RNTP todavía emite temporalmente la canción



         * anterior, el efecto de sincronización la ignorará.



         */

        clearPendingVisualTimeout();

        pendingVisualSongIdRef.current = targetSong.id;

        const expectedVisualSongId = targetSong.id;

        pendingVisualTimeoutRef.current = setTimeout(() => {
          if (pendingVisualSongIdRef.current === expectedVisualSongId) {
            /*

             * Seguridad solamente lógica:

             * liberamos el pending, pero NO tocamos la portada

             * visible. Así evitamos un rollback visual momentáneo

             * que producía pequeños flashes.

             */

            pendingVisualSongIdRef.current = null;
          }

          pendingVisualTimeoutRef.current = null;
        }, 2500);

        setVisualSongId(targetSong.id);

        /*

         * IMPORTANTE:

         * El swipe ya NO manda next() ni previous().

         *

         * Enviamos directamente el ID exacto de la portada

         * que quedó centrada. Así audio, portada, título,

         * artista, álbum y fondo terminan en la misma canción.

         */

        void (async () => {
          const success = await player.skipToSong(targetSong.id);

          /*

           * Si por alguna razón RNTP no pudo encontrar/saltar

           * a ese mediaId, soltamos el pending visual.

           *

           * Solo lo hacemos si este sigue siendo el último

           * destino solicitado; un swipe posterior no se toca.

           */

          if (!success && pendingVisualSongIdRef.current === targetSong.id) {
            pendingVisualSongIdRef.current = null;

            setVisualSongId(player.currentSong?.id ?? song.id);
          }
        })();
      });
    },

    [
      artworkTranslateX,

      artworkPageDistance,

      nextCarouselSong,

      previousCarouselSong,

      player.skipToSong,

      player.currentSong?.id,

      song.id,

      clearPendingVisualTimeout,

      animateArtworkBack,

      beginTrackChangeVisual,
    ]
  );

  const artworkPanResponder = useMemo(
    () =>
      PanResponder.create({
        /*



         * La carátula no tiene acción de toque, por eso



         * podemos tomar el responder desde el inicio.



         * Así Android no entrega el gesto a otro View.



         */

        onStartShouldSetPanResponder: () => true,

        onStartShouldSetPanResponderCapture: () => true,

        onMoveShouldSetPanResponder: () => true,

        onMoveShouldSetPanResponderCapture: () => true,

        onPanResponderGrant: () => {
          artworkTranslateX.stopAnimation();
        },

        onPanResponderMove: (
          _event,

          gestureState
        ) => {
          /*



           * Seguimos el dedo en tiempo real.



           * Limitamos un poco el recorrido vertical



           * porque solo nos interesa dx.



           */

          artworkTranslateX.setValue(gestureState.dx);
        },

        onPanResponderTerminationRequest: () => false,

        onPanResponderRelease: (
          _event,

          gestureState
        ) => {
          const horizontal = Math.abs(gestureState.dx);

          const vertical = Math.abs(gestureState.dy);

          const horizontalEnough =
            horizontal > artworkSwipeDistance && horizontal > vertical;

          const fastEnough =
            Math.abs(gestureState.vx) > 0.35 && horizontal > 24;

          if (horizontalEnough || fastEnough) {
            if (gestureState.dx < 0) {
              finishArtworkSwipe("next");
            } else {
              finishArtworkSwipe("previous");
            }

            return;
          }

          animateArtworkBack();
        },

        onPanResponderTerminate: () => {
          animateArtworkBack();
        },
      }),

    [
      artworkSwipeDistance,

      artworkTranslateX,

      animateArtworkBack,

      finishArtworkSwipe,
    ]
  );

  const addCurrentSongToPlaylist = useCallback(
    (playlistId: string) => {
      playlists.addSong(playlistId, visualCurrentSong.id);
    },

    [playlists, visualCurrentSong.id]
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          {/* =========================















              FONDO AISLADO DEL CARRUSEL















          ========================= */}

          {!hasRealBackground ? (
            <>
              <View
                style={[
                  styles.generatedBackground,

                  {
                    backgroundColor: backgroundTheme.background,
                  },
                ]}
              />

              <View
                style={[
                  styles.generatedGlowOne,

                  {
                    backgroundColor: backgroundTheme.glow1,
                  },
                ]}
              />

              <View
                style={[
                  styles.generatedGlowTwo,

                  {
                    backgroundColor: backgroundTheme.glow2,
                  },
                ]}
              />

              <View
                style={[
                  styles.generatedGlowThree,

                  {
                    backgroundColor: backgroundTheme.glow1,
                  },
                ]}
              />
            </>
          ) : (
            <View style={styles.neutralBackground} />
          )}

          {hasRealBackground ? (
            <Image
              key={normalizedBackgroundArtwork}
              source={{
                uri: normalizedBackgroundArtwork,
              }}
              blurRadius={45}
              resizeMode="cover"
              fadeDuration={0}
              onError={() => {
                setFailedBackgroundUri(normalizedBackgroundArtwork);
              }}
              style={styles.backgroundImage}
            />
          ) : null}

          <View
            style={[
              styles.darkOverlay,

              hasRealBackground
                ? styles.darkOverlayWithArtwork
                : styles.darkOverlayGenerated,
            ]}
          />

          <SafeAreaView
            style={[
              styles.safeArea,

              {
                paddingHorizontal: veryNarrow ? 10 : 16,
              },
            ]}
          >
            {/* =========================















                CABECERA















            ========================= */}

            <View
              style={[
                styles.topBar,

                {
                  height: shortScreen ? 54 : 58,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.topButton, narrow && styles.topButtonCompact]}
                activeOpacity={0.7}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Cerrar reproductor"
              >
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={narrow ? 27 : 30}
                  color={COLORS.white}
                />
              </TouchableOpacity>

              <View style={styles.topCenter}>
                <Text style={styles.nowPlayingLabel} numberOfLines={1}>
                  REPRODUCIENDO
                </Text>

                <Text
                  style={[
                    styles.nowPlayingArtist,

                    {
                      maxWidth: Math.max(130, width - 150),
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {visualCurrentSong.artist}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.topButton,

                  narrow && styles.topButtonCompact,

                  favorite && styles.favoriteButtonActive,
                ]}
                activeOpacity={0.7}
                onPress={onFavorite}
                accessibilityRole="button"
                accessibilityLabel={
                  favorite ? "Quitar de favoritos" : "Añadir a favoritos"
                }
              >
                <MaterialCommunityIcons
                  name={favorite ? "heart" : "heart-outline"}
                  size={narrow ? 22 : 24}
                  color={favorite ? COLORS.pink : COLORS.white}
                />
              </TouchableOpacity>
            </View>

            {/* =========================















                CONTENIDO PRINCIPAL















            ========================= */}

            <View
              style={[
                styles.mainContent,

                {
                  paddingTop: veryShortScreen ? 2 : shortScreen ? 4 : 7,
                },
              ]}
            >
              {/* =======================















                  CARÁTULA















              ======================= */}

              <View
                style={[
                  styles.artworkStage,

                  {
                    height: artworkSize,

                    marginBottom: veryShortScreen ? 8 : shortScreen ? 10 : 14,
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.artworkTrack,

                    {
                      width: artworkSize * 3 + artworkCarouselGap * 2,

                      height: artworkSize,

                      marginLeft:
                        -(artworkSize * 3 + artworkCarouselGap * 2) / 2,

                      transform: [
                        {
                          translateX: artworkTranslateX,
                        },
                      ],
                    },
                  ]}
                  {...artworkPanResponder.panHandlers}
                  accessibilityRole="adjustable"
                  accessibilityLabel="Carátula. Desliza a la izquierda para la siguiente canción o a la derecha para la anterior."
                >
                  {/*

                   * POSICIONES FIJAS DEL CARRUSEL

                   *

                   * Android puede conservar el bitmap viejo cuando

                   * una misma instancia Image cambia de posición.

                   * Por eso previous/current/next son slots fijos.

                   */}

                  <Animated.View
                    key="carousel-previous-slot"
                    pointerEvents="none"
                    style={[
                      styles.artworkCarouselItem,

                      {
                        width: artworkSize,

                        height: artworkSize,

                        borderRadius: artworkRadius,

                        opacity: previousArtworkOpacity,

                        transform: [
                          {
                            scale: previousArtworkScale,
                          },
                        ],
                      },
                    ]}
                  >
                    {previousCarouselSong ? (
                      <CarouselArtwork
                        song={previousCarouselSong}
                        size={artworkSize}
                        radius={artworkRadius}
                        iconSize={artworkIconSize}
                      />
                    ) : null}
                  </Animated.View>

                  <View
                    style={{
                      width: artworkCarouselGap,
                    }}
                  />

                  <Animated.View
                    key="carousel-current-slot"
                    pointerEvents="none"
                    style={[
                      styles.artworkCarouselItem,

                      {
                        width: artworkSize,

                        height: artworkSize,

                        borderRadius: artworkRadius,

                        opacity: currentArtworkOpacity,

                        transform: [
                          {
                            scale: currentArtworkScale,
                          },
                        ],
                      },
                    ]}
                  >
                    <CarouselArtwork
                      key={`current-${resolvedVisualSongId}`}
                      song={visualCurrentSong}
                      size={artworkSize}
                      radius={artworkRadius}
                      iconSize={artworkIconSize}
                    />
                  </Animated.View>

                  <View
                    style={{
                      width: artworkCarouselGap,
                    }}
                  />

                  <Animated.View
                    key="carousel-next-slot"
                    pointerEvents="none"
                    style={[
                      styles.artworkCarouselItem,

                      {
                        width: artworkSize,

                        height: artworkSize,

                        borderRadius: artworkRadius,

                        opacity: nextArtworkOpacity,

                        transform: [
                          {
                            scale: nextArtworkScale,
                          },
                        ],
                      },
                    ]}
                  >
                    {nextCarouselSong ? (
                      <CarouselArtwork
                        song={nextCarouselSong}
                        size={artworkSize}
                        radius={artworkRadius}
                        iconSize={artworkIconSize}
                      />
                    ) : null}
                  </Animated.View>
                </Animated.View>
              </View>

              {/* =======================















                  INFORMACIÓN















              ======================= */}

              <View
                style={[
                  styles.songInfo,

                  {
                    paddingHorizontal: narrow ? 8 : 12,

                    height: shortScreen ? 68 : 74,
                  },
                ]}
              >
                <MarqueeTitle
                  key={`title-${resolvedVisualSongId}`}
                  text={visualCurrentSong.title}
                  fontSize={titleFontSize}
                  lineHeight={titleLineHeight}
                />

                <Text
                  style={[
                    styles.artist,

                    {
                      fontSize: narrow ? 12 : 13,

                      marginTop: shortScreen ? 4 : 6,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {visualCurrentSong.artist}
                </Text>

                <View
                  style={[
                    styles.albumRow,

                    {
                      marginTop: shortScreen ? 2 : 4,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="album"
                    size={13}
                    color="#B6B6BE"
                  />

                  <Text
                    style={styles.album}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {visualCurrentSong.album}
                  </Text>
                </View>
              </View>

              {/* =======================















                  PROGRESO















              ======================= */}

              <View
                style={[
                  styles.progressArea,

                  {
                    marginHorizontal: narrow ? 8 : 12,

                    marginTop: veryShortScreen ? 3 : shortScreen ? 5 : 7,
                  },
                ]}
              >
                <PlayerProgressConnected onSeek={onSeek} />
              </View>

              {/* =======================















                  CONTROLES















              ======================= */}

              <View
                style={[
                  styles.controls,

                  {
                    height: shortScreen ? 64 : 70,

                    marginHorizontal: narrow ? 4 : 10,

                    marginTop: veryShortScreen ? 2 : shortScreen ? 4 : 6,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.secondaryControl,

                    {
                      width: secondaryButtonSize,

                      height: secondaryButtonSize,

                      borderRadius: secondaryButtonSize / 2,
                    },

                    shuffle && styles.secondaryControlActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={handleShufflePress}
                  accessibilityRole="button"
                  accessibilityLabel={
                    shuffle
                      ? "Desactivar reproducción aleatoria"
                      : "Activar reproducción aleatoria"
                  }
                >
                  <MaterialCommunityIcons
                    name="shuffle-variant"
                    size={narrow ? 21 : 23}
                    color={shuffle ? COLORS.purpleLight : "#DADAE0"}
                  />

                  {shuffle ? <View style={styles.activeDot} /> : null}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.skipButton,

                    {
                      width: narrow ? 48 : 54,

                      height: narrow ? 52 : 56,
                    },
                  ]}
                  activeOpacity={0.68}
                  onPress={handlePreviousPress}
                  accessibilityRole="button"
                  accessibilityLabel="Canción anterior"
                >
                  <MaterialCommunityIcons
                    name="skip-previous"
                    size={skipIconSize}
                    color={COLORS.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.playButton,

                    {
                      width: playButtonSize,

                      height: playButtonSize,

                      borderRadius: playButtonSize / 2,
                    },
                  ]}
                  activeOpacity={0.82}
                  onPress={handlePlayPausePress}
                  accessibilityRole="button"
                  accessibilityLabel={visualPlaying ? "Pausar" : "Reproducir"}
                >
                  <MaterialCommunityIcons
                    name={visualPlaying ? "pause" : "play"}
                    size={playIconSize}
                    color={COLORS.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.skipButton,

                    {
                      width: narrow ? 48 : 54,

                      height: narrow ? 52 : 56,
                    },
                  ]}
                  activeOpacity={0.68}
                  onPress={handleNextPress}
                  accessibilityRole="button"
                  accessibilityLabel="Siguiente canción"
                >
                  <MaterialCommunityIcons
                    name="skip-next"
                    size={skipIconSize}
                    color={COLORS.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryControl,

                    {
                      width: secondaryButtonSize,

                      height: secondaryButtonSize,

                      borderRadius: secondaryButtonSize / 2,
                    },

                    repeatMode !== "off" && styles.secondaryControlActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={onRepeat}
                  accessibilityRole="button"
                  accessibilityLabel={
                    repeatMode === "off"
                      ? "Activar repetición"
                      : repeatMode === "all"
                      ? "Repetir una canción"
                      : "Desactivar repetición"
                  }
                >
                  <MaterialCommunityIcons
                    name={repeatMode === "one" ? "repeat-once" : "repeat"}
                    size={narrow ? 21 : 23}
                    color={
                      repeatMode === "off" ? "#DADAE0" : COLORS.purpleLight
                    }
                  />

                  {repeatMode !== "off" ? (
                    <View style={styles.activeDot} />
                  ) : null}
                </TouchableOpacity>
              </View>
            </View>

            {/* =========================















                FOOTER















            ========================= */}

            <View
              style={[
                styles.footer,

                {
                  gap: veryNarrow ? 6 : 9,

                  paddingHorizontal: veryNarrow ? 4 : 10,

                  paddingTop: shortScreen ? 2 : 4,

                  paddingBottom: shortScreen ? 5 : 7,
                },
              ]}
            >
              <FooterAction
                icon="playlist-play"
                label="Cola"
                compact={compactFooter}
                onPress={onQueue}
              />

              <FooterAction
                icon="playlist-plus"
                label="Playlist"
                compact={compactFooter}
                onPress={() => setPlaylistOpen(true)}
              />

              <FooterAction
                icon="equalizer"
                label="EQ"
                compact={compactFooter}
                onPress={() => setEqualizerOpen(true)}
              />

              <FooterAction
                icon="text-box-outline"
                label="Letras"
                compact={compactFooter}
                onPress={() => setLyricsOpen(true)}
              />

              <FooterAction
                icon="timer-outline"
                label="Temporizador"
                compact={compactFooter}
                onPress={onSleepTimer}
              />
            </View>

            {/* =========================















                AGREGAR A PLAYLIST















            ========================= */}

            {playlistOpen ? (
              <View style={styles.playlistOverlay}>
                <Pressable
                  style={styles.playlistBackdrop}
                  onPress={() => setPlaylistOpen(false)}
                />

                <View style={styles.playlistSheet}>
                  <View style={styles.playlistHandle} />

                  <View style={styles.playlistHeader}>
                    <View style={styles.playlistHeaderText}>
                      <Text style={styles.playlistTitle}>
                        Agregar a playlist
                      </Text>

                      <Text style={styles.playlistSubtitle} numberOfLines={1}>
                        {visualCurrentSong.title}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.playlistClose}
                      activeOpacity={0.72}
                      onPress={() => setPlaylistOpen(false)}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={22}
                        color={COLORS.white}
                      />
                    </TouchableOpacity>
                  </View>

                  {playlists.playlists.length === 0 ? (
                    <View style={styles.playlistEmpty}>
                      <MaterialCommunityIcons
                        name="playlist-music-outline"
                        size={42}
                        color="#A7A7B2"
                      />

                      <Text style={styles.playlistEmptyTitle}>
                        No tienes playlists
                      </Text>

                      <Text style={styles.playlistEmptyText}>
                        Crea una desde la sección Playlists y luego podrás
                        agregar esta canción aquí.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.playlistList}
                      contentContainerStyle={styles.playlistListContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {playlists.playlists.map((playlist) => {
                        const alreadyAdded = playlist.songIds.includes(
                          visualCurrentSong.id
                        );

                        return (
                          <TouchableOpacity
                            key={playlist.id}
                            style={[
                              styles.playlistRow,

                              alreadyAdded && styles.playlistRowAdded,
                            ]}
                            activeOpacity={0.72}
                            onPress={() =>
                              addCurrentSongToPlaylist(playlist.id)
                            }
                          >
                            <View style={styles.playlistRowIcon}>
                              <MaterialCommunityIcons
                                name="playlist-music"
                                size={23}
                                color={
                                  alreadyAdded
                                    ? COLORS.purpleLight
                                    : COLORS.white
                                }
                              />
                            </View>

                            <View style={styles.playlistRowText}>
                              <Text
                                style={styles.playlistRowTitle}
                                numberOfLines={1}
                              >
                                {playlist.name}
                              </Text>

                              <Text style={styles.playlistRowSubtitle}>
                                {playlist.songIds.length}{" "}
                                {playlist.songIds.length === 1
                                  ? "canción"
                                  : "canciones"}
                              </Text>
                            </View>

                            <MaterialCommunityIcons
                              name={
                                alreadyAdded
                                  ? "check-circle"
                                  : "plus-circle-outline"
                              }
                              size={24}
                              color={
                                alreadyAdded ? COLORS.purpleLight : "#CFCFD6"
                              }
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              </View>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>

      {lyricsOpen ? (
        <LyricsModalConnected
          visible={lyricsOpen}
          song={song}
          onClose={() => setLyricsOpen(false)}
        />
      ) : null}

      {equalizerOpen ? (
        <EqualizerModal
          visible={equalizerOpen}
          onClose={() => setEqualizerOpen(false)}
        />
      ) : null}
    </>
  );
}

export default memo(PlayerModal);

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: COLORS.background,
  },

  safeArea: {
    flex: 1,
  },

  /*















   * =====================================================















   * FONDO















   * =====================================================















   */

  generatedBackground: {
    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    bottom: 0,
  },

  backgroundLayer: {
    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    bottom: 0,
  },

  neutralBackground: {
    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    bottom: 0,

    backgroundColor: "#09090F",
  },

  generatedGlowOne: {
    position: "absolute",

    width: 620,

    height: 620,

    borderRadius: 310,

    top: -320,

    right: -270,

    opacity: 0.4,
  },

  generatedGlowTwo: {
    position: "absolute",

    width: 560,

    height: 560,

    borderRadius: 280,

    bottom: -300,

    left: -310,

    opacity: 0.3,
  },

  generatedGlowThree: {
    position: "absolute",

    width: 390,

    height: 390,

    borderRadius: 195,

    top: 280,

    right: -240,

    opacity: 0.14,
  },

  backgroundImage: {
    position: "absolute",

    top: -45,

    left: -45,

    right: -45,

    bottom: -45,
  },

  darkOverlay: {
    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    bottom: 0,
  },

  darkOverlayGenerated: {
    backgroundColor: "rgba(8,8,12,0.42)",
  },

  darkOverlayWithArtwork: {
    backgroundColor: "rgba(8,8,12,0.52)",
  },

  /*















   * =====================================================















   * HEADER















   * =====================================================















   */

  topBar: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    zIndex: 10,
  },

  topButton: {
    width: 44,

    height: 44,

    borderRadius: 22,

    backgroundColor: "rgba(255,255,255,0.11)",

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: "rgba(255,255,255,0.18)",

    justifyContent: "center",

    alignItems: "center",
  },

  topButtonCompact: {
    width: 40,

    height: 40,

    borderRadius: 20,
  },

  favoriteButtonActive: {
    backgroundColor: "rgba(236,72,153,0.18)",

    borderColor: "rgba(236,72,153,0.35)",
  },

  topCenter: {
    flex: 1,

    alignItems: "center",

    paddingHorizontal: 8,
  },

  nowPlayingLabel: {
    color: "rgba(255,255,255,0.68)",

    fontSize: 8,

    fontWeight: "700",

    letterSpacing: 1.6,
  },

  nowPlayingArtist: {
    color: COLORS.white,

    fontSize: 11,

    fontWeight: "600",

    marginTop: 3,

    textAlign: "center",
  },

  /*















   * =====================================================















   * CONTENIDO















   * =====================================================















   */

  mainContent: {
    flex: 1,

    paddingHorizontal: 2,

    justifyContent: "flex-start",

    minHeight: 0,
  },

  /*















   * =====================================================















   * CARÁTULA















   * =====================================================















   */

  artworkStage: {
    width: "100%",

    alignItems: "center",

    justifyContent: "center",

    flexShrink: 0,

    overflow: "hidden",
  },

  artworkTrack: {
    position: "absolute",

    left: "50%",

    top: 0,

    flexDirection: "row",

    alignItems: "center",
  },

  artworkCarouselItem: {
    overflow: "hidden",

    backgroundColor: COLORS.surface,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.17)",

    elevation: 12,
  },

  /*















   * =====================================================















   * INFORMACIÓN















   * =====================================================















   */

  songInfo: {
    flexShrink: 0,

    overflow: "hidden",
  },

  title: {
    color: COLORS.white,

    fontWeight: "700",

    letterSpacing: -0.25,
  },

  titleViewport: {
    width: "100%",

    overflow: "hidden",

    position: "relative",

    justifyContent: "center",
  },

  titleMeasure: {
    position: "absolute",

    left: 0,

    top: 0,

    width: 5000,

    opacity: 0,
  },

  titleMoving: {
    alignSelf: "flex-start",

    flexShrink: 0,
  },

  titleStatic: {
    width: "100%",
  },

  artist: {
    color: "#E2E2E8",

    lineHeight: 18,

    fontWeight: "500",
  },

  albumRow: {
    minHeight: 17,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  album: {
    flex: 1,

    color: "#B6B6BE",

    fontSize: 10,
  },

  /*















   * =====================================================















   * PROGRESO















   * =====================================================















   */

  progressArea: {
    flexShrink: 0,

    marginBottom: 0,
  },

  /*















   * =====================================================















   * CONTROLES















   * =====================================================















   */

  controls: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    flexShrink: 0,
  },

  secondaryControl: {
    backgroundColor: "rgba(255,255,255,0.075)",

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: "rgba(255,255,255,0.12)",

    alignItems: "center",

    justifyContent: "center",

    position: "relative",
  },

  secondaryControlActive: {
    backgroundColor: "rgba(139,92,246,0.20)",

    borderColor: "rgba(167,139,250,0.35)",
  },

  activeDot: {
    position: "absolute",

    bottom: 4,

    width: 4,

    height: 4,

    borderRadius: 2,

    backgroundColor: COLORS.purpleLight,
  },

  skipButton: {
    justifyContent: "center",

    alignItems: "center",
  },

  playButton: {
    backgroundColor: COLORS.purple,

    justifyContent: "center",

    alignItems: "center",

    elevation: 10,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.24)",
  },

  /*















   * =====================================================















   * FOOTER















   * =====================================================















   */

  footer: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: "auto",

    flexShrink: 0,
  },

  footerAction: {
    flex: 1,

    height: 54,

    borderRadius: 17,

    backgroundColor: "rgba(255,255,255,0.095)",

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: "rgba(255,255,255,0.14)",

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal: 4,
  },

  footerActionCompact: {
    height: 49,

    borderRadius: 15,
  },

  footerActionActive: {
    backgroundColor: "rgba(139,92,246,0.20)",

    borderColor: "rgba(167,139,250,0.34)",
  },

  footerIcon: {
    height: 23,

    justifyContent: "center",

    alignItems: "center",
  },

  footerIconCompact: {
    height: 20,
  },

  footerText: {
    color: "#D5D5DC",

    fontSize: 9,

    fontWeight: "600",

    textAlign: "center",

    marginTop: 3,
  },

  footerTextCompact: {
    fontSize: 8,

    marginTop: 2,
  },

  footerTextActive: {
    color: COLORS.purpleLight,
  },

  /*















   * =====================================================















   * PLAYLIST SHEET















   * =====================================================















   */

  playlistOverlay: {
    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    bottom: 0,

    justifyContent: "flex-end",

    zIndex: 50,
  },

  playlistBackdrop: {
    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    bottom: 0,

    backgroundColor: "rgba(0,0,0,0.58)",
  },

  playlistSheet: {
    maxHeight: "58%",

    minHeight: 220,

    backgroundColor: "#17171F",

    borderTopLeftRadius: 26,

    borderTopRightRadius: 26,

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: "rgba(255,255,255,0.13)",

    paddingTop: 8,

    paddingHorizontal: 16,

    paddingBottom: 18,

    elevation: 20,
  },

  playlistHandle: {
    alignSelf: "center",

    width: 42,

    height: 4,

    borderRadius: 2,

    backgroundColor: "rgba(255,255,255,0.25)",

    marginBottom: 12,
  },

  playlistHeader: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: 12,
  },

  playlistHeaderText: {
    flex: 1,

    paddingRight: 12,
  },

  playlistTitle: {
    color: COLORS.white,

    fontSize: 18,

    fontWeight: "700",
  },

  playlistSubtitle: {
    color: "#AAAAAF",

    fontSize: 11,

    marginTop: 3,
  },

  playlistClose: {
    width: 38,

    height: 38,

    borderRadius: 19,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.08)",
  },

  playlistList: {
    flexGrow: 0,
  },

  playlistListContent: {
    paddingBottom: 4,
  },

  playlistRow: {
    minHeight: 62,

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 12,

    marginBottom: 8,

    backgroundColor: "rgba(255,255,255,0.065)",

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: "rgba(255,255,255,0.10)",
  },

  playlistRowAdded: {
    backgroundColor: "rgba(139,92,246,0.13)",

    borderColor: "rgba(167,139,250,0.28)",
  },

  playlistRowIcon: {
    width: 40,

    height: 40,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",

    marginRight: 10,

    backgroundColor: "rgba(255,255,255,0.075)",
  },

  playlistRowText: {
    flex: 1,

    paddingRight: 10,
  },

  playlistRowTitle: {
    color: COLORS.white,

    fontSize: 13,

    fontWeight: "600",
  },

  playlistRowSubtitle: {
    color: "#A9A9B1",

    fontSize: 10,

    marginTop: 3,
  },

  playlistEmpty: {
    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 20,

    paddingVertical: 24,
  },

  playlistEmptyTitle: {
    color: COLORS.white,

    fontSize: 15,

    fontWeight: "700",

    marginTop: 10,
  },

  playlistEmptyText: {
    color: "#A8A8B0",

    fontSize: 11,

    lineHeight: 17,

    textAlign: "center",

    marginTop: 6,
  },
});
