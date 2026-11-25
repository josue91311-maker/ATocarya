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
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Emblema Oficial: A Grande + Arpa de David + Oveja Abstracta en Oro Champán & Obsidiana */}
      <div
        className={`${iconDimensions[size]} relative rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-glow`}
      >
        <img
          src="/logo-emblem.png?v=4"
          alt="ATocarYa"
          className="w-full h-full object-contain"
        />
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
