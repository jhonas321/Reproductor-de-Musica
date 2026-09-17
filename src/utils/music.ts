import type {
  Song,
  SortKey,
} from '../types/Song';


export function formatDuration(
  seconds: number
) {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return '0:00';
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  const remaining =
    Math.floor(
      seconds % 60
    );

  return `${minutes}:${remaining
    .toString()
    .padStart(2, '0')}`;
}


export function normalizeMetadata(
  value: unknown,
  fallback: string
) {
  if (
    typeof value !==
    'string'
  ) {
    return fallback;
  }

  const clean =
    value.trim();

  if (
    !clean ||
    clean.toLowerCase() ===
      '<unknown>' ||
    clean.toLowerCase() ===
      'unknown'
  ) {
    return fallback;
  }

  return clean;
}


export function normalizeSearchText(
  text: string
) {
  return text
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim();
}


export function sortSongs(
  songs: Song[],
  key: SortKey,
  ascending: boolean
) {
  const result =
    [...songs];

  result.sort(
    (
      a,
      b
    ) => {
      let comparison =
        0;

      if (
        key === 'newest'
      ) {
        comparison =
          (
            a.createdAt ??
            0
          )
          -
          (
            b.createdAt ??
            0
          );
      } else {
        comparison =
          a[key]
            .localeCompare(
              b[key],
              undefined,
              {
                sensitivity:
                  'base',

                numeric:
                  true,
              }
            );
      }

      return ascending
        ? comparison
        : -comparison;
    }
  );

  return result;
}


export function uniqueSongs(
  songs: Song[]
) {
  return Array.from(
    new Map(
      songs.map(
        song => [
          song.id,
          song,
        ]
      )
    ).values()
  );
}


export function formatBytes(
  bytes?: number
) {
  if (
    !bytes ||
    bytes <= 0
  ) {
    return 'Desconocido';
  }

  const units =
    [
      'B',
      'KB',
      'MB',
      'GB',
    ];

  const index =
    Math.min(
      Math.floor(
        Math.log(
          bytes
        )
        /
        Math.log(
          1024
        )
      ),
      units.length - 1
    );

  const value =
    bytes /
    Math.pow(
      1024,
      index
    );

  return `${value.toFixed(
    index === 0
      ? 0
      : 1
  )} ${units[index]}`;
}


export function normalizeFolderPath(
  path: string
) {
  const clean =
    path
      .replace(
        /\\/g,
        '/'
      )
      .replace(
        /^\/+/,
        ''
      )
      .replace(
        /\/+$/,
        ''
      )
      .trim();

  return clean ||
    'Otros';
}


export function getSongFolderPath(
  song: Song
) {
  /*
   * Primera opción:
   * RELATIVE_PATH obtenido directamente
   * desde Android MediaStore.
   */
  if (
    song.folderPath &&
    song.folderPath !==
      'Otros'
  ) {
    return normalizeFolderPath(
      song.folderPath
    );
  }


  /*
   * Respaldo para algún archivo que
   * todavía tenga una URI file://.
   */
  if (
    song.uri.startsWith(
      'file://'
    )
  ) {
    try {
      const decoded =
        decodeURIComponent(
          song.uri.replace(
            /^file:\/\//,
            ''
          )
        );

      const normalized =
        decoded.replace(
          /\\/g,
          '/'
        );

      const slash =
        normalized.lastIndexOf(
          '/'
        );

      if (
        slash > 0
      ) {
        return normalizeFolderPath(
          normalized
            .slice(
              0,
              slash
            )
            .replace(
              /^\/storage\/emulated\/0\//i,
              ''
            )
            .replace(
              /^\/sdcard\//i,
              ''
            )
        );
      }
    } catch (error) {
      console.log(
        'Error obteniendo carpeta:',
        error
      );
    }
  }


  return 'Otros';
}


export function getFolderName(
  path: string
) {
  const clean =
    normalizeFolderPath(
      path
    );

  if (
    clean ===
    'Otros'
  ) {
    return clean;
  }

  const parts =
    clean
      .split('/')
      .filter(
        Boolean
      );

  return (
    parts[
      parts.length - 1
    ]
    ??
    clean
  );
}