const fs = require("fs");
const path = require("path");

const EXPECTED_EXPO_AUDIO_VERSION = "57.0.4";

/*
 * IMPORTANTE:
 * Este parche NO modifica Audio Focus.
 *
 * Solo toca:
 * - pausa al desconectar Bluetooth/auriculares
 * - opciones Previous/Next
 * - MediaSession
 * - notificación Android
 * - callbacks remotos hacia JavaScript
 *
 * Así evitamos reintroducir el problema donde la música
 * sonaba ~1 segundo y después se quedaba en silencio.
 */

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `[Hmusic] No se encontró el archivo requerido de expo-audio: ${filePath}`
    );
  }

  return fs.readFileSync(filePath, "utf8");
}

function writeIfChanged(filePath, before, after) {
  if (before === after) {
    return false;
  }

  fs.writeFileSync(filePath, after, "utf8");
  return true;
}

function fail(label, extra = "") {
  throw new Error(
    `[Hmusic] No se pudo aplicar el parche "${label}". ` +
      "La estructura de expo-audio 57.0.4 no coincide con la esperada." +
      (extra ? ` ${extra}` : "")
  );
}

/* =========================================================
   1. PAUSAR AL DESCONECTAR BLUETOOTH / AURICULARES
========================================================= */

function patchAudioPlayer(expoAudioRoot) {
  const filePath = path.join(
    expoAudioRoot,
    "android",
    "src",
    "main",
    "java",
    "expo",
    "modules",
    "audio",
    "AudioPlayer.kt"
  );

  const original = readText(filePath);
  let patched = original;

  if (!patched.includes(".setHandleAudioBecomingNoisy(true)")) {
    const target = ".setAudioAttributes(AudioAttributes.DEFAULT, false)";

    if (!patched.includes(target)) {
      fail("pausa al desconectar Bluetooth/auriculares");
    }

    patched = patched.replace(
      target,
      `${target}\n      .setHandleAudioBecomingNoisy(true)`
    );
  }

  if (!patched.includes("HMUSIC_EQUALIZER_V1")) {
    if (!patched.includes("import android.media.audiofx.Visualizer")) {
      fail("import del ecualizador");
    }

    patched = patched.replace(
      "import android.media.audiofx.Visualizer",
      "import android.media.audiofx.Equalizer\nimport android.media.audiofx.Visualizer"
    );

    const fields =
      "  private var samplingEnabled = false\n" +
      "  private var visualizer: Visualizer? = null";

    if (!patched.includes(fields)) {
      fail("campos del ecualizador");
    }

    patched = patched.replace(
      fields,
`  private var samplingEnabled = false
  private var visualizer: Visualizer? = null

  // HMUSIC_EQUALIZER_V1
  private var hmusicEqualizer: Equalizer? = null
  private var hmusicEqualizerSessionId: Int = -1
  private var hmusicEqualizerEnabled: Boolean = false
  private var hmusicEqualizerLevels: List<Short>? = null`
    );

    const insertionPoint = "  override fun setPlaybackRate(rate: Float) {";

    if (!patched.includes(insertionPoint)) {
      fail("métodos del ecualizador");
    }

    const methods = `  private fun releaseHmusicEqualizerInternal() {
    try {
      hmusicEqualizer?.enabled = false
    } catch (_: Exception) {
    }

    try {
      hmusicEqualizer?.release()
    } catch (_: Exception) {
    }

    hmusicEqualizer = null
    hmusicEqualizerSessionId = -1
  }

  private fun ensureHmusicEqualizer(): Equalizer {
    val sessionId = ref.audioSessionId

    if (sessionId <= 0) {
      throw Exception(
        "El ecualizador todavía no puede conectarse al audio. Reproduce una canción primero."
      )
    }

    if (
      hmusicEqualizer == null ||
      hmusicEqualizerSessionId != sessionId
    ) {
      releaseHmusicEqualizerInternal()

      val effect =
        try {
          Equalizer(
            0,
            sessionId
          )
        } catch (error: Exception) {
          throw Exception(
            "Este dispositivo no pudo crear el ecualizador: \${error.message}",
            error
          )
        }

      hmusicEqualizer = effect
      hmusicEqualizerSessionId = sessionId

      val savedLevels =
        hmusicEqualizerLevels

      if (savedLevels != null) {
        val bandCount =
          effect.numberOfBands.toInt()

        val range =
          effect.bandLevelRange

        val minLevel =
          range[0].toInt()

        val maxLevel =
          range[1].toInt()

        savedLevels
          .take(
            bandCount
          )
          .forEachIndexed {
            index,
            value ->

            effect.setBandLevel(
              index.toShort(),
              value
                .toInt()
                .coerceIn(
                  minLevel,
                  maxLevel
                )
                .toShort()
            )
          }
      }

      effect.enabled =
        hmusicEqualizerEnabled
    }

    return hmusicEqualizer
      ?: throw Exception(
        "No se pudo inicializar el ecualizador."
      )
  }

  fun getHmusicEqualizerInfo():
    Map<String, Any?> {

    val effect =
      ensureHmusicEqualizer()

    val range =
      effect.bandLevelRange

    val bandCount =
      effect.numberOfBands.toInt()

    val bands =
      (0 until bandCount)
        .map { index ->

          val band =
            index.toShort()

          mapOf(
            "index" to
              index,

            "centerFrequencyHz" to
              (
                effect.getCenterFreq(
                  band
                ) /
                  1000
              ),

            "levelMb" to
              effect
                .getBandLevel(
                  band
                )
                .toInt()
          )
        }

    return mapOf(
      "supported" to
        true,

      "enabled" to
        effect.enabled,

      "audioSessionId" to
        hmusicEqualizerSessionId,

      "minLevelMb" to
        range[0].toInt(),

      "maxLevelMb" to
        range[1].toInt(),

      "bands" to
        bands
    )
  }

  fun setHmusicEqualizerEnabled(
    enabled:
      Boolean
  ):
    Map<String, Any?> {

    hmusicEqualizerEnabled =
      enabled

    if (!enabled) {
      try {
        hmusicEqualizer?.enabled =
          false
      } catch (_: Exception) {
      }

      return mapOf(
        "enabled" to
          false
      )
    }

    val effect =
      ensureHmusicEqualizer()

    effect.enabled =
      true

    return mapOf(
      "enabled" to
        effect.enabled
    )
  }

  fun setHmusicEqualizerBandLevel(
    bandIndex:
      Int,

    levelMb:
      Int
  ):
    Map<String, Any?> {

    val effect =
      ensureHmusicEqualizer()

    val bandCount =
      effect.numberOfBands.toInt()

    if (
      bandIndex < 0 ||
      bandIndex >= bandCount
    ) {
      throw Exception(
        "Banda de ecualizador inválida: \$bandIndex"
      )
    }

    val range =
      effect.bandLevelRange

    val safeLevel =
      levelMb.coerceIn(
        range[0].toInt(),
        range[1].toInt()
      )

    effect.setBandLevel(
      bandIndex.toShort(),
      safeLevel.toShort()
    )

    hmusicEqualizerLevels =
      (0 until bandCount)
        .map { index ->
          effect
            .getBandLevel(
              index.toShort()
            )
        }

    return mapOf(
      "bandIndex" to
        bandIndex,

      "levelMb" to
        safeLevel
    )
  }

  fun setHmusicEqualizerLevels(
    levelsMb:
      List<Int>
  ):
    Map<String, Any?> {

    val effect =
      ensureHmusicEqualizer()

    val bandCount =
      effect.numberOfBands.toInt()

    val range =
      effect.bandLevelRange

    val minLevel =
      range[0].toInt()

    val maxLevel =
      range[1].toInt()

    val applied =
      mutableListOf<Int>()

    (0 until bandCount)
      .forEach { index ->

        val requested =
          levelsMb
            .getOrNull(
              index
            )
            ?: 0

        val safeLevel =
          requested.coerceIn(
            minLevel,
            maxLevel
          )

        effect.setBandLevel(
          index.toShort(),
          safeLevel.toShort()
        )

        applied.add(
          safeLevel
        )
      }

    hmusicEqualizerLevels =
      applied.map {
        it.toShort()
      }

    return mapOf(
      "levelsMb" to
        applied
    )
  }

  fun resetHmusicEqualizer():
    Map<String, Any?> {

    val effect =
      ensureHmusicEqualizer()

    val bandCount =
      effect.numberOfBands.toInt()

    (0 until bandCount)
      .forEach { index ->
        effect.setBandLevel(
          index.toShort(),
          0
        )
      }

    hmusicEqualizerLevels =
      List(
        bandCount
      ) {
        0.toShort()
      }

    return mapOf(
      "levelsMb" to
        List(
          bandCount
        ) {
          0
        }
    )
  }

  fun releaseHmusicEqualizer() {
    releaseHmusicEqualizerInternal()
  }

`;

    patched = patched.replace(
      insertionPoint,
      methods + insertionPoint
    );

    const sharedRelease =
      "  override fun sharedObjectDidRelease() {\n" +
      "    serviceConnection.release()";

    if (!patched.includes(sharedRelease)) {
      fail("liberación del ecualizador");
    }

    patched = patched.replace(
      sharedRelease,
      "  override fun sharedObjectDidRelease() {\n" +
        "    releaseHmusicEqualizerInternal()\n" +
        "    serviceConnection.release()"
    );

    const playerRelease =
      "    visualizer?.release()\n" +
      "    super.releasePlayer()";

    if (!patched.includes(playerRelease)) {
      fail("releasePlayer del ecualizador");
    }

    patched = patched.replace(
      playerRelease,
      "    visualizer?.release()\n" +
        "    releaseHmusicEqualizerInternal()\n" +
        "    super.releasePlayer()"
    );
  }

  return writeIfChanged(
    filePath,
    original,
    patched
  );
}

/* =========================================================
   2. EXPONER ECUALIZADOR A JAVASCRIPT
========================================================= */

function patchAudioModuleEqualizer(expoAudioRoot) {
  const filePath = path.join(
    expoAudioRoot,
    "android",
    "src",
    "main",
    "java",
    "expo",
    "modules",
    "audio",
    "AudioModule.kt"
  );

  const original = readText(filePath);
  let patched = original;

  /*
   * V1: dejamos los métodos dentro de Class(AudioPlayer::class)
   * por compatibilidad, pero la app usará el bridge V2.
   */
  if (
    !patched.includes(
      'Function("getHmusicEqualizerInfo") { player: AudioPlayer ->'
    )
  ) {
    const target = `      Function("setAudioSamplingEnabled") { player: AudioPlayer, enabled: Boolean ->
        runOnMain {
          player.setSamplingEnabled(enabled)
        }
      }
`;

    if (!patched.includes(target)) {
      fail(
        "bridge JavaScript del ecualizador V1",
        'No se encontró Function("setAudioSamplingEnabled") en AudioModule.kt.'
      );
    }

    const equalizerBridge = `${target}
      /*
       * HMUSIC_EQUALIZER_V1
       */

      Function("getHmusicEqualizerInfo") { player: AudioPlayer ->
        runOnMain {
          player.getHmusicEqualizerInfo()
        }
      }

      Function("setHmusicEqualizerEnabled") { player: AudioPlayer, enabled: Boolean ->
        runOnMain {
          player.setHmusicEqualizerEnabled(
            enabled
          )
        }
      }

      Function("setHmusicEqualizerBandLevel") {
          player: AudioPlayer,
          bandIndex: Int,
          levelMb: Int ->

        runOnMain {
          player.setHmusicEqualizerBandLevel(
            bandIndex,
            levelMb
          )
        }
      }

      Function("setHmusicEqualizerLevels") {
          player: AudioPlayer,
          levelsMb: List<Int> ->

        runOnMain {
          player.setHmusicEqualizerLevels(
            levelsMb
          )
        }
      }

      Function("resetHmusicEqualizer") { player: AudioPlayer ->
        runOnMain {
          player.resetHmusicEqualizer()
        }
      }

      Function("releaseHmusicEqualizer") { player: AudioPlayer ->
        runOnMain {
          player.releaseHmusicEqualizer()
        }
      }
`;

    patched =
      patched.replace(
        target,
        equalizerBridge
      );
  }

  /*
   * V2:
   * Funciones a nivel de módulo ExpoAudio.
   * JavaScript las llama pasando player.id.
   */
  if (
    !patched.includes(
      "HMUSIC_EQUALIZER_MODULE_V2"
    )
  ) {
    const classTarget =
      "    Class(AudioPlayer::class) {";

    if (
      !patched.includes(
        classTarget
      )
    ) {
      fail(
        "bridge JavaScript del ecualizador V2",
        "No se encontró Class(AudioPlayer::class)."
      );
    }

    const moduleBridge = `    /*
     * HMUSIC_EQUALIZER_MODULE_V2
     */

    Function("hmusicGetEqualizerInfo") { playerId: String ->
      runOnMain {
        val player =
          players[playerId]
            ?: throw IllegalStateException(
              "No se encontró el reproductor Hmusic: $playerId"
            )

        player.getHmusicEqualizerInfo()
      }
    }

    Function("hmusicSetEqualizerEnabled") {
        playerId: String,
        enabled: Boolean ->

      runOnMain {
        val player =
          players[playerId]
            ?: throw IllegalStateException(
              "No se encontró el reproductor Hmusic: $playerId"
            )

        player.setHmusicEqualizerEnabled(
          enabled
        )
      }
    }

    Function("hmusicSetEqualizerBandLevel") {
        playerId: String,
        bandIndex: Int,
        levelMb: Int ->

      runOnMain {
        val player =
          players[playerId]
            ?: throw IllegalStateException(
              "No se encontró el reproductor Hmusic: $playerId"
            )

        player.setHmusicEqualizerBandLevel(
          bandIndex,
          levelMb
        )
      }
    }

    Function("hmusicSetEqualizerLevels") {
        playerId: String,
        levelsMb: List<Int> ->

      runOnMain {
        val player =
          players[playerId]
            ?: throw IllegalStateException(
              "No se encontró el reproductor Hmusic: $playerId"
            )

        player.setHmusicEqualizerLevels(
          levelsMb
        )
      }
    }

    Function("hmusicResetEqualizer") { playerId: String ->
      runOnMain {
        val player =
          players[playerId]
            ?: throw IllegalStateException(
              "No se encontró el reproductor Hmusic: $playerId"
            )

        player.resetHmusicEqualizer()
      }
    }

`;

    patched =
      patched.replace(
        classTarget,
        moduleBridge +
          classTarget
      );
  }

  return writeIfChanged(
    filePath,
    original,
    patched
  );
}

/* =========================================================
   3. OPCIONES NEXT / PREVIOUS EN LOCK SCREEN
========================================================= */

function patchAudioRecords(expoAudioRoot) {
  const filePath = path.join(
    expoAudioRoot,
    "android",
    "src",
    "main",
    "java",
    "expo",
    "modules",
    "audio",
    "AudioRecords.kt"
  );

  const original = readText(filePath);

  if (
    original.includes("showNextTrack") &&
    original.includes("showPreviousTrack")
  ) {
    return false;
  }

  const classRegex =
    /class AudioLockScreenOptions\(([\s\S]*?)\n\)\s*:\s*Record/;

  const match = original.match(classRegex);

  if (!match) {
    fail("opciones next/previous en AudioLockScreenOptions");
  }

  let params = match[1].replace(/\s+$/, "");

  if (!params.trim().endsWith(",")) {
    params += ",";
  }

  params +=
    "\n  @Field val showNextTrack: Boolean = false," +
    "\n  @Field val showPreviousTrack: Boolean = false";

  const replacement = `class AudioLockScreenOptions(${params}\n) : Record`;

  const patched = original.replace(classRegex, replacement);

  return writeIfChanged(filePath, original, patched);
}

/* =========================================================
   4. CALLBACK DE MEDIASESSION
========================================================= */

function patchMediaSessionCallback(expoAudioRoot) {
  const filePath = path.join(
    expoAudioRoot,
    "android",
    "src",
    "main",
    "java",
    "expo",
    "modules",
    "audio",
    "service",
    "AudioMediaSessionCallback.kt"
  );

  const original = readText(filePath);

  // V2: además de eventos KEYCODE_MEDIA_NEXT/PREVIOUS, intercepta
  // comandos de transporte enviados por Bluetooth/AVRCP/MediaController.
  if (original.includes("HMUSIC_HEADSET_TRANSPORT_V2")) {
    return false;
  }

  const patched = `package expo.modules.audio.service

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import androidx.annotation.OptIn
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

@OptIn(UnstableApi::class)
class AudioMediaSessionCallback(
  private val onCustomAction: ((String) -> Unit)? = null
) : MediaSession.Callback {

  companion object {
    private const val HMUSIC_HEADSET_TRANSPORT_V2 = true
  }

  override fun onConnect(
    session: MediaSession,
    controller: MediaSession.ControllerInfo
  ): MediaSession.ConnectionResult {
    return try {
      MediaSession.ConnectionResult.AcceptedResultBuilder(session)
        .setAvailablePlayerCommands(
          MediaSession.ConnectionResult.DEFAULT_PLAYER_COMMANDS.buildUpon()
            .add(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM)
            .add(Player.COMMAND_SEEK_FORWARD)
            .add(Player.COMMAND_SEEK_BACK)
            .add(Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM)
            .add(Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM)
            .add(Player.COMMAND_SEEK_TO_PREVIOUS)
            .add(Player.COMMAND_SEEK_TO_NEXT)
            .build()
        )
        .setAvailableSessionCommands(
          MediaSession.ConnectionResult.DEFAULT_SESSION_COMMANDS.buildUpon()
            .add(SessionCommand(AudioControlsService.ACTION_SEEK_BACKWARD, Bundle.EMPTY))
            .add(SessionCommand(AudioControlsService.ACTION_SEEK_FORWARD, Bundle.EMPTY))
            .add(SessionCommand(AudioControlsService.ACTION_NEXT_TRACK, Bundle.EMPTY))
            .add(SessionCommand(AudioControlsService.ACTION_PREVIOUS_TRACK, Bundle.EMPTY))
            .build()
        )
        .build()
    } catch (_: Exception) {
      MediaSession.ConnectionResult.reject()
    }
  }

  override fun onCustomCommand(
    session: MediaSession,
    controller: MediaSession.ControllerInfo,
    command: SessionCommand,
    args: Bundle
  ): ListenableFuture<SessionResult> {
    when (command.customAction) {
      AudioControlsService.ACTION_SEEK_FORWARD -> {
        session.player.seekTo(
          session.player.currentPosition + AudioControlsService.SEEK_INTERVAL_MS
        )
      }

      AudioControlsService.ACTION_SEEK_BACKWARD -> {
        session.player.seekTo(
          session.player.currentPosition - AudioControlsService.SEEK_INTERVAL_MS
        )
      }

      AudioControlsService.ACTION_NEXT_TRACK,
      AudioControlsService.ACTION_PREVIOUS_TRACK -> {
        onCustomAction?.invoke(command.customAction)
      }
    }

    return Futures.immediateFuture(
      SessionResult(SessionResult.RESULT_SUCCESS)
    )
  }

  /*
   * Algunos auriculares Bluetooth envían NEXT/PREVIOUS como un
   * KeyEvent multimedia tradicional. Lo consumimos aquí y avisamos
   * a JavaScript mediante el evento remoto de Hmusic.
   */
  override fun onMediaButtonEvent(
    session: MediaSession,
    controllerInfo: MediaSession.ControllerInfo,
    intent: Intent
  ): Boolean {
    @Suppress("DEPRECATION")
    val keyEvent =
      intent.getParcelableExtra<KeyEvent>(Intent.EXTRA_KEY_EVENT)

    if (
      keyEvent?.action == KeyEvent.ACTION_DOWN &&
      keyEvent.repeatCount == 0
    ) {
      when (keyEvent.keyCode) {
        KeyEvent.KEYCODE_MEDIA_NEXT -> {
          onCustomAction?.invoke(
            AudioControlsService.ACTION_NEXT_TRACK
          )
          return true
        }

        KeyEvent.KEYCODE_MEDIA_PREVIOUS -> {
          onCustomAction?.invoke(
            AudioControlsService.ACTION_PREVIOUS_TRACK
          )
          return true
        }
      }
    }

    return super.onMediaButtonEvent(
      session,
      controllerInfo,
      intent
    )
  }

  /*
   * Otros dispositivos Bluetooth/AVRCP no entregan un KeyEvent.
   * En su lugar mandan directamente un comando de transporte a la
   * MediaSession. Esta era la ruta que faltaba en el parche anterior.
   *
   * Interceptamos los cuatro comandos que Android/Media3 puede usar
   * para "siguiente" y "anterior", emitimos el evento hacia Hmusic y
   * bloqueamos el seek interno de ExoPlayer porque la cola real la
   * administra el PlayerContext de JavaScript.
   */
  @Suppress("DEPRECATION")
  override fun onPlayerCommandRequest(
    session: MediaSession,
    controller: MediaSession.ControllerInfo,
    playerCommand: Int
  ): Int {
    return when (playerCommand) {
      Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM,
      Player.COMMAND_SEEK_TO_NEXT -> {
        onCustomAction?.invoke(
          AudioControlsService.ACTION_NEXT_TRACK
        )
        SessionResult.RESULT_ERROR_NOT_SUPPORTED
      }

      Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM,
      Player.COMMAND_SEEK_TO_PREVIOUS -> {
        onCustomAction?.invoke(
          AudioControlsService.ACTION_PREVIOUS_TRACK
        )
        SessionResult.RESULT_ERROR_NOT_SUPPORTED
      }

      else -> SessionResult.RESULT_SUCCESS
    }
  }
}
`;

  return writeIfChanged(filePath, original, patched);
}

/* =========================================================
   5. SERVICIO DE CONTROLES ANDROID
========================================================= */

function patchAudioControlsService(expoAudioRoot) {
  const filePath = path.join(
    expoAudioRoot,
    "android",
    "src",
    "main",
    "java",
    "expo",
    "modules",
    "audio",
    "service",
    "AudioControlsService.kt"
  );

  const original = readText(filePath);
  let patched = original;

  /* ---------------------------------------------------------
     A. EVENTOS NEXT / PREVIOUS EN onStartCommand
  --------------------------------------------------------- */

  if (!patched.includes('emit("onRemoteNextTrack"')) {
    const actionRegex =
      /(^[ \t]*ACTION_SEEK_BACKWARD\s*->\s*currentPlayerRef\.seekTo\([^\n]*SEEK_INTERVAL_MS\)[ \t]*$)/m;

    const match = patched.match(actionRegex);

    if (!match) {
      fail(
        "eventos next/previous del servicio",
        "No se encontró ACTION_SEEK_BACKWARD en onStartCommand."
      );
    }

    const indent = match[1].match(/^[ \t]*/)[0];

    const insertion =
      `${match[1]}\n` +
      `${indent}ACTION_NEXT_TRACK -> currentPlayer?.emit("onRemoteNextTrack", emptyMap<String, Any?>())\n` +
      `${indent}ACTION_PREVIOUS_TRACK -> currentPlayer?.emit("onRemotePreviousTrack", emptyMap<String, Any?>())`;

    patched = patched.replace(actionRegex, insertion);
  }

  /* ---------------------------------------------------------
     B. NOTIFICACIÓN ANDROID <= 12L:
        PREVIOUS antes de Play/Pause
  --------------------------------------------------------- */

  if (!patched.includes("// HMUSIC: Previous notification action")) {
    const seekBackwardNotificationRegex =
      /([ \t]*if\s*\(currentOptions\?\.showSeekBackward\s*==\s*true\)\s*\{[\s\S]*?compactViewIndices\.add\(currentIndex\)[\s\S]*?currentIndex\+\+\s*\n[ \t]*\})/;

    const match = patched.match(seekBackwardNotificationRegex);

    if (!match) {
      fail(
        "botón previous en notificación Android",
        "No se encontró el bloque showSeekBackward."
      );
    }

    const indent = match[1].match(/^[ \t]*/)[0];

    const previousNotification =
      `${match[1]}\n\n` +
      `${indent}// HMUSIC: Previous notification action\n` +
      `${indent}if (currentOptions?.showPreviousTrack == true) {\n` +
      `${indent}  builder.addAction(\n` +
      `${indent}    NotificationCompat.Action(\n` +
      `${indent}      androidx.media3.session.R.drawable.media3_icon_previous,\n` +
      `${indent}      "Previous",\n` +
      `${indent}      buildActionPendingIntent(ACTION_PREVIOUS_TRACK)\n` +
      `${indent}    )\n` +
      `${indent}  )\n` +
      `${indent}  compactViewIndices.add(currentIndex)\n` +
      `${indent}  currentIndex++\n` +
      `${indent}}`;

    patched = patched.replace(
      seekBackwardNotificationRegex,
      previousNotification
    );
  }

  /* ---------------------------------------------------------
     C. NOTIFICACIÓN ANDROID <= 12L:
        NEXT después de Play/Pause y antes de seekForward
  --------------------------------------------------------- */

  if (!patched.includes("// HMUSIC: Next notification action")) {
    const seekForwardStartRegex =
      /(^[ \t]*if\s*\(currentOptions\?\.showSeekForward\s*==\s*true\)\s*\{)/m;

    const match = patched.match(seekForwardStartRegex);

    if (!match) {
      fail(
        "botón next en notificación Android",
        "No se encontró el bloque showSeekForward."
      );
    }

    const indent = match[1].match(/^[ \t]*/)[0];

    const nextNotification =
      `${indent}// HMUSIC: Next notification action\n` +
      `${indent}if (currentOptions?.showNextTrack == true) {\n` +
      `${indent}  builder.addAction(\n` +
      `${indent}    NotificationCompat.Action(\n` +
      `${indent}      androidx.media3.session.R.drawable.media3_icon_next,\n` +
      `${indent}      "Next",\n` +
      `${indent}      buildActionPendingIntent(ACTION_NEXT_TRACK)\n` +
      `${indent}    )\n` +
      `${indent}  )\n` +
      `${indent}  compactViewIndices.add(currentIndex)\n` +
      `${indent}  currentIndex++\n` +
      `${indent}}\n\n` +
      match[1];

    patched = patched.replace(
      seekForwardStartRegex,
      nextNotification
    );
  }

  /* ---------------------------------------------------------
     D. MEDIASESSION:
        aquí expo-audio 57.0.4 usa mediaButtons,
        NO customLayout.
  --------------------------------------------------------- */

  if (!patched.includes("// HMUSIC: Previous MediaSession button")) {
    const mediaButtonsRegex =
      /(^[ \t]*val\s+mediaButtons\s*=\s*mutableListOf<CommandButton>\(\)[ \t]*$)/m;

    const match = patched.match(mediaButtonsRegex);

    if (!match) {
      fail(
        "botón previous en MediaSession",
        'No se encontró "val mediaButtons = mutableListOf<CommandButton>()".'
      );
    }

    const indent = match[1].match(/^[ \t]*/)[0];

    const previousMediaButton =
      `${match[1]}\n\n` +
      `${indent}// HMUSIC: Previous MediaSession button\n` +
      `${indent}if (currentOptions?.showPreviousTrack == true) {\n` +
      `${indent}  mediaButtons.add(\n` +
      `${indent}    CommandButton.Builder(CommandButton.ICON_PREVIOUS)\n` +
      `${indent}      .setDisplayName("Previous")\n` +
      `${indent}      .setEnabled(true)\n` +
      `${indent}      .setSessionCommand(SessionCommand(ACTION_PREVIOUS_TRACK, Bundle.EMPTY))\n` +
      `${indent}      .setSlots(CommandButton.SLOT_BACK)\n` +
      `${indent}      .build()\n` +
      `${indent}  )\n` +
      `${indent}}`;

    patched = patched.replace(
      mediaButtonsRegex,
      previousMediaButton
    );
  }

  if (!patched.includes("// HMUSIC: Next MediaSession button")) {
    const setCustomLayoutRegex =
      /(^[ \t]*session\.setCustomLayout\(mediaButtons\)[ \t]*$)/m;

    const match = patched.match(setCustomLayoutRegex);

    if (!match) {
      fail(
        "botón next en MediaSession",
        'No se encontró "session.setCustomLayout(mediaButtons)".'
      );
    }

    const indent = match[1].match(/^[ \t]*/)[0];

    const nextMediaButton =
      `${indent}// HMUSIC: Next MediaSession button\n` +
      `${indent}if (currentOptions?.showNextTrack == true) {\n` +
      `${indent}  mediaButtons.add(\n` +
      `${indent}    CommandButton.Builder(CommandButton.ICON_NEXT)\n` +
      `${indent}      .setDisplayName("Next")\n` +
      `${indent}      .setEnabled(true)\n` +
      `${indent}      .setSessionCommand(SessionCommand(ACTION_NEXT_TRACK, Bundle.EMPTY))\n` +
      `${indent}      .setSlots(CommandButton.SLOT_FORWARD)\n` +
      `${indent}      .build()\n` +
      `${indent}  )\n` +
      `${indent}}\n\n` +
      match[1];

    patched = patched.replace(
      setCustomLayoutRegex,
      nextMediaButton
    );
  }

  /* ---------------------------------------------------------
     E. MEDIASESSION CALLBACK
        En tu archivo aparecen DOS Builder(...).setCallback(...)
  --------------------------------------------------------- */

  if (!patched.includes("AudioMediaSessionCallback { action ->")) {
    const callbackRegex =
      /\.setCallback\(\s*AudioMediaSessionCallback\(\)\s*\)/g;

    const matches = [...patched.matchAll(callbackRegex)];

    if (matches.length === 0) {
      fail(
        "callback next/previous de MediaSession",
        "No se encontró AudioMediaSessionCallback()."
      );
    }

    patched = patched.replace(
      callbackRegex,
      `.setCallback(AudioMediaSessionCallback { action ->
            when (action) {
              ACTION_NEXT_TRACK ->
                currentPlayer?.emit("onRemoteNextTrack", emptyMap<String, Any?>())

              ACTION_PREVIOUS_TRACK ->
                currentPlayer?.emit("onRemotePreviousTrack", emptyMap<String, Any?>())
            }
          })`
    );
  }

  /* ---------------------------------------------------------
     F. CONSTANTES
  --------------------------------------------------------- */

  if (
    !patched.includes(
      'ACTION_NEXT_TRACK = "expo.modules.audio.action.NEXT_TRACK"'
    )
  ) {
    const seekBackwardConstRegex =
      /(^[ \t]*const\s+val\s+ACTION_SEEK_BACKWARD\s*=\s*"expo\.modules\.audio\.action\.SEEK_BACKWARD"[ \t]*$)/m;

    const match = patched.match(seekBackwardConstRegex);

    if (!match) {
      fail(
        "constantes next/previous",
        "No se encontró ACTION_SEEK_BACKWARD."
      );
    }

    const indent = match[1].match(/^[ \t]*/)[0];

    const constants =
      `${match[1]}\n` +
      `${indent}const val ACTION_NEXT_TRACK = "expo.modules.audio.action.NEXT_TRACK"\n` +
      `${indent}const val ACTION_PREVIOUS_TRACK = "expo.modules.audio.action.PREVIOUS_TRACK"`;

    patched = patched.replace(
      seekBackwardConstRegex,
      constants
    );
  }

  return writeIfChanged(filePath, original, patched);
}

/* =========================================================
   APLICAR TODO
========================================================= */

function patchExpoAudio(projectRoot) {
  const expoAudioRoot = path.join(
    projectRoot,
    "node_modules",
    "expo-audio"
  );

  const packageJsonPath = path.join(
    expoAudioRoot,
    "package.json"
  );

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      "[Hmusic] expo-audio no está instalado. Ejecuta npx expo install expo-audio."
    );
  }

  const packageJson = JSON.parse(
    readText(packageJsonPath)
  );

  if (
    packageJson.version !==
    EXPECTED_EXPO_AUDIO_VERSION
  ) {
    throw new Error(
      `[Hmusic] Este parche fue preparado para expo-audio ${EXPECTED_EXPO_AUDIO_VERSION}, ` +
        `pero se encontró ${packageJson.version}.`
    );
  }

  console.log(
    `[Hmusic] Aplicando parche para expo-audio ${packageJson.version}...`
  );

  const results = {
    playerAndEqualizer: patchAudioPlayer(expoAudioRoot),
    equalizerBridge: patchAudioModuleEqualizer(expoAudioRoot),
    options: patchAudioRecords(expoAudioRoot),
    callback: patchMediaSessionCallback(expoAudioRoot),
    service: patchAudioControlsService(expoAudioRoot),
  };

  const changed = Object.values(results).some(Boolean);

  if (changed) {
    console.log(
      "[Hmusic] expo-audio 57.0.4 parcheado correctamente."
    );
    console.log(
      "[Hmusic] Incluye: pausa al desconectar, ecualizador real Android y controles Anterior/Siguiente. Audio Focus no se modifica."
    );
  } else {
    console.log(
      "[Hmusic] El parche de expo-audio ya estaba aplicado."
    );
  }
}

module.exports =
  function withHmusicExpoAudioPatch(config) {
    const {
      withDangerousMod,
    } = require("expo/config-plugins");

    return withDangerousMod(config, [
      "android",
      async (modConfig) => {
        patchExpoAudio(
          modConfig.modRequest.projectRoot
        );

        return modConfig;
      },
    ]);
  };

module.exports.patchExpoAudio =
  patchExpoAudio;

if (require.main === module) {
  patchExpoAudio(process.cwd());
}
