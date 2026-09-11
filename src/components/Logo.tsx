import React, { useState } from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  subtitle = 'Stress Relief App'
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 rounded-lg',
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
    xl: 'text-2xl font-extrabold'
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div 
        className={`${sizeClasses[size]} overflow-hidden shrink-0 shadow-xs border border-teal-600/20 bg-teal-50/50 flex items-center justify-center transition-transform hover:scale-105`}
      >
        {!imageError ? (
          <img
            src="/logo.png"
            alt="MindEase Stress Relief Logo"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center font-bold text-xs">
            ME
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className={`${textSizes[size]} tracking-tight text-stone-900 font-bold leading-none`}>
            MindEase
          </span>
          {subtitle && (
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-teal-800 uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
