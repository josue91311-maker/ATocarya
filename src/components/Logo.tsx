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
      {/* Símbolo vectorial profesional: Pulso de sonido / ecualizador de escenario */}
      <div
        className={`${iconDimensions[size]} relative rounded-xl bg-gradient-to-br from-[#1C2D4F] to-[#0D162B] border border-[#38BDF8]/35 flex items-center justify-center flex-shrink-0 shadow-glow`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[68%] h-[68%]"
          aria-hidden="true"
        >
          <rect x="4" y="15" width="3.5" height="10" rx="1.75" fill="#38BDF8" fillOpacity="0.65" />
          <rect x="10.5" y="9" width="3.5" height="20" rx="1.75" fill="#38BDF8" />
          <rect x="17" y="5" width="3.5" height="26" rx="1.75" fill="#FFFFFF" />
          <rect x="23.5" y="11" width="3.5" height="16" rx="1.75" fill="#38BDF8" />
          <rect x="30" y="16" width="3.5" height="8" rx="1.75" fill="#FACC15" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center gap-2">
          <span
            className={`${textSizes[size]} font-display font-extrabold italic tracking-tight text-white leading-none`}
          >
            ATOCAR<span className="text-[#38BDF8]">YA</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#FACC15] text-[#0B1120] text-[9px] font-black uppercase tracking-widest leading-none shadow-glow-yellow">
            {subtitle || 'LIVE'}
          </span>
        </div>
      )}
    </div>
  );
};
