import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  subtitle = ''
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-18 h-18',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Original Custom Vector Icon: 'A' shaped soundwave with musical rhythm and strings */}
      <div className={`${iconSizes[size]} relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 p-0.5 shadow-md shadow-blue-500/20 flex-shrink-0`}>
        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1.5">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="logoGrad" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1d4ed8" />
                <stop offset="0.5" stopColor="#4338ca" />
                <stop offset="1" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            {/* The Stylized 'A' + Musical Instrument Neck & Soundwaves */}
            {/* Left string leg */}
            <path d="M12 40L23.2 8C23.6 6.8 24.4 6.8 24.8 8L36 40" stroke="url(#logoGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Chord crossbar formed as musical equalizer / plectrum */}
            <path d="M16 28H32" stroke="url(#logoGrad)" strokeWidth="4" strokeLinecap="round" />
            {/* Central harmonic wave resonance */}
            <circle cx="24" cy="21" r="3.5" fill="#2563eb" />
            {/* Sound pulse radiating upwards */}
            <path d="M21 4L24 1L27 4" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Lower acoustic bridge */}
            <path d="M10 40H38" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {showText && (
        <div>
          <div className="flex items-center gap-2">
            <span className={`${textSizes[size]} font-black tracking-tight bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 bg-clip-text text-transparent`}>
              AtocarYa
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
