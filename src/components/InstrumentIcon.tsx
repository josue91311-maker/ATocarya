import React from 'react';
import { PrimaryInstrument, SlotKey } from '../types';

interface Props {
  instrument?: PrimaryInstrument | SlotKey | string;
  className?: string;
  size?: number;
}

export const InstrumentIcon: React.FC<Props> = ({ 
  instrument, 
  className = "w-4 h-4", 
  size = 18 
}) => {
  const norm = (instrument || '').toLowerCase();

  // 1. PIANO / TECLADOS
  if (norm.includes('piano') || norm.includes('teclado')) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        {/* Piano base body */}
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
        {/* White keys dividers */}
        <line x1="6.5" y1="11" x2="6.5" y2="20" stroke="currentColor" strokeWidth="1.2" />
        <line x1="11" y1="11" x2="11" y2="20" stroke="currentColor" strokeWidth="1.2" />
        <line x1="15.5" y1="11" x2="15.5" y2="20" stroke="currentColor" strokeWidth="1.2" />
        {/* Black keys */}
        <rect x="4.5" y="4" width="2.5" height="7" rx="0.5" fill="currentColor" />
        <rect x="9" y="4" width="2.5" height="7" rx="0.5" fill="currentColor" />
        <rect x="14" y="4" width="2.5" height="7" rx="0.5" fill="currentColor" />
        <rect x="18" y="4" width="2.2" height="7" rx="0.5" fill="currentColor" />
      </svg>
    );
  }

  // 2. GUITARRA ELÉCTRICA
  if (norm.includes('electrica') || norm.includes('eléctrica') || norm.includes('guitarra_1') || norm.includes('guitarra_2')) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        {/* Electric Guitar Solid Body with Double Cutaway */}
        <path d="M11.5 21C7.5 21 5 18 5 14.5C5 12.5 6 11 7 10C6.5 8.5 7.5 7 9 7.5C10 7.8 10.5 8.5 11 9L15 4.5L16.5 5.5L18.5 3.5L20.5 5.5L19 7.5L14.5 12C15.2 12.5 16 13 16.5 14C17 15.5 15.5 16.5 14 16C13 17 11.5 21 11.5 21Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Pickups */}
        <rect x="8.5" y="12" width="4" height="1.5" rx="0.4" fill="currentColor" />
        <rect x="10" y="14.5" width="4" height="1.5" rx="0.4" fill="currentColor" />
        {/* Neck string line */}
        <line x1="12" y1="8.5" x2="16" y2="4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }

  // 3. GUITARRA ACÚSTICA
  if (norm.includes('acustica') || norm.includes('acústica')) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        {/* Acoustic Figure-8 Guitar Body */}
        <path d="M12 21C8 21 5.5 18.5 5.5 15.5C5.5 13.5 6.8 12.5 7.5 11.5C6.8 10.5 6.5 9 7.8 8C9 7 10.5 7.8 11.5 8.5L16.5 3L18 4.5L20 2.5L21.5 4L19.5 6L14.5 11.5C15.2 12.5 16 14 15 15.2C14 16.5 13.5 18 12 21Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Soundhole */}
        <circle cx="11.5" cy="14" r="2" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
        {/* Bridge */}
        <rect x="9.5" y="17.5" width="4" height="1" rx="0.3" fill="currentColor" />
      </svg>
    );
  }

  // 4. BATERÍA
  if (norm.includes('bateria') || norm.includes('batería')) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        {/* Snare Drum / Tom */}
        <ellipse cx="12" cy="14" rx="7" ry="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5 14V18C5 19.8 8.1 21.2 12 21.2C15.9 21.2 19 19.8 19 18V14" stroke="currentColor" strokeWidth="1.6" />
        {/* Drum Sticks */}
        <line x1="6" y1="4" x2="14" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="18" y1="4" x2="10" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        {/* Cymbal Top */}
        <ellipse cx="6" cy="6" rx="3.5" ry="1" stroke="currentColor" strokeWidth="1.3" />
        <ellipse cx="18" cy="6" rx="3.5" ry="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }

  // 5. BAJO (Electric Bass Guitar)
  if (norm.includes('bajo')) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        {/* Bass Body with heavy lower bout */}
        <path d="M10 21C6.5 21 4.5 18 4.5 15C4.5 12.8 5.8 11.5 6.5 10.5C6 9 7 7.5 8.5 8C9.5 8.2 10.2 9 10.8 9.5L16.5 3L17.8 4.2L20.5 2L22 3.5L19.5 6L14.2 11.5C15 12.2 15.5 13.5 14.8 14.8C14 16 12 17.5 10 21Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        {/* 4-String Bass Bridge and Thick Pickups */}
        <rect x="8" y="13.5" width="4.5" height="1.8" rx="0.5" fill="currentColor" />
        <rect x="8.8" y="16" width="3.5" height="1" rx="0.3" fill="currentColor" />
        {/* Headstock 4 tuning pegs */}
        <circle cx="20.5" cy="2" r="0.8" fill="currentColor" />
        <circle cx="22" cy="3.5" r="0.8" fill="currentColor" />
      </svg>
    );
  }

  // 6. VOZ DIRECTOR (Microphone with Star/Director Crown)
  if (norm.includes('director') || norm.includes('líder') || norm.includes('lider')) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        {/* Mic Capsule */}
        <rect x="9" y="5" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.75" fill="currentColor" fillOpacity="0.1" />
        {/* Capsule grid */}
        <line x1="9" y1="8.5" x2="15" y2="8.5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="12" y1="5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.2" />
        {/* Cradle */}
        <path d="M6 11C6 14.3 8.7 17 12 17C15.3 17 18 14.3 18 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        {/* Stand */}
        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <line x1="8.5" y1="21" x2="15.5" y2="21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        {/* Director Sparkle / Star on top */}
        <path d="M12 1L12.7 2.8L14.5 3.5L12.7 4.2L12 6L11.3 4.2L9.5 3.5L11.3 2.8L12 1Z" fill="#eab308" />
      </svg>
    );
  }

  // 7. VOZ CORO (Choir / Harmonizing Microphones)
  if (norm.includes('coro') || norm.includes('voz')) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        {/* Dual Vocal Microphones */}
        {/* Primary Mic */}
        <rect x="7" y="6" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.5 10.5C4.5 13 6.8 15 9.5 15C12.2 15 14.5 13 14.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="9.5" y1="15" x2="9.5" y2="20" stroke="currentColor" strokeWidth="1.6" />
        <line x1="7" y1="20" x2="12" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        {/* Secondary Harmonizing Mic */}
        <path d="M15 6.5C15 5.7 15.7 5 16.5 5C17.3 5 18 5.7 18 6.5V11C18 11.8 17.3 12.5 16.5 12.5C15.7 12.5 15 11.8 15 11V6.5Z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M14 10C14 11.5 15.2 13.5 16.5 13.5C17.8 13.5 19 11.5 19 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }

  // 8. SONIDO / CONSOLA DE AUDIO
  if (norm.includes('sonido') || norm.includes('audio') || norm.includes('streaming')) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        {/* Audio Console Faders & Sliders */}
        <line x1="5" y1="3" x2="5" y2="21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <line x1="19" y1="3" x2="19" y2="21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        {/* Fader Knobs */}
        <rect x="2.5" y="7" width="5" height="4" rx="1" fill="currentColor" />
        <rect x="9.5" y="13" width="5" height="4" rx="1" fill="currentColor" />
        <rect x="16.5" y="6" width="5" height="4" rx="1" fill="currentColor" />
      </svg>
    );
  }

  // Default Generic Music
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path d="M9 18V5L20 3V16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17" cy="16" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
};
