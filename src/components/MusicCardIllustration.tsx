import React from 'react';

export type MusicThemeKey = 'worship' | 'guitar' | 'drums' | 'piano' | 'musicWave';

export interface MusicCardTheme {
  id: MusicThemeKey;
  headerBg: string;
  headerText: string;
  accentColor: string;
  lightBg: string;
  svgPath: string;
}

export const MUSIC_CARD_THEMES: Record<MusicThemeKey, MusicCardTheme> = {
  worship: {
    id: 'worship',
    headerBg: '#2E4056', // Azul Iglesia
    headerText: '#F8F4EA',
    accentColor: '#213042',
    lightBg: '#E7EDF3',
    svgPath: '/assets/music/worship-silhouette.svg',
  },
  guitar: {
    id: 'guitar',
    headerBg: '#5C6B54', // Salvia profundo
    headerText: '#F8F4EA',
    accentColor: '#485441',
    lightBg: '#EBF0E7',
    svgPath: '/assets/music/guitar-line.svg',
  },
  drums: {
    id: 'drums',
    headerBg: '#8A6A4B', // Arena cálida tostada
    headerText: '#F8F4EA',
    accentColor: '#6E5238',
    lightBg: '#F5EBE0',
    svgPath: '/assets/music/drums-line.svg',
  },
  piano: {
    id: 'piano',
    headerBg: '#3D372E', // Café oscuro editorial
    headerText: '#F8F4EA',
    accentColor: '#302C24',
    lightBg: '#F2ECE1',
    svgPath: '/assets/music/piano-line.svg',
  },
  musicWave: {
    id: 'musicWave',
    headerBg: '#2E4056',
    headerText: '#F8F4EA',
    accentColor: '#213042',
    lightBg: '#E7EDF3',
    svgPath: '/assets/music/music-wave.svg',
  },
};

/**
 * Deterministic stable hash to pick a visual theme per serviceId without randomness
 */
export function getServiceCardTheme(serviceId: string): MusicCardTheme {
  const variants: MusicThemeKey[] = ['worship', 'guitar', 'drums', 'piano'];
  if (!serviceId) return MUSIC_CARD_THEMES.guitar;
  
  let hash = 0;
  for (let i = 0; i < serviceId.length; i++) {
    hash = (hash << 5) - hash + serviceId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % variants.length;
  return MUSIC_CARD_THEMES[variants[index]] || MUSIC_CARD_THEMES.guitar;
}

interface Props {
  theme: MusicCardTheme;
  className?: string;
}

export const MusicCardIllustration: React.FC<Props> = ({ theme, className = '' }) => {
  return (
    <div 
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <img
        src={theme.svgPath}
        alt=""
        className="w-full h-full object-cover object-right opacity-25 filter invert mix-blend-screen"
        loading="lazy"
      />
    </div>
  );
};
