import React, { useState, useMemo, useEffect } from 'react';
import { 
  LocationItem, 
  RideOption, 
  RideHistoryEntry, 
  PlatformId 
} from './types';
import { SINGAPORE_LOCATIONS } from './data/singaporeLocations';
import { 
  calculateDistanceKm, 
  estimateDurationMinutes, 
  calculateErpFee, 
  calculateSpecialSurcharges, 
  generateRideComparisons, 
  generate24HourPredictions,
  DEFAULT_RIDE_HISTORY,
  ACTIVE_PROMOS
} from './data/singaporeFares';
import { Navbar } from './components/Navbar';
import { RouteSelector } from './components/RouteSelector';
import { RouteMap } from './components/RouteMap';
import { FareComparisonTable } from './components/FareComparisonTable';
import { FarePredictor } from './components/FarePredictor';
import { PromoAndCashback } from './components/PromoAndCashback';
import { RideHistory } from './components/RideHistory';
import { BookingModal } from './components/BookingModal';
import { FareAlertModal } from './components/FareAlertModal';
import { FareWisePlusBanner } from './components/FareWisePlusBanner';
import { FareWiseLogo } from './components/FareWiseLogo';
import sgExpresswayHero from './assets/images/sg_expressway_hero_1792053113557.jpg';
import { 
  Sparkles, 
  Car, 
  CheckCircle, 
  AlertCircle, 
  TrendingDown, 
  ShieldCheck, 
  MapPin, 
  BadgePercent,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function App() {
  // Origin & Destination State - Defaults to Sentosa to Marina Bay Sands
  const [origin, setOrigin] = useState<LocationItem>(SINGAPORE_LOCATIONS[0]); // Sentosa Beach Station
  const [destination, setDestination] = useState<LocationItem>(SINGAPORE_LOCATIONS[5]); // Marina Bay Sands

  // Simulation Controls
  const [weather, setWeather] = useState<'clear' | 'cloudy' | 'rain' | 'heavy_rain'>('clear');
  const [timeMode, setTimeMode] = useState<'now' | 'morning_peak' | 'evening_peak' | 'midnight'>('now');

  // Modals & UI States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPromosOpen, setIsPromosOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [bookingOption, setBookingOption] = useState<RideOption | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ride History in Local Storage
  const [history, setHistory] = useState<RideHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('farewise_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_RIDE_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('farewise_history', JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Live LTA DataMall Taxi Availability State
  const [ltaTaxiData, setLtaTaxiData] = useState<{
    count: number;
    isLive: boolean;
    islandwideTotal: number;
  }>({
    count: 14,
    isLive: false,
    islandwideTotal: 85,
  });

  useEffect(() => {
    let isCancelled = false;
    const fetchTaxiAvailability = async () => {
      try {
        const res = await fetch(`/api/taxiaavailability?lat=${origin.lat}&lng=${origin.lng}&radius=4`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setLtaTaxiData({
              count: data.nearbyTaxiCount ?? 14,
              isLive: Boolean(data.isLiveFromDatamall),
              islandwideTotal: data.totalTaxisIslandwide ?? 85,
            });
          }
        }
      } catch {
        // graceful fallback to simulated count
      }
    };

    fetchTaxiAvailability();
    const interval = setInterval(fetchTaxiAvailability, 30000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [origin.lat, origin.lng]);

  // Compute Hour Value
  const simulatedHourDecimal = useMemo(() => {
    switch (timeMode) {
      case 'morning_peak':
        return 8.5; // 8:30 AM
      case 'evening_peak':
        return 18.5; // 6:30 PM
      case 'midnight':
        return 1.5; // 1:30 AM
      case 'now':
      default: {
        const d = new Date();
        return d.getHours() + d.getMinutes() / 60;
      }
    }
  }, [timeMode]);

  // Calculated distance & route properties
  const distanceKm = useMemo(() => calculateDistanceKm(origin, destination), [origin, destination]);
  const isPeak = (simulatedHourDecimal >= 7.5 && simulatedHourDecimal <= 9.5) || (simulatedHourDecimal >= 17.5 && simulatedHourDecimal <= 20.5);
  const durationMins = useMemo(() => estimateDurationMinutes(distanceKm, isPeak, weather), [distanceKm, isPeak, weather]);
  const erpFee = useMemo(() => calculateErpFee(origin, destination, simulatedHourDecimal), [origin, destination, simulatedHourDecimal]);
  const specialSurchargeData = useMemo(() => calculateSpecialSurcharges(origin, destination, simulatedHourDecimal), [origin, destination, simulatedHourDecimal]);

  // Generated Ride Comparison Options
  const rideOptions = useMemo(() => {
    return generateRideComparisons(origin, destination, simulatedHourDecimal, weather);
  }, [origin, destination, simulatedHourDecimal, weather]);

  // 24-Hour Predictions
  const predictions = useMemo(() => {
    return generate24HourPredictions(origin, destination, weather === 'rain' || weather === 'heavy_rain' ? 'rain' : 'clear');
  }, [origin, destination, weather]);

  // Total savings accumulated
  const totalSaved = useMemo(() => {
    return history.reduce((sum, item) => sum + item.savedAmount, 0);
  }, [history]);

  // Lowest current price
  const cheapestFare = useMemo(() => {
    if (!rideOptions.length) return 0;
    return Math.min(...rideOptions.map((o) => o.finalEffectiveFare));
  }, [rideOptions]);

  // Handle Swap Locations
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Handle Booking Confirmation
  const handleConfirmBooking = (option: RideOption) => {
    const highestStandardFare = Math.max(...rideOptions.filter(o => o.tier === 'standard').map(o => o.finalEffectiveFare));
    const savedAmount = Math.max(1.80, Math.round((highestStandardFare - option.finalEffectiveFare) * 10) / 10);

    const newEntry: RideHistoryEntry = {
      id: `ride_${Date.now()}`,
      timestamp: 'Just now',
      fromName: origin.name,
      toName: destination.name,
      platform: option.platform,
      serviceName: option.serviceName,
      paidFare: option.finalEffectiveFare,
      savedAmount: savedAmount,
      shopbackEarned: option.shopbackCashback,
      date: new Date().toISOString().split('T')[0],
    };

    setHistory((prev) => [newEntry, ...prev]);
    showToast(`✅ Booked on ${option.platformName}! Saved S$${savedAmount.toFixed(2)} vs peak.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        weather={weather}
        setWeather={setWeather}
        selectedTimeMode={timeMode}
        setSelectedTimeMode={setTimeMode}
        totalSaved={totalSaved}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPromos={() => setIsPromosOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Section with Cinematic Singapore City & Grab Hail View */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/60 text-white min-h-[340px] sm:min-h-[380px] flex flex-col justify-between">
          {/* Background Singapore Expressway Sunset Image (No Dark Overlay) */}
          <div className="absolute inset-0 z-0">
            <img
              src={sgExpresswayHero}
              alt="Singapore Expressway at Sunset with CBD Skyline, Taxis and Traffic"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Top HUD Badges */}
          <div className="relative z-10 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-400/50 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Singapore Mobility Radar
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-slate-200 text-xs font-bold hidden sm:inline-flex items-center gap-1.5 shadow-md">
                <span className="text-emerald-400 font-extrabold">8,450+</span> SG Drivers Online
              </span>
            </div>

            {/* Platform Badges */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/20 text-[11px] font-extrabold shadow-lg">
              <span className="px-2.5 py-1 rounded-lg bg-[#00B14F] text-white shadow-xs">Grab</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#00AA13] text-white shadow-xs">Gojek</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FA6400] text-white shadow-xs">TADA</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#004B9B] text-white shadow-xs">CDG Zig</span>
            </div>
          </div>

          {/* Center/Bottom Content Inside a Sleek Frosted Glass Card */}
          <div className="relative z-10 p-4 sm:p-6">
            <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 max-w-2xl space-y-2.5 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Save an average of S$6.40 per peak-hour trip</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                Compare Singapore Ride Fares &amp; Outsmart The Surge
              </h1>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                Instant side-by-side pricing across Grab, Gojek, TADA, and CDG Taxis with live Singapore ERP rates, Sentosa island entry waivers, and predictive surge timing.
              </p>
            </div>
          </div>

          {/* Bottom Live Corridor Ticker */}
          <div className="relative z-10 bg-slate-900/80 backdrop-blur-md border-t border-white/20 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs overflow-hidden shadow-lg">
            <div className="flex items-center gap-2 font-bold text-amber-400 shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] uppercase tracking-wider">Live SG Intel:</span>
            </div>
            <div className="flex items-center gap-6 text-[11px] text-slate-200 truncate pl-3 font-medium">
              <span className="truncate">
                ⚡ <strong className="text-white">Sentosa ↔ CBD:</strong> TADA is S$4.20 lower than Grab right now.
              </span>
              <span className="hidden md:inline text-slate-400">·</span>
              <span className="hidden md:inline truncate">
                ✈️ <strong className="text-white">Changi T3:</strong> Airport levy S$6.00 applied · CDG Taxi queue ETA 2 mins.
              </span>
              <span className="hidden lg:inline text-slate-400">·</span>
              <span className="hidden lg:inline truncate">
                🌧️ <strong className="text-white">ERP Gantries:</strong> CTE &amp; CBD live pricing active.
              </span>
            </div>
          </div>
        </div>

        {/* Route Selector Input Module */}
        <RouteSelector
          origin={origin}
          destination={destination}
          onSelectOrigin={setOrigin}
          onSelectDestination={setDestination}
          distanceKm={distanceKm}
          durationMins={durationMins}
          erpFee={erpFee}
          specialSurcharge={specialSurchargeData.amount}
          specialSurchargeLabel={specialSurchargeData.label}
          onSwap={handleSwap}
        />

        {/* Main Content Grid: Map + Comparison + Predictions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Comparisons & Predictions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Comparison Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Car className="w-5 h-5 text-emerald-600" />
                  <span>Real-Time Operator Comparison</span>
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  Cheapest from <strong className="text-emerald-700">S${cheapestFare.toFixed(2)}</strong>
                </span>
              </div>

              <FareComparisonTable
                options={rideOptions}
                onSelectBooking={setBookingOption}
                weather={weather}
              />
            </div>

            {/* Smart 24-Hour Fare Predictor */}
            <FarePredictor
              origin={origin}
              destination={destination}
              predictions={predictions}
              currentHourValue={simulatedHourDecimal}
              onSetAlert={() => setIsAlertModalOpen(true)}
              weather={weather}
            />

            {/* FareWise Plus Membership Perk Banner */}
            <FareWisePlusBanner
              onJoinPlus={() => showToast('🎉 FareWise Pass activated! Enjoy surge freeze & priority queue.')}
            />
          </div>

          {/* Right Column: Interactive SG Radar Map & Quick Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Route Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Interactive Singapore Transit Map</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {origin.name.slice(0, 14)} → {destination.name.slice(0, 14)}
                </span>
              </div>

              <RouteMap
                origin={origin}
                destination={destination}
                distanceKm={distanceKm}
                durationMins={durationMins}
                erpFee={erpFee}
                driverCount={ltaTaxiData.count}
              />
            </div>

            {/* Singapore Corridor Insights Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Singapore Regulatory &amp; Route Telemetry
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ltaTaxiData.isLive 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {ltaTaxiData.isLive ? '● Live LTA DataMall' : '○ LTA DataMall Ready'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* LTA Taxi Availability Live Feed */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/80 border border-blue-200">
                  <div className="p-1 rounded bg-white shrink-0 mt-0.5">🚖</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">LTA Taxi-Availability</span>
                      <span className="font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded shadow-2xs">
                        {ltaTaxiData.count} taxis nearby
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      {ltaTaxiData.isLive
                        ? `Streamed live from LTA DataMall endpoint (/api/taxiaavailability). ${ltaTaxiData.islandwideTotal} taxis islandwide.`
                        : `Live serverless endpoint ready at /api/taxiaavailability. Set LTA_DATAMALL_API_KEY to activate live API stream.`}
                    </p>
                  </div>
                </div>

                {/* Weather Surge Notice */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-1 rounded bg-white shrink-0 mt-0.5">
                    {weather === 'heavy_rain' ? '⛈️' : weather === 'rain' ? '🌦️' : '☀️'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">
                      {weather === 'heavy_rain'
                        ? 'Heavy Rain Surge Warning Active'
                        : weather === 'rain'
                        ? 'Passing Showers Detected'
                        : 'Clear Weather Corridor'}
                    </span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {weather === 'heavy_rain'
                        ? 'High private-hire demand. TADA and CDG Metred Taxi are currently the most stable pricing choices.'
                        : weather === 'rain'
                        ? 'Moderate surge elasticity (+20-25%). Expect pickup delays of 2-4 minutes.'
                        : 'Standard driver availability across Central and Island routes.'}
                    </p>
                  </div>
                </div>

                {/* ERP Breakdown */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-1 rounded bg-white shrink-0 mt-0.5">⚡</div>
                  <div>
                    <span className="font-bold text-slate-900">Electronic Road Pricing (ERP)</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {erpFee > 0
                        ? `Route traverses active ERP gantries (S$${erpFee.toFixed(2)} added to fare total).`
                        : 'No ERP gantries triggered for this corridor at the current hour.'}
                    </p>
                  </div>
                </div>

                {/* Sentosa or Airport Surcharges */}
                {(origin.id.includes('sentosa') || destination.id.includes('sentosa')) && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="p-1 rounded bg-white shrink-0 mt-0.5">🏝️</div>
                    <div>
                      <span className="font-bold text-emerald-950">Sentosa Gateway Entry Policy</span>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        Private-hire and taxi drop-offs into Sentosa include standard S$3 island gantry fee. Sentosa residents &amp; hotel guests can present hotel confirmations for entry waiver.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Active Voucher Snapshot */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                  <BadgePercent className="w-4 h-4 text-amber-600" />
                  Featured Commuter Promos
                </span>
                <button
                  onClick={() => setIsPromosOpen(true)}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {ACTIVE_PROMOS.slice(0, 2).map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-white border border-amber-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{p.code}</span>
                      <p className="text-[10px] text-slate-500">{p.discountDesc}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {p.platform.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-2">
            <FareWiseLogo size="sm" showSubtitle={false} />
            <p className="text-[11px] text-slate-500 max-w-md">
              Singapore&apos;s independent ride-hailing aggregator and fare prediction engine. Live pricing across Grab, Gojek, TADA, and ComfortDelGro (CDG Zig) taxis.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600">
            <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> LTA Compliant
            </span>
            <button
              onClick={() => setIsPromosOpen(true)}
              className="hover:text-emerald-700 transition-colors"
            >
              ShopBack Cashback
            </button>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="hover:text-emerald-700 transition-colors"
            >
              Saved Trips Log
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BookingModal
        option={bookingOption}
        origin={origin}
        destination={destination}
        isOpen={!!bookingOption}
        onClose={() => setBookingOption(null)}
        onConfirmBooking={handleConfirmBooking}
      />

      <PromoAndCashback
        isOpen={isPromosOpen}
        onClose={() => setIsPromosOpen(false)}
      />

      <RideHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onReorder={(from, to) => {
          setOrigin(from);
          setDestination(to);
          showToast(`Applied route: ${from.name} → ${to.name}`);
        }}
      />

      <FareAlertModal
        origin={origin}
        destination={destination}
        currentCheapestFare={cheapestFare}
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onAlertCreated={(target) => {
          showToast(`🔔 Price alert set for S$${target.toFixed(2)} on this route.`);
        }}
      />
    </div>
  );
}
