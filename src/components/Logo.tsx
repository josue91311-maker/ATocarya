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
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Modern AtocarYa Emblem: Architectural 'A' + Soundwave */}
      <div className={`${iconSizes[size]} relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 text-white shadow-sm ring-1 ring-white/30 flex-shrink-0`}>
        <svg viewBox="0 0 64 64" fill="none" className="w-5/6 h-5/6">
          <path 
            d="M17 48 L30.2 14.6 C31.0 12.6 33.0 12.6 33.8 14.6 L47 48" 
            stroke="currentColor" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M14 34 C19 34 21 28 26 28 C31 28 33 40 38 40 C43 40 45 34 50 34" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          <circle cx="38" cy="40" r="3.5" fill="#34d399" />
          <circle cx="26" cy="28" r="2.5" fill="currentColor" />
        </svg>
      </div>

      {showText && (
        <div>
          <div className="flex items-center gap-2">
            <span className={`${textSizes[size]} font-bold tracking-tight text-slate-900 font-display`}>
              AtocarYa
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Services
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
