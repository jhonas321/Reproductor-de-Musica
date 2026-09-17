import AsyncStorage
  from '@react-native-async-storage/async-storage';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  Song,
} from '../types/Song';

export type SongSortBy =
  | 'title'
  | 'artist'
  | 'album'
  | 'createdAt'
  | 'duration';

export type SongSortDirection =
  | 'asc'
  | 'desc';

export interface SongSortSettings {
  sortBy: SongSortBy;
  direction: SongSortDirection;
}

const STORAGE_KEY =
  '@hmusic/library-sort';

const DEFAULT_SETTINGS: SongSortSettings = {
  sortBy: 'title',
  direction: 'asc',
};

/*
 * Se crea una sola vez. Antes localeCompare recibía
 * las mismas opciones miles de veces durante cada sort.
 */
const TEXT_COLLATOR =
  new Intl.Collator('es', {
    sensitivity: 'base',
    numeric: true,
  });

type SortCache = {
  title: string;
  artist: string;
  album: string;
  createdAt: number;
  duration: number;
};

const SONG_CACHE =
  new WeakMap<Song, SortCache>();

const SORT_RESULTS_CACHE =
  new WeakMap<
    Song[],
    Map<string, Song[]>
  >();

function parseCreatedAt(
  value: string | number | null | undefined
) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return value < 1_000_000_000_000
      ? value * 1000
      : value;
  }

  const clean = String(value).trim();
  if (!clean) {
    return 0;
  }

  const numeric = Number(clean);
  if (Number.isFinite(numeric)) {
    return numeric < 1_000_000_000_000
      ? numeric * 1000
      : numeric;
  }

  const parsed = Date.parse(clean);
  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function getSongCache(song: Song): SortCache {
  const cached = SONG_CACHE.get(song);
  if (cached) {
    return cached;
  }

  const createdAt =
    (
      song as Song & {
        createdAt?: string | number | null;
      }
    ).createdAt;

  const duration = Number(song.duration);

  const result: SortCache = {
    title: (song.title ?? '').trim(),
    artist: (song.artist ?? '').trim(),
    album: (song.album ?? '').trim(),
    createdAt: parseCreatedAt(createdAt),
    duration: Number.isFinite(duration) ? duration : 0,
  };

  SONG_CACHE.set(song, result);
  return result;
}

export function sortSongs(
  songs: Song[],
  settings: SongSortSettings
) {
  let cache = SORT_RESULTS_CACHE.get(songs);

  if (!cache) {
    cache = new Map<string, Song[]>();
    SORT_RESULTS_CACHE.set(songs, cache);
  }

  const key = `${settings.sortBy}:${settings.direction}`;
  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  if (settings.direction === 'desc') {
    const asc = cache.get(`${settings.sortBy}:asc`);

    if (asc) {
      const reversed = [...asc].reverse();
      cache.set(key, reversed);
      return reversed;
    }
  }

  const prepared = songs.map((song, originalIndex) => ({
    song,
    originalIndex,
    cache: getSongCache(song),
  }));

  prepared.sort((first, second) => {
    let result = 0;

    switch (settings.sortBy) {
      case 'artist':
        result = TEXT_COLLATOR.compare(
          first.cache.artist,
          second.cache.artist
        );
        break;

      case 'album':
        result = TEXT_COLLATOR.compare(
          first.cache.album,
          second.cache.album
        );
        break;

      case 'createdAt':
        result = first.cache.createdAt - second.cache.createdAt;
        break;

      case 'duration':
        result = first.cache.duration - second.cache.duration;
        break;

      case 'title':
      default:
        result = TEXT_COLLATOR.compare(
          first.cache.title,
          second.cache.title
        );
        break;
    }

    if (result === 0 && settings.sortBy !== 'title') {
      result = TEXT_COLLATOR.compare(
        first.cache.title,
        second.cache.title
      );
    }

    if (result === 0) {
      result = first.originalIndex - second.originalIndex;
    }

    return settings.direction === 'asc'
      ? result
      : -result;
  });

  const ordered = prepared.map(item => item.song);
  cache.set(key, ordered);

  return ordered;
}

export function useLibrarySort(
  songs: Song[]
) {
  const [settings, setSettings] =
    useState<SongSortSettings>(DEFAULT_SETTINGS);

  const [restored, setRestored] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!saved || !mounted) {
          return;
        }

        const parsed = JSON.parse(saved) as Partial<SongSortSettings>;

        const validSortBy: SongSortBy[] = [
          'title',
          'artist',
          'album',
          'createdAt',
          'duration',
        ];

        const validDirections: SongSortDirection[] = [
          'asc',
          'desc',
        ];

        if (
          parsed.sortBy &&
          validSortBy.includes(parsed.sortBy) &&
          parsed.direction &&
          validDirections.includes(parsed.direction)
        ) {
          setSettings({
            sortBy: parsed.sortBy,
            direction: parsed.direction,
          });
        }
      } catch (error) {
        console.log(
          'Error restaurando el orden de la biblioteca:',
          error
        );
      } finally {
        if (mounted) {
          setRestored(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!restored) {
      return;
    }

    void AsyncStorage
      .setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      )
      .catch(error => {
        console.log(
          'Error guardando el orden de la biblioteca:',
          error
        );
      });
  }, [restored, settings]);

  const orderedSongs = useMemo(
    () => sortSongs(songs, settings),
    [
      songs,
      settings.sortBy,
      settings.direction,
    ]
  );

  const setSortBy = useCallback((sortBy: SongSortBy) => {
    setSettings(current => {
      if (current.sortBy === sortBy) {
        return current;
      }

      return {
        ...current,
        sortBy,
      };
    });
  }, []);

  const setDirection = useCallback(
    (direction: SongSortDirection) => {
      setSettings(current => {
        if (current.direction === direction) {
          return current;
        }

        return {
          ...current,
          direction,
        };
      });
    },
    []
  );

  const resetSort = useCallback(() => {
    setSettings(current => {
      if (
        current.sortBy === DEFAULT_SETTINGS.sortBy &&
        current.direction === DEFAULT_SETTINGS.direction
      ) {
        return current;
      }

      return DEFAULT_SETTINGS;
    });
  }, []);

  return {
    orderedSongs,
    settings,
    setSortBy,
    setDirection,
    resetSort,
  };
}
