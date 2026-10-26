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
} from 'lucide-react';

export const DriverView: React.FC = () => {
  const { currentUser, t } = useAppStore();
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

    // Active job assigned to this driver
    const job = data.bookings.find(
      (b) =>
        b.driverId === drv.id &&
        b.status !== 'DELIVERED' &&
        b.status !== 'SETTLED' &&
        b.status !== 'CANCELLED'
    );
    setActiveJob(job || null);
    if (job) setDeliveredLitres(job.volumeL);

    // Unaccepted job offer
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
          // Timeout: decline and trigger reassign
          mockApi.cancelBooking(jobOffer.id, 'Driver offer timed out (90s)');
          return 90;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [jobOffer?.id]);

  // Handle Source Check-in submission
  const handleCheckInSubmit = async () => {
    setCheckInLoading(true);
    setCheckInError(null);
    try {
      const res = await mockApi.driverSourceCheckIn({
        driverId: driver.id,
        sourceId: selectedSourceId,
        certificateNo: certInput,
        driverLat: 18.4988, // At PMC Parvati filling station
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

  // Status transitions: FILLING -> EN_ROUTE -> ARRIVED
  const handleTransitionStatus = async (status: any) => {
    if (!activeJob) return;
    await mockApi.updateBookingStatus(activeJob.id, status);
    refreshData();
  };

  // Auto-scan Neha's live QR (Demo helper)
  const handleAutoReadLiveQr = async () => {
    if (!activeJob) return;
    const livePayload = await mockApi.getPodQr(activeJob.id);
    handleVerifyPoD(JSON.stringify(livePayload));
  };

  // Verify PoD
  const handleVerifyPoD = async (payloadString: string) => {
    if (!activeJob) return;
    setIsVerifying(true);
    try {
      const res = await mockApi.verifyPod({
        bookingId: activeJob.id,
        payloadString,
        driverLat: activeJob.lat,
        driverLng: activeJob.lng,
        deliveredLitres,
        simulateGpsDrift,
      });

      setVerifyResult(res.result);
      if (res.result.allPassed) {
        refreshData();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none text-slate-800">
      {/* Top Driver Navigation & Vehicle Header Bar */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center font-black text-white text-2xl shadow-md">
            <Truck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black tracking-tight">{driver?.name || 'Santosh Jadhav'}</h1>
              <span className="text-xs font-mono bg-cyan-950 text-cyan-300 font-extrabold px-2.5 py-0.5 rounded-lg border border-cyan-700/60">
                MH-12 AB 4821
              </span>
              <span className="text-xs bg-emerald-950 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-700/50">
                10,000 Litre Tanker
              </span>
            </div>
            <p className="text-xs text-cyan-200/80 mt-1">
              Shree Ganesh Water Suppliers • Zone 2 (Baner-Aundh Corridor) • 12% Per-Trip Incentive
            </p>
          </div>
        </div>

        {/* Driver Earnings & Online Toggle */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-800/90 px-4 py-2 rounded-2xl border border-slate-700 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Driver Wallet Balance
            </div>
            <div className="text-xl font-black text-cyan-300">
              {formatINR(driver?.walletPaise || 0)}
            </div>
          </div>

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
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm ${
              driver?.online
                ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                : 'bg-rose-500 hover:bg-rose-600 text-white'
            }`}
          >
            {driver?.online ? 'Online (Ready)' : 'Offline'}
          </button>
        </div>
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7/12): Active Trip & Live Navigation Map */}
        <div className="lg:col-span-7 space-y-6">
          {activeJob ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h2 className="text-base font-black text-slate-900">
                      Active Delivery Job: {activeJob.id}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Destination: {activeJob.address.label} ({activeJob.address.line})
                  </p>
                </div>
                <span className="text-xs font-black text-cyan-800 bg-cyan-100 px-3 py-1 rounded-full uppercase">
                  {activeJob.status.replace('_', ' ')}
                </span>
              </div>

              {/* Wide Driver Route Navigation Map */}
              <LeafletMap
                center={[activeJob.lat, activeJob.lng]}
                zoom={14}
                className="h-60 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-200"
                markers={[
                  {
                    id: 'tanker',
                    lat: activeJob.currentLat || 18.54,
                    lng: activeJob.currentLng || 73.79,
                    title: 'My Tanker (MH-12 AB 4821)',
                    type: 'truck',
                    subLabel: 'MH-12 AB 4821',
                    etaMin: activeJob.etaMin,
                  },
                  {
                    id: 'dest',
                    lat: activeJob.lat,
                    lng: activeJob.lng,
                    title: activeJob.address.label,
                    type: 'delivery',
                  },
                ]}
                routePolyline={[
                  [18.4985, 73.8475],
                  [18.515, 73.825],
                  [activeJob.currentLat || 18.54, activeJob.currentLng || 73.79],
                  [activeJob.lat, activeJob.lng],
                ]}
              />

              {/* Trip Progression Buttons */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-700">Trip Progression Controls:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeJob.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleTransitionStatus('FILLING')}
                      className="py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-2xl text-xs cursor-pointer shadow-xs col-span-2"
                    >
                      Start Filling at Source (PMC Parvati Station)
                    </button>
                  )}

                  {activeJob.status === 'FILLING' && (
                    <button
                      onClick={() => handleTransitionStatus('EN_ROUTE')}
                      className="py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-2xl text-xs cursor-pointer shadow-xs col-span-2"
                    >
                      Filled (10,000 L) • Depart En Route to Delivery
                    </button>
                  )}

                  {activeJob.status === 'EN_ROUTE' && (
                    <button
                      onClick={() => handleTransitionStatus('ARRIVED')}
                      className="py-3 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-extrabold rounded-2xl text-xs cursor-pointer shadow-md col-span-2"
                    >
                      Arrived at Customer Delivery Gate
                    </button>
                  )}

                  {activeJob.status === 'ARRIVED' && (
                    <button
                      onClick={() => setShowScanner(true)}
                      className="py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg animate-pulse cursor-pointer col-span-2"
                    >
                      <QrCode size={18} />
                      <span>Scan Customer Dynamic Delivery QR (Proof of Delivery)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <Truck size={48} className="text-slate-300 mx-auto" />
              <h3 className="text-lg font-black text-slate-800">No Active Trip Assigned</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You are online in Zone 2. New 10,000 L customer and society tanker bookings will appear in your offers queue.
              </p>
            </div>
          )}
        </div>

        {/* Right Column (5/12): Source Check-in & Trip Offers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Daily Source Check-in Card */}
          {!todayCheckIn ? (
            <div className="bg-white rounded-3xl p-6 border border-amber-300 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-800 font-black text-sm">
                <AlertTriangle size={18} className="text-amber-600" />
                <span>{t('source_checkin_title')}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{t('source_checkin_desc')}</p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Select Certified Water Source
                  </label>
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Batch / Certificate Number
                  </label>
                  <input
                    type="text"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 flex items-center justify-between border border-slate-200">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-cyan-600" />
                    <span>GPS Location: Parvati Station</span>
                  </span>
                  <span className="text-emerald-700 font-extrabold">Within 45m</span>
                </div>

                {checkInError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 font-medium">
                    {checkInError}
                  </div>
                )}

                <button
                  onClick={handleCheckInSubmit}
                  disabled={checkInLoading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:brightness-105 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {checkInLoading ? 'Verifying Source & Geotag...' : 'Complete Source Audit & Go Online'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                <div>
                  <div className="font-black text-sm text-emerald-950">
                    {t('source_verified_badge')}
                  </div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    PMC Parvati Filling Station • Cert: {todayCheckIn.certificateNo}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                Active Audit
              </span>
            </div>
          )}

          {/* Incoming Job Offer Card with 90s Timer */}
          {jobOffer && (
            <div className="bg-white rounded-3xl p-6 border border-cyan-300 shadow-xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-black text-cyan-800 bg-cyan-100 px-3 py-1 rounded-full">
                  Incoming Job Offer
                </span>
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <Clock size={14} />
                  <span>{offerCountdown}s remaining</span>
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-lg font-black text-slate-900">
                    {jobOffer.volumeL.toLocaleString('en-IN')} L Water Tanker
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Delivery Address: {jobOffer.address.label}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-emerald-700">
                    +{formatINR(Math.round(jobOffer.price.total * 0.12))}
                  </div>
                  <div className="text-[10px] text-slate-400">12% Driver Incentive</div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => mockApi.cancelBooking(jobOffer.id, 'Driver declined offer')}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleTransitionStatus('ACCEPTED')}
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-black rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Accept Offer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- CAMERA SCANNER & POD MODAL --- */}
      {showScanner && activeJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <Camera size={18} className="text-cyan-600" />
                <span>{t('driver_scan_qr')}</span>
              </div>
              <button onClick={() => setShowScanner(false)} className="text-slate-400 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Simulated Camera Viewfinder */}
            <div className="h-48 bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center text-white border-2 border-dashed border-cyan-400">
              <div className="w-32 h-32 border-2 border-cyan-400 rounded-2xl animate-pulse flex items-center justify-center">
                <QrCode size={48} className="text-cyan-300 opacity-60" />
              </div>
              <span className="text-xs text-cyan-200 mt-2">Align customer dynamic QR in frame</span>
            </div>

            {/* Delivered Litres Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {t('confirm_quantity')} (Litres)
              </label>
              <input
                type="number"
                value={deliveredLitres}
                onChange={(e) => setDeliveredLitres(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <span className="text-[11px] text-slate-400 block">
                If delivered &lt; 95% of ordered, difference is automatically refunded to customer wallet.
              </span>
            </div>

            {/* Quick Demo Scan Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleAutoReadLiveQr}
                disabled={isVerifying}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>{t('scan_demo_qr')}</span>
              </button>

              <button
                onClick={() => setSimulateGpsDrift(!simulateGpsDrift)}
                className={`w-full py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  simulateGpsDrift
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {simulateGpsDrift ? '⚠️ GPS Drift Active (1.85 km away)' : t('simulate_gps_drift')}
              </button>
            </div>

            {/* Verification Checklist Output */}
            {verifyResult && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-900 text-xs mb-1">5-Point Security Checklist:</div>

                <div className="flex items-center justify-between text-xs">
                  <span>1. Cryptographic Signature (SHA-256)</span>
                  {verifyResult.signatureValid ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check size={13} /> Pass
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-0.5">
                      <X size={13} /> Fail
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span>2. Freshness (&lt; 60s)</span>
                  {verifyResult.freshnessValid ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check size={13} /> Pass
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-0.5">
                      <X size={13} /> Fail
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span>3. Booking Status is ARRIVED</span>
                  {verifyResult.statusValid ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check size={13} /> Pass
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-0.5">
                      <X size={13} /> Fail
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span>4. One-Time Nonce Unused</span>
                  {verifyResult.nonceUnused ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check size={13} /> Pass
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-0.5">
                      <X size={13} /> Replay
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span>5. GPS Geofence (Within 150m)</span>
                  {verifyResult.geofenceValid ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check size={13} /> {verifyResult.distanceM}m
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-0.5">
                      <X size={13} /> {verifyResult.distanceM}m
                    </span>
                  )}
                </div>

                {verifyResult.allPassed ? (
                  <div className="mt-2 p-2.5 bg-emerald-100 text-emerald-900 rounded-xl font-bold text-center">
                    🎉 PoD Verified! Escrow Released. Payouts credited!
                  </div>
                ) : (
                  <div className="mt-2 p-2.5 bg-rose-100 text-rose-900 rounded-xl font-bold text-center">
                    ❌ Verification Rejected: {verifyResult.failureReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
