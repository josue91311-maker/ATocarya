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
  lightText = false,
}) => {
  const fullHeights = {
    sm: 'h-9 sm:h-10',
    md: 'h-11 sm:h-12',
    lg: 'h-16 sm:h-20',
    xl: 'h-20 sm:h-24',
  };

  const iconSizes = {
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {showText ? (
        <div className="flex items-center gap-2.5">
          <img
            src={lightText ? '/logo-transparent.png?v=5' : '/logo-dark.png?v=5'}
            alt="AtocarYa · Programación de Canciones"
            className={`${fullHeights[size]} w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]`}
          />
          {subtitle && (
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-display font-extrabold uppercase tracking-widest ${
                lightText
                  ? 'bg-[#DCBD9E]/25 text-[#F8F4EA] border border-[#DCBD9E]/45'
                  : 'bg-[#E7EDF3] text-[#2E4056] border border-[#2E4056]/20'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E9B84] animate-pulse" />
              {subtitle}
            </span>
          )}
        </div>
      ) : (
        <div className={`${iconSizes[size]} relative rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105`}>
          <img
            src="/logo-emblem.png?v=5"
            alt="AtocarYa"
            className="w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};
