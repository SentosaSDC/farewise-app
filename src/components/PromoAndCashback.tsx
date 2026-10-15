import React, { useState } from 'react';
import { PromoCode } from '../types';
import { ACTIVE_PROMOS } from '../data/singaporeFares';
import { 
  Sparkles, 
  Copy, 
  Check, 
  CreditCard, 
  BadgePercent, 
  ExternalLink, 
  Tag, 
  X,
  Gift
} from 'lucide-react';

interface PromoAndCashbackProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromoAndCashback: React.FC<PromoAndCashbackProps> = ({ isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const creditCardTips = [
    {
      bank: 'Citi Cash Back Card',
      rebate: '8% Cashback',
      detail: 'On all Grab, Gojek and TADA rides (min. S$800 spend)',
      logo: '💳 Citi',
      color: 'bg-blue-50 text-blue-900 border-blue-200',
    },
    {
      bank: 'DBS Altitude Visa',
      rebate: '4.0 mpd (Miles)',
      detail: '4 miles per S$1 on GrabPay, CDG Zig & Gojek rides',
      logo: '💳 DBS',
      color: 'bg-red-50 text-red-900 border-red-200',
    },
    {
      bank: 'UOB One Card',
      rebate: 'Up to 10% Cashback',
      detail: 'Additional 5% rebate on Grab transactions + ShopBack',
      logo: '💳 UOB',
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    },
    {
      bank: 'OCBC 365 Card',
      rebate: '3% Cashback',
      detail: 'Applicable across all local taxis & ride-hail operators',
      logo: '💳 OCBC',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Vouchers, Cashbacks &amp; Card Perks
              </h3>
              <p className="text-xs text-slate-500">
                Partnered with ShopBack, Grab, Gojek, TADA &amp; ComfortDelGro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ShopBack Integration Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-100">
              <BadgePercent className="w-4 h-4" />
              <span>Official Cashback Partner</span>
            </div>
            <h4 className="text-base font-extrabold mt-1">Earn Up to 4.0% with ShopBack</h4>
            <p className="text-xs text-rose-100 mt-0.5">
              Cashback is automatically credited to your linked ShopBack Singapore account upon booking.
            </p>
          </div>
          <span className="shrink-0 px-3 py-1.5 rounded-lg bg-white text-rose-600 font-extrabold text-xs shadow-xs">
            Linked Active
          </span>
        </div>

        {/* Active Promo Codes */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            Verified Promo Codes for Today
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACTIVE_PROMOS.map((promo) => (
              <div
                key={promo.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {promo.platform.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">Verified today</span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs mt-1.5">{promo.discountDesc}</p>
                  <p className="text-[10px] text-slate-400">Min. spend S${promo.minSpend}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <span className="font-mono font-bold text-slate-800 text-xs">{promo.code}</span>
                  <button
                    onClick={() => handleCopy(promo.code)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-95"
                  >
                    {copiedCode === promo.code ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Card Stacking Optimization */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            Best Credit Cards for Singapore Ride-Hailing
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {creditCardTips.map((card, idx) => (
              <div key={idx} className={`p-3 rounded-xl border ${card.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{card.bank}</span>
                  <span className="font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-white shadow-2xs">
                    {card.rebate}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 mt-1">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
