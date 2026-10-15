import React, { useState } from 'react';
import { 
  RideOption, 
  PlatformId, 
  RideTier 
} from '../types';
import { 
  Clock, 
  Users, 
  Zap, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Car, 
  ExternalLink, 
  BadgePercent,
  Check,
  Flame,
  ArrowRight
} from 'lucide-react';

interface FareComparisonTableProps {
  options: RideOption[];
  onSelectBooking: (option: RideOption) => void;
  weather: string;
}

export const FareComparisonTable: React.FC<FareComparisonTableProps> = ({
  options,
  onSelectBooking,
  weather,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'standard' | 'cheapest' | 'fastest' | 'large' | 'premium'>('all');
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);

  // Platform logo / visual badges
  const getPlatformIcon = (platform: PlatformId) => {
    switch (platform) {
      case 'grab':
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#009b45] to-[#00c853] text-white flex flex-col items-center justify-center font-black shadow-sm ring-1 ring-emerald-400/30">
            <span className="text-[11px] tracking-tight leading-none">Grab</span>
          </div>
        );
      case 'gojek':
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#008f10] to-[#00b818] text-white flex flex-col items-center justify-center font-black shadow-sm ring-1 ring-green-400/30">
            <span className="text-[10px] tracking-tight leading-none">gojek</span>
          </div>
        );
      case 'tada':
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e05800] to-[#ff7b1a] text-white flex flex-col items-center justify-center font-black shadow-sm ring-1 ring-orange-400/30">
            <span className="text-[11px] tracking-wider leading-none">TADA</span>
          </div>
        );
      case 'taxi_cdg':
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#003c7d] to-[#025ec2] text-white flex flex-col items-center justify-center font-black shadow-sm ring-1 ring-blue-400/30">
            <span className="text-[10px] tracking-tight leading-none">CDG</span>
            <span className="text-[8px] opacity-80 leading-none">Zig</span>
          </div>
        );
    }
  };

  const getFilteredOptions = () => {
    let list = [...options];

    switch (selectedFilter) {
      case 'standard':
        return list.filter((o) => o.tier === 'standard');
      case 'large':
        return list.filter((o) => o.tier === 'large');
      case 'premium':
        return list.filter((o) => o.tier === 'premium');
      case 'cheapest':
        return [...list].sort((a, b) => a.finalEffectiveFare - b.finalEffectiveFare);
      case 'fastest':
        return [...list].sort((a, b) => a.etaMinutes - b.etaMinutes);
      default:
        // Default sort: prioritize standard best values then by price
        return list.sort((a, b) => a.finalEffectiveFare - b.finalEffectiveFare);
    }
  };

  const filteredOptions = getFilteredOptions();

  // Find lowest price and fastest ETA for quick badge comparisons
  const lowestPrice = Math.min(...options.map((o) => o.finalEffectiveFare));
  const fastestEta = Math.min(...options.map((o) => o.etaMinutes));

  const toggleExpand = (id: string) => {
    setExpandedOptionId(expandedOptionId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Category Pills & Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            All Rides ({options.length})
          </button>
          <button
            onClick={() => setSelectedFilter('cheapest')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              selectedFilter === 'cheapest'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>💰 Cheapest First</span>
          </button>
          <button
            onClick={() => setSelectedFilter('fastest')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              selectedFilter === 'fastest'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>⚡ Fastest Pick-up</span>
          </button>
          <button
            onClick={() => setSelectedFilter('standard')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedFilter === 'standard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Standard 4-Seater
          </button>
          <button
            onClick={() => setSelectedFilter('large')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedFilter === 'large'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            6-Seater / XL
          </button>
          <button
            onClick={() => setSelectedFilter('premium')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedFilter === 'premium'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Premium
          </button>
        </div>

        {/* Live Market Alert */}
        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Real-time rates synced across 4 platforms</span>
        </div>
      </div>

      {/* Ride Cards List */}
      <div className="space-y-3">
        {filteredOptions.map((opt) => {
          const isLowest = opt.finalEffectiveFare === lowestPrice;
          const isFastest = opt.etaMinutes === fastestEta;
          const isExpanded = expandedOptionId === opt.id;

          return (
            <div
              key={opt.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                isLowest
                  ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Card Main Row */}
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Platform Logo, Service Name, & Badges */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="shrink-0 mt-0.5">{getPlatformIcon(opt.platform)}</div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base leading-snug">
                        {opt.serviceName}
                      </h4>

                      {/* Highlight Badges */}
                      {isLowest && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          🏆 Best Price
                        </span>
                      )}
                      {isFastest && !isLowest && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300">
                          ⚡ Fastest ETA
                        </span>
                      )}
                      {opt.platform === 'tada' && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          0% Driver Commission
                        </span>
                      )}
                      {opt.platform === 'taxi_cdg' && opt.id === 'cdg_metered' && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Regulated Meter
                        </span>
                      )}
                    </div>

                    {/* Metadata Subline: ETA, Capacity, Surge Tag */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pickup in {opt.etaMinutes} mins</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{opt.capacity} seats</span>
                      </span>
                      <span>·</span>
                      {opt.surgeMultiplier > 1.0 ? (
                        <span className="flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          <Flame className="w-3 h-3 text-rose-500" />
                          <span>{opt.surgeMultiplier}x Surge (+S${opt.surgeAmount.toFixed(2)})</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                          1.0x Normal Fare
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Pricing, ShopBack Cashback & Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Price Block */}
                  <div className="text-left md:text-right">
                    <div className="flex items-baseline gap-1.5 md:justify-end">
                      <span className="text-xs font-semibold text-slate-500">S$</span>
                      <span className="text-2xl font-black tracking-tight text-slate-900">
                        {opt.finalEffectiveFare.toFixed(2)}
                      </span>
                    </div>

                    {/* Shopback Cashback Tag */}
                    <div className="flex items-center gap-1 md:justify-end mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 rounded-sm">
                        <BadgePercent className="w-3 h-3 text-rose-500" />
                        ShopBack: -S${opt.shopbackCashback.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(opt.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="View fare calculation breakdown"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => onSelectBooking(opt)}
                      className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-2 transition-all active:scale-95 shadow-sm ${
                        opt.platform === 'grab'
                          ? 'bg-[#00B14F] hover:bg-[#009b45]'
                          : opt.platform === 'gojek'
                          ? 'bg-[#00AA13] hover:bg-[#008f10]'
                          : opt.platform === 'tada'
                          ? 'bg-[#FA6400] hover:bg-[#e05800]'
                          : 'bg-[#004B9B] hover:bg-[#003c7d]'
                      }`}
                    >
                      <span>Book on {opt.platformName}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Accordion */}
              {isExpanded && (
                <div className="px-4 sm:px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Base Fare</p>
                      <p className="font-semibold text-slate-800">S${opt.baseFare.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Distance &amp; Time</p>
                      <p className="font-semibold text-slate-800">
                        S${(opt.distanceFare + opt.timeFare).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">ERP &amp; Tolls</p>
                      <p className="font-semibold text-slate-800">
                        {opt.erpFee > 0 ? `S$${opt.erpFee.toFixed(2)}` : 'S$0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Location Surcharge</p>
                      <p className="font-semibold text-slate-800">
                        {opt.specialSurcharge > 0 ? `S$${opt.specialSurcharge.toFixed(2)}` : 'S$0.00'}
                      </p>
                    </div>
                  </div>

                  {opt.specialSurchargeLabel && (
                    <p className="mt-2 text-[11px] text-purple-700 bg-purple-50 p-1.5 rounded border border-purple-100">
                      ℹ️ {opt.specialSurchargeLabel}
                    </p>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Cancellation policy: Free cancellation within {opt.cancellationFreeMins} minutes of driver match.
                    </span>
                    <span className="font-medium text-emerald-700">
                      Guaranteed fixed fare quote before dispatch.
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
