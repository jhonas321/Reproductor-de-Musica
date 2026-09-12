import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


/* =========================================================
   PROPS
========================================================= */

interface Props {
  songCount:
    number;

  albumCount:
    number;

  artistCount:
    number;

  playlistCount:
    number;

  favoriteCount:
    number;

  recentCount:
    number;

  favoritesOnly:
    boolean;

  onSongsPress:
    () => void;

  onAlbumsPress:
    () => void;

  onArtistsPress:
    () => void;

  onFoldersPress:
    () => void;

  onPlaylistsPress:
    () => void;

  onFavoritesPress:
    () => void;

  onRecentPress:
    () => void;

  onTopPress:
    () => void;
}


/* =========================================================
   TEMA DE TARJETA
========================================================= */

interface CardTheme {
  background:
    string;

  glow:
    string;

  glowSecondary:
    string;

  iconBackground:
    string;

  iconColor:
    string;

  border:
    string;
}


/* =========================================================
   CARD
========================================================= */

interface LibraryCardProps {
  title:
    string;

  subtitle:
    string;

  icon:
    keyof typeof MaterialCommunityIcons.glyphMap;

  theme:
    CardTheme;

  active?:
    boolean;

  onPress:
    () => void;
}


function LibraryCard({
  title,
  subtitle,
  icon,
  theme,
  active = false,
  onPress,
}: LibraryCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        styles.card,

        {
          backgroundColor:
            theme.background,

          borderColor:
            active
              ? theme.border
              : 'rgba(255,255,255,0.07)',
        },
      ]}
    >
      {/* ===============================================
          DECORACIÓN
      =============================================== */}

      <View
        style={[
          styles.glow,
          {
            backgroundColor:
              theme.glow,
          },
        ]}
      />


      <View
        style={[
          styles.glowSecondary,
          {
            backgroundColor:
              theme.glowSecondary,
          },
        ]}
      />


      <View
        style={styles.decorLine}
      />


      {/* ===============================================
          ICONO
      =============================================== */}

      <View
        style={[
          styles.iconContainer,

          {
            backgroundColor:
              theme.iconBackground,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={25}
          color={theme.iconColor}
        />
      </View>


      {/* ===============================================
          TEXTO
      =============================================== */}

      <View
        style={styles.textArea}
      >
        <Text
          style={styles.title}
          numberOfLines={1}
        >
          {title}
        </Text>


        <Text
          style={styles.subtitle}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>


      {/* ===============================================
          FLECHA
      =============================================== */}

      <View
        style={styles.arrow}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={17}
          color="rgba(255,255,255,0.55)"
        />
      </View>
    </TouchableOpacity>
  );
}


/* =========================================================
   COLORES

   No usamos un solo violeta.
========================================================= */

const THEMES = {
  songs: {
    background:
      '#31204A',

    glow:
      'rgba(139,92,246,0.40)',

    glowSecondary:
      'rgba(96,165,250,0.20)',

    iconBackground:
      'rgba(255,255,255,0.12)',

    iconColor:
      '#E4D4FF',

    border:
      'rgba(167,139,250,0.65)',
  },


  albums: {
    background:
      '#123744',

    glow:
      'rgba(34,211,238,0.27)',

    glowSecondary:
      'rgba(59,130,246,0.22)',

    iconBackground:
      'rgba(255,255,255,0.12)',

    iconColor:
      '#C8F8FF',

    border:
      'rgba(103,232,249,0.62)',
  },


  artists: {
    background:
      '#3B2039',

    glow:
      'rgba(236,72,153,0.28)',

    glowSecondary:
      'rgba(168,85,247,0.20)',

    iconBackground:
      'rgba(255,255,255,0.12)',

    iconColor:
      '#FFD3E9',

    border:
      'rgba(244,114,182,0.62)',
  },


  folders: {
    background:
      '#17372F',

    glow:
      'rgba(52,211,153,0.25)',

    glowSecondary:
      'rgba(45,212,191,0.18)',

    iconBackground:
      'rgba(255,255,255,0.11)',

    iconColor:
      '#C8F9E7',

    border:
      'rgba(52,211,153,0.58)',
  },


  playlists: {
    background:
      '#3C2B16',

    glow:
      'rgba(245,158,11,0.28)',

    glowSecondary:
      'rgba(249,115,22,0.18)',

    iconBackground:
      'rgba(255,255,255,0.11)',

    iconColor:
      '#FFE7B7',

    border:
      'rgba(245,158,11,0.58)',
  },


  favorites: {
    background:
      '#421E2D',

    glow:
      'rgba(236,72,153,0.31)',

    glowSecondary:
      'rgba(239,68,68,0.16)',

    iconBackground:
      'rgba(255,255,255,0.12)',

    iconColor:
      '#FFD0DF',

    border:
      'rgba(236,72,153,0.64)',
  },


  recent: {
    background:
      '#243263',

    glow:
      'rgba(96,165,250,0.28)',

    glowSecondary:
      'rgba(99,102,241,0.23)',

    iconBackground:
      'rgba(255,255,255,0.11)',

    iconColor:
      '#D5DEFF',

    border:
      'rgba(129,140,248,0.60)',
  },


  top: {
    background:
      '#4A291E',

    glow:
      'rgba(249,115,22,0.30)',

    glowSecondary:
      'rgba(239,68,68,0.18)',

    iconBackground:
      'rgba(255,255,255,0.11)',

    iconColor:
      '#FFD7BF',

    border:
      'rgba(251,146,60,0.62)',
  },
} satisfies Record<
  string,
  CardTheme
>;


/* =========================================================
   GRID
========================================================= */

export default function LibraryGrid({
  songCount,
  albumCount,
  artistCount,
  playlistCount,
  favoriteCount,
  recentCount,
  favoritesOnly,
  onSongsPress,
  onAlbumsPress,
  onArtistsPress,
  onFoldersPress,
  onPlaylistsPress,
  onFavoritesPress,
  onRecentPress,
  onTopPress,
}: Props) {
  return (
    <View
      style={styles.grid}
    >
      {/* CANCIONES */}

      <LibraryCard
        title="Canciones"
        subtitle={`${songCount} canciones`}
        icon="music-note"
        theme={THEMES.songs}
        active={!favoritesOnly}
        onPress={onSongsPress}
      />


      {/* ÁLBUMES */}

      <LibraryCard
        title="Álbumes"
        subtitle={`${albumCount} álbumes`}
        icon="album"
        theme={THEMES.albums}
        onPress={onAlbumsPress}
      />


      {/* ARTISTAS */}

      <LibraryCard
        title="Artistas"
        subtitle={`${artistCount} artistas`}
        icon="microphone-outline"
        theme={THEMES.artists}
        onPress={onArtistsPress}
      />


      {/* CARPETAS */}

      <LibraryCard
        title="Carpetas"
        subtitle="Explorar música"
        icon="folder-music-outline"
        theme={THEMES.folders}
        onPress={onFoldersPress}
      />


      {/* PLAYLISTS */}

      <LibraryCard
        title="Playlists"
        subtitle={`${playlistCount} playlists`}
        icon="playlist-music-outline"
        theme={THEMES.playlists}
        onPress={onPlaylistsPress}
      />


      {/* FAVORITOS */}

      <LibraryCard
        title="Favoritos"
        subtitle={`${favoriteCount} canciones`}
        icon="heart-outline"
        theme={THEMES.favorites}
        active={favoritesOnly}
        onPress={onFavoritesPress}
      />


      {/* RECIENTES */}

      <LibraryCard
        title="Recientes"
        subtitle={`${recentCount} reproducciones`}
        icon="history"
        theme={THEMES.recent}
        onPress={onRecentPress}
      />


      {/* MÁS ESCUCHADAS */}

      <LibraryCard
        title="Más escuchadas"
        subtitle="Tus favoritas"
        icon="fire"
        theme={THEMES.top}
        onPress={onTopPress}
      />
    </View>
  );
}


/* =========================================================
   ESTILOS
========================================================= */

const styles =
  StyleSheet.create({
    grid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      justifyContent:
        'space-between',

      marginBottom:
        24,
    },


    card: {
      width:
        '48.3%',

      minHeight:
        112,

      borderRadius:
        21,

      marginBottom:
        12,

      paddingHorizontal:
        14,

      paddingVertical:
        14,

      overflow:
        'hidden',

      borderWidth:
        1,

      justifyContent:
        'space-between',
    },


    /* =====================================================
       DECORACIÓN
    ===================================================== */

    glow: {
      position:
        'absolute',

      width:
        125,

      height:
        125,

      borderRadius:
        63,

      top:
        -58,

      right:
        -34,
    },


    glowSecondary: {
      position:
        'absolute',

      width:
        90,

      height:
        90,

      borderRadius:
        45,

      bottom:
        -48,

      left:
        -32,
    },


    decorLine: {
      position:
        'absolute',

      width:
        110,

      height:
        1,

      right:
        -26,

      bottom:
        34,

      backgroundColor:
        'rgba(255,255,255,0.09)',

      transform: [
        {
          rotate:
            '-22deg',
        },
      ],
    },


    /* =====================================================
       ICONO
    ===================================================== */

    iconContainer: {
      width:
        42,

      height:
        42,

      borderRadius:
        14,

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    /* =====================================================
       TEXTO
    ===================================================== */

    textArea: {
      marginTop:
        11,

      paddingRight:
        17,
    },


    title: {
      color:
        '#FFFFFF',

      fontSize:
        14,

      fontWeight:
        '700',
    },


    subtitle: {
      color:
        'rgba(255,255,255,0.68)',

      fontSize:
        10,

      fontWeight:
        '500',

      marginTop:
        4,
    },


    /* =====================================================
       FLECHA
    ===================================================== */

    arrow: {
      position:
        'absolute',

      right:
        9,

      bottom:
        10,

      width:
        25,

      height:
        25,

      borderRadius:
        13,

      backgroundColor:
        'rgba(255,255,255,0.08)',

      alignItems:
        'center',

      justifyContent:
        'center',
    },
  });