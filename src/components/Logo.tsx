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

  const uid = React.useId().replace(/:/g, '');

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Emblema Aesthetic Moderno: Halo Acústico + Cresta Armónica en Obsidiana & Oro Champán */}
      <div
        className={`${iconDimensions[size]} relative rounded-[26%] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-glow`}
      >
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`bg_${uid}`} cx="35%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#262630" />
              <stop offset="60%" stopColor="#131318" />
              <stop offset="100%" stopColor="#09090C" />
            </radialGradient>
            <linearGradient id={`gold_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F7E4CA" />
              <stop offset="50%" stopColor="#D8B28A" />
              <stop offset="100%" stopColor="#E08E45" />
            </linearGradient>
          </defs>
          <rect x="8" y="8" width="496" height="496" rx="124" fill={`url(#bg_${uid})`} stroke="#D8B28A" strokeOpacity="0.45" strokeWidth="14" />
          <path d="M 119 294 A 146 146 0 0 1 227 151" fill="none" stroke={`url(#gold_${uid})`} strokeWidth="24" strokeLinecap="round" />
          <path d="M 285 151 A 146 146 0 0 1 393 294" fill="none" stroke={`url(#gold_${uid})`} strokeWidth="24" strokeLinecap="round" />
          <circle cx="256" cy="142" r="15" fill="#F7E4CA" />
          <rect x="140" y="272" width="32" height="90" rx="16" fill={`url(#gold_${uid})`} opacity="0.85" />
          <rect x="190" y="218" width="34" height="162" rx="17" fill={`url(#gold_${uid})`} />
          <rect x="239" y="176" width="34" height="232" rx="17" fill="#FFFFFF" />
          <rect x="288" y="218" width="34" height="162" rx="17" fill={`url(#gold_${uid})`} />
          <rect x="340" y="272" width="32" height="90" rx="16" fill="#E08E45" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center gap-2">
          <span
            className={`${textSizes[size]} font-display font-extrabold tracking-tight text-white leading-none`}
          >
            ATocar<span className="text-[#D8B28A]">Ya</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#D8B28A] to-[#E08E45] text-[#0D0D10] text-[9px] font-black uppercase tracking-widest leading-none">
            {subtitle || 'STUDIO'}
          </span>
        </div>
      )}
    </div>
  );
};
