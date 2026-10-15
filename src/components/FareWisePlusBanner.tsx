import React from 'react';
import { Crown, Sparkles, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react';

interface FareWisePlusBannerProps {
  onJoinPlus: () => void;
}

export const FareWisePlusBanner: React.FC<FareWisePlusBannerProps> = ({ onJoinPlus }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border border-indigo-900/50 shadow-md">
      {/* Decorative gradient glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" />
            <span>FareWise Pass Privileges</span>
          </div>

          <h3 className="text-lg font-black tracking-tight text-white">
            Unlock Priority Queue &amp; Surcharge Protection
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            Get automated surge caps (max 1.25x), 2x ShopBack cashbacks across Grab, Gojek &amp; TADA, and 100% waiver on Sentosa Island &amp; Changi pick-up levies.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-teal-300 pt-1 font-semibold">
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-teal-400" /> Surge Freeze Protection
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-teal-400" /> S$0 ERP Passback Rebate
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-teal-400" /> Priority Booking Dispatch
            </span>
          </div>
        </div>

        <button
          onClick={onJoinPlus}
          className="shrink-0 self-start md:self-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span>Try Free for 30 Days</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
