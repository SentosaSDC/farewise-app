import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Navigation2, 
  ArrowUpDown, 
  Search, 
  Clock, 
  Compass, 
  Zap, 
  Palmtree, 
  Plane, 
  Building2, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { LocationItem } from '../types';
import { SINGAPORE_LOCATIONS, POPULAR_ROUTES } from '../data/singaporeLocations';

interface RouteSelectorProps {
  origin: LocationItem;
  destination: LocationItem;
  onSelectOrigin: (loc: LocationItem) => void;
  onSelectDestination: (loc: LocationItem) => void;
  distanceKm: number;
  durationMins: number;
  erpFee: number;
  specialSurcharge: number;
  specialSurchargeLabel?: string;
  onSwap: () => void;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  distanceKm,
  durationMins,
  erpFee,
  specialSurcharge,
  specialSurchargeLabel,
  onSwap,
}) => {
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setIsOriginOpen(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setIsDestOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterLocations = (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return SINGAPORE_LOCATIONS;
    return SINGAPORE_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q) ||
        loc.postalCode.includes(q) ||
        loc.district.toLowerCase().includes(q)
    );
  };

  const filteredOrigins = filterLocations(originSearch);
  const filteredDests = filterLocations(destSearch);

  const handleApplyPreset = (fromId: string, toId: string) => {
    const fromLoc = SINGAPORE_LOCATIONS.find((l) => l.id === fromId);
    const toLoc = SINGAPORE_LOCATIONS.find((l) => l.id === toId);
    if (fromLoc && toLoc) {
      onSelectOrigin(fromLoc);
      onSelectDestination(toLoc);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'airport':
        return <Plane className="w-4 h-4 text-sky-500" />;
      case 'attraction':
        return <Palmtree className="w-4 h-4 text-emerald-500" />;
      case 'business':
        return <Building2 className="w-4 h-4 text-slate-600" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5">
      {/* Route Selector Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-center">
        {/* Origin Input */}
        <div className="relative" ref={originRef}>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              Pick-up Location
            </span>
            <span className="text-[10px] text-slate-400 font-mono">S({origin.postalCode})</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setIsOriginOpen(!isOriginOpen);
              setIsDestOpen(false);
            }}
            className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-800 shrink-0">
                {getCategoryIcon(origin.category)}
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-900 text-sm truncate">{origin.name}</p>
                <p className="text-xs text-slate-500 truncate">{origin.address}</p>
              </div>
            </div>
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </button>

          {/* Origin Dropdown */}
          {isOriginOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-80 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Singapore place, address or 6-digit postal..."
                    value={originSearch}
                    onChange={(e) => setOriginSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100 p-1">
                {filteredOrigins.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      onSelectOrigin(loc);
                      setIsOriginOpen(false);
                      setOriginSearch('');
                    }}
                    className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 hover:bg-emerald-50/60 transition-colors ${
                      loc.id === origin.id ? 'bg-emerald-50 border border-emerald-200' : ''
                    }`}
                  >
                    <div className="p-1 rounded bg-slate-100 shrink-0 mt-0.5">
                      {getCategoryIcon(loc.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {loc.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {loc.postalCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{loc.address}</p>
                      {loc.specialSurcharge && (
                        <span className="inline-block mt-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                          +{loc.specialSurcharge.name}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1 md:my-0">
          <button
            onClick={onSwap}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 transition-transform active:scale-90 shadow-2xs"
            title="Swap Pick-up and Drop-off"
          >
            <ArrowUpDown className="w-4 h-4 md:rotate-90" />
          </button>
        </div>

        {/* Destination Input */}
        <div className="relative" ref={destRef}>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-100" />
              Drop-off Destination
            </span>
            <span className="text-[10px] text-slate-400 font-mono">S({destination.postalCode})</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setIsDestOpen(!isDestOpen);
              setIsOriginOpen(false);
            }}
            className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="p-1.5 rounded-lg bg-rose-100/70 text-rose-800 shrink-0">
                {getCategoryIcon(destination.category)}
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-900 text-sm truncate">{destination.name}</p>
                <p className="text-xs text-slate-500 truncate">{destination.address}</p>
              </div>
            </div>
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </button>

          {/* Destination Dropdown */}
          {isDestOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-80 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Singapore place, address or 6-digit postal..."
                    value={destSearch}
                    onChange={(e) => setDestSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100 p-1">
                {filteredDests.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      onSelectDestination(loc);
                      setIsDestOpen(false);
                      setDestSearch('');
                    }}
                    className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 hover:bg-rose-50/60 transition-colors ${
                      loc.id === destination.id ? 'bg-rose-50 border border-rose-200' : ''
                    }`}
                  >
                    <div className="p-1 rounded bg-slate-100 shrink-0 mt-0.5">
                      {getCategoryIcon(loc.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {loc.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {loc.postalCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{loc.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Route Telemetry Pill */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-600">
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md font-semibold text-slate-800">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>{distanceKm} km</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md font-semibold text-slate-800">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>~{durationMins} mins travel time</span>
          </div>

          {erpFee > 0 ? (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md font-medium">
              <Zap className="w-3 h-3 text-amber-600" />
              <span>ERP Gantry: S${erpFee.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>ERP Free Route</span>
            </div>
          )}

          {specialSurcharge > 0 && (
            <div className="flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-md font-medium">
              <Info className="w-3 h-3 text-purple-600" />
              <span>{specialSurchargeLabel || `Levy S$${specialSurcharge.toFixed(2)}`}</span>
            </div>
          )}
        </div>

        {/* Sentosa Badge when Sentosa is origin/destination */}
        {(origin.id.includes('sentosa') || destination.id.includes('sentosa')) && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-900 bg-emerald-100/70 border border-emerald-300 px-2.5 py-1 rounded-md font-semibold">
            <Palmtree className="w-3.5 h-3.5 text-emerald-700" />
            <span>Sentosa Island Corridor Active</span>
          </div>
        )}
      </div>

      {/* Popular Fast Route Presets */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Quick Routes:
        </span>
        {POPULAR_ROUTES.map((route, idx) => (
          <button
            key={idx}
            onClick={() => handleApplyPreset(route.fromId, route.toId)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 font-medium transition-colors"
          >
            {route.title}
          </button>
        ))}
      </div>
    </div>
  );
};
