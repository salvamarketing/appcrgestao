import React from 'react';

interface CRLogoProps {
  variant?: 'full' | 'mark' | 'emblem' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
}

export const CRLogo: React.FC<CRLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showText = false,
  textColor = 'text-slate-900',
  subtextColor = 'text-blue-600',
}) => {
  // Size presets (ajustados proporcionalmente para não cortar)
  const sizeMap = {
    xs: { logo: 'h-5 w-auto', mark: 'w-5 h-5', text: 'text-xs', subtext: 'text-[9px]' },
    sm: { logo: 'h-7 w-auto', mark: 'w-7 h-7', text: 'text-sm', subtext: 'text-[10px]' },
    md: { logo: 'h-9 w-auto', mark: 'w-9 h-9', text: 'text-base', subtext: 'text-xs' },
    lg: { logo: 'h-12 w-auto', mark: 'w-12 h-12', text: 'text-lg', subtext: 'text-sm' },
    xl: { logo: 'h-16 w-auto', mark: 'w-16 h-16', text: 'text-2xl', subtext: 'text-sm' },
    '2xl': { logo: 'h-24 w-auto', mark: 'w-24 h-24', text: 'text-3xl', subtext: 'text-base' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // The base SVG Mark containing the user's exact "CR" letters + Wrench in Bracket
  const LogoSVG = ({ isMarkOnly = false }: { isMarkOnly?: boolean }) => (
    <svg
      viewBox="0 0 765 375"
      className={`${isMarkOnly ? 'w-full h-full' : currentSize.logo} ${className} shrink-0 select-none overflow-visible`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="crLogoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0066f5" />
          <stop offset="45%" stopColor="#004ecc" />
          <stop offset="85%" stopColor="#002b85" />
          <stop offset="100%" stopColor="#001852" />
        </linearGradient>

        <linearGradient id="crLogoCyanHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="35%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        <linearGradient id="crLogoWrenchLight" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="75%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>

        <linearGradient id="crLogoWrenchDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0041a8" />
          <stop offset="60%" stopColor="#002773" />
          <stop offset="100%" stopColor="#001542" />
        </linearGradient>

        <linearGradient id="crLogoBracketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0080ff" />
          <stop offset="40%" stopColor="#0055d4" />
          <stop offset="100%" stopColor="#002b80" />
        </linearGradient>

        <filter id="crLogoGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
      </defs>

      <g filter="url(#crLogoGlow)">
        {/* ================= LETTER "C" ================= */}
        <path
          d="M 235 152 
             C 228 108, 195 72, 142 72 
             C 80 72, 35 125, 35 210 
             C 35 295, 80 348, 142 348 
             C 198 348, 230 312, 238 266 
             L 176 250 
             C 170 274, 155 296, 138 296 
             C 106 296, 88 260, 88 210 
             C 88 160, 106 124, 138 124 
             C 156 124, 170 144, 175 168 
             Z"
          fill="url(#crLogoBlueGrad)"
          stroke="#001a59"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Letter C Top Highlight Lip */}
        <path
          d="M 235 152 
             C 228 108, 195 72, 142 72 
             C 80 72, 35 125, 35 210 
             C 35 155, 80 82, 142 82 
             C 192 82, 222 116, 231 154 
             Z"
          fill="url(#crLogoCyanHighlight)"
          opacity="0.7"
        />

        {/* ================= LETTER "R" ================= */}
        <path
          d="M 245 76 
             L 345 76 
             C 382 76, 408 98, 408 142 
             C 408 178, 385 200, 350 206 
             L 420 344 
             L 360 344 
             L 298 220 
             L 298 344 
             L 245 344 
             Z 
             M 298 122 
             L 298 176 
             L 338 176 
             C 354 176, 365 166, 365 148 
             C 365 132, 354 122, 338 122 
             Z"
          fill="url(#crLogoBlueGrad)"
          stroke="#001a59"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Letter R Top Highlight */}
        <path
          d="M 245 76 
             L 345 76 
             C 382 76, 408 98, 408 142 
             C 408 118, 375 84, 342 84 
             L 252 84 
             L 252 76 
             Z"
          fill="url(#crLogoCyanHighlight)"
          opacity="0.8"
        />

        {/* ================= BRACKET ================= */}
        <path
          d="M 450 162 
             L 476 162 
             L 476 178 
             L 490 178 
             L 490 102 
             C 490 68, 510 52, 546 52 
             L 590 52 
             L 590 74 
             L 548 74 
             C 528 74, 516 82, 516 102 
             L 516 178 
             L 528 178 
             L 528 162 
             L 552 162 
             L 552 186 
             L 538 186 
             L 538 274 
             C 538 316, 566 338, 614 338 
             C 650 338, 672 320, 672 284 
             L 672 242 
             L 692 242 
             L 692 286 
             C 692 336, 658 358, 610 358 
             C 544 358, 512 324, 512 268 
             L 512 186 
             L 450 186 
             Z"
          fill="url(#crLogoBracketGrad)"
          stroke="#00184d"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Top bracket highlight */}
        <path
          d="M 490 102 
             C 490 68, 510 52, 546 52 
             L 590 52 
             L 590 62 
             L 546 62 
             C 516 62, 498 76, 498 102 
             Z"
          fill="#38bdf8"
          opacity="0.85"
        />

        {/* ================= WRENCH ================= */}
        <g transform="translate(485, 95)">
          <path
            d="M 68 182 
               L 125 125 
               L 155 155 
               L 98 212 
               C 85 225, 62 225, 48 212 
               C 35 198, 35 176, 48 162 
               L 68 182 Z"
            fill="url(#crLogoWrenchDark)"
          />

          <path
            d="M 126 124 
               L 65 185 
               C 55 195, 55 212, 65 222 
               C 76 232, 92 232, 102 222 
               L 164 160 
               C 178 170, 196 174, 215 168 
               C 226 164, 238 156, 246 146 
               L 204 124 
               C 196 120, 190 110, 192 100 
               C 194 90, 202 82, 212 80 
               L 240 76 
               C 232 58, 218 45, 200 40 
               C 172 32, 145 44, 132 68 
               C 126 80, 126 94, 130 106 
               L 126 124 Z"
            fill="url(#crLogoWrenchLight)"
            stroke="#002d8f"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Center Ridge line */}
          <path
            d="M 80 206 L 142 144"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>
      </g>
    </svg>
  );

  // Compact Badge / Icon Mark (for sidebar button, header icon, avatar)
  if (variant === 'mark') {
    return (
      <div
        className={`${currentSize.mark} rounded-xl bg-gradient-to-b from-[#0e1c38] via-[#091326] to-[#050a14] border border-blue-500/30 flex items-center justify-center p-1.5 shadow-md shadow-blue-900/30 shrink-0 relative overflow-hidden group ${className}`}
      >
        <div className="absolute inset-0 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors" />
        <LogoSVG isMarkOnly={true} />
      </div>
    );
  }

  // Horizontal variant with text
  if (variant === 'horizontal' || showText) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <LogoSVG />
        <div className="flex flex-col min-w-0">
          <span className={`font-black tracking-tight uppercase leading-none ${textColor} ${currentSize.text} flex items-center gap-1.5`}>
            CR SERVIÇOS
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase font-bold tracking-normal">
              24H
            </span>
          </span>
          <span className={`font-medium tracking-wide uppercase mt-1 ${subtextColor} ${currentSize.subtext}`}>
            Gestão Operacional & Manutenção
          </span>
        </div>
      </div>
    );
  }

  // Full Logo mark
  return <LogoSVG />;
};
