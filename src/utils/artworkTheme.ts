export interface ArtworkTheme {
    background: string;
    glow1: string;
    glow2: string;
    icon: string;
  }
  
  
  export const ARTWORK_THEMES: ArtworkTheme[] = [
    {
      background: '#4A2B73',
      glow1: '#9B6BFF',
      glow2: '#477BFF',
      icon: '#F4ECFF',
    },
  
    {
      background: '#155168',
      glow1: '#14B8D4',
      glow2: '#3B82F6',
      icon: '#D9FAFF',
    },
  
    {
      background: '#6D2B56',
      glow1: '#EC4899',
      glow2: '#A855F7',
      icon: '#FFE4F1',
    },
  
    {
      background: '#7A421D',
      glow1: '#F59E0B',
      glow2: '#F97316',
      icon: '#FFF0CC',
    },
  
    {
      background: '#185846',
      glow1: '#10B981',
      glow2: '#14B8A6',
      icon: '#D9FFF1',
    },
  
    {
      background: '#3734A3',
      glow1: '#6366F1',
      glow2: '#8B5CF6',
      icon: '#E7E8FF',
    },
  ];
  
  
  function getThemeIndex(
    seed?: string | null
  ) {
    if (!seed) {
      return 0;
    }
  
  
    let hash = 0;
  
  
    for (
      let index = 0;
      index < seed.length;
      index++
    ) {
      hash =
        (
          (
            hash * 31
          ) +
          seed.charCodeAt(index)
        ) | 0;
    }
  
  
    return (
      Math.abs(hash) %
      ARTWORK_THEMES.length
    );
  }
  
  
  export function getArtworkTheme(
    seed?: string | null
  ) {
    return ARTWORK_THEMES[
      getThemeIndex(seed)
    ];
  }