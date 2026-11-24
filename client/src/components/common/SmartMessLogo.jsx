import React from 'react';

const sizeConfig = {
  sm: { icon: 28, text: 'text-base', sub: 'text-[10px]' },
  md: { icon: 38, text: 'text-xl', sub: 'text-xs' },
  lg: { icon: 48, text: 'text-2xl', sub: 'text-xs' },
  xl: { icon: 64, text: 'text-3xl', sub: 'text-sm' },
};

export const SmartMessLogo = ({
  size = 'md',
  variant = 'full',
  subtitle = 'Dining & Zero-Waste Platform',
  className = '',
  inverted = false,
}) => {
  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon SVG */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={config.icon}
          height={config.icon}
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-xs transition-transform duration-300 hover:scale-105"
          aria-hidden="true"
        >
          <defs>
            {/* Primary Gradient: Violet to Indigo */}
            <linearGradient id="smPrimaryGrad" x1="4" y1="4" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>

            {/* Glowing Accent Gradient */}
            <linearGradient id="smAccentRing" x1="0" y1="28" x2="56" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="50%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>

            {/* Eco Leaf Gradient */}
            <linearGradient id="smLeafGrad" x1="36" y1="4" x2="52" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Plate Base Fill */}
            <linearGradient id="smPlateFill" x1="12" y1="12" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#F5F3FF" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Outer Queue Orbit Track */}
          <circle
            cx="28"
            cy="30"
            r="23"
            stroke="url(#smPrimaryGrad)"
            strokeWidth="2.5"
            strokeDasharray="6 4.5"
            strokeLinecap="round"
            opacity="0.35"
          />

          {/* Real-time Queue Indicator Dots (moving clockwise flow) */}
          <circle cx="28" cy="7" r="3.2" fill="#8B5CF6" />
          <circle cx="49" cy="22" r="2.4" fill="#6366F1" opacity="0.8" />
          <circle cx="47" cy="42" r="2.8" fill="#4F46E5" />
          <circle cx="9" cy="38" r="2.2" fill="#A855F7" opacity="0.6" />

          {/* Main Dining Plate (Outer Rim) */}
          <circle
            cx="28"
            cy="30"
            r="18"
            fill="url(#smPrimaryGrad)"
          />

          {/* Plate Surface (Inner Porcelain Bowl) */}
          <circle
            cx="28"
            cy="30"
            r="14"
            fill="url(#smPlateFill)"
          />

          {/* Inner Plate Well Border */}
          <circle
            cx="28"
            cy="30"
            r="10.5"
            stroke="#DDD6FE"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Minimalist Cutlery: Fork (left) and Spoon (right) */}
          {/* Fork */}
          <g fill="#4F46E5">
            <rect x="23.5" y="24" width="1.2" height="11" rx="0.6" />
            {/* Prongs */}
            <path d="M22 24.5V28C22 28.8 22.7 29.5 23.5 29.5V29.5C24.3 29.5 25 28.8 25 28V24.5" stroke="#4F46E5" strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <line x1="23.5" y1="24.5" x2="23.5" y2="28" stroke="#4F46E5" strokeWidth="1.1" strokeLinecap="round" />
          </g>

          {/* Spoon */}
          <g fill="#4F46E5">
            <rect x="31" y="27" width="1.2" height="8" rx="0.6" />
            <ellipse cx="31.6" cy="24.5" rx="2.4" ry="3.5" />
          </g>

          {/* Eco Sustainability Leaf (Symbolizing zero food waste) */}
          <path
            d="M38 18C38 18 42 12 49 11C49 11 49.5 17 44.5 21C41.5 23.5 38 21.5 38 18Z"
            fill="url(#smLeafGrad)"
          />
          {/* Leaf Vein */}
          <path
            d="M39.5 18.5C42.5 17.5 45.5 15 47.5 13"
            stroke="#ECFDF5"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </svg>

        {/* Small live pulse ring on top of logo */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      {/* Typography */}
      {variant === 'full' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${config.text} ${
                inverted ? 'text-white' : 'text-gray-900'
              }`}
            >
              Smart<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Mess</span>
            </span>
            <span className="rounded-md bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Queue
            </span>
          </div>
          {subtitle && (
            <span
              className={`font-medium tracking-normal ${config.sub} ${
                inverted ? 'text-indigo-200' : 'text-gray-500'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

