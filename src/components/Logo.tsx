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
          <img 
            src={lightText ? "/logo-transparent.png" : "/logo-dark.png"} 
            alt="ATocarYa - Worship Team Scheduling" 
            className={`${imageHeights[size]} w-auto object-contain`}
          />
          {subtitle && (
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
              lightText 
                ? 'bg-white/15 text-white border border-white/20' 
                : 'bg-[#D9E9EB] text-[#315F6D] border border-[#315F6D]/20'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8B844] animate-pulse" />
              {subtitle}
            </span>
          )}
        </div>
      ) : (
        /* Modo solo ícono / emblema oficial transparente */
        <div className={`${iconSizes[size]} relative flex items-center justify-center flex-shrink-0`}>
          <img 
            src="/favicon.png" 
            alt="ATocarYa" 
            className="w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};
