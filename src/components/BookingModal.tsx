import React, { useState } from 'react';
import { RideOption, LocationItem } from '../types';
import { 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Car, 
  ShieldCheck, 
  BadgePercent, 
  X, 
  Sparkles,
  MapPin,
  ArrowRight,
  PhoneCall
} from 'lucide-react';

interface BookingModalProps {
  option: RideOption | null;
  origin: LocationItem;
  destination: LocationItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (option: RideOption) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  option,
  origin,
  destination,
  isOpen,
  onClose,
  onConfirmBooking,
}) => {
  const [bookingState, setBookingState] = useState<'review' | 'dispatching' | 'confirmed'>('review');

  if (!isOpen || !option) return null;

  const handleStartBooking = () => {
    setBookingState('dispatching');
    setTimeout(() => {
      setBookingState('confirmed');
    }, 1500);
  };

  const handleFinish = () => {
    onConfirmBooking(option);
    setBookingState('review');
    onClose();
  };

  // Simulated vehicle details
  const vehiclePlate = 'SMA 8824 X';
  const carModel =
    option.platform === 'taxi_cdg'
      ? 'Toyota Prius Hybrid (Comfort Taxi)'
      : option.tier === 'premium'
      ? 'Mercedes-Benz E200 (Obsidian Black)'
      : option.tier === 'large'
      ? 'Toyota Alphard 7-Seater'
      : 'Hyundai Ioniq 5 Electric (Silver)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: option.color }}
            />
            <h3 className="font-extrabold text-slate-900 text-base">
              {bookingState === 'review'
                ? `Book with ${option.platformName}`
                : bookingState === 'dispatching'
                ? 'Connecting to Hailing Fleet...'
                : 'Ride Dispatched & Confirmed!'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookingState === 'review' && (
          <div className="space-y-4">
            {/* Route summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-900 truncate">{origin.name}</span>
              </div>
              <div className="border-l border-dashed border-slate-300 ml-1 h-3" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-bold text-slate-900 truncate">{destination.name}</span>
              </div>
            </div>

            {/* Price & Cashback Highlight */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">{option.serviceName}</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs text-slate-400">S$</span>
                  <span className="text-3xl font-black">{option.finalEffectiveFare.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800/80 px-2 py-1 rounded-lg">
                  <BadgePercent className="w-3 h-3 text-rose-400" />
                  +S${option.shopbackCashback.toFixed(2)} ShopBack
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pickup in ~{option.etaMinutes} mins
                </p>
              </div>
            </div>

            {/* Breakdown item list */}
            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Base + Distance Fare</span>
                <span>S${(option.baseFare + option.distanceFare + option.timeFare).toFixed(2)}</span>
              </div>
              {option.surgeMultiplier > 1.0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Surge Multiplier ({option.surgeMultiplier}x)</span>
                  <span>+S${option.surgeAmount.toFixed(2)}</span>
                </div>
              )}
              {option.erpFee > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>ERP Road Toll</span>
                  <span>+S${option.erpFee.toFixed(2)}</span>
                </div>
              )}
              {option.specialSurcharge > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>{option.specialSurchargeLabel || 'Location Surcharge'}</span>
                  <span>+S${option.specialSurcharge.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleStartBooking}
                className="w-full py-3 rounded-xl font-extrabold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: option.color }}
              >
                <span>Confirm &amp; Launch {option.platformName}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Deep-linking to verified Singapore operator with locked price guarantee.
              </p>
            </div>
          </div>
        )}

        {bookingState === 'dispatching' && (
          <div className="py-8 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div
                className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: `${option.color} transparent transparent transparent` }}
              />
              <Car className="w-6 h-6 absolute inset-0 m-auto text-slate-700" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Contacting {option.platformName}...</h4>
              <p className="text-xs text-slate-500 mt-1">
                Searching among {option.driverCountNearby} nearby drivers on corridor...
              </p>
            </div>
          </div>
        )}

        {bookingState === 'confirmed' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-emerald-950 text-base">Driver Matched &amp; En Route!</h4>
              <p className="text-xs text-emerald-800">
                Arriving in approx <span className="font-bold">{option.etaMinutes} minutes</span>
              </p>
            </div>

            {/* Vehicle info card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-300">
                  {vehiclePlate}
                </span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  ⭐ 4.95 Rating
                </span>
              </div>
              <p className="text-slate-600 font-medium">{carModel}</p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-500 text-[11px]">
                <span>Driver: Tan W. K.</span>
                <span className="text-emerald-700 font-semibold">Contacted via App</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
              <span className="font-medium">ShopBack Cashback Tracked</span>
              <span className="font-bold text-rose-700">+S${option.shopbackCashback.toFixed(2)}</span>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Done &amp; Save to Ride Log
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
