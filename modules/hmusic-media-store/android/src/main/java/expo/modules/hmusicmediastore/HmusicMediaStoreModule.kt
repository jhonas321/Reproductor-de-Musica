package expo.modules.hmusicmediastore

import android.app.Activity
import android.app.RecoverableSecurityException
import android.content.ClipData
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import android.provider.MediaStore

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import java.io.ByteArrayOutputStream
import java.text.Normalizer
import java.util.ArrayDeque
import java.util.ArrayList


class HmusicMediaStoreModule : Module() {

  companion object {
    private const val DELETE_REQUEST_CODE = 7401
    private const val LYRICS_FOLDER_REQUEST_CODE = 7402

    private const val PREFS_NAME =
      "hmusic_media_store"

    private const val LYRICS_TREE_URI_KEY =
      "lyrics_tree_uri"

    private const val LYRICS_TREE_NAME_KEY =
      "lyrics_tree_name"

    private const val MAX_LYRICS_FILE_BYTES =
      2_000_000

    private const val MAX_LYRICS_SCAN_ITEMS =
      5_000

    private const val MAX_LYRICS_SCAN_DEPTH =
      12
  }


  /*
   * Utilizado principalmente por Android 10,
   * donde después del permiso tenemos que
   * intentar la eliminación nuevamente.
   */

  private var pendingDeleteUris:
    List<Uri> = emptyList()

  private var pendingDeleteNeedsRetry:
    Boolean = false


  /* =========================================================
     CONTEXTO
  ========================================================= */

  private fun requireContext():
    Context {

    return appContext.reactContext
      ?: throw Exception(
        "Android context unavailable"
      )
  }


  /* =========================================================
     VALIDAR CONTENT URI
  ========================================================= */

  private fun parseContentUri(
    uriString: String
  ): Uri {

    val uri =
      Uri.parse(
        uriString
      )


    if (
      uri.scheme !=
      "content"
    ) {
      throw Exception(
        "La canción no dispone de una URI content:// válida."
      )
    }


    return uri
  }


  /* =========================================================
     LEER CANCIONES Y CARPETAS DE MEDIASTORE
  ========================================================= */

  private fun readAudioLocations(
    context: Context
  ):
    List<Map<String, Any?>> {

    val resolver =
      context.contentResolver


    val result =
      mutableListOf<
        Map<String, Any?>
      >()


    val volumes =
      if (
        Build.VERSION.SDK_INT >=
        Build.VERSION_CODES.Q
      ) {

        MediaStore
          .getExternalVolumeNames(
            context
          )
          .toList()

      } else {

        listOf(
          "external"
        )

      }


    for (
      volume in volumes
    ) {

      val collection =
        if (
          Build.VERSION.SDK_INT >=
          Build.VERSION_CODES.Q
        ) {

          MediaStore
            .Audio
            .Media
            .getContentUri(
              volume
            )

        } else {

          MediaStore
            .Audio
            .Media
            .EXTERNAL_CONTENT_URI

        }


      val projection =
        mutableListOf(

          MediaStore
            .Audio
            .Media
            ._ID,

          MediaStore
            .MediaColumns
            .DISPLAY_NAME

        )


      if (
        Build.VERSION.SDK_INT >=
        Build.VERSION_CODES.Q
      ) {

        projection.add(
          MediaStore
            .MediaColumns
            .RELATIVE_PATH
        )

      } else {

        projection.add(
          MediaStore
            .Audio
            .Media
            .DATA
        )

      }


      try {

        resolver.query(

          collection,

          projection
            .toTypedArray(),

          null,

          null,

          null

        )?.use { cursor ->


          val idIndex =
            cursor.getColumnIndexOrThrow(

              MediaStore
                .Audio
                .Media
                ._ID

            )


          val nameIndex =
            cursor.getColumnIndexOrThrow(

              MediaStore
                .MediaColumns
                .DISPLAY_NAME

            )


          val pathIndex =
            if (
              Build.VERSION.SDK_INT >=
              Build.VERSION_CODES.Q
            ) {

              cursor.getColumnIndex(

                MediaStore
                  .MediaColumns
                  .RELATIVE_PATH

              )

            } else {

              cursor.getColumnIndex(

                MediaStore
                  .Audio
                  .Media
                  .DATA

              )

            }


          while (
            cursor.moveToNext()
          ) {

            val id =
              cursor.getLong(
                idIndex
              )


            val displayName =
              cursor.getString(
                nameIndex
              ) ?: ""


            val contentUri =
              ContentUris
                .withAppendedId(
                  collection,
                  id
                )
                .toString()


            var folderPath =
              ""


            if (
              pathIndex >= 0
            ) {

              val rawPath =
                cursor.getString(
                  pathIndex
                ) ?: ""


              if (
                Build.VERSION.SDK_INT >=
                Build.VERSION_CODES.Q
              ) {

                folderPath =
                  rawPath
                    .replace(
                      "\\",
                      "/"
                    )
                    .trim('/')

              } else {

                val slash =
                  rawPath
                    .lastIndexOf(
                      '/'
                    )


                if (
                  slash > 0
                ) {

                  folderPath =
                    rawPath
                      .substring(
                        0,
                        slash
                      )
                      .replace(
                        "\\",
                        "/"
                      )
                      .removePrefix(
                        "/storage/emulated/0/"
                      )
                      .removePrefix(
                        "/sdcard/"
                      )
                      .trim('/')

                }

              }

            }


            result.add(

              mapOf(

                "id" to
                  id.toString(),

                "contentUri" to
                  contentUri,

                "displayName" to
                  displayName,

                "folderPath" to
                  folderPath,

                "volumeName" to
                  volume

              )

            )

          }

        }

      } catch (
        error: Exception
      ) {

        error.printStackTrace()

      }

    }


    return result
  }


  /* =========================================================
     CARPETA DE LETRAS
  ========================================================= */

  private fun lyricsPreferences(
    context: Context
  ) =
    context.getSharedPreferences(
      PREFS_NAME,
      Context.MODE_PRIVATE
    )


  private fun getStoredLyricsTreeUri(
    context: Context
  ): Uri? {

    val raw =
      lyricsPreferences(
        context
      )
        .getString(
          LYRICS_TREE_URI_KEY,
          null
        )
        ?: return null


    val uri =
      Uri.parse(
        raw
      )


    val hasPermission =
      context
        .contentResolver
        .persistedUriPermissions
        .any {
          it.uri ==
            uri &&
          it.isReadPermission
        }


    if (
      !hasPermission
    ) {

      lyricsPreferences(
        context
      )
        .edit()
        .remove(
          LYRICS_TREE_URI_KEY
        )
        .remove(
          LYRICS_TREE_NAME_KEY
        )
        .apply()


      return null
    }


    return uri
  }


  private fun getDocumentDisplayName(
    context: Context,
    uri: Uri
  ): String {

    val resolver =
      context.contentResolver


    try {

      resolver.query(
        uri,
        arrayOf(
          DocumentsContract
            .Document
            .COLUMN_DISPLAY_NAME
        ),
        null,
        null,
        null
      )?.use { cursor ->

        if (
          cursor.moveToFirst()
        ) {

          val index =
            cursor.getColumnIndex(
              DocumentsContract
                .Document
                .COLUMN_DISPLAY_NAME
            )


          if (
            index >= 0
          ) {

            return cursor
              .getString(
                index
              )
              ?: "Carpeta de letras"

          }

        }

      }

    } catch (
      error: Exception
    ) {

      error.printStackTrace()

    }


    return "Carpeta de letras"
  }


  private fun getLyricsFolderInfo(
    context: Context
  ):
    Map<String, Any?>? {

    val uri =
      getStoredLyricsTreeUri(
        context
      )
        ?: return null


    val preferences =
      lyricsPreferences(
        context
      )


    val storedName =
      preferences.getString(
        LYRICS_TREE_NAME_KEY,
        null
      )


    val name =
      storedName
        ?.takeIf {
          it.isNotBlank()
        }
        ?: getDocumentDisplayName(
          context,
          uri
        )


    return mapOf(

      "uri" to
        uri.toString(),

      "name" to
        name

    )
  }


  /* =========================================================
     NORMALIZAR NOMBRE PARA BUSCAR .LRC / .TXT
  ========================================================= */

  private fun removeFileExtension(
    value: String
  ): String {

    val clean =
      value.trim()


    val lastSlash =
      maxOf(
        clean.lastIndexOf('/'),
        clean.lastIndexOf('\\')
      )


    val fileName =
      if (
        lastSlash >= 0
      ) {
        clean.substring(
          lastSlash + 1
        )
      } else {
        clean
      }


    val dot =
      fileName.lastIndexOf('.')


    return if (
      dot > 0
    ) {

      fileName.substring(
        0,
        dot
      )

    } else {

      fileName

    }
  }


  private fun normalizeLyricsName(
    value: String
  ): String {

    val withoutExtension =
      removeFileExtension(
        value
      )


    val normalized =
      Normalizer.normalize(
        withoutExtension,
        Normalizer.Form.NFD
      )
        .replace(
          Regex("\\p{M}+"),
          ""
        )
        .lowercase()
        .replace(
          Regex("[^a-z0-9]+"),
          " "
        )
        .trim()


    return normalized
  }


  /* =========================================================
     LEER TEXTO .LRC / .TXT
  ========================================================= */

  private fun readLyricsText(
    context: Context,
    uri: Uri
  ): String {

    val resolver =
      context.contentResolver


    val input =
      resolver.openInputStream(
        uri
      )
        ?: throw Exception(
          "No se pudo abrir el archivo de letras."
        )


    val output =
      ByteArrayOutputStream()


    input.use { stream ->

      val buffer =
        ByteArray(
          8192
        )


      var total =
        0


      while (
        true
      ) {

        val read =
          stream.read(
            buffer
          )


        if (
          read <= 0
        ) {
          break
        }


        total +=
          read


        if (
          total >
          MAX_LYRICS_FILE_BYTES
        ) {

          throw Exception(
            "El archivo de letras es demasiado grande."
          )

        }


        output.write(
          buffer,
          0,
          read
        )

      }

    }


    val bytes =
      output.toByteArray()


    if (
      bytes.isEmpty()
    ) {
      return ""
    }


    /*
     * UTF-8 BOM
     */
    if (
      bytes.size >= 3 &&
      bytes[0] ==
        0xEF.toByte() &&
      bytes[1] ==
        0xBB.toByte() &&
      bytes[2] ==
        0xBF.toByte()
    ) {

      return String(
        bytes,
        3,
        bytes.size - 3,
        Charsets.UTF_8
      )

    }


    /*
     * UTF-16 LE BOM
     */
    if (
      bytes.size >= 2 &&
      bytes[0] ==
        0xFF.toByte() &&
      bytes[1] ==
        0xFE.toByte()
    ) {

      return String(
        bytes,
        2,
        bytes.size - 2,
        Charsets.UTF_16LE
      )

    }


    /*
     * UTF-16 BE BOM
     */
    if (
      bytes.size >= 2 &&
      bytes[0] ==
        0xFE.toByte() &&
      bytes[1] ==
        0xFF.toByte()
    ) {

      return String(
        bytes,
        2,
        bytes.size - 2,
        Charsets.UTF_16BE
      )

    }


    return String(
      bytes,
      Charsets.UTF_8
    )
  }


  private data class LyricsFolderNode(
    val uri: Uri,
    val depth: Int
  )


  private data class LyricsCandidate(
    val uri: Uri,
    val fileName: String,
    val format: String,
    val score: Int
  )


  /* =========================================================
     BUSCAR ARCHIVO DE LETRAS RECURSIVAMENTE
  ========================================================= */

  private fun findSidecarLyrics(
    context: Context,
    audioFileName: String?,
    songTitle: String?
  ):
    Map<String, Any?>? {

    val treeUri =
      getStoredLyricsTreeUri(
        context
      )
        ?: return null


    val expectedNames =
      listOfNotNull(
        audioFileName
          ?.takeIf {
            it.isNotBlank()
          },
        songTitle
          ?.takeIf {
            it.isNotBlank()
          }
      )
        .map {
          normalizeLyricsName(
            it
          )
        }
        .filter {
          it.isNotBlank()
        }
        .distinct()


    if (
      expectedNames.isEmpty()
    ) {
      return null
    }


    val resolver =
      context.contentResolver


    val rootDocumentId =
      try {

        DocumentsContract
          .getTreeDocumentId(
            treeUri
          )

      } catch (
        error: Exception
      ) {

        error.printStackTrace()

        return null
      }


    val rootDocumentUri =
      DocumentsContract
        .buildDocumentUriUsingTree(
          treeUri,
          rootDocumentId
        )


    val pending =
      ArrayDeque<
        LyricsFolderNode
      >()


    pending.add(
      LyricsFolderNode(
        rootDocumentUri,
        0
      )
    )


    var scannedItems =
      0


    var best:
      LyricsCandidate? =
        null


    while (
      pending.isNotEmpty() &&
      scannedItems <
        MAX_LYRICS_SCAN_ITEMS
    ) {

      val node =
        pending.removeFirst()


      val parentDocumentId =
        try {

          DocumentsContract
            .getDocumentId(
              node.uri
            )

        } catch (
          error: Exception
        ) {

          error.printStackTrace()

          continue
        }


      val childrenUri =
        DocumentsContract
          .buildChildDocumentsUriUsingTree(
            treeUri,
            parentDocumentId
          )


      try {

        resolver.query(

          childrenUri,

          arrayOf(

            DocumentsContract
              .Document
              .COLUMN_DOCUMENT_ID,

            DocumentsContract
              .Document
              .COLUMN_DISPLAY_NAME,

            DocumentsContract
              .Document
              .COLUMN_MIME_TYPE

          ),

          null,

          null,

          null

        )?.use { cursor ->


          val idIndex =
            cursor.getColumnIndexOrThrow(

              DocumentsContract
                .Document
                .COLUMN_DOCUMENT_ID

            )


          val nameIndex =
            cursor.getColumnIndexOrThrow(

              DocumentsContract
                .Document
                .COLUMN_DISPLAY_NAME

            )


          val mimeIndex =
            cursor.getColumnIndexOrThrow(

              DocumentsContract
                .Document
                .COLUMN_MIME_TYPE

            )


          while (
            cursor.moveToNext() &&
            scannedItems <
              MAX_LYRICS_SCAN_ITEMS
          ) {

            scannedItems++


            val documentId =
              cursor.getString(
                idIndex
              )


            val displayName =
              cursor.getString(
                nameIndex
              )
                ?: ""


            val mimeType =
              cursor.getString(
                mimeIndex
              )
                ?: ""


            val childUri =
              DocumentsContract
                .buildDocumentUriUsingTree(
                  treeUri,
                  documentId
                )


            if (
              mimeType ==
              DocumentsContract
                .Document
                .MIME_TYPE_DIR
            ) {

              if (
                node.depth <
                MAX_LYRICS_SCAN_DEPTH
              ) {

                pending.addLast(
                  LyricsFolderNode(
                    childUri,
                    node.depth + 1
                  )
                )

              }


              continue
            }


            val lowerName =
              displayName
                .lowercase()


            val format =
              when {

                lowerName.endsWith(
                  ".lrc"
                ) ->
                  "lrc"

                lowerName.endsWith(
                  ".txt"
                ) ->
                  "txt"

                else ->
                  null

              }
                ?: continue


            val normalizedStem =
              normalizeLyricsName(
                displayName
              )


            val exactIndex =
              expectedNames
                .indexOf(
                  normalizedStem
                )


            val fuzzyIndex =
              if (
                exactIndex <
                0 &&
                normalizedStem.length >=
                  4
              ) {

                expectedNames
                  .indexOfFirst {
                    expected ->

                    expected.length >=
                      4 &&
                    (
                      normalizedStem.contains(
                        expected
                      ) ||
                      expected.contains(
                        normalizedStem
                      )
                    )
                  }

              } else {

                -1

              }


            if (
              exactIndex <
                0 &&
              fuzzyIndex <
                0
            ) {
              continue
            }


            /*
             * Preferencias:
             *
             * 1) mismo nombre exacto del archivo
             * 2) título exacto
             * 3) coincidencia parcial razonable
             * 4) .lrc antes que .txt
             */
            val nameScore =
              if (
                exactIndex >=
                0
              ) {

                exactIndex *
                  10

              } else {

                100 +
                (
                  fuzzyIndex *
                  10
                )

              }


            val score =
              nameScore +
              if (
                format ==
                "lrc"
              ) {
                0
              } else {
                1
              }


            if (
              best ==
                null ||
              score <
                best!!.score
            ) {

              best =
                LyricsCandidate(
                  childUri,
                  displayName,
                  format,
                  score
                )

            }


            /*
             * No existe un resultado mejor que:
             * mismo nombre exacto + .lrc
             */
            if (
              score ==
              0
            ) {
              break
            }

          }

        }

      } catch (
        error:
          SecurityException
      ) {

        error.printStackTrace()

        return null

      } catch (
        error:
          Exception
      ) {

        error.printStackTrace()

      }


      if (
        best?.score ==
        0
      ) {
        break
      }

    }


    val candidate =
      best
        ?: return null


    val content =
      readLyricsText(
        context,
        candidate.uri
      )
        .trim()


    if (
      content.isBlank()
    ) {
      return null
    }


    return mapOf(

      "content" to
        content,

      "format" to
        candidate.format,

      "fileName" to
        candidate.fileName,

      "uri" to
        candidate.uri.toString()

    )
  }


  /* =========================================================
     SOLICITAR ELIMINACIÓN
  ========================================================= */

  private fun requestDelete(
    uris: List<Uri>
  ):
    Map<String, Any?> {

    if (
      uris.isEmpty()
    ) {

      throw Exception(
        "No se proporcionaron canciones para eliminar."
      )

    }


    val context =
      requireContext()


    val activity =
      appContext.currentActivity
        ?: throw Exception(
          "No hay una actividad Android activa."
        )


    val resolver =
      context.contentResolver


    /*
     * =====================================
     * ANDROID 11+
     * =====================================
     *
     * Android muestra su propia ventana
     * de confirmación.
     */

    if (
      Build.VERSION.SDK_INT >=
      Build.VERSION_CODES.R
    ) {

      val pendingIntent =
        MediaStore
          .createDeleteRequest(
            resolver,
            uris
          )


      pendingDeleteUris =
        uris

      pendingDeleteNeedsRetry =
        false


      activity
        .startIntentSenderForResult(

          pendingIntent
            .intentSender,

          DELETE_REQUEST_CODE,

          null,

          0,

          0,

          0

        )


      return mapOf(

        "status" to
          "requested",

        "count" to
          uris.size

      )

    }


    /*
     * =====================================
     * ANDROID 10
     * =====================================
     */

    if (
      Build.VERSION.SDK_INT ==
      Build.VERSION_CODES.Q
    ) {

      if (
        uris.size >
        1
      ) {

        throw Exception(
          "La eliminación múltiple requiere Android 11 o superior."
        )

      }


      try {

        val deleted =
          resolver.delete(
            uris.first(),
            null,
            null
          )


        return mapOf(

          "status" to
            if (
              deleted > 0
            )
              "deleted"
            else
              "not_deleted",

          "count" to
            deleted

        )

      } catch (
        error:
          RecoverableSecurityException
      ) {

        pendingDeleteUris =
          uris

        pendingDeleteNeedsRetry =
          true


        activity
          .startIntentSenderForResult(

            error
              .userAction
              .actionIntent
              .intentSender,

            DELETE_REQUEST_CODE,

            null,

            0,

            0,

            0

          )


        return mapOf(

          "status" to
            "requested",

          "count" to
            uris.size

        )

      }

    }


    /*
     * =====================================
     * ANDROID 9 O ANTERIOR
     * =====================================
     */

    var deletedCount =
      0


    uris.forEach { uri ->

      try {

        deletedCount +=
          resolver.delete(
            uri,
            null,
            null
          )

      } catch (
        error:
          Exception
      ) {

        error.printStackTrace()

      }

    }


    return mapOf(

      "status" to
        if (
          deletedCount > 0
        )
          "deleted"
        else
          "not_deleted",

      "count" to
        deletedCount

    )
  }


  /* =========================================================
     MODULE DEFINITION
  ========================================================= */

  override fun definition() =
    ModuleDefinition {

      Name(
        "HmusicMediaStore"
      )


      /*
       * Avisaremos a JavaScript cuando
       * finalice la ventana de eliminación.
       */

      Events(
        "onDeleteResult",
        "onLyricsFolderResult"
      )


      /* =====================================================
         1. OBTENER BIBLIOTECA / CARPETAS
      ===================================================== */

      AsyncFunction(
        "getAudioLocationsAsync"
      ) {

        readAudioLocations(
          requireContext()
        )

      }


      /* =====================================================
         2. ACTUALIZAR MEDIASTORE
      =====================================================
       *
       * En Android moderno no forzamos un
       * scan completo del disco.
       *
       * Hacemos una consulta fresca a
       * MediaStore.
       */

      AsyncFunction(
        "refreshAudioLibraryAsync"
      ) {

        readAudioLocations(
          requireContext()
        )

      }


      /* =====================================================
         3. COMPARTIR UNA CANCIÓN
      ===================================================== */

      AsyncFunction(
        "shareAudioAsync"
      ) {
        uriString:
          String,

        displayName:
          String? ->


        val context =
          requireContext()


        val activity =
          appContext.currentActivity
            ?: throw Exception(
              "No hay una actividad Android activa."
            )


        val uri =
          parseContentUri(
            uriString
          )


        val resolver =
          context.contentResolver


        val mimeType =
          resolver.getType(
            uri
          )
            ?: "audio/*"


        val safeName =
          displayName
            ?.takeIf {
              it.isNotBlank()
            }
            ?: "Audio"


        val shareIntent =
          Intent(
            Intent.ACTION_SEND
          ).apply {

            type =
              mimeType


            putExtra(
              Intent.EXTRA_STREAM,
              uri
            )


            putExtra(
              Intent.EXTRA_TITLE,
              safeName
            )


            clipData =
              ClipData.newUri(
                resolver,
                safeName,
                uri
              )


            addFlags(
              Intent.FLAG_GRANT_READ_URI_PERMISSION
            )

          }


        val chooser =
          Intent.createChooser(
            shareIntent,
            "Compartir audio"
          )


        chooser.addFlags(
          Intent.FLAG_GRANT_READ_URI_PERMISSION
        )


        activity.startActivity(
          chooser
        )


        true

      }


      /* =====================================================
         4. COMPARTIR VARIAS CANCIONES
      ===================================================== */

      AsyncFunction(
        "shareMultipleAudioAsync"
      ) {
        uriStrings:
          List<String> ->


        val context =
          requireContext()


        val activity =
          appContext.currentActivity
            ?: throw Exception(
              "No hay una actividad Android activa."
            )


        val resolver =
          context.contentResolver


        val uris =
          uriStrings
            .map {
              parseContentUri(
                it
              )
            }
            .distinct()


        if (
          uris.isEmpty()
        ) {

          throw Exception(
            "No existen archivos para compartir."
          )

        }


        /*
         * Si solamente hay una canción,
         * usamos igualmente ACTION_SEND.
         */

        if (
          uris.size ==
          1
        ) {

          val uri =
            uris.first()


          val shareIntent =
            Intent(
              Intent.ACTION_SEND
            ).apply {

              type =
                resolver.getType(
                  uri
                )
                  ?: "audio/*"


              putExtra(
                Intent.EXTRA_STREAM,
                uri
              )


              clipData =
                ClipData.newUri(
                  resolver,
                  "Audio",
                  uri
                )


              addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION
              )

            }


          activity.startActivity(

            Intent.createChooser(
              shareIntent,
              "Compartir audio"
            )

          )


          return@AsyncFunction true

        }


        /*
         * Varias canciones.
         */

        val streamUris =
          ArrayList<Uri>(
            uris
          )


        val clipData =
          ClipData.newUri(

            resolver,

            "Archivos de audio",

            uris.first()

          )


        uris
          .drop(
            1
          )
          .forEach { uri ->

            clipData.addItem(
              ClipData.Item(
                uri
              )
            )

          }


        val shareIntent =
          Intent(
            Intent.ACTION_SEND_MULTIPLE
          ).apply {

            type =
              "audio/*"


            putParcelableArrayListExtra(
              Intent.EXTRA_STREAM,
              streamUris
            )


            this.clipData =
              clipData


            addFlags(
              Intent.FLAG_GRANT_READ_URI_PERMISSION
            )

          }


        val chooser =
          Intent.createChooser(

            shareIntent,

            "Compartir audios"

          )


        chooser.addFlags(
          Intent.FLAG_GRANT_READ_URI_PERMISSION
        )


        activity.startActivity(
          chooser
        )


        true

      }


      /* =====================================================
         5. ABRIR CON OTRA APLICACIÓN
      ===================================================== */

      AsyncFunction(
        "openAudioWithAsync"
      ) {
        uriString:
          String,

        displayName:
          String? ->


        val context =
          requireContext()


        val activity =
          appContext.currentActivity
            ?: throw Exception(
              "No hay una actividad Android activa."
            )


        val resolver =
          context.contentResolver


        val uri =
          parseContentUri(
            uriString
          )


        val mimeType =
          resolver.getType(
            uri
          )
            ?: "audio/*"


        val viewIntent =
          Intent(
            Intent.ACTION_VIEW
          ).apply {

            setDataAndType(
              uri,
              mimeType
            )


            clipData =
              ClipData.newUri(

                resolver,

                displayName
                  ?: "Audio",

                uri

              )


            addFlags(
              Intent.FLAG_GRANT_READ_URI_PERMISSION
            )

          }


        val chooser =
          Intent.createChooser(

            viewIntent,

            "Abrir audio con"

          )


        chooser.addFlags(
          Intent.FLAG_GRANT_READ_URI_PERMISSION
        )


        activity.startActivity(
          chooser
        )


        true

      }


      /* =====================================================
         6. OBTENER CARPETA DE LETRAS
      ===================================================== */

      AsyncFunction(
        "getLyricsFolderAsync"
      ) {

        getLyricsFolderInfo(
          requireContext()
        )

      }


      /* =====================================================
         7. SELECCIONAR CARPETA DE LETRAS
      ===================================================== */

      AsyncFunction(
        "requestLyricsFolderAsync"
      ) {

        val activity =
          appContext.currentActivity
            ?: throw Exception(
              "No hay una actividad Android activa."
            )


        val intent =
          Intent(
            Intent.ACTION_OPEN_DOCUMENT_TREE
          ).apply {

            addFlags(
              Intent.FLAG_GRANT_READ_URI_PERMISSION
            )

            addFlags(
              Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
            )

            addFlags(
              Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
            )

          }


        activity.startActivityForResult(
          intent,
          LYRICS_FOLDER_REQUEST_CODE
        )


        true
      }


      /* =====================================================
         8. QUITAR CARPETA DE LETRAS
      ===================================================== */

      AsyncFunction(
        "clearLyricsFolderAsync"
      ) {

        val context =
          requireContext()


        val uri =
          getStoredLyricsTreeUri(
            context
          )


        if (
          uri != null
        ) {

          try {

            context
              .contentResolver
              .releasePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
              )

          } catch (
            error: Exception
          ) {

            error.printStackTrace()

          }

        }


        lyricsPreferences(
          context
        )
          .edit()
          .remove(
            LYRICS_TREE_URI_KEY
          )
          .remove(
            LYRICS_TREE_NAME_KEY
          )
          .apply()


        true
      }


      /* =====================================================
         9. BUSCAR .LRC / .TXT
      ===================================================== */

      AsyncFunction(
        "findSidecarLyricsAsync"
      ) {
        audioFileName:
          String?,

        songTitle:
          String? ->


        findSidecarLyrics(
          requireContext(),
          audioFileName,
          songTitle
        )

      }


      /* =====================================================
         10. ELIMINAR UNA CANCIÓN
      ===================================================== */

      AsyncFunction(
        "requestDeleteAudioAsync"
      ) {
        uriString:
          String ->


        requestDelete(

          listOf(

            parseContentUri(
              uriString
            )

          )

        )

      }


      /* =====================================================
         11. ELIMINAR VARIAS CANCIONES
      ===================================================== */

      AsyncFunction(
        "requestDeleteMultipleAudioAsync"
      ) {
        uriStrings:
          List<String> ->


        val uris =
          uriStrings
            .map {

              parseContentUri(
                it
              )

            }
            .distinct()


        requestDelete(
          uris
        )

      }


      /* =====================================================
         RESULTADO DE LA CONFIRMACIÓN DE ELIMINACIÓN
      ===================================================== */

      OnActivityResult {
        activity,
        payload ->


        /*
         * =====================================================
         * RESULTADO DEL SELECTOR DE CARPETA DE LETRAS
         * =====================================================
         */
        if (
          payload.requestCode ==
          LYRICS_FOLDER_REQUEST_CODE
        ) {

          val context =
            requireContext()


          val selectedUri =
            payload.data
              ?.data


          val granted =
            payload.resultCode ==
              Activity.RESULT_OK &&
            selectedUri !=
              null


          var folderName:
            String? =
              null


          if (
            granted &&
            selectedUri !=
              null
          ) {

            try {

              context
                .contentResolver
                .takePersistableUriPermission(
                  selectedUri,
                  Intent.FLAG_GRANT_READ_URI_PERMISSION
                )


              folderName =
                getDocumentDisplayName(
                  context,
                  selectedUri
                )


              lyricsPreferences(
                context
              )
                .edit()
                .putString(
                  LYRICS_TREE_URI_KEY,
                  selectedUri.toString()
                )
                .putString(
                  LYRICS_TREE_NAME_KEY,
                  folderName
                )
                .apply()

            } catch (
              error:
                Exception
            ) {

              error.printStackTrace()

            }

          }


          val savedInfo =
            getLyricsFolderInfo(
              context
            )


          sendEvent(

            "onLyricsFolderResult",

            mapOf(

              "granted" to
                (
                  granted &&
                  savedInfo !=
                    null
                ),

              "uri" to
                savedInfo
                  ?.get(
                    "uri"
                  ),

              "name" to
                savedInfo
                  ?.get(
                    "name"
                  )

            )

          )


          return@OnActivityResult
        }


        /*
         * =====================================================
         * RESULTADO DE ELIMINACIÓN
         * =====================================================
         */
        if (
          payload.requestCode !=
          DELETE_REQUEST_CODE
        ) {

          return@OnActivityResult

        }


        val confirmed =
          payload.resultCode ==
          Activity.RESULT_OK


        var deletedCount =
          0


        if (
          confirmed
        ) {

          /*
           * Android 10:
           *
           * El usuario nos acaba de conceder
           * permiso y tenemos que volver
           * a ejecutar delete().
           */

          if (
            pendingDeleteNeedsRetry
          ) {

            val resolver =
              requireContext()
                .contentResolver


            pendingDeleteUris
              .forEach { uri ->

                try {

                  deletedCount +=
                    resolver.delete(
                      uri,
                      null,
                      null
                    )

                } catch (
                  error:
                    Exception
                ) {

                  error.printStackTrace()

                }

              }

          } else {

            /*
             * Android 11+:
             *
             * createDeleteRequest ya realiza
             * la eliminación si el usuario
             * confirma.
             */

            deletedCount =
              pendingDeleteUris
                .size

          }

        }


        sendEvent(

          "onDeleteResult",

          mapOf(

            "confirmed" to
              confirmed,

            "deletedCount" to
              deletedCount,

            "requestedCount" to
              pendingDeleteUris
                .size

          )

        )


        pendingDeleteUris =
          emptyList()


        pendingDeleteNeedsRetry =
          false

      }

    }
}