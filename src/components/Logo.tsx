import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  subtitle?: string;
  lightText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  subtitle = '',
  lightText = false
}) => {
  const imageHeights = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {showText ? (
        <div className="flex items-center gap-2.5">
          {lightText ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 relative flex items-center justify-center shrink-0 bg-white/10 rounded-xl p-1 border border-white/20 shadow-xs">
                <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                  <circle cx="32" cy="32" r="23" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeDasharray="115 35" strokeDashoffset="-12" />
                  <polygon points="47,15 52,20 48,24 43,19" fill="#E8B844" />
                  <circle cx="24" cy="42" r="9.5" fill="#FFFFFF" />
                  <path d="M24 42 V26 L34 36 L55 15" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-white font-extrabold text-base tracking-tight leading-tight font-display">
                  ATocarYa
                </span>
                <span className="text-[10px] font-semibold text-white/70 tracking-wide leading-none mt-0.5">
                  Worship Team Scheduling
                </span>
              </div>
            </div>
          ) : (
            <img 
              src="/logooficial.png" 
              alt="ATocarYa - Worship Team Scheduling" 
              className={`${imageHeights[size]} w-auto object-contain`}
            />
          )}
          {subtitle && (
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
              lightText 
                ? 'bg-white/15 text-white border border-white/20' 
                : 'bg-emerald-50 text-[#315F6D] border border-emerald-200/80'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8B844] animate-pulse" />
              {subtitle}
            </span>
          )}
        </div>
      ) : (
        /* Modo solo ícono / emblema oficial */
        <div className={`${iconSizes[size]} relative flex items-center justify-center flex-shrink-0 bg-white rounded-2xl p-1 shadow-xs border border-slate-100`}>
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
            {/* Círculo Azul Eléctrico */}
            <circle 
              cx="32" 
              cy="32" 
              r="23" 
              stroke="#1E74FD" 
              strokeWidth="6.5" 
              strokeLinecap="round"
              strokeDasharray="115 35"
              strokeDashoffset="-12"
            />
            {/* Acento Naranja */}
            <polygon 
              points="47,15 52,20 48,24 43,19" 
              fill="#FF7E22" 
            />
            {/* Cabeza de Nota Azul Marino Profundo */}
            <circle 
              cx="24" 
              cy="42" 
              r="9.5" 
              fill="#0B132B" 
            />
            {/* Checkmark Azul Eléctrico */}
            <path 
              d="M24 42 V26 L34 36 L55 15" 
              stroke="#1E74FD" 
              strokeWidth="6.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* Plica Nota Azul Marino */}
            <line 
              x1="24" 
              y1="42" 
              x2="24" 
              y2="26" 
              stroke="#0B132B" 
              strokeWidth="6.5" 
              strokeLinecap="round" 
            />
          </svg>
        </div>
      )}
    </div>
  );
};
