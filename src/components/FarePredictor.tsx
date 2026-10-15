import React, { useState } from 'react';
import { LocationItem, FarePredictionHour } from '../types';
import { 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Bell, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  Calendar, 
  CheckCircle,
  HelpCircle,
  Zap,
  Flame,
  CloudRain
} from 'lucide-react';

interface FarePredictorProps {
  origin: LocationItem;
  destination: LocationItem;
  predictions: FarePredictionHour[];
  currentHourValue: number;
  onSetAlert: () => void;
  weather: string;
}

export const FarePredictor: React.FC<FarePredictorProps> = ({
  origin,
  destination,
  predictions,
  currentHourValue,
  onSetAlert,
  weather,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(4); // default morning rush or mid
  const [platformFocus, setPlatformFocus] = useState<'all' | 'grab' | 'tada' | 'taxi_cdg'>('all');

  const selectedSlot = predictions[selectedSlotIndex] || predictions[0];

  // Maximum fare for SVG chart scaling
  const maxFare = Math.max(...predictions.map((p) => Math.max(p.grabFare, p.gojekFare, p.tadaFare, p.taxiFare))) * 1.15;
  const minFare = Math.max(0, Math.min(...predictions.map((p) => Math.min(p.grabFare, p.gojekFare, p.tadaFare, p.taxiFare))) * 0.85);

  // Map slot index to SVG coordinates
  const svgWidth = 720;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 25;

  const getX = (index: number) => {
    return paddingX + (index / (predictions.length - 1)) * (svgWidth - paddingX * 2);
  };

  const getY = (fare: number) => {
    const range = maxFare - minFare || 1;
    const normalized = (fare - minFare) / range;
    return svgHeight - paddingY - normalized * (svgHeight - paddingY * 2);
  };

  // Generate SVG path strings
  const generatePath = (getter: (p: FarePredictionHour) => number) => {
    return predictions
      .map((p, idx) => {
        const x = getX(idx);
        const y = getY(getter(p));
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const grabPath = generatePath((p) => p.grabFare);
  const gojekPath = generatePath((p) => p.gojekFare);
  const tadaPath = generatePath((p) => p.tadaFare);
  const taxiPath = generatePath((p) => p.taxiFare);

  // Smart Recommendation Logic
  const isMorningRush = currentHourValue >= 7.5 && currentHourValue <= 9.3;
  const isEveningRush = currentHourValue >= 17.5 && currentHourValue <= 20.0;
  const isMidnight = currentHourValue >= 0.0 && currentHourValue <= 5.5;

  let adviceBadge: {
    type: string;
    title: string;
    description: string;
    action: string;
    icon: React.ReactNode;
    savingsEstimate: string | null;
  } = {
    type: 'good',
    title: 'Optimal Time to Book',
    description: 'Current surge is at base rate (1.0x). Fares are at standard baseline.',
    action: 'Book Now',
    icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    savingsEstimate: null,
  };

  if (isMorningRush) {
    adviceBadge = {
      type: 'wait',
      title: 'High Morning Surge (CBD Rush)',
      description: 'Demand is peaking due to office arrivals. Surge is expected to drop by 25-30% after 9:30 AM.',
      action: 'Wait 15-20 Mins if Flexible',
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      savingsEstimate: 'Save ~S$5.50 - S$7.80',
    };
  } else if (isEveningRush) {
    adviceBadge = {
      type: 'rush',
      title: 'Evening Rush Approaching Peak',
      description: 'Fares on Grab & Gojek are projected to climb further as CBD dinner crowds depart.',
      action: 'Lock in Fare Now',
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      savingsEstimate: 'Avoid +S$4.00 impending surge',
    };
  } else if (isMidnight) {
    adviceBadge = {
      type: 'info',
      title: 'Midnight Taxi Surcharge Active (50%)',
      description: 'Regulated street taxis charge +50% metered rate. TADA & GoCar are typically 15-20% cheaper right now.',
      action: 'Choose TADA or GoCar',
      icon: <Info className="w-5 h-5 text-blue-500" />,
      savingsEstimate: 'Save ~S$6.00 vs Taxi Meter',
    };
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <Sparkles className="w-4 h-4 text-teal-600" />
            </span>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Smart Fare Predictor &amp; Trend Forecast
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical &amp; real-time predictive model for {origin.name} → {destination.name}
          </p>
        </div>

        {/* Price Alert Button */}
        <button
          onClick={onSetAlert}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-700 text-xs font-semibold transition-all self-start sm:self-center"
        >
          <Bell className="w-3.5 h-3.5 text-emerald-600" />
          <span>Set Fare Drop Alert</span>
        </button>
      </div>

      {/* Smart Booking Advisor Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 ${
        adviceBadge.type === 'wait'
          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
          : adviceBadge.type === 'rush'
          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-1 rounded-md shrink-0 mt-0.5">{adviceBadge.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm">{adviceBadge.title}</h4>
              {adviceBadge.savingsEstimate && (
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-white/90 border border-current shadow-2xs">
                  {adviceBadge.savingsEstimate}
                </span>
              )}
            </div>
            <p className="text-xs opacity-90 mt-0.5">{adviceBadge.description}</p>
          </div>
        </div>

        <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-white shadow-2xs border border-current/20">
          👉 {adviceBadge.action}
        </span>
      </div>

      {/* 24-Hour Interactive Timeline Chart */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">Platform Projections:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00B14F]" />
              <span className="text-slate-600">Grab</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FA6400]" />
              <span className="text-slate-600">TADA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00AA13]" />
              <span className="text-slate-600">Gojek</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#004B9B]" />
              <span className="text-slate-600">Taxi (CDG)</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-400">
            Click any hour point to inspect predicted rates
          </span>
        </div>

        {/* SVG Curve Container */}
        <div className="relative bg-slate-900 rounded-xl p-2 sm:p-4 overflow-hidden border border-slate-800">
          <div className="w-full h-48 sm:h-56">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3,3">
                <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} />
                <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} />
                <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} />
              </g>

              {/* Peak Hour Bands (Morning Peak 7:30-9:30 & Evening Peak 17:30-20:00) */}
              {/* Slot 4 to 6 is morning peak */}
              <rect
                x={getX(3.5)}
                y={paddingY}
                width={getX(5.5) - getX(3.5)}
                height={svgHeight - paddingY * 2}
                fill="#f59e0b"
                opacity="0.1"
              />
              <text x={getX(4.5)} y={paddingY + 12} fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">
                AM PEAK
              </text>

              {/* Slot 10 to 12 is evening peak */}
              <rect
                x={getX(9.5)}
                y={paddingY}
                width={getX(12) - getX(9.5)}
                height={svgHeight - paddingY * 2}
                fill="#ef4444"
                opacity="0.1"
              />
              <text x={getX(10.7)} y={paddingY + 12} fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle">
                PM PEAK
              </text>

              {/* Curves */}
              <path d={grabPath} fill="none" stroke="#00B14F" strokeWidth="2.5" />
              <path d={tadaPath} fill="none" stroke="#FA6400" strokeWidth="2" strokeDasharray="4,2" />
              <path d={gojekPath} fill="none" stroke="#00AA13" strokeWidth="1.8" opacity="0.8" />
              <path d={taxiPath} fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="2,2" />

              {/* Active Selected Hour Vertical Line */}
              <line
                x1={getX(selectedSlotIndex)}
                y1={paddingY}
                x2={getX(selectedSlotIndex)}
                y2={svgHeight - paddingY}
                stroke="#ffffff"
                strokeWidth="1.5"
                opacity="0.8"
              />

              {/* Data points for selected slot */}
              <circle cx={getX(selectedSlotIndex)} cy={getY(selectedSlot.grabFare)} r="5" fill="#00B14F" stroke="#ffffff" strokeWidth="2" />
              <circle cx={getX(selectedSlotIndex)} cy={getY(selectedSlot.tadaFare)} r="4" fill="#FA6400" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          {/* Time Labels Below Chart */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 px-2 pt-2 border-t border-slate-800">
            {predictions.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSlotIndex(idx)}
                className={`transition-colors py-1 px-1 rounded ${
                  idx === selectedSlotIndex
                    ? 'font-bold text-white bg-slate-800'
                    : 'hover:text-slate-200'
                }`}
              >
                {p.hour}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Hour Detailed Breakdown Card */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900 text-white font-mono font-bold text-sm">
              {selectedSlot.hour}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Predicted Surge: {selectedSlot.predictedSurge}x</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  selectedSlot.trafficLevel === 'Gridlock'
                    ? 'bg-rose-100 text-rose-800'
                    : selectedSlot.trafficLevel === 'Heavy'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedSlot.trafficLevel} Traffic
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Action: <span className="font-medium text-slate-700">{selectedSlot.recommendedAction}</span>
              </p>
            </div>
          </div>

          {/* Price matrix at this hour */}
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Grab</span>
              <span className="font-bold text-emerald-700">S${selectedSlot.grabFare.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">TADA</span>
              <span className="font-bold text-amber-700">S${selectedSlot.tadaFare.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Gojek</span>
              <span className="font-bold text-green-700">S${selectedSlot.gojekFare.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">CDG Taxi</span>
              <span className="font-bold text-blue-700">S${selectedSlot.taxiFare.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
