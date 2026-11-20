import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { eventBus } from '../../services/eventBus';
import { mockApi } from '../../services/mockApi';
import { formatINR } from '../../services/pricing';
import { LeafletMap } from '../../components/common/LeafletMap';
import { VerificationChecklist } from '../../services/qr';
import { Booking, SourceCheckIn, WaterSource } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Clock,
  QrCode,
  AlertTriangle,
  Play,
  Wallet,
  PhoneCall,
  Check,
  RefreshCw,
  Camera,
  ArrowRight,
  X,
  Navigation,
  DollarSign,
  Award,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  Gauge,
  Droplets,
} from 'lucide-react';

interface DriverViewProps {
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

export const DriverView: React.FC<DriverViewProps> = ({
  activeNav: externalNav,
  onNavChange: externalOnNavChange,
}) => {
  const { currentUser, t } = useAppStore();
  const [internalTab, setInternalTab] = useState<string>('home');
  const activeTab = externalNav || internalTab;
  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (externalOnNavChange) externalOnNavChange(tab);
  };

  const [driver, setDriver] = useState<any>(null);
  const [todayCheckIn, setTodayCheckIn] = useState<SourceCheckIn | null>(null);
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [activeJob, setActiveJob] = useState<Booking | null>(null);
  const [jobOffer, setJobOffer] = useState<Booking | null>(null);
  const [offerCountdown, setOfferCountdown] = useState(90);

  // Source Check-in Form
  const [selectedSourceId, setSelectedSourceId] = useState('src-1');
  const [certInput, setCertInput] = useState('PMC-WTR-2026-PARV-094');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Scanner & PoD
  const [showScanner, setShowScanner] = useState(false);
  const [qrInputText, setQrInputText] = useState('');
  const [deliveredLitres, setDeliveredLitres] = useState<number>(10000);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerificationChecklist | null>(null);
  const [simulateGpsDrift, setSimulateGpsDrift] = useState(false);

  const refreshData = () => {
    const data = db.getData();
    const drv = data.drivers.find((d) => d.id === 'driver-1') || data.drivers[0];
    setDriver(drv);
    setSources(data.waterSources);

    const checkin = data.sourceCheckIns.find((c) => c.driverId === drv.id && c.status === 'verified');
    setTodayCheckIn(checkin || null);

    const job = data.bookings.find(
      (b) =>
        b.driverId === drv.id &&
        b.status !== 'DELIVERED' &&
        b.status !== 'SETTLED' &&
        b.status !== 'CANCELLED'
    );
    setActiveJob(job || null);
    if (job) setDeliveredLitres(job.volumeL);

    const offer = data.bookings.find(
      (b) => b.driverId === drv.id && b.status === 'MATCHED'
    );
    setJobOffer(offer || null);
  };

  useEffect(() => {
    refreshData();
    const sub1 = eventBus.subscribe('simulation_tick', refreshData);
    const sub2 = eventBus.subscribe('booking_status_changed', refreshData);
    const sub3 = eventBus.subscribe('source_checkin_completed', refreshData);

    return () => {
      sub1();
      sub2();
      sub3();
    };
  }, []);

  // 90s Offer timer
  useEffect(() => {
    if (!jobOffer) return;
    const interval = setInterval(() => {
      setOfferCountdown((prev) => {
        if (prev <= 1) {
          mockApi.cancelBooking(jobOffer.id, 'Driver offer timed out (90s)');
          return 90;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [jobOffer?.id]);

  const handleCheckInSubmit = async () => {
    setCheckInLoading(true);
    setCheckInError(null);
    try {
      const res = await mockApi.driverSourceCheckIn({
        driverId: driver.id,
        sourceId: selectedSourceId,
        certificateNo: certInput,
        driverLat: 18.4988,
        driverLng: 73.8472,
      });

      if (res.status === 'rejected') {
        setCheckInError(res.rejectionReason || 'Check-in failed');
      } else {
        setTodayCheckIn(res);
        refreshData();
      }
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleTransitionStatus = async (status: any) => {
    if (!activeJob) return;
    await mockApi.updateBookingStatus(activeJob.id, status);
    refreshData();
  };

  const handleScanSubmit = async () => {
    if (!activeJob) return;
    setIsVerifying(true);
    try {
      let lat = activeJob.lat;
      let lng = activeJob.lng;
      if (simulateGpsDrift) {
        lat += 0.005;
        lng += 0.005;
      }
      const result = await mockApi.verifyPod({
        bookingId: activeJob.id,
        payloadString: qrInputText || 'simulated-valid-qr',
        driverLat: lat,
        driverLng: lng,
        deliveredLitres,
      });
      setVerifyResult(result.result);
      if (result.result.allPassed) {
        setTimeout(() => {
          setShowScanner(false);
          setVerifyResult(null);
          refreshData();
        }, 2500);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 select-none text-slate-800">
      {/* 90-Second Urgent Job Offer Alert Banner */}
      {jobOffer && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Clock size={24} className="animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black">New Tanker Dispatch Offer!</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-orange-700 text-xs font-black">
                  {offerCountdown}s Left
                </span>
              </div>
              <p className="text-xs text-orange-100 font-semibold mt-0.5">
                {jobOffer.volumeL.toLocaleString()} Litres • Destination: {jobOffer.address.line} • Guaranteed Earning:{' '}
                {formatINR(Math.round(jobOffer.price.total * 0.12))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTransitionStatus('ACCEPTED')}
              className="px-6 py-2.5 rounded-2xl bg-white text-slate-900 font-black text-xs hover:bg-orange-50 shadow-md cursor-pointer"
            >
              Accept Trip Now
            </button>
            <button
              onClick={() => mockApi.cancelBooking(jobOffer.id, 'Driver declined')}
              className="px-4 py-2.5 rounded-2xl bg-black/20 text-white font-bold text-xs hover:bg-black/30 cursor-pointer"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP 5 ACTION CARDS RIBBON (Matching reference aesthetic)   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Active Trip */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'home'
              ? 'bg-gradient-to-r from-[#0d6b82] to-[#0a5265] text-white shadow-md shadow-cyan-900/20 scale-[1.02]'
              : 'bg-gradient-to-r from-[#0d6b82] to-[#0a5265] text-white hover:brightness-105 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Truck size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Active Trip</span>
              <span className="text-[10px] text-cyan-200 font-medium">Trip Radar</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-white/80 shrink-0" />
        </button>

        {/* Card 2: Source Check-In */}
        <button
          onClick={() => setActiveTab('source_checkin')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'source_checkin'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Source Check-In</span>
              <span className="text-[10px] text-slate-400 font-medium">PMC Audit</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 3: Scan Customer QR */}
        <button
          onClick={() => setShowScanner(true)}
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 shadow-xs transition-all duration-200 cursor-pointer text-left text-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <QrCode size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Scan PoD QR</span>
              <span className="text-[10px] text-slate-400 font-medium">30s Token Lock</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 4: Earnings & Ledger */}
        <button
          onClick={() => setActiveTab('earnings')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'earnings'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Wallet size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Earnings</span>
              <span className="text-[10px] text-slate-400 font-medium">{formatINR(driver?.walletPaise || 245000)}</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 5: Vehicle Status */}
        <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-sky-100/90 shadow-xs text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight text-slate-900">
                MH-12 AB 4821
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">10kL • PMC Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN 2-COLUMN DASHBOARD (Driver View)                       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
        {/* Left Column (7/12): Hero Active Trip Card + 4 Metrics + Navigation */}
        <div className="lg:col-span-7 space-y-5">
          {/* HERO ACTIVE TRIP CARD */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#063b4f] via-[#09576f] to-[#0c6b84] text-white p-5 sm:p-7 shadow-lg shadow-cyan-950/15 border border-cyan-800/40">
            <div className="relative z-10 space-y-4 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/20 backdrop-blur-md border border-cyan-300/30 text-cyan-200 text-[11px] font-extrabold uppercase tracking-wider">
                <Truck size={13} className="text-cyan-300" />
                <span>{activeJob ? 'Active Assigned Dispatch' : 'Ready for Dispatch'}</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                  {activeJob ? activeJob.address.line : 'No Active Job Assigned'}
                </h2>
                <p className="text-cyan-200 text-xs sm:text-sm font-semibold mt-0.5">
                  {activeJob
                    ? `10,000 Litres • Customer: ${activeJob.address.label} • ETA: ${activeJob.etaMin} mins`
                    : 'Standing by at PMC Parvati filling station • Online'}
                </p>
              </div>

              {activeJob && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(activeJob.status === 'ACCEPTED' || activeJob.status === 'MATCHED') && (
                    <button
                      onClick={() => handleTransitionStatus('FILLING')}
                      className="px-5 py-2 rounded-full bg-white text-cyan-950 text-xs font-black hover:bg-cyan-50 shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Play size={13} />
                      <span>Start Water Filling</span>
                    </button>
                  )}
                  {activeJob.status === 'FILLING' && (
                    <button
                      onClick={() => handleTransitionStatus('EN_ROUTE')}
                      className="px-5 py-2 rounded-full bg-cyan-400 text-slate-950 text-xs font-black hover:bg-cyan-300 shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Navigation size={13} />
                      <span>Start Route Navigation</span>
                    </button>
                  )}
                  {activeJob.status === 'EN_ROUTE' && (
                    <button
                      onClick={() => handleTransitionStatus('ARRIVED')}
                      className="px-5 py-2 rounded-full bg-emerald-400 text-slate-950 text-xs font-black hover:bg-emerald-300 shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <MapPin size={13} />
                      <span>Arrived at Customer Gate</span>
                    </button>
                  )}
                  {activeJob.status === 'ARRIVED' && (
                    <button
                      onClick={() => setShowScanner(true)}
                      className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 animate-pulse"
                    >
                      <QrCode size={13} />
                      <span>Scan Customer Delivery QR</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 z-10 text-right pointer-events-none hidden sm:block">
              <span className="text-sm font-serif italic text-cyan-100/90 font-bold block drop-shadow-md">
                Every Drop Counts ♡
              </span>
              <span className="text-xs text-cyan-200/80 font-mono">
                Driver Santosh J.
              </span>
            </div>
          </div>

          {/* 4 DRIVER METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Truck size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Trips Today</span>
                <span className="text-sm font-black text-slate-900 block">4 Completed</span>
              </div>
              <div className="text-[10px] font-extrabold text-cyan-700">40,000 Litres</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Today's Earnings</span>
                <span className="text-sm font-black text-slate-900 block">₹2,450</span>
              </div>
              <div className="text-[10px] font-extrabold text-emerald-700">12% Incentive Active</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Driver Rating</span>
                <span className="text-sm font-black text-slate-900 block">4.9 ★</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-500">128 Citizen Reviews</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <ShieldCheck size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Source Audit</span>
                <span className="text-sm font-black text-slate-900 block">PMC Verified</span>
              </div>
              <div className="text-[10px] font-extrabold text-teal-700">Parvati Reservoir</div>
            </div>
          </div>

          {/* DRIVER TRIP ROUTE MAP */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-cyan-700" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Active Turn-by-Turn Route
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Speed: 28 km/h • GPS Steady
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <LeafletMap
                center={[18.535, 73.805]}
                zoom={13}
                className="h-72 w-full"
                markers={[
                  {
                    id: 'drv-truck',
                    lat: activeJob?.currentLat || 18.535,
                    lng: activeJob?.currentLng || 73.805,
                    title: 'My Tanker (MH-12 AB 4821)',
                    type: 'truck',
                    etaMin: activeJob?.etaMin || 22,
                  },
                  {
                    id: 'dest',
                    lat: activeJob?.lat || 18.552,
                    lng: activeJob?.lng || 73.788,
                    title: 'Baner Sector 9 Delivery',
                    type: 'delivery',
                  },
                ]}
                routePolyline={[
                  [18.4985, 73.8475],
                  [18.515, 73.825],
                  [18.535, 73.805],
                  [18.552, 73.788],
                ]}
              />
            </div>
          </div>
        </div>

        {/* Right Column (5/12): Source Check-In Card + QR PoD Trigger + Quick Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. DAILY SOURCE CHECK-IN CARD (PMC MANDATORY AUDIT) */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-cyan-700" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Daily Source Check-In (PMC Audit)
                </h3>
              </div>
              {todayCheckIn ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Verified Today
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  Action Required
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Tankers must check-in within 500m of a licensed PMC municipal station to unlock order dispatch.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Water Filling Station
                </label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} • Cert: {s.certificateNo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Filling Certificate No.
                </label>
                <input
                  type="text"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              <button
                onClick={handleCheckInSubmit}
                disabled={checkInLoading}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {checkInLoading ? 'Verifying PMC Geofence...' : 'Submit Station Check-In'}
              </button>
            </div>
          </div>

          {/* 2. CUSTOMER POD SCANNER TRIGGER CARD */}
          <div className="rounded-3xl bg-gradient-to-r from-sky-100/90 via-cyan-100/80 to-teal-100/90 p-5 border border-sky-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black shrink-0 shadow-md">
                <QrCode size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-cyan-950">
                  Customer PoD Verification Scanner
                </h4>
                <p className="text-[11px] text-cyan-800">
                  Scan customer's dynamic 30-sec QR to release escrow payment instantly.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowScanner(true)}
              className="w-full py-2.5 rounded-2xl bg-[#0a5265] hover:bg-[#073b49] text-white text-xs font-black shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Camera size={14} />
              <span>Launch Verification Camera</span>
            </button>
          </div>

          {/* 3. DRIVER QUICK ACTIONS */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-700" />
              <span>Driver Controls</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (driver) {
                    db.update((d) => {
                      const drv = d.drivers.find((item) => item.id === driver.id);
                      if (drv) drv.online = !drv.online;
                    });
                    refreshData();
                  }
                }}
                className={`p-3 rounded-2xl border text-center transition-colors cursor-pointer ${
                  driver?.online
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <span className="text-xs font-extrabold block">
                  {driver?.online ? 'Online (Ready)' : 'Go Online'}
                </span>
                <span className="text-[10px] text-slate-500">Toggle Dispatch</span>
              </button>

              <button
                onClick={() => alert('Support helpline: +91 20 2550 1000 (PMC Water Control Desk)')}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold block text-slate-800">PMC Helpline</span>
                <span className="text-[10px] text-slate-500">Emergency Support</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SCANNER MODAL */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-sky-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Camera className="w-5 h-5 text-cyan-600" />
                <span>Scan Customer Delivery QR</span>
              </div>
              <button
                onClick={() => setShowScanner(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Align camera with customer's 30-second dynamic QR code on their screen to unlock instant escrow release.
            </p>

            <div className="relative h-48 rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800">
              <div className="w-36 h-36 border-2 border-cyan-400 rounded-2xl relative flex items-center justify-center animate-pulse">
                <QrCode size={48} className="text-cyan-400/50" />
              </div>
            </div>

            <button
              onClick={handleScanSubmit}
              disabled={isVerifying}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? 'Verifying Escrow Cryptography...' : 'Simulate Successful QR Scan & Deliver'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
