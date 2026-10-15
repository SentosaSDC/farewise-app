import React from 'react';
import { 
  Car, 
  CloudRain, 
  Sun, 
  CloudSun, 
  Sparkles, 
  PiggyBank, 
  Clock, 
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { FareWiseLogo } from './FareWiseLogo';

interface NavbarProps {
  weather: 'clear' | 'cloudy' | 'rain' | 'heavy_rain';
  setWeather: (w: 'clear' | 'cloudy' | 'rain' | 'heavy_rain') => void;
  selectedTimeMode: 'now' | 'morning_peak' | 'evening_peak' | 'midnight';
  setSelectedTimeMode: (m: 'now' | 'morning_peak' | 'evening_peak' | 'midnight') => void;
  totalSaved: number;
  onOpenHistory: () => void;
  onOpenPromos: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  weather,
  setWeather,
  selectedTimeMode,
  setSelectedTimeMode,
  totalSaved,
  onOpenHistory,
  onOpenPromos,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Singapore Badge */}
          <FareWiseLogo size="md" />

          {/* Quick Simulation Bar (Time & Weather in Singapore) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Weather Simulator */}
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600 px-2 flex items-center gap-1">
                Weather:
              </span>
              <button
                onClick={() => setWeather('clear')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  weather === 'clear'
                    ? 'bg-white text-amber-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Sunny / Dry (Standard Surge)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Clear</span>
              </button>
              <button
                onClick={() => setWeather('rain')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  weather === 'rain'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Passing Shower (+25% Surge)"
              >
                <CloudSun className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Rain</span>
              </button>
              <button
                onClick={() => setWeather('heavy_rain')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  weather === 'heavy_rain'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Heavy Downpour (+65% Surge across Grab/Gojek)"
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Storm</span>
              </button>
            </div>

            {/* Time Slot Peak Mode */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600 px-2 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Time:
              </span>
              <button
                onClick={() => setSelectedTimeMode('now')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedTimeMode === 'now'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Live Now
              </button>
              <button
                onClick={() => setSelectedTimeMode('morning_peak')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedTimeMode === 'morning_peak'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="08:30 AM CBD Morning Peak"
              >
                AM Peak
              </button>
              <button
                onClick={() => setSelectedTimeMode('evening_peak')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedTimeMode === 'evening_peak'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="18:30 PM Dinner & Evening Rush"
              >
                PM Peak
              </button>
              <button
                onClick={() => setSelectedTimeMode('midnight')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedTimeMode === 'midnight'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="01:30 AM Midnight Taxi 50% Surcharge"
              >
                Midnight
              </button>
            </div>

            {/* Savings & Shopback Badge */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 text-xs font-bold transition-all shadow-xs"
              title="Click to view ride savings history"
            >
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              <span>Saved S${totalSaved.toFixed(2)}</span>
            </button>

            {/* Promo Codes & Cashback Button */}
            <button
              onClick={onOpenPromos}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vouchers &amp; Cashback</span>
              <span className="sm:hidden">Promos</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
