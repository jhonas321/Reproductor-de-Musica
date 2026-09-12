import * as FileSystem
  from 'expo-file-system/legacy';


const LOCK_ARTWORK_PREFIX =
  'hmusic-lock-artwork-';


/*
 * Algunas canciones tienen una URI de carátula generada por Android,
 * pero el archivo realmente no existe.
 *
 * Ejemplo:
 *
 * content://media/external/audio/albumart/123
 *
 * En esos casos Android lanza:
 *
 * FileNotFoundException: No album art found
 *
 * Guardamos esas URIs fallidas para no intentar copiarlas una y otra vez.
 */
const failedArtworkUris =
  new Set<string>();


function safeFileName(
  value:
    string
) {
  return value
    .replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    )
    .slice(
      0,
      80
    );
}


function getExtension(
  uri:
    string
) {
  const cleanUri =
    uri
      .split('?')[0]
      .toLowerCase();


  if (
    cleanUri.endsWith(
      '.png'
    )
  ) {
    return '.png';
  }


  if (
    cleanUri.endsWith(
      '.webp'
    )
  ) {
    return '.webp';
  }


  if (
    cleanUri.endsWith(
      '.jpeg'
    )
  ) {
    return '.jpeg';
  }


  return '.jpg';
}


export async function getLockScreenArtworkUrl(
  artwork:
    string | null | undefined,

  songId:
    string
):
  Promise<string | null> {

  if (
    typeof artwork !==
      'string'
  ) {
    return null;
  }


  const uri =
    artwork.trim();


  if (!uri) {
    return null;
  }


  /*
   * Si esta URI ya falló una vez,
   * no volvemos a intentar copiarla.
   */
  if (
    failedArtworkUris.has(
      uri
    )
  ) {
    return null;
  }


  /*
   * HTTP/HTTPS y file:// ya pueden usarse directamente.
   */
  if (
    uri.startsWith(
      'http://'
    ) ||
    uri.startsWith(
      'https://'
    ) ||
    uri.startsWith(
      'file://'
    )
  ) {
    return uri;
  }


  /*
   * Solo intentamos convertir content://.
   */
  if (
    !uri.startsWith(
      'content://'
    )
  ) {
    return null;
  }


  try {
    if (
      !FileSystem.cacheDirectory
    ) {
      return null;
    }


    const extension =
      getExtension(
        uri
      );


    const destination =
      `${FileSystem.cacheDirectory}${LOCK_ARTWORK_PREFIX}${safeFileName(
        songId
      )}${extension}`;


    /*
     * Si ya existe una copia válida,
     * la reutilizamos.
     */
    const info =
      await FileSystem
        .getInfoAsync(
          destination
        );


    if (
      info.exists
    ) {
      return destination;
    }


    /*
     * Intentamos copiar la URI content://
     * al caché interno de Hmusic.
     */
    await FileSystem
      .copyAsync({
        from:
          uri,

        to:
          destination,
      });


    const copiedInfo =
      await FileSystem
        .getInfoAsync(
          destination
        );


    if (
      !copiedInfo.exists
    ) {
      failedArtworkUris.add(
        uri
      );

      return null;
    }


    return destination;

  } catch (
    error
  ) {
    /*
     * Si Android dice que no existe carátula,
     * no es un error grave.
     *
     * La marcamos como fallida para no generar
     * el mismo error cada vez que MediaSession
     * se actualiza.
     */
    failedArtworkUris.add(
      uri
    );


    const message =
      error instanceof Error
        ? error.message
        : String(
            error
          );


    /*
     * Solo dejamos un log corto de depuración.
     * No usamos console.error para evitar pantalla roja.
     */
    console.log(
      `[Hmusic] Carátula no disponible para lockscreen: ${message}`
    );


    return null;
  }
}


/*
 * Útil si en el futuro el usuario cambia la carátula
 * de una canción y queremos volver a intentarlo.
 */
export function clearFailedLockScreenArtworkCache() {
  failedArtworkUris.clear();
}
