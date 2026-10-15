import React from 'react';

interface FareWiseLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light' | 'auto';
  showSubtitle?: boolean;
}

export const FareWiseLogo: React.FC<FareWiseLogoProps> = ({
  size = 'md',
  theme = 'auto',
  showSubtitle = true,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
  };

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 group select-none">
      {/* Vibrant Consumer Emblem */}
      <div className="relative">
        {/* Ambient neon aura */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-2xl blur-xs opacity-70 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />

        {/* 3D Glass / Vibrant Gradient Squircle */}
        <div
          className={`${iconSizes[size]} relative rounded-2xl bg-gradient-to-tr from-[#008744] via-[#00B14F] to-[#00E575] p-[1.5px] shadow-lg shadow-emerald-500/25 transform transition-transform group-hover:scale-105 duration-200 flex items-center justify-center`}
        >
          <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-slate-950 via-slate-900 to-[#032e1d] flex items-center justify-center overflow-hidden relative">
            {/* Background speed streaks */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px] opacity-25" />
            
            {/* Custom SVG: Intersecting Fast Arrows / Dynamic "FW" Car Silhouette */}
            <svg
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={isSm ? 'w-5 h-5' : isLg ? 'w-8 h-8' : 'w-6 h-6'}
            >
              {/* Lightning / Speed Accent */}
              <path
                d="M19 3L11 17H18L15 31L27 15H19L23 3Z"
                fill="url(#lightningGrad)"
                opacity="0.25"
              />
              
              {/* Sleek Aerodynamic Ride Hail Vehicle Silhouette */}
              <path
                d="M9 22C7.89543 22 7 22.8954 7 24C7 25.1046 7.89543 26 9 26H27C28.1046 26 29 25.1046 29 24C29 22.8954 28.1046 22 27 22C26.5 22 25.8 21.6 25.2 20.8L23.4 17.2C22.8 16 21.6 15.2 20.2 15.2H14.8C13.4 15.2 12.2 16 11.6 17.2L9.8 20.8C9.2 21.6 8.5 22 9 22Z"
                fill="url(#carGrad)"
              />
              {/* Windshield */}
              <path
                d="M12.6 18.2C12.9 17.6 13.5 17.2 14.2 17.2H20.8C21.5 17.2 22.1 17.6 22.4 18.2L23.9 21.2H11.1L12.6 18.2Z"
                fill="#052e16"
              />
              {/* Glowing Headlights */}
              <circle cx="10.5" cy="23.5" r="1.5" fill="#FDE047" />
              <circle cx="24.5" cy="23.5" r="1.5" fill="#38BDF8" />
              {/* Wheels */}
              <circle cx="11.5" cy="26" r="2.2" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
              <circle cx="23.5" cy="26" r="2.2" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
              
              {/* Dynamic Currency/Target Smart Radar Ring */}
              <circle cx="28" cy="9" r="4.5" fill="#F59E0B" />
              <text
                x="28"
                y="11.8"
                fill="#ffffff"
                fontSize="6"
                fontWeight="900"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                $
              </text>

              <defs>
                <linearGradient id="lightningGrad" x1="11" y1="3" x2="27" y2="31" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F59E0B" />
                  <stop offset="1" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="carGrad" x1="7" y1="15" x2="29" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#34D399" />
                  <stop offset="0.5" stopColor="#10B981" />
                  <stop offset="1" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing active radar dot */}
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-amber-400/40 animate-ping" />
          </div>
        </div>
      </div>

      {/* Wordmark Typography */}
      <div>
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-tight leading-none ${
              isSm ? 'text-lg' : isLg ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
            } ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            Fare<span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 bg-clip-text text-transparent">Wise</span>
          </span>

          {/* Singapore Flag / Micro Pill */}
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            SG
          </span>
        </div>

        {showSubtitle && (
          <p
            className={`font-semibold tracking-wide ${
              isSm ? 'text-[10px]' : 'text-[11px]'
            } ${
              theme === 'dark' ? 'text-emerald-300/80' : 'text-slate-500'
            } flex items-center gap-1 mt-0.5`}
          >
            <span>Live SG Fare Radar</span>
            <span className="text-emerald-500 font-bold">·</span>
            <span className="text-amber-500 font-bold">Grab · Gojek · TADA · Taxi</span>
          </p>
        )}
      </div>
    </div>
  );
};
