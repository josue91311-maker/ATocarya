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
      {/* Planning Center Services style Icon with Emerald Gradient */}
      <div className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm flex-shrink-0`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          {/* Planning Center Services style Music Sheet & Play icon */}
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
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
