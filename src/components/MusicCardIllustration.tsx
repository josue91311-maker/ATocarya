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
    headerBg: '#C96B65', // Coral
    headerText: '#FFFFFF',
    accentColor: '#B95752',
    lightBg: '#F7EAE5',
    svgPath: '/assets/music/worship-silhouette.svg',
  },
  guitar: {
    id: 'guitar',
    headerBg: '#315F6D', // Petróleo
    headerText: '#FFFFFF',
    accentColor: '#234A57',
    lightBg: '#D9E9EB',
    svgPath: '/assets/music/guitar-line.svg',
  },
  drums: {
    id: 'drums',
    headerBg: '#BD8C29', // Mostaza elegante
    headerText: '#FFFFFF',
    accentColor: '#9D721A',
    lightBg: '#FFF1CB',
    svgPath: '/assets/music/drums-line.svg',
  },
  piano: {
    id: 'piano',
    headerBg: '#46516F', // Pizarra
    headerText: '#FFFFFF',
    accentColor: '#363F59',
    lightBg: '#E5E8F0',
    svgPath: '/assets/music/piano-line.svg',
  },
  musicWave: {
    id: 'musicWave',
    headerBg: '#315F6D',
    headerText: '#FFFFFF',
    accentColor: '#264F5D',
    lightBg: '#D9E9EB',
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
