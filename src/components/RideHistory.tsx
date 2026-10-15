import React from 'react';
import { RideHistoryEntry, LocationItem } from '../types';
import { SINGAPORE_LOCATIONS } from '../data/singaporeLocations';
import { 
  History, 
  RotateCcw, 
  PiggyBank, 
  BadgePercent, 
  X, 
  MapPin, 
  CheckCircle,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface RideHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: RideHistoryEntry[];
  onReorder: (from: LocationItem, to: LocationItem) => void;
}

export const RideHistory: React.FC<RideHistoryProps> = ({
  isOpen,
  onClose,
  history,
  onReorder,
}) => {
  if (!isOpen) return null;

  const totalSaved = history.reduce((acc, curr) => acc + curr.savedAmount, 0);
  const totalShopback = history.reduce((acc, curr) => acc + curr.shopbackEarned, 0);

  const handleReorderClick = (fromName: string, toName: string) => {
    const fromLoc = SINGAPORE_LOCATIONS.find((l) => l.name.toLowerCase().includes(fromName.toLowerCase())) || SINGAPORE_LOCATIONS[0];
    const toLoc = SINGAPORE_LOCATIONS.find((l) => l.name.toLowerCase().includes(toName.toLowerCase())) || SINGAPORE_LOCATIONS[1];
    onReorder(fromLoc, toLoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Ride History &amp; Re-Ordering Log
              </h3>
              <p className="text-xs text-slate-500">
                Track cumulative savings and re-book frequent routes in 1 tap
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

        {/* Savings Stats Hero */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              <span>Surge Saved</span>
            </div>
            <p className="text-2xl font-black mt-1 text-emerald-800">
              S${totalSaved.toFixed(2)}
            </p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Vs. peak platform surges</p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wider">
              <BadgePercent className="w-4 h-4 text-rose-600" />
              <span>ShopBack Cash</span>
            </div>
            <p className="text-2xl font-black mt-1 text-rose-800">
              S${totalShopback.toFixed(2)}
            </p>
            <p className="text-[10px] text-rose-600 mt-0.5">Credited to wallet</p>
          </div>
        </div>

        {/* History Entries */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recent Trips ({history.length})
          </h4>

          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No recent trips logged yet. Compare fares and click book to log your first ride!
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {item.serviceName}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
                    <span className="truncate">{item.fromName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.toName}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>Paid S${item.paidFare.toFixed(2)}</span>
                    <span className="text-emerald-700 font-medium">Saved S${item.savedAmount.toFixed(2)}</span>
                    <span className="text-rose-600 font-medium">+S${item.shopbackEarned.toFixed(2)} cashback</span>
                  </div>
                </div>

                {/* 1-Tap Reorder Button */}
                <button
                  onClick={() => handleReorderClick(item.fromName, item.toName)}
                  className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-all active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Re-book</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
