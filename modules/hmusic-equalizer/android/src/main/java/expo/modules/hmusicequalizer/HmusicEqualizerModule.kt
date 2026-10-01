package expo.modules.hmusicequalizer

import android.content.Context
import android.media.audiofx.Equalizer

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition


class HmusicEqualizerModule : Module() {

  private var equalizer:
    Equalizer? =
      null

  private var audioSessionId:
    Int =
      0


  /*
   * =========================================================
   * LIBERAR ECUALIZADOR ACTUAL
   * =========================================================
   */
  private fun releaseCurrent() {

    try {
      equalizer
        ?.enabled =
        false
    } catch (
      _:
        Throwable
    ) {
    }


    try {
      equalizer
        ?.release()
    } catch (
      _:
        Throwable
    ) {
    }


    equalizer =
      null
  }


  /*
   * =========================================================
   * OBTENER CONTEXTO ANDROID
   * =========================================================
   */
  private fun getAndroidContext():
    Context {

    return appContext
      .reactContext
      ?.applicationContext
      ?: throw Exception(
        "No se pudo acceder al contexto de Android."
      )
  }


  /*
   * =========================================================
   * OBTENER AUDIO SESSION ID GUARDADO POR RNTP
   * =========================================================
   */
  private fun getStoredAudioSessionId():
    Int {

    val context =
      getAndroidContext()


    val preferences =
      context
        .getSharedPreferences(
          "hmusic_audio_session",
          Context.MODE_PRIVATE
        )


    return preferences
      .getInt(
        "audio_session_id",
        0
      )
  }


  /*
   * =========================================================
   * ACTUALIZAR LA SESIÓN REAL
   * =========================================================
   */
  private fun syncAudioSessionId() {

    val storedSessionId =
      getStoredAudioSessionId()


    /*
     * Si RNTP todavía no guardó una sesión válida,
     * conservamos la sesión que pudiera haberse establecido
     * mediante setAudioSessionIdAsync().
     */
    if (
      storedSessionId <=
        0
    ) {

      return
    }


    /*
     * Si Media3 creó una nueva sesión,
     * liberamos el Equalizer anterior.
     */
    if (
      audioSessionId !=
        storedSessionId
    ) {

      releaseCurrent()

      audioSessionId =
        storedSessionId
    }
  }


  /*
   * =========================================================
   * OBTENER / CREAR ECUALIZADOR
   * =========================================================
   */
  private fun requireEqualizer():
    Equalizer {

    /*
     * Antes de crear el efecto,
     * sincronizamos la sesión del reproductor.
     */
    syncAudioSessionId()


    if (
      audioSessionId <=
        0
    ) {

      throw Exception(
        "Todavía no existe una sesión de audio activa. " +
          "Reproduce una canción e inténtalo nuevamente."
      )
    }


    val existing =
      equalizer


    if (
      existing !=
        null
    ) {

      return existing
    }


    val created =
      try {

        Equalizer(
          0,
          audioSessionId
        )

      } catch (
        error:
          Throwable
      ) {

        throw Exception(
          "El ecualizador no está disponible para la sesión " +
            "$audioSessionId: ${
              error.message
                ?: "error desconocido"
            }"
        )
      }


    equalizer =
      created


    return created
  }


  /*
   * =========================================================
   * LIMITAR NIVEL DE UNA BANDA
   * =========================================================
   */
  private fun clampLevel(
    eq:
      Equalizer,

    requestedLevel:
      Int
  ):
    Short {

    val range =
      eq.bandLevelRange


    val min =
      range[
        0
      ].toInt()


    val max =
      range[
        1
      ].toInt()


    return requestedLevel
      .coerceIn(
        min,
        max
      )
      .toShort()
  }


  /*
   * =========================================================
   * CONSTRUIR INFORMACIÓN DEL ECUALIZADOR
   * =========================================================
   */
  private fun buildInfo():
    Map<String, Any?> {

    val eq =
      requireEqualizer()


    val range =
      eq.bandLevelRange


    val minLevel =
      range[
        0
      ].toInt()


    val maxLevel =
      range[
        1
      ].toInt()


    val bandCount =
      eq.numberOfBands
        .toInt()


    val bands =
      mutableListOf<
        Map<String, Any?>
      >()


    for (
      index in
      0 until
        bandCount
    ) {

      val band =
        index
          .toShort()


      val frequencyHz =
        try {

          eq
            .getCenterFreq(
              band
            )
            .toDouble() /
            1000.0

        } catch (
          _:
            Throwable
        ) {

          0.0
        }


      val levelMb =
        try {

          eq
            .getBandLevel(
              band
            )
            .toInt()

        } catch (
          _:
            Throwable
        ) {

          0
        }


      bands.add(
        mapOf(
          "index" to
            index,

          "centerFrequencyHz" to
            frequencyHz,

          "levelMb" to
            levelMb
        )
      )
    }


    return mapOf(

      "supported" to
        true,

      "enabled" to
        try {

          eq.enabled

        } catch (
          _:
            Throwable
        ) {

          false
        },

      "audioSessionId" to
        audioSessionId,

      "minLevelMb" to
        minLevel,

      "maxLevelMb" to
        maxLevel,

      "bands" to
        bands
    )
  }


  /*
   * =========================================================
   * MÓDULO EXPO
   * =========================================================
   */
  override fun definition() =
    ModuleDefinition {

      Name(
        "HmusicEqualizer"
      )


      /*
       * -------------------------------------------------------
       * INFORMACIÓN DEL ECUALIZADOR
       * -------------------------------------------------------
       */
      AsyncFunction(
        "getEqualizerInfoAsync"
      ) {

        buildInfo()
      }


      /*
       * -------------------------------------------------------
       * ACTIVAR / DESACTIVAR
       * -------------------------------------------------------
       */
      AsyncFunction(
        "setEqualizerEnabledAsync"
      ) {
        enabled:
          Boolean ->


        val eq =
          requireEqualizer()


        eq.enabled =
          enabled


        buildInfo()
      }


      /*
       * -------------------------------------------------------
       * CAMBIAR UNA BANDA
       * -------------------------------------------------------
       */
      AsyncFunction(
        "setEqualizerBandLevelAsync"
      ) {
        bandIndex:
          Int,

        levelMb:
          Int ->


        val eq =
          requireEqualizer()


        val bandCount =
          eq.numberOfBands
            .toInt()


        if (
          bandIndex <
            0 ||
          bandIndex >=
            bandCount
        ) {

          throw Exception(
            "La banda $bandIndex no existe."
          )
        }


        eq.setBandLevel(
          bandIndex
            .toShort(),

          clampLevel(
            eq,
            levelMb
          )
        )


        buildInfo()
      }


      /*
       * -------------------------------------------------------
       * CAMBIAR TODAS LAS BANDAS
       * -------------------------------------------------------
       */
      AsyncFunction(
        "setEqualizerLevelsAsync"
      ) {
        levels:
          List<Int> ->


        val eq =
          requireEqualizer()


        val bandCount =
          eq.numberOfBands
            .toInt()


        val count =
          minOf(
            bandCount,
            levels.size
          )


        for (
          index in
          0 until
            count
        ) {

          eq.setBandLevel(
            index
              .toShort(),

            clampLevel(
              eq,
              levels[
                index
              ]
            )
          )
        }


        buildInfo()
      }


      /*
       * -------------------------------------------------------
       * RESTABLECER
       * -------------------------------------------------------
       */
      AsyncFunction(
        "resetEqualizerAsync"
      ) {

        val eq =
          requireEqualizer()


        val bandCount =
          eq.numberOfBands
            .toInt()


        for (
          index in
          0 until
            bandCount
        ) {

          eq.setBandLevel(
            index
              .toShort(),

            clampLevel(
              eq,
              0
            )
          )
        }


        buildInfo()
      }


      /*
       * -------------------------------------------------------
       * ESTABLECER SESIÓN MANUALMENTE
       *
       * Lo dejamos disponible por compatibilidad.
       * -------------------------------------------------------
       */
      AsyncFunction(
        "setAudioSessionIdAsync"
      ) {
        nextAudioSessionId:
          Int ->


        if (
          nextAudioSessionId <=
            0
        ) {

          throw Exception(
            "audioSessionId debe ser mayor que 0."
          )
        }


        if (
          audioSessionId !=
            nextAudioSessionId
        ) {

          releaseCurrent()

          audioSessionId =
            nextAudioSessionId
        }


        requireEqualizer()


        buildInfo()
      }


      /*
       * -------------------------------------------------------
       * LIBERAR
       * -------------------------------------------------------
       */
      AsyncFunction(
        "releaseEqualizerAsync"
      ) {

        releaseCurrent()

        true
      }


      /*
       * -------------------------------------------------------
       * DESTRUIR MÓDULO
       * -------------------------------------------------------
       */
      OnDestroy {

        releaseCurrent()
      }
    }
}