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
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Símbolo vectorial moderno estilo estudio musical (Obsidiana + Oro Champán) */}
      <div
        className={`${iconDimensions[size]} relative rounded-xl bg-gradient-to-br from-[#23232B] to-[#0D0D10] border border-[#D8B28A]/40 flex items-center justify-center flex-shrink-0 shadow-glow`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[66%] h-[66%]"
          aria-hidden="true"
        >
          <rect x="4" y="15" width="3.5" height="10" rx="1.75" fill="#D8B28A" fillOpacity="0.65" />
          <rect x="10.5" y="9" width="3.5" height="20" rx="1.75" fill="#D8B28A" />
          <rect x="17" y="5" width="3.5" height="26" rx="1.75" fill="#FFFFFF" />
          <rect x="23.5" y="11" width="3.5" height="16" rx="1.75" fill="#D8B28A" />
          <rect x="30" y="16" width="3.5" height="8" rx="1.75" fill="#E08E45" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center gap-2">
          <span
            className={`${textSizes[size]} font-display font-extrabold tracking-tight text-white leading-none`}
          >
            ATocar<span className="text-[#D8B28A]">Ya</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#D8B28A] text-[#0D0D10] text-[9px] font-black uppercase tracking-widest leading-none">
            {subtitle || 'STUDIO'}
          </span>
        </div>
      )}
    </div>
  );
};
