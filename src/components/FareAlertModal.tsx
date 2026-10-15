import React, { useState } from 'react';
import { LocationItem } from '../types';
import { Bell, Check, X, ShieldAlert, Zap } from 'lucide-react';

interface FareAlertModalProps {
  origin: LocationItem;
  destination: LocationItem;
  currentCheapestFare: number;
  isOpen: boolean;
  onClose: () => void;
  onAlertCreated: (targetPrice: number) => void;
}

export const FareAlertModal: React.FC<FareAlertModalProps> = ({
  origin,
  destination,
  currentCheapestFare,
  isOpen,
  onClose,
  onAlertCreated,
}) => {
  const [targetPrice, setTargetPrice] = useState(
    Math.max(10, Math.floor(currentCheapestFare * 0.85))
  );
  const [notifyMethod, setNotifyMethod] = useState<'push' | 'sms' | 'email'>('push');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      onAlertCreated(targetPrice);
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Set Surge Drop Alert</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSaved ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Alert Active!</h4>
            <p className="text-xs text-slate-500">
              We'll notify you as soon as fares for this route drop to S${targetPrice.toFixed(2)}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="font-medium text-slate-500 block text-[10px] uppercase">Route</span>
              <p className="font-semibold text-slate-800 truncate mt-0.5">
                {origin.name} → {destination.name}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Current Best Rate: <span className="font-bold text-slate-900">S${currentCheapestFare.toFixed(2)}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alert me when fare drops below:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">S$</span>
                <input
                  type="number"
                  step="0.50"
                  min="5"
                  max="100"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Saves approx S${Math.max(0, currentCheapestFare - targetPrice).toFixed(2)} from current surge.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notification Channel:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setNotifyMethod('push')}
                  className={`p-2 rounded-lg font-medium border text-center transition-all ${
                    notifyMethod === 'push'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🔔 In-App Push
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyMethod('sms')}
                  className={`p-2 rounded-lg font-medium border text-center transition-all ${
                    notifyMethod === 'sms'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📱 Mobile / SMS
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Activate Price Tracker
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
