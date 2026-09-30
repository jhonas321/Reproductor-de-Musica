package expo.modules.hmusicequalizer

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


  private fun releaseCurrent() {

    try {
      equalizer
        ?.enabled =
        false
    } catch (
      _: Exception
    ) {
    }


    try {
      equalizer
        ?.release()
    } catch (
      _: Exception
    ) {
    }


    equalizer =
      null
  }


  private fun requireEqualizer():
    Equalizer {

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
          "El ecualizador no está disponible: ${
            error.message
              ?: "error desconocido"
          }"
        )
      }


    equalizer =
      created


    return created
  }


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


  override fun definition() =
    ModuleDefinition {

      Name(
        "HmusicEqualizer"
      )


      AsyncFunction(
        "getEqualizerInfoAsync"
      ) {

        buildInfo()
      }


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


      AsyncFunction(
        "setAudioSessionIdAsync"
      ) {
        nextAudioSessionId:
          Int ->


        if (
          nextAudioSessionId <
          0
        ) {

          throw Exception(
            "audioSessionId no puede ser negativo."
          )
        }


        if (
          audioSessionId !=
          nextAudioSessionId
        ) {

          releaseCurrent()

          audioSessionId =
            nextAudioSessionId

          requireEqualizer()
        }


        buildInfo()
      }


      AsyncFunction(
        "releaseEqualizerAsync"
      ) {

        releaseCurrent()

        true
      }


      OnDestroy {

        releaseCurrent()
      }
    }
}