import { MaterialCommunityIcons } from "@expo/vector-icons";



import { StyleSheet, Text, TouchableOpacity, View } from "react-native";



/* =========================================================



   PROPS



\\========================================================= */



interface Props {

  songCount: number;



  albumCount: number;



  artistCount: number;



  playlistCount: number;



  favoriteCount: number;



  recentCount: number;



  favoritesOnly: boolean;



  onSongsPress: () => void;



  onAlbumsPress: () => void;



  onArtistsPress: () => void;



  onFoldersPress: () => void;



  onPlaylistsPress: () => void;



  onFavoritesPress: () => void;



  onRecentPress: () => void;



  onTopPress: () => void;

}



/* =========================================================



   TIPOS



\\========================================================= */



type CardSize = "hero" | "large" | "small" | "normal" | "wide";



interface BentoCardProps {

  title: string;



  subtitle: string;



  icon: keyof typeof MaterialCommunityIcons.glyphMap;



  size?: CardSize;



  active?: boolean;



  tint: string;



  activeTint?: string;



  onPress: () => void;

}



/* =========================================================



   TARJETA BENTO



\\========================================================= */



function BentoCard({

  title,



  subtitle,



  icon,



  size = "normal",



  active = false,



  tint,



  activeTint,



  onPress,

}: BentoCardProps) {

  const isHero = size === "hero";



  const isLarge = size === "large";



  const isSmall = size === "small";



  const isWide = size === "wide";



  return (

    <TouchableOpacity

      activeOpacity={0.84}

      onPress={onPress}

      style={[

        styles.card,



        isHero && styles.heroCard,



        isLarge && styles.largeCard,



        isSmall && styles.smallCard,



        isWide && styles.wideCard,



        active && styles.activeCard,

      ]}

    >

      {/* FONDO DE COLOR TIPO BLUR */}

      <View

        pointerEvents="none"

        style={[

          styles.colorBackdrop,



          {

            backgroundColor: active && activeTint ? activeTint : tint,

          },

        ]}

      />



      {/* CAPA DE PROFUNDIDAD */}

      <View pointerEvents="none" style={styles.colorDepth} />



      {/* REFLEJO SUPERIOR */}



      <View pointerEvents="none" style={styles.cardReflection} />



      {/* ICONO */}



      <View

        style={[

          styles.iconBox,



          isHero && styles.heroIconBox,



          isSmall && styles.smallIconBox,

        ]}

      >

        <MaterialCommunityIcons

          name={icon}

          size={isHero ? 30 : isSmall ? 20 : 23}

          color="#FFFFFF"

        />

      </View>



      {/* FLECHA */}



      <View

        style={[

          styles.arrowBox,



          isHero && styles.heroArrowBox,



          isSmall && styles.smallArrowBox,

        ]}

      >

        <MaterialCommunityIcons

          name="chevron-right"

          size={isHero ? 19 : 17}

          color="rgba(255,255,255,0.50)"

        />

      </View>



      {/* TEXTO */}



      <View

        style={[

          styles.textArea,



          isHero && styles.heroTextArea,



          isSmall && styles.smallTextArea,



          isWide && styles.wideTextArea,

        ]}

      >

        {isHero ? <Text style={styles.eyebrow}>TU MÚSICA</Text> : null}



        <Text

          style={[

            styles.title,



            isHero && styles.heroTitle,



            isLarge && styles.largeTitle,



            isSmall && styles.smallTitle,



            isWide && styles.wideTitle,

          ]}

          numberOfLines={1}

        >

          {title}

        </Text>



        <Text

          style={[

            styles.subtitle,



            isHero && styles.heroSubtitle,



            isSmall && styles.smallSubtitle,

          ]}

          numberOfLines={1}

        >

          {subtitle}

        </Text>

      </View>



      {/* INDICADOR ACTIVO */}



      {active ? (

        <View pointerEvents="none" style={styles.activeIndicator} />

      ) : null}

    </TouchableOpacity>

  );

}



/* =========================================================



   BENTO ESCALONADO



\\========================================================= */



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

    <View style={styles.container}>

      {/* ===============================================



          CANCIONES - HERO COMPLETO



      =============================================== */}



      <BentoCard

        title="Canciones"

        subtitle={`${songCount} canciones`}

        icon="music-note"

        tint="rgba(129,140,248,0.20)"

        activeTint="rgba(129,140,248,0.24)"

        size="hero"

        active={!favoritesOnly}

        onPress={onSongsPress}

      />



      {/* ===============================================



          FILA 1



          ÁLBUMES + ARTISTAS - MISMO TAMAÑO



      =============================================== */}



      <View style={styles.row}>

        <BentoCard

          title="Álbumes"

          subtitle={`${albumCount} álbumes`}

          icon="album"

          tint="rgba(139,92,246,0.20)"


          onPress={onAlbumsPress}

        />



        <BentoCard

          title="Artistas"

          subtitle={`${artistCount} artistas`}

          icon="microphone-outline"

          tint="rgba(217,70,239,0.19)"


          onPress={onArtistsPress}

        />

      </View>



      {/* ===============================================



          FILA 2



          CARPETAS + PLAYLISTS - MISMO TAMAÑO



      =============================================== */}



      <View style={styles.row}>

        <BentoCard

          title="Carpetas"

          subtitle="Explorar música"

          icon="folder-music-outline"

          tint="rgba(45,212,191,0.18)"


          onPress={onFoldersPress}

        />



        <BentoCard

          title="Playlists"

          subtitle={`${playlistCount} playlists`}

          icon="playlist-music-outline"

          tint="rgba(234,179,8,0.18)"


          onPress={onPlaylistsPress}

        />

      </View>



      {/* ===============================================



          FILA 3



          FAVORITOS + RECIENTES



      =============================================== */}



      <View style={styles.row}>

        <BentoCard

          title="Favoritos"

          subtitle={`${favoriteCount} canciones`}

          icon="heart-outline"

          tint="rgba(251,113,133,0.20)"

          activeTint="rgba(251,113,133,0.24)"

          active={favoritesOnly}

          onPress={onFavoritesPress}

        />



        <BentoCard

          title="Recientes"

          subtitle={`${recentCount} reproducciones`}

          icon="history"

          tint="rgba(56,189,248,0.19)"

          onPress={onRecentPress}

        />

      </View>



      {/* ===============================================



          MÁS ESCUCHADAS - HORIZONTAL



      =============================================== */}



      <BentoCard

        title="Más escuchadas"

        subtitle="Tus canciones favoritas"

        icon="fire"

        tint="rgba(251,146,60,0.19)"

        size="wide"

        onPress={onTopPress}

      />

    </View>

  );

}



/* =========================================================



   ESTILOS



\\========================================================= */



const styles = StyleSheet.create({

  container: {

    width: "100%",



    marginBottom: 28,

  },



  row: {

    width: "100%",



    flexDirection: "row",



    justifyContent: "space-between",



    alignItems: "stretch",



    marginTop: 8,

  },



  /* =====================================================



       TARJETAS



       Mantengo la misma paleta del diseño anterior.



    ===================================================== */



  card: {

    width: "48.3%",



    minHeight: 90,



    borderRadius: 22,



    paddingHorizontal: 12,



    paddingVertical: 10,



    overflow: "hidden",



    justifyContent: "space-between",



    backgroundColor: "rgba(10,12,18,0.08)",



    borderWidth: StyleSheet.hairlineWidth,



    borderColor: "rgba(255,255,255,0.14)",

  },



  heroCard: {

    width: "100%",



    minHeight: 116,



    borderRadius: 24,



    paddingHorizontal: 14,



    paddingVertical: 12,



    backgroundColor: "rgba(10,12,18,0.08)",



    borderColor: "rgba(255,255,255,0.15)",

  },



  largeCard: {

    width: "61.8%",



    minHeight: 132,

  },



  smallCard: {

    width: "35.2%",



    minHeight: 132,



    paddingHorizontal: 13,



    paddingVertical: 13,

  },



  wideCard: {

    width: "100%",



    minHeight: 78,



    marginTop: 8,



    paddingHorizontal: 12,



    paddingVertical: 9,

  },



  activeCard: {

    backgroundColor: "rgba(21,23,30,0.42)",



    borderColor: "rgba(255,255,255,0.22)",

  },



  colorBackdrop: {

    position: "absolute",



    top: 0,



    right: 0,



    bottom: 0,



    left: 0,

  },



  colorDepth: {

    position: "absolute",



    top: 0,



    right: 0,



    bottom: 0,



    left: 0,



    backgroundColor: "rgba(8,10,16,0.10)",

  },



  cardReflection: {

    position: "absolute",



    top: 0,



    left: 20,



    right: 20,



    height: StyleSheet.hairlineWidth,



    backgroundColor: "rgba(255,255,255,0.18)",

  },



  activeIndicator: {

    position: "absolute",



    left: 17,



    bottom: 0,



    width: 27,



    height: 2,



    borderRadius: 2,



    backgroundColor: "rgba(255,255,255,0.58)",

  },



  /* =====================================================



       ICONOS



    ===================================================== */



  iconBox: {

    width: 36,



    height: 36,



    borderRadius: 12,



    alignItems: "center",



    justifyContent: "center",



    backgroundColor: "rgba(255,255,255,0.075)",



    borderWidth: StyleSheet.hairlineWidth,



    borderColor: "rgba(255,255,255,0.09)",

  },



  heroIconBox: {

    width: 42,



    height: 42,



    borderRadius: 14,

  },



  smallIconBox: {

    width: 38,



    height: 38,



    borderRadius: 13,

  },



  /* =====================================================



       FLECHAS



    ===================================================== */



  arrowBox: {

    position: "absolute",



    top: 14,



    right: 13,



    width: 29,



    height: 29,



    borderRadius: 15,



    alignItems: "center",



    justifyContent: "center",

  },



  heroArrowBox: {

    top: 17,



    right: 17,



    width: 34,



    height: 34,

  },



  smallArrowBox: {

    top: 12,



    right: 10,



    width: 25,



    height: 25,

  },



  /* =====================================================



       TEXTO



    ===================================================== */



  textArea: {

    marginTop: 10,



    paddingRight: 5,

  },



  heroTextArea: {

    marginTop: 13,

  },



  smallTextArea: {

    marginTop: 18,



    paddingRight: 0,

  },



  wideTextArea: {

    marginTop: 8,



    width: "75%",

  },



  eyebrow: {

    color: "rgba(255,255,255,0.42)",



    fontSize: 9,



    fontWeight: "700",



    letterSpacing: 1.4,



    marginBottom: 5,

  },



  title: {

    color: "rgba(255,255,255,0.94)",



    fontSize: 13,



    fontWeight: "700",



    letterSpacing: -0.15,

  },



  heroTitle: {

    color: "#FFFFFF",



    fontSize: 21,



    fontWeight: "800",



    letterSpacing: -0.5,

  },



  largeTitle: {

    fontSize: 16,

  },



  smallTitle: {

    fontSize: 13,

  },



  wideTitle: {

    fontSize: 14,

  },



  subtitle: {

    color: "rgba(255,255,255,0.46)",



    fontSize: 10,



    fontWeight: "500",



    marginTop: 4,

  },



  heroSubtitle: {

    color: "rgba(255,255,255,0.56)",



    fontSize: 11,



    marginTop: 5,

  },



  smallSubtitle: {

    fontSize: 9,

  },

});
