import React, { useState } from 'react';
import { LocationItem } from '../types';
import { 
  Navigation, 
  Car, 
  MapPin, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Flame, 
  Compass,
  Sparkles
} from 'lucide-react';

interface RouteMapProps {
  origin: LocationItem;
  destination: LocationItem;
  distanceKm: number;
  durationMins: number;
  erpFee: number;
  driverCount: number;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  origin,
  destination,
  distanceKm,
  durationMins,
  erpFee,
  driverCount,
}) => {
  const [showTraffic, setShowTraffic] = useState(true);
  const [showGantries, setShowGantries] = useState(true);

  // Map latitude/longitude bounds of Singapore to SVG viewBox (0 0 1000 560)
  // SG approx: Lat 1.22 to 1.47, Lng 103.60 to 104.04
  const minLng = 103.62;
  const maxLng = 104.02;
  const minLat = 1.23;
  const maxLat = 1.46;

  const projectToSvg = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 960 + 20;
    // Lat is inverted in SVG y-coords
    const y = ((maxLat - lat) / (maxLat - minLat)) * 520 + 20;
    return { x: Math.max(40, Math.min(940, x)), y: Math.max(30, Math.min(510, y)) };
  };

  const pOrigin = projectToSvg(origin.lat, origin.lng);
  const pDest = projectToSvg(destination.lat, destination.lng);

  // Midpoint with curve offset for realistic highway path
  const midX = (pOrigin.x + pDest.x) / 2;
  const midY = (pOrigin.y + pDest.y) / 2;
  const dx = pDest.x - pOrigin.x;
  const dy = pDest.y - pOrigin.y;
  // Perpendicular curve
  const curveFactor = 0.18;
  const ctrlX = midX - dy * curveFactor;
  const ctrlY = midY + dx * curveFactor;

  const pathD = `M ${pOrigin.x} ${pOrigin.y} Q ${ctrlX} ${ctrlY} ${pDest.x} ${pDest.y}`;

  // ERP Gantry location along the path (approx 45% along route)
  const gantryX = 0.55 * 0.55 * pOrigin.x + 2 * 0.55 * 0.45 * ctrlX + 0.45 * 0.45 * pDest.x;
  const gantryY = 0.55 * 0.55 * pOrigin.y + 2 * 0.55 * 0.45 * ctrlY + 0.45 * 0.45 * pDest.y;

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
      {/* Top Map HUD Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-white text-xs shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">Singapore Live Mobility Radar</span>
          <span className="text-slate-400 text-[11px]">|</span>
          <span className="text-emerald-400 font-medium">{driverCount} drivers nearby</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 text-xs">
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              showTraffic
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Traffic
          </button>
          <button
            onClick={() => setShowGantries(!showGantries)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              showGantries
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ERP Gantries
          </button>
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="w-full h-64 sm:h-80 relative select-none">
        <svg
          viewBox="0 0 1000 560"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Singapore Water & Land Gradients */}
            <linearGradient id="sgLand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            {/* Glowing route filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>

            {/* Moving Car Marker pattern */}
            <radialGradient id="pinPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Ocean */}
          <rect width="1000" height="560" fill="#090d16" />

          {/* Stylized Singapore Expressway Network (PIE, AYE, CTE, ECP, KJE, SLE, TPE) */}
          <g stroke="#334155" strokeWidth="1.2" opacity="0.4" fill="none">
            {/* PIE (Tuas to Changi) */}
            <path d="M 90 280 Q 300 240 500 270 T 910 260" strokeDasharray="3,3" />
            {/* AYE (Tuas to Marina Bay) */}
            <path d="M 120 330 Q 340 370 540 400 T 680 430" />
            {/* CTE (Seletar to CBD) */}
            <path d="M 540 100 Q 550 240 560 360 T 570 440" />
            {/* ECP (Changi to Marina Bay / Sentosa bridge) */}
            <path d="M 910 270 Q 750 360 620 440 L 510 470" />
            {/* KPE / TPE */}
            <path d="M 720 160 Q 640 280 610 390" />
          </g>

          {/* Singapore Simplified Coastline & Islands */}
          {/* Main Island */}
          <path
            d="M 140 290 
               C 100 250, 110 180, 220 160 
               C 320 140, 420 110, 520 100 
               C 620 90, 720 130, 800 150 
               C 880 170, 930 220, 940 270 
               C 920 330, 840 360, 750 390 
               C 670 420, 600 450, 550 450 
               C 490 450, 440 430, 360 410 
               C 270 390, 200 370, 150 340 Z"
            fill="url(#sgLand)"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Sentosa Island (South) */}
          <path
            d="M 470 475 
               C 490 468, 540 470, 560 480 
               C 550 495, 520 505, 480 500 
               C 460 495, 460 482, 470 475 Z"
            fill="#134e4a"
            stroke="#0d9488"
            strokeWidth="1.5"
          />
          {/* Sentosa Gateway Bridge */}
          <line
            x1="510"
            y1="450"
            x2="510"
            y2="475"
            stroke="#14b8a6"
            strokeWidth="2.5"
            strokeDasharray="2,2"
          />
          <text x="500" y="520" fill="#2dd4bf" fontSize="11" fontWeight="bold" textAnchor="middle">
            🏝️ Sentosa Island
          </text>

          {/* Jurong Island */}
          <path
            d="M 220 410 C 260 410, 300 430, 290 460 C 260 470, 210 460, 200 435 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Pulau Ubin & Tekong (Northeast) */}
          <ellipse cx="780" cy="120" rx="35" ry="14" fill="#1e293b" stroke="#334155" />
          <ellipse cx="850" cy="115" rx="30" ry="20" fill="#1e293b" stroke="#334155" />

          {/* Major Key Geographic Labels */}
          <text x="910" y="240" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">
            ✈️ Changi
          </text>
          <text x="580" y="420" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">
            🏙️ CBD / MBS
          </text>
          <text x="280" y="310" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">
            🏢 Jurong
          </text>
          <text x="460" y="140" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">
            🛂 Woodlands
          </text>
          <text x="740" y="270" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">
            🏡 Tampines
          </text>

          {/* Traffic Density Highlights */}
          {showTraffic && (
            <g opacity="0.75">
              {/* CTE & CBD Traffic glow (moderate/heavy) */}
              <circle cx="560" cy="400" r="32" fill="#ef4444" opacity="0.15" />
              <circle cx="560" cy="400" r="16" fill="#ef4444" opacity="0.25" />
              {/* Sentosa Gateway traffic flow (flowing/green) */}
              <circle cx="510" cy="460" r="18" fill="#10b981" opacity="0.2" />
            </g>
          )}

          {/* Nearby Active Drivers (Grab green, Gojek green, TADA orange, Taxi blue) */}
          <g>
            <circle cx={pOrigin.x - 22} cy={pOrigin.y + 14} r="3" fill="#00B14F" />
            <circle cx={pOrigin.x + 18} cy={pOrigin.y - 16} r="3" fill="#00AA13" />
            <circle cx={pOrigin.x + 30} cy={pOrigin.y + 20} r="3" fill="#FA6400" />
            <circle cx={pOrigin.x - 15} cy={pOrigin.y - 25} r="3" fill="#004B9B" />
            <circle cx={pOrigin.x + 40} cy={pOrigin.y - 8} r="3" fill="#00B14F" />
          </g>

          {/* Calculated Route Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#glow)"
            opacity="0.9"
          />

          {/* Dashed moving line */}
          <path
            d={pathD}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6,8"
            className="animate-pulse"
          />

          {/* ERP Gantry Marker on Route */}
          {showGantries && erpFee > 0 && (
            <g transform={`translate(${gantryX}, ${gantryY})`}>
              <rect
                x="-36"
                y="-22"
                width="72"
                height="20"
                rx="6"
                fill="#1e1b4b"
                stroke="#818cf8"
                strokeWidth="1.5"
              />
              <text x="0" y="-8" fill="#c7d2fe" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                ⚡ ERP S${erpFee.toFixed(2)}
              </text>
            </g>
          )}

          {/* Pick-up Pin (Origin) */}
          <g transform={`translate(${pOrigin.x}, ${pOrigin.y})`}>
            {/* Ripple */}
            <circle cx="0" cy="0" r="18" fill="url(#pinPulse)" className="animate-ping" opacity="0.5" />
            <circle cx="0" cy="0" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
            {/* Label bubble */}
            <g transform="translate(0, -18)">
              <rect
                x="-65"
                y="-18"
                width="130"
                height="20"
                rx="6"
                fill="#064e3b"
                stroke="#10b981"
                strokeWidth="1.2"
              />
              <text x="0" y="-5" fill="#ecfdf5" fontSize="10" fontWeight="bold" textAnchor="middle">
                🟢 {origin.name.slice(0, 15)}
              </text>
            </g>
          </g>

          {/* Drop-off Pin (Destination) */}
          <g transform={`translate(${pDest.x}, ${pDest.y})`}>
            <circle cx="0" cy="0" r="9" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.5" />
            {/* Label bubble */}
            <g transform="translate(0, -18)">
              <rect
                x="-65"
                y="-18"
                width="130"
                height="20"
                rx="6"
                fill="#881337"
                stroke="#f43f5e"
                strokeWidth="1.2"
              />
              <text x="0" y="-5" fill="#fff1f2" fontSize="10" fontWeight="bold" textAnchor="middle">
                🔴 {destination.name.slice(0, 15)}
              </text>
            </g>
          </g>
        </svg>

        {/* Bottom Route Summary Floating Card */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-white shadow-xl flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Navigation className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Fastest Corridor</p>
              <p className="font-bold text-slate-100">{distanceKm} km · ~{durationMins} mins</p>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div>
            <p className="text-[10px] text-slate-400 font-medium">ERP Status</p>
            <p className={`font-bold ${erpFee > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {erpFee > 0 ? `S$${erpFee.toFixed(2)} active` : 'No Tolls'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
