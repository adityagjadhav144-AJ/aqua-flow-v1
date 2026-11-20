import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { eventBus } from '../../services/eventBus';
import { mockApi } from '../../services/mockApi';
import { simulationEngine } from '../../services/simulation';
import { calculateDistanceMeters, VerificationChecklist } from '../../services/qr';
import { formatINR } from '../../services/pricing';
import { GoogleTankerMap } from '../../components/common/GoogleTankerMap';
import { StatusStepper } from '../../components/common/StatusStepper';
import { Booking, SourceCheckIn, WaterSource, LedgerEntry } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Clock,
  QrCode,
  Play,
  Wallet,
  Camera,
  ArrowRight,
  X,
  Navigation,
  DollarSign,
  Award,
  Sparkles,
  Crosshair,
  FastForward,
  Phone,
  Compass,
  Route,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

interface DriverViewProps {
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

export const DriverView: React.FC<DriverViewProps> = ({
  activeNav: externalNav,
  onNavChange: externalOnNavChange,
}) => {
  const { currentUser } = useAppStore();
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
  const [latestJob, setLatestJob] = useState<Booking | null>(null);
  const [jobOffer, setJobOffer] = useState<Booking | null>(null);
  const [driverLedger, setDriverLedger] = useState<LedgerEntry[]>([]);
  const [offerCountdown, setOfferCountdown] = useState(90);

  // Active Navigate Google Maps Controls
  const [simSpeed, setSimSpeed] = useState<1 | 10 | 60>(() => simulationEngine.getConfig().timeSpeed);
  const [followTanker, setFollowTanker] = useState<boolean>(true);
  const [isDispatchingNext, setIsDispatchingNext] = useState<boolean>(false);
  const [showHelplineInfo, setShowHelplineInfo] = useState<boolean>(false);
  const [showCustomerContact, setShowCustomerContact] = useState<boolean>(false);

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

    const checkin = data.sourceCheckIns.find(
      (c) => c.driverId === drv.id && c.status === 'verified'
    );
    setTodayCheckIn(checkin || null);

    const job = data.bookings.find(
      (b) =>
        b.driverId === drv.id &&
        b.status !== 'DELIVERED' &&
        b.status !== 'SETTLED' &&
        b.status !== 'CANCELLED'
    );
    setActiveJob(job || null);

    const fallbackLatest =
      data.bookings.find((b) => b.driverId === drv.id && b.status !== 'CANCELLED') ||
      data.bookings.find((b) => b.id === 'BK-2026-9041') ||
      data.bookings[0] ||
      null;
    setLatestJob(fallbackLatest);

    if (job) {
      setDeliveredLitres(job.volumeL);
    } else if (fallbackLatest) {
      setDeliveredLitres(fallbackLatest.volumeL);
    }

    const offer = data.bookings.find((b) => b.driverId === drv.id && b.status === 'MATCHED');
    setJobOffer(offer || null);

    setDriverLedger(
      data.ledger.filter(
        (l) => l.partyId === drv.id || l.type === 'driver_incentive' || l.type === 'payout'
      )
    );
  };

  useEffect(() => {
    refreshData();
    const sub1 = eventBus.subscribe('simulation_tick', refreshData);
    const sub2 = eventBus.subscribe('booking_status_changed', refreshData);
    const sub3 = eventBus.subscribe('booking_created', refreshData);
    const sub4 = eventBus.subscribe('source_checkin_completed', refreshData);
    const sub5 = eventBus.subscribe('db_reset', refreshData);

    return () => {
      sub1();
      sub2();
      sub3();
      sub4();
      sub5();
    };
  }, []);

  // Open PoD Scanner if sidebar 'scan_pod' is selected
  useEffect(() => {
    if (externalNav === 'scan_pod') {
      setShowScanner(true);
    }
  }, [externalNav]);

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

  // Live Trip & Google Maps Telemetry Calculation
  const trackedJob: Booking | null = activeJob || latestJob;
  const trackedSource =
    sources.find((s) => s.id === selectedSourceId) ||
    sources.find((s) => s.id === 'src-1') ||
    sources[0];

  const sourceLat = trackedSource?.lat || 18.4985;
  const sourceLng = trackedSource?.lng || 73.8475;
  const destLat = trackedJob?.lat || 18.5592;
  const destLng = trackedJob?.lng || 73.7868;

  const isDelivered =
    trackedJob?.status === 'DELIVERED' || trackedJob?.status === 'SETTLED';
  const isArrived = trackedJob?.status === 'ARRIVED';
  const isPreTransit =
    !trackedJob ||
    trackedJob.status === 'REQUESTED' ||
    trackedJob.status === 'MATCHED' ||
    trackedJob.status === 'ACCEPTED' ||
    trackedJob.status === 'FILLING';

  const truckLat =
    isDelivered || isArrived
      ? destLat
      : isPreTransit
      ? sourceLat
      : trackedJob?.currentLat || 18.535;
  const truckLng =
    isDelivered || isArrived
      ? destLng
      : isPreTransit
      ? sourceLng
      : trackedJob?.currentLng || 73.805;

  const remainingDistM =
    isDelivered || isArrived
      ? 0
      : calculateDistanceMeters(truckLat, truckLng, destLat, destLng);
  const remainingDistKm = (remainingDistM / 1000).toFixed(1);
  const totalCorridorDistM = Math.max(
    1,
    calculateDistanceMeters(sourceLat, sourceLng, destLat, destLng)
  );
  const transitProgressPct = isDelivered
    ? 100
    : isArrived
    ? 95
    : isPreTransit
    ? 12
    : Math.min(
        92,
        Math.max(18, Math.round(((totalCorridorDistM - remainingDistM) / totalCorridorDistM) * 100))
      );

  const traveledPolyline: [number, number][] =
    isDelivered || isArrived
      ? [
          [sourceLat, sourceLng],
          [18.515, 73.828],
          [18.535, 73.808],
          [destLat, destLng],
        ]
      : isPreTransit
      ? [
          [sourceLat, sourceLng],
          [sourceLat, sourceLng],
        ]
      : [
          [sourceLat, sourceLng],
          [18.515, 73.828],
          [truckLat, truckLng],
        ];

  const remainingPolyline: [number, number][] =
    isDelivered || isArrived
      ? []
      : [
          [truckLat, truckLng],
          [destLat, destLng],
        ];

  const nextTurnInstruction = isDelivered
    ? 'Delivery Verified • Ready for Next Dispatch'
    : isArrived
    ? 'Arrived at Customer Gate — Verify 30s Dynamic QR'
    : isPreTransit
    ? `At ${trackedSource?.name || 'Parvati Filling Station'} • Prepare Dispatch`
    : transitProgressPct < 45
    ? 'Continue NW via Sinhagad Rd toward Karve Statue (2.8 km)'
    : transitProgressPct < 75
    ? 'Merge onto Senapati Bapat Rd toward University Circle'
    : 'Turn left onto Baner Rd • Customer Gate ahead on right';

  const navStatusLabel = !trackedJob
    ? 'Standing By at Parvati Station'
    : trackedJob.status === 'MATCHED' || trackedJob.status === 'ACCEPTED'
    ? 'Proceed to Filling Bay'
    : trackedJob.status === 'FILLING'
    ? 'Filling Tanker at Source'
    : trackedJob.status === 'EN_ROUTE'
    ? `En Route • ETA ${trackedJob.etaMin} min`
    : trackedJob.status === 'ARRIVED'
    ? 'Arrived at Customer Gate'
    : 'Delivered & Escrow Released';

  const handleSpeedChange = (speed: 1 | 10 | 60) => {
    simulationEngine.setTimeSpeed(speed);
    setSimSpeed(speed);
  };

  const handleDispatchSampleTrip = async () => {
    setIsDispatchingNext(true);
    try {
      const { price } = await mockApi.quoteBooking({
        volumeL: 10000,
        purpose: 'general',
        slotType: 'express',
        distanceKm: 4.5,
        demandIndex: 1.0,
      });
      const created = await mockApi.createBooking({
        customerId: 'user-resident-1',
        volumeL: 10000,
        purpose: 'general',
        slot: {
          type: 'express',
          start: 'Now',
          end: '45 mins',
          label: 'Express Route Dispatch',
        },
        price,
        vendorId: 'vendor-1',
        driverId: driver?.id || 'driver-1',
        vehicleId: 'veh-1',
        etaMin: 22,
      });
      await mockApi.updateBookingStatus(
        created.id,
        'EN_ROUTE',
        'Driver started turn-by-turn navigation from Parvati Station.',
        { lat: 18.515, lng: 73.828 }
      );
      setFollowTanker(true);
      refreshData();
    } finally {
      setIsDispatchingNext(false);
    }
  };

  const handleCheckInSubmit = async () => {
    if (!driver) return;
    setCheckInLoading(true);
    setCheckInError(null);
    try {
      const res = await mockApi.driverSourceCheckIn({
        driverId: driver.id,
        sourceId: selectedSourceId,
        certificateNo: certInput,
        driverLat: sourceLat,
        driverLng: sourceLng,
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
    if (!trackedJob) return;
    await mockApi.updateBookingStatus(trackedJob.id, status);
    refreshData();
  };

  const handleScanSubmit = async () => {
    const jobToVerify = activeJob || trackedJob;
    if (!jobToVerify) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      let lat = jobToVerify.lat;
      let lng = jobToVerify.lng;
      if (simulateGpsDrift) {
        lat += 0.006;
        lng += 0.006;
      }

      let payloadString = qrInputText.trim();
      if (!payloadString) {
        const dynamicPayload = await mockApi.getPodQr(jobToVerify.id);
        payloadString = JSON.stringify(dynamicPayload);
      }

      const result = await mockApi.verifyPod({
        bookingId: jobToVerify.id,
        payloadString,
        driverLat: lat,
        driverLng: lng,
        deliveredLitres,
        simulateGpsDrift,
      });
      setVerifyResult(result.result);
      if (result.result.allPassed) {
        refreshData();
        setTimeout(() => {
          setShowScanner(false);
          setVerifyResult(null);
          setQrInputText('');
          if (activeTab === 'scan_pod') setActiveTab('home');
        }, 1800);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const closeScannerModal = () => {
    setShowScanner(false);
    setVerifyResult(null);
    if (activeTab === 'scan_pod') {
      setActiveTab('home');
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
      {/* 1. TOP 5 ACTION CARDS RIBBON                                   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Home / Trip Radar */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'home'
              ? 'bg-gradient-to-r from-[#0d6b82] to-[#0a5265] text-white shadow-md shadow-cyan-900/20 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeTab === 'home' ? 'bg-white/20 text-white' : 'bg-cyan-50 text-cyan-700'
              }`}
            >
              <Truck size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Active Trip</span>
              <span
                className={`text-[10px] font-medium ${
                  activeTab === 'home' ? 'text-cyan-200' : 'text-slate-400'
                }`}
              >
                Trip Radar
              </span>
            </div>
          </div>
          <ArrowRight
            size={15}
            className={activeTab === 'home' ? 'text-white/80 shrink-0' : 'text-slate-400 shrink-0'}
          />
        </button>

        {/* Card 2: Active Navigation (Dedicated Google Maps View) */}
        <button
          onClick={() => setActiveTab('active_nav')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'active_nav'
              ? 'bg-gradient-to-r from-[#0d6b82] to-[#0a5265] text-white shadow-md shadow-cyan-900/20 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeTab === 'active_nav' ? 'bg-white/20 text-white' : 'bg-sky-50 text-cyan-700'
              }`}
            >
              <Navigation size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Active Navigate</span>
              <span
                className={`text-[10px] font-medium ${
                  activeTab === 'active_nav' ? 'text-cyan-200' : 'text-slate-400'
                }`}
              >
                Google Maps GPS
              </span>
            </div>
          </div>
          <ArrowRight
            size={15}
            className={activeTab === 'active_nav' ? 'text-white/80 shrink-0' : 'text-slate-400 shrink-0'}
          />
        </button>

        {/* Card 3: Source Check-In */}
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

        {/* Card 4: Scan Customer QR */}
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

        {/* Card 5: Earnings & Ledger */}
        <button
          onClick={() => setActiveTab('earnings')}
          className={`col-span-2 sm:col-span-1 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'earnings'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Earnings</span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {formatINR(driver?.walletPaise || 245000)}
              </span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. DEDICATED VIEW: DRIVER ACTIVE NAVIGATE (GOOGLE MAPS)        */}
      {/* ============================================================== */}
      {activeTab === 'active_nav' && (
        <div className="bg-white rounded-3xl p-4 sm:p-7 border border-sky-100 shadow-sm space-y-5 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center font-black shadow-sm ${
                  isDelivered ? 'bg-emerald-600' : 'bg-cyan-600'
                }`}
              >
                <Navigation size={20} className={!isDelivered ? 'animate-pulse' : ''} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Driver Active Navigation (Google Maps)
                  </h2>
                  {trackedJob && (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-900 border border-cyan-200">
                      {trackedJob.id} • {trackedJob.volumeL.toLocaleString('en-IN')} L
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Turn-by-turn route from {trackedSource?.name || 'PMC Parvati Station'} →{' '}
                  {trackedJob?.address?.line || 'Baner Sector 9 Delivery Gate'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isArrived && (
                <button
                  onClick={() => setShowScanner(true)}
                  className="text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 animate-pulse"
                >
                  <QrCode size={14} />
                  <span>Scan Delivery QR</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                ← Back to Overview
              </button>
            </div>
          </div>

          {/* Live Driver Navigation KPI & Speed Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Navigation Status
              </span>
              <span
                className={`text-sm font-black block mt-0.5 ${
                  isDelivered ? 'text-emerald-700' : isArrived ? 'text-emerald-600' : 'text-cyan-950'
                }`}
              >
                {navStatusLabel}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Distance to Customer Gate
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                {isDelivered || isArrived ? '0.0 km (At Gate)' : `${remainingDistKm} km remaining`}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Destination & Tanker
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5 truncate">
                {trackedJob?.address?.label || 'Baner Gate'} • MH-12 AB 4821
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                Route Speed & Fast-Forward
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {([1, 10, 60] as const).map((sp) => (
                  <button
                    key={sp}
                    onClick={() => handleSpeedChange(sp)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-black cursor-pointer transition-colors ${
                      simSpeed === sp
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
                {!isDelivered && !isArrived && trackedJob && (
                  <button
                    onClick={() => simulationEngine.triggerDriverArriveNow(trackedJob.id)}
                    className="ml-auto px-2 py-0.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                    title="Fast-forward tanker directly to customer gate"
                  >
                    <FastForward size={11} />
                    <span>Arrive Gate</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Live Google Maps Navigation Viewport */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-[380px] sm:h-[460px] w-full bg-[#E5F1F6]">
            <GoogleTankerMap
              center={[truckLat, truckLng]}
              zoom={13}
              followTruck={followTanker && !isDelivered}
              autoFitBounds={isDelivered}
              origin={{ lat: sourceLat, lng: sourceLng }}
              destination={{ lat: destLat, lng: destLng }}
              transitProgressPct={transitProgressPct}
              isDelivered={isDelivered}
              isArrived={isArrived}
              showMapControls={true}
              className="h-full w-full"
              markers={[
                {
                  id: 'drv-nav-source',
                  lat: sourceLat,
                  lng: sourceLng,
                  title: trackedSource?.name || 'PMC Parvati Water Works',
                  type: 'source',
                  popupContent: `PMC Licensed Filling Point • Cert ${
                    trackedSource?.certificateNo || 'PMC-WTR-2026-PARV-094'
                  }`,
                },
                {
                  id: 'drv-nav-truck',
                  lat: truckLat,
                  lng: truckLng,
                  title: `My Tanker MH-12 AB 4821 (${driver?.name || 'Santosh Jadhav'})`,
                  type: 'truck',
                  etaMin: isDelivered || isArrived ? 0 : trackedJob?.etaMin || 22,
                  subLabel: 'MH-12 AB 4821',
                  popupContent: isDelivered
                    ? 'Trip Completed & Escrow Credited'
                    : isArrived
                    ? 'Arrived at Customer Gate — Open QR Scanner'
                    : `Next: ${nextTurnInstruction} • ${remainingDistKm} km left`,
                },
                {
                  id: 'drv-nav-dest',
                  lat: destLat,
                  lng: destLng,
                  title: trackedJob?.address?.label || 'Customer Delivery Gate',
                  type: 'delivery',
                  popupContent: trackedJob?.address?.line || 'Verified Delivery Gate (Baner)',
                },
              ]}
              traveledPolyline={traveledPolyline}
              routePolyline={remainingPolyline}
            />

            {/* Floating Follow Tanker Control */}
            <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
              <button
                onClick={() => setFollowTanker((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold shadow-lg backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all ${
                  followTanker
                    ? 'bg-cyan-600 text-white border border-cyan-400'
                    : 'bg-white/95 text-slate-800 border border-slate-200 hover:bg-white'
                }`}
              >
                <Crosshair size={14} />
                <span>{followTanker ? 'Following GPS' : 'Re-center GPS'}</span>
              </button>
            </div>

            {/* Bottom Turn-by-Turn Driver Corridor HUD Strip */}
            <div className="absolute bottom-3 left-3 right-3 z-[500]">
              <div className="bg-slate-900/92 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-xl border border-cyan-500/30 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-extrabold">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isDelivered ? 'bg-emerald-400' : 'bg-cyan-400 animate-ping'
                      }`}
                    />
                    <Route size={14} className="text-cyan-300 shrink-0" />
                    <span>{nextTurnInstruction}</span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-300 font-bold">
                    {truckLat.toFixed(4)}°N, {truckLng.toFixed(4)}°E • {transitProgressPct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isDelivered
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400'
                    }`}
                    style={{ width: `${transitProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trip Lifecycle & Customer Action Controls Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 bg-sky-50/40 rounded-2xl p-4 sm:p-5 border border-sky-100 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Trip Lifecycle & Stage Actions</h3>
                <span className="text-[11px] font-bold text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded-full">
                  {trackedJob?.status || 'READY'}
                </span>
              </div>
              <StatusStepper
                currentStatus={trackedJob?.status || 'EN_ROUTE'}
                timeline={trackedJob?.timeline || []}
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-between bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Compass size={16} className="text-cyan-700" />
                    <span>Delivery & Escrow Dispatch Card</span>
                  </h3>
                  {trackedJob && (
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Payout: {formatINR(Math.round(trackedJob.price.total * 0.12))}
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="font-extrabold text-slate-900">
                    {trackedJob?.address?.line || 'Baner Sector 9, Pune'}
                  </div>
                  <div className="text-slate-500">
                    Load: {(trackedJob?.volumeL || 10000).toLocaleString('en-IN')} L •{' '}
                    {trackedJob?.purpose === 'drinking' ? 'Potable RO Certified' : 'Domestic Supply'} •{' '}
                    Slot: {trackedJob?.slot?.label || 'Express Live Dispatch'}
                  </div>
                </div>

                {showCustomerContact && (
                  <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-950 font-semibold flex items-center justify-between">
                    <span>Customer Desk: +91 98220 44190 ({currentUser?.name || 'Resident'})</span>
                    <button
                      onClick={() => setShowCustomerContact(false)}
                      className="text-cyan-700 hover:text-cyan-900 font-bold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {activeJob && (activeJob.status === 'ACCEPTED' || activeJob.status === 'MATCHED') && (
                  <button
                    onClick={() => handleTransitionStatus('FILLING')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play size={14} />
                    <span>Start Water Filling</span>
                  </button>
                )}

                {activeJob && activeJob.status === 'FILLING' && (
                  <button
                    onClick={() => handleTransitionStatus('EN_ROUTE')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Navigation size={14} />
                    <span>Depart Source Station</span>
                  </button>
                )}

                {activeJob && activeJob.status === 'EN_ROUTE' && (
                  <button
                    onClick={() => handleTransitionStatus('ARRIVED')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MapPin size={14} />
                    <span>Mark Arrived at Gate</span>
                  </button>
                )}

                {activeJob && activeJob.status === 'ARRIVED' && (
                  <button
                    onClick={() => setShowScanner(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-md cursor-pointer flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    <QrCode size={14} />
                    <span>Scan Customer Delivery QR</span>
                  </button>
                )}

                {(!activeJob || isDelivered) && (
                  <button
                    onClick={handleDispatchSampleTrip}
                    disabled={isDispatchingNext}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isDispatchingNext ? 'animate-spin' : ''} />
                    <span>{isDispatchingNext ? 'Dispatching...' : 'Dispatch Next Live Trip'}</span>
                  </button>
                )}

                <button
                  onClick={() => setShowCustomerContact((prev) => !prev)}
                  className="py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-cyan-900 border border-sky-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Phone size={13} />
                  <span>Contact Customer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SUB-VIEW: EARNINGS & PAYOUT LEDGER                          */}
      {/* ============================================================== */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-sky-100 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Driver Earnings & Escrow Settlement Ledger
                </h2>
                <p className="text-xs text-slate-500">
                  Instant 12% trip incentive credited upon verified 30s QR delivery proof
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('home')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              ← Back to Overview
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 block">Wallet Balance</span>
              <span className="text-xl font-black text-emerald-950 block mt-0.5">
                {formatINR(driver?.walletPaise || 245000)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
              <span className="text-[11px] font-bold text-cyan-800 block">Today's Completed Load</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">40,000 Litres</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-800 block">Citizen Rating</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">4.9 ★ (128 Trips)</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Recent Settlement Entries
            </h3>
            {driverLedger.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                Complete an active delivery with PoD QR verification to record an instant escrow payout here.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {driverLedger.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 block truncate">
                        {entry.description}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {entry.bookingId ? `${entry.bookingId} • ` : ''}
                        {format(new Date(entry.ts), 'dd MMM, hh:mm a')}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                      +{formatINR(Math.abs(entry.amountPaise))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MAIN 2-COLUMN DRIVER DASHBOARD (Home / Source Check-In)     */}
      {/* ============================================================== */}
      {activeTab !== 'active_nav' && activeTab !== 'earnings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
          {/* Left Column (7/12): Hero Active Trip Card + 4 Metrics + Google Maps Route */}
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
                      ? `${activeJob.volumeL.toLocaleString('en-IN')} Litres • Customer: ${activeJob.address.label} • ETA: ${activeJob.etaMin} mins`
                      : 'Standing by at PMC Parvati filling station • Online'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {activeJob && (activeJob.status === 'ACCEPTED' || activeJob.status === 'MATCHED') && (
                    <button
                      onClick={() => handleTransitionStatus('FILLING')}
                      className="px-5 py-2 rounded-full bg-white text-cyan-950 text-xs font-black hover:bg-cyan-50 shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Play size={13} />
                      <span>Start Water Filling</span>
                    </button>
                  )}
                  {activeJob && activeJob.status === 'FILLING' && (
                    <button
                      onClick={() => handleTransitionStatus('EN_ROUTE')}
                      className="px-5 py-2 rounded-full bg-cyan-400 text-slate-950 text-xs font-black hover:bg-cyan-300 shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Navigation size={13} />
                      <span>Start Route Navigation</span>
                    </button>
                  )}
                  {activeJob && activeJob.status === 'EN_ROUTE' && (
                    <button
                      onClick={() => handleTransitionStatus('ARRIVED')}
                      className="px-5 py-2 rounded-full bg-emerald-400 text-slate-950 text-xs font-black hover:bg-emerald-300 shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <MapPin size={13} />
                      <span>Arrived at Customer Gate</span>
                    </button>
                  )}
                  {activeJob && activeJob.status === 'ARRIVED' && (
                    <button
                      onClick={() => setShowScanner(true)}
                      className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 animate-pulse"
                    >
                      <QrCode size={13} />
                      <span>Scan Customer Delivery QR</span>
                    </button>
                  )}

                  {!activeJob && (
                    <button
                      onClick={handleDispatchSampleTrip}
                      disabled={isDispatchingNext}
                      className="px-5 py-2 rounded-full bg-white text-cyan-950 text-xs font-black hover:bg-cyan-50 shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Play size={13} />
                      <span>{isDispatchingNext ? 'Dispatching...' : 'Dispatch Next Sample Trip'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('active_nav')}
                    className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-extrabold cursor-pointer flex items-center gap-1.5"
                  >
                    <Navigation size={13} />
                    <span>Open Active Navigate</span>
                  </button>
                </div>
              </div>

              <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 z-10 text-right pointer-events-none hidden sm:block">
                <span className="text-sm font-serif italic text-cyan-100/90 font-bold block drop-shadow-md">
                  Every Drop Counts ♡
                </span>
                <span className="text-xs text-cyan-200/80 font-mono">
                  Driver {driver?.name || 'Santosh J.'}
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
                  <span className="text-sm font-black text-slate-900 block">
                    {formatINR(driver?.walletPaise || 245000)}
                  </span>
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
                  <span className="text-sm font-black text-slate-900 block">
                    {todayCheckIn ? 'PMC Verified' : 'Pending'}
                  </span>
                </div>
                <div className="text-[10px] font-extrabold text-teal-700">
                  {trackedSource?.name || 'Parvati Reservoir'}
                </div>
              </div>
            </div>

            {/* DRIVER ACTIVE TURN-BY-TURN GOOGLE MAPS ROUTE CARD */}
            <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isDelivered
                        ? 'bg-emerald-500'
                        : isArrived
                        ? 'bg-emerald-500 animate-ping'
                        : 'bg-cyan-600 animate-ping'
                    }`}
                  />
                  <Navigation size={18} className="text-cyan-700" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Active Turn-by-Turn Route (Google Maps)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {isDelivered || isArrived ? '0.0 km • At Gate' : `${remainingDistKm} km • GPS Live`}
                  </span>
                  <button
                    onClick={() => setActiveTab('active_nav')}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <span>Expand</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-80 w-full bg-[#E5F1F6]">
                <GoogleTankerMap
                  center={[truckLat, truckLng]}
                  zoom={13}
                  followTruck={followTanker && !isDelivered}
                  autoFitBounds={isDelivered}
                  origin={{ lat: sourceLat, lng: sourceLng }}
                  destination={{ lat: destLat, lng: destLng }}
                  transitProgressPct={transitProgressPct}
                  isDelivered={isDelivered}
                  isArrived={isArrived}
                  showMapControls={true}
                  className="h-full w-full"
                  markers={[
                    {
                      id: 'drv-home-source',
                      lat: sourceLat,
                      lng: sourceLng,
                      title: trackedSource?.name || 'PMC Parvati Water Works',
                      type: 'source',
                      popupContent: 'PMC Licensed Filling Station',
                    },
                    {
                      id: 'drv-home-truck',
                      lat: truckLat,
                      lng: truckLng,
                      title: 'My Tanker (MH-12 AB 4821)',
                      type: 'truck',
                      etaMin: isDelivered || isArrived ? 0 : trackedJob?.etaMin || 22,
                      subLabel: 'MH-12 AB 4821',
                      popupContent: nextTurnInstruction,
                    },
                    {
                      id: 'drv-home-dest',
                      lat: destLat,
                      lng: destLng,
                      title: trackedJob?.address?.label || 'Baner Sector 9 Delivery',
                      type: 'delivery',
                      popupContent: trackedJob?.address?.line || 'Customer Delivery Gate',
                    },
                  ]}
                  traveledPolyline={traveledPolyline}
                  routePolyline={remainingPolyline}
                />

                {/* Top-right Follow GPS Toggle */}
                <button
                  onClick={() => setFollowTanker((prev) => !prev)}
                  className={`absolute top-3 right-3 z-[500] px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold shadow-md backdrop-blur-md flex items-center gap-1 cursor-pointer ${
                    followTanker
                      ? 'bg-cyan-600 text-white border border-cyan-400'
                      : 'bg-white/95 text-slate-800 border border-slate-200'
                  }`}
                >
                  <Crosshair size={12} />
                  <span>{followTanker ? 'Following' : 'Follow'}</span>
                </button>

                {/* Bottom Navigation Cue & Speed Controls Overlay */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[500] bg-slate-900/90 backdrop-blur-md text-white rounded-xl p-2.5 shadow-lg border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold min-w-0">
                    <Route size={13} className="text-cyan-300 shrink-0" />
                    <span className="truncate">{nextTurnInstruction}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {([1, 10, 60] as const).map((sp) => (
                      <button
                        key={sp}
                        onClick={() => handleSpeedChange(sp)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                          simSpeed === sp ? 'bg-cyan-500 text-slate-950' : 'bg-white/10 text-slate-200'
                        }`}
                      >
                        {sp}x
                      </button>
                    ))}
                    {!isDelivered && !isArrived && trackedJob && (
                      <button
                        onClick={() => simulationEngine.triggerDriverArriveNow(trackedJob.id)}
                        className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black cursor-pointer flex items-center gap-0.5"
                      >
                        <FastForward size={10} />
                        <span>Arrive</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5/12): Source Check-In Card + QR PoD Trigger + Quick Controls */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. DAILY SOURCE CHECK-IN CARD (PMC MANDATORY AUDIT) */}
            <div
              className={`bg-white rounded-3xl p-5 border shadow-2xs space-y-4 ${
                activeTab === 'source_checkin' ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-sky-100/90'
              }`}
            >
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

              {checkInError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{checkInError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Water Filling Station
                  </label>
                  <select
                    value={selectedSourceId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedSourceId(id);
                      const src = sources.find((s) => s.id === id);
                      if (src) setCertInput(src.certificateNo);
                    }}
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
                  onClick={() => setShowHelplineInfo((prev) => !prev)}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-extrabold block text-slate-800">PMC Helpline</span>
                  <span className="text-[10px] text-slate-500">Emergency Support</span>
                </button>
              </div>

              {showHelplineInfo && (
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-cyan-950 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-black block">PMC Water Control Desk</span>
                    <span className="text-[11px] font-mono">+91 20 2550 1000 • 24x7 Priority Line</span>
                  </div>
                  <button
                    onClick={() => setShowHelplineInfo(false)}
                    className="p-1 rounded-lg hover:bg-sky-100 text-cyan-700 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                onClick={closeScannerModal}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Align camera with customer's 30-second dynamic QR code on their screen to unlock instant escrow release.
            </p>

            <div className="relative h-40 rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800">
              <div className="w-32 h-32 border-2 border-cyan-400 rounded-2xl relative flex items-center justify-center animate-pulse">
                <QrCode size={44} className="text-cyan-400/60" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  Delivered Volume (L)
                </label>
                <input
                  type="number"
                  value={deliveredLitres}
                  onChange={(e) => setDeliveredLitres(Number(e.target.value) || 0)}
                  className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>
              <div className="flex items-end">
                <label className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateGpsDrift}
                    onChange={(e) => setSimulateGpsDrift(e.target.checked)}
                    className="rounded text-cyan-600"
                  />
                  <span className="text-[11px] font-bold text-slate-700">Test GPS Drift</span>
                </label>
              </div>
            </div>

            {verifyResult && (
              <div
                className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                  verifyResult.allPassed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="font-black flex items-center gap-1.5">
                  {verifyResult.allPassed ? (
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  ) : (
                    <XCircle size={15} className="text-rose-600" />
                  )}
                  <span>
                    {verifyResult.allPassed
                      ? 'Escrow Released & Delivery Verified!'
                      : verifyResult.failureReason || 'Verification Blocked'}
                  </span>
                </div>
                <div className="text-[11px] opacity-85">
                  Geofence: {verifyResult.distanceM}m • Signature:{' '}
                  {verifyResult.signatureValid ? 'Valid' : 'Invalid'} • Replay Lock:{' '}
                  {verifyResult.nonceUnused ? 'Unique' : 'Used'}
                </div>
              </div>
            )}

            <button
              onClick={handleScanSubmit}
              disabled={isVerifying || !trackedJob}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
            >
              {isVerifying
                ? 'Verifying Escrow Cryptography...'
                : 'Simulate Successful QR Scan & Deliver'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
