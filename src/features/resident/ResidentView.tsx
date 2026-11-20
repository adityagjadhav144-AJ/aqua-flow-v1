import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { eventBus } from '../../services/eventBus';
import { mockApi } from '../../services/mockApi';
import { formatINR } from '../../services/pricing';
import { LeafletMap } from '../../components/common/LeafletMap';
import { StatusStepper } from '../../components/common/StatusStepper';
import { PriceBreakdown } from '../../components/common/PriceBreakdown';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { RealtimeTankerTrackerModal } from '../../components/common/RealtimeTankerTrackerModal';
import { UpiQrPaymentCard } from '../../components/common/UpiQrPaymentCard';
import { Booking, Pool, ScheduleEvent, CrowdReport, Complaint } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { generateWhatsAppShareLink } from '../../services/pooling';
import { triageComplaintText } from '../../services/gemini';
import {
  Home,
  Droplets,
  Calendar,
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertTriangle,
  Radio,
  Plus,
  Share2,
  CheckCircle2,
  Check,
  Star,
  FileText,
  PhoneCall,
  X,
  CreditCard,
  Send,
  Bell,
  RefreshCw,
  Navigation,
  Compass,
  Wallet,
  MapPin,
  Truck,
  HelpCircle,
  ExternalLink,
  QrCode,
  Smartphone,
  Gauge,
  Activity,
  Award,
  Sparkles,
  ChevronRight,
  Info,
  Phone,
  Layers,
  ThumbsUp,
  Heart,
  Droplet,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ResidentViewProps {
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

export const ResidentView: React.FC<ResidentViewProps> = ({
  activeNav: externalNav,
  onNavChange: externalOnNavChange,
}) => {
  const { currentUser, currentLanguage, t, toggleAquaBot } = useAppStore();

  // Internal tab state synced with external prop if provided
  const [internalTab, setInternalTab] = useState<string>('home');
  const activeTab = externalNav || internalTab;
  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (externalOnNavChange) externalOnNavChange(tab);
  };

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [crowdReports, setCrowdReports] = useState<CrowdReport[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showReceiptBooking, setShowReceiptBooking] = useState<Booking | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);
  const [qrPayload, setQrPayload] = useState<{ payloadString: string; secondsLeft: number } | null>(null);

  // Dashboard Spline Chart Period State
  const [trendPeriod, setTrendPeriod] = useState<'7D' | '30D' | '3M'>('30D');

  // Modals for engaging dashboard interactions
  const [showConservationModal, setShowConservationModal] = useState(false);
  const [showSupplyDetailsModal, setShowSupplyDetailsModal] = useState(false);
  const [showCallDriverModal, setShowCallDriverModal] = useState(false);
  const [showReportLeakModal, setShowReportLeakModal] = useState(false);
  const [leakText, setLeakText] = useState('');
  const [isSubmittingLeak, setIsSubmittingLeak] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(1000);

  // Booking Flow State (5 Steps)
  const [bookStep, setBookStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [bookVolume, setBookVolume] = useState<number>(10000);
  const [bookPurpose, setBookPurpose] = useState<'general' | 'drinking'>('general');
  const [bookSlotType, setBookSlotType] = useState<'express' | 'today' | 'scheduled'>('today');
  const [bookQuote, setBookQuote] = useState<any>(null);
  const [matchingVendors, setMatchingVendors] = useState<any[]>([]);
  const [selectedVendorIdx, setSelectedVendorIdx] = useState<number>(0);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingConfirmedObj, setBookingConfirmedObj] = useState<Booking | null>(null);
  const [payMode, setPayMode] = useState<'upi_qr' | 'upi_vpa' | 'wallet'>('upi_qr');
  const [vpaInput, setVpaInput] = useState('neha@okaxis');

  // Pool Create State
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  const [poolTargetL, setPoolTargetL] = useState(5000);
  const [poolMyShareL, setPoolMyShareL] = useState(1500);
  const [poolDropPointLabel, setPoolDropPointLabel] = useState('Near Pancard Club Road, Baner');

  // Refresh data from db
  const refreshData = () => {
    const data = db.getData();
    setAllBookings([...data.bookings]);
    const ongoing = data.bookings.find(
      (b) =>
        b.customerId === currentUser.id &&
        b.status !== 'DELIVERED' &&
        b.status !== 'SETTLED' &&
        b.status !== 'CANCELLED'
    );
    setActiveBooking(ongoing || null);
    setPools([...data.pools]);
    setSchedules([...data.schedules]);
    setCrowdReports([...data.crowdReports]);
    setComplaints([...data.complaints.filter((c) => c.userId === currentUser.id)]);
  };

  useEffect(() => {
    refreshData();
    const sub1 = eventBus.subscribe('simulation_tick', refreshData);
    const sub2 = eventBus.subscribe('booking_status_changed', refreshData);
    const sub3 = eventBus.subscribe('booking_created', refreshData);
    const sub4 = eventBus.subscribe('pool_updated', refreshData);
    const sub5 = eventBus.subscribe('schedule_published', refreshData);
    const sub6 = eventBus.subscribe('crowd_report_created', refreshData);
    const sub7 = eventBus.subscribe('db_reset', refreshData);

    return () => {
      sub1();
      sub2();
      sub3();
      sub4();
      sub5();
      sub6();
      sub7();
    };
  }, [currentUser.id]);

  // Handle Dynamic QR generation & 30-sec refresh when Arrived
  useEffect(() => {
    if (activeBooking?.status === 'ARRIVED') {
      let countdown = 30;
      const generateQr = async () => {
        const payload = await mockApi.getPodQr(activeBooking.id);
        setQrPayload({
          payloadString: JSON.stringify(payload),
          secondsLeft: countdown,
        });
      };

      generateQr();
      const interval = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          countdown = 30;
          generateQr();
        } else {
          setQrPayload((prev) => (prev ? { ...prev, secondsLeft: countdown } : null));
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setQrPayload(null);
    }
  }, [activeBooking?.status, activeBooking?.id]);

  // Fetch Fair-Price Quote
  const handleGetQuote = async () => {
    const quote = await mockApi.quoteBooking({
      volumeL: bookVolume,
      purpose: bookPurpose,
      slotType: bookSlotType,
      distanceKm: 4.5,
      demandIndex: 1.0,
    });
    setBookQuote(quote);

    const matches = await mockApi.getMatchingVendors(bookVolume, 18.552, 73.788);
    setMatchingVendors(matches);
    setBookStep(3);
  };

  // Complete Booking Submission
  const handleConfirmBooking = async () => {
    if (!bookQuote) return;
    setIsBookingSubmitting(true);
    const matchedVendor = matchingVendors[selectedVendorIdx] || matchingVendors[0];

    const newBooking = await mockApi.createBooking({
      customerId: currentUser.id,
      volumeL: bookVolume,
      purpose: bookPurpose,
      slot: {
        type: bookSlotType,
        start: '10:00 AM',
        end: '12:00 PM',
        label: bookSlotType === 'express' ? 'Express (<2 hrs)' : 'Today Standard',
      },
      price: bookQuote.price,
      vendorId: matchedVendor?.vendor.id || 'vendor-1',
      driverId: matchedVendor?.driver.id || 'driver-1',
      vehicleId: matchedVendor?.vehicle.id || 'veh-1',
      etaMin: matchedVendor?.estimatedEtaMin || 25,
    });

    setIsBookingSubmitting(false);
    setBookingConfirmedObj(newBooking);
    setBookStep(5);
    refreshData();
  };

  // Handle reporting leak / grievance
  const handleSubmitLeakReport = async () => {
    if (!leakText.trim()) return;
    setIsSubmittingLeak(true);
    try {
      const triage = await triageComplaintText(leakText);
      await mockApi.createComplaint({
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        zoneId: 'z2',
        category: triage.category,
        urgency: triage.urgency,
        text: leakText,
      });
      setLeakText('');
      setShowReportLeakModal(false);
      refreshData();
    } finally {
      setIsSubmittingLeak(false);
    }
  };

  // Top Up Wallet Handler
  const handleTopUpWallet = () => {
    useAppStore.setState((state) => ({
      currentUser: {
        ...state.currentUser,
        walletPaise: (state.currentUser.walletPaise || 150000) + topUpAmount * 100,
      },
    }));
    setShowTopUpModal(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 select-none text-slate-800">
      {/* ============================================================== */}
      {/* 1. TOP 5 ACTION CARDS RIBBON (Exactly matching reference design) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Book Tanker (Deep teal active card) */}
        <button
          onClick={() => {
            setActiveTab('book');
            setBookStep(1);
          }}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'book'
              ? 'bg-gradient-to-r from-[#0d6b82] to-[#0a5265] text-white shadow-md shadow-cyan-900/20 scale-[1.02]'
              : 'bg-gradient-to-r from-[#0d6b82] to-[#0a5265] text-white hover:brightness-105 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Truck size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">
                {currentLanguage === 'mr' ? 'टँकर बुक करा' : 'Book Tanker'}
              </span>
              <span className="text-[10px] text-cyan-200 font-medium">Fair-Capped</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-white/80 shrink-0" />
        </button>

        {/* Card 2: Track Tanker */}
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'radar'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">
                {currentLanguage === 'mr' ? 'टँकर ट्रॅक करा' : 'Track Tanker'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Live Radar</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 3: Order History */}
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'orders'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">
                {currentLanguage === 'mr' ? 'ऑर्डर इतिहास' : 'Order History'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Escrow Ledger</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 4: Community Pools */}
        <button
          onClick={() => setActiveTab('pool')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'pool'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">
                {currentLanguage === 'mr' ? 'कम्युनिटी पूल' : 'Community Pools'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Split Tankers</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 5: Tax Invoices */}
        <button
          onClick={() => setActiveTab('orders')}
          className="col-span-2 sm:col-span-1 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 shadow-xs transition-all duration-200 cursor-pointer text-left text-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">
                {currentLanguage === 'mr' ? 'कर पावत्या' : 'Tax Invoices'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">GST Compliant</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. TAB CONTENT: DASHBOARD HOME (MATCHING REFERENCE IMAGE)      */}
      {/* ============================================================== */}
      {activeTab === 'home' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
          {/* ========================================================== */}
          {/* LEFT COLUMN: Hero Next Supply + 4 Metrics + Spline Chart   */}
          {/* ========================================================== */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-5">
            {/* HERO CARD: NEXT SUPPLY (Deep ocean gradient + water splash) */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#063b4f] via-[#09576f] to-[#0c6b84] text-white p-5 sm:p-7 shadow-lg shadow-cyan-950/15 border border-cyan-800/40">
              {/* High-res water splash crown background graphic aligned to right */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-35 mix-blend-screen pointer-events-none overflow-hidden">
                <img
                  src="/assets/water_splash_banner.jpg"
                  alt="Water Splash Banner"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Foreground Hero Content */}
              <div className="relative z-10 space-y-4 max-w-md">
                {/* Top Capsule Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/20 backdrop-blur-md border border-cyan-300/30 text-cyan-200 text-[11px] font-extrabold uppercase tracking-wider">
                  <Droplets size={13} className="text-cyan-300" />
                  <span>Next Supply</span>
                </div>

                {/* Big Supply Window Heading */}
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                    Today, 6:00 PM – 8:30 PM
                  </h2>
                  <p className="text-cyan-200 text-xs sm:text-sm font-semibold mt-0.5">
                    (Evening Window • Baner Ward 9)
                  </p>
                </div>

                {/* Verified PMC Checkmark */}
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-emerald-300 stroke-[3]" />
                  </div>
                  <span>PMC municipal water supply scheduled for your area</span>
                </div>

                {/* View Details Pill Button */}
                <div className="pt-1 flex items-center gap-4">
                  <button
                    onClick={() => setShowSupplyDetailsModal(true)}
                    className="px-5 py-2 rounded-full bg-white text-cyan-950 text-xs font-extrabold hover:bg-cyan-50 transition-all shadow-md shadow-black/10 cursor-pointer flex items-center gap-1.5 group"
                  >
                    <span>View Details</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </button>

                  {/* Carousel indicator dots (as shown in reference) */}
                  <div className="flex items-center gap-1.5 opacity-80">
                    <span className="w-5 h-1.5 rounded-full bg-white" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                </div>
              </div>

              {/* Water for a Better Tomorrow Cursive Watermark (as shown in reference) */}
              <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 z-10 text-right pointer-events-none hidden sm:block">
                <span className="text-sm font-serif italic text-cyan-100/90 font-bold block drop-shadow-md">
                  Water for a Better
                </span>
                <span className="text-sm font-serif italic text-cyan-100/90 font-bold block drop-shadow-md">
                  Tomorrow ♡
                </span>
              </div>
            </div>

            {/* 4 STATUS METRIC CARDS GRID (Exact match to reference) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Metric 1: Water Quality */}
              <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Droplet size={17} className="fill-cyan-500 text-cyan-600" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">Water Quality</span>
                  <span className="text-sm font-black text-slate-900 block">Verified</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold">
                  <Check size={10} className="stroke-[3]" />
                  <span>Safe to use</span>
                </div>
              </div>

              {/* Metric 2: Current Pressure */}
              <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Gauge size={17} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">Current Pressure</span>
                  <span className="text-sm font-black text-slate-900 block">Normal</span>
                </div>
                <div className="text-[11px] text-slate-600 font-extrabold flex items-center gap-1">
                  <span>2.8 bar</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              {/* Metric 3: Monthly Usage */}
              <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Activity size={17} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">Your Monthly Usage</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-slate-900">12 kL</span>
                    <span className="text-[10px] font-bold text-emerald-600">↓ 8%</span>
                  </div>
                </div>
                {/* Mini graphical bar lines */}
                <div className="flex items-end gap-1 h-3.5 pt-0.5">
                  <span className="w-1.5 h-2 bg-cyan-200 rounded-t-xs" />
                  <span className="w-1.5 h-3 bg-cyan-300 rounded-t-xs" />
                  <span className="w-1.5 h-2.5 bg-cyan-400 rounded-t-xs" />
                  <span className="w-1.5 h-3.5 bg-cyan-600 rounded-t-xs" />
                  <span className="w-1.5 h-2 bg-cyan-500 rounded-t-xs" />
                </div>
              </div>

              {/* Metric 4: Eco Score */}
              <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Award size={17} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">Eco Score</span>
                  <span className="text-sm font-black text-slate-900 block">92/100</span>
                </div>
                <span className="text-[10px] font-bold text-teal-700 block">
                  Keep saving water!
                </span>
              </div>
            </div>

            {/* WATER USAGE TREND SPLINE CHART (Curved SVG with tooltip & 7D/30D/3M toggles) */}
            <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
              {/* Header with period selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-cyan-700" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Water Usage Trend
                  </h3>
                </div>

                {/* Period Pills: [7D] [30D] [3M] */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-full text-xs font-bold">
                  {(['7D', '30D', '3M'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setTrendPeriod(period)}
                      className={`px-3 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                        trendPeriod === period
                          ? 'bg-cyan-600 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Vector Spline SVG Chart */}
              <div className="relative pt-6 pb-2">
                {/* Active Highlight Marker Tooltip (9.2 kL on 24 Oct) */}
                <div className="absolute top-0 left-[58%] -translate-x-1/2 z-10">
                  <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-black shadow-md border border-cyan-400/40">
                    9.2 kL
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-0.5" />
                </div>

                <svg viewBox="0 0 500 130" className="w-full h-32 sm:h-36 overflow-visible">
                  <defs>
                    <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline Grids */}
                  <line x1="40" y1="20" x2="490" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="40" y1="65" x2="490" y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="40" y1="110" x2="490" y2="110" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Y-Axis Labels */}
                  <text x="5" y="24" fontSize="10" fill="#94a3b8" fontWeight="bold">10kL</text>
                  <text x="10" y="69" fontSize="10" fill="#94a3b8" fontWeight="bold">5kL</text>
                  <text x="10" y="114" fontSize="10" fill="#94a3b8" fontWeight="bold">0kL</text>

                  {/* Vertical Guideline at Peak */}
                  <line x1="290" y1="28" x2="290" y2="110" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2 2" />

                  {/* Spline Area Fill */}
                  <path
                    d="M 60 85 C 110 70, 140 60, 180 50 C 230 40, 260 28, 290 28 C 340 28, 380 45, 420 48 C 450 50, 470 65, 490 70 L 490 110 L 60 110 Z"
                    fill="url(#splineGradient)"
                  />

                  {/* Spline Curved Line */}
                  <path
                    d="M 60 85 C 110 70, 140 60, 180 50 C 230 40, 260 28, 290 28 C 340 28, 380 45, 420 48 C 450 50, 470 65, 490 70"
                    fill="none"
                    stroke="#00acc1"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  <circle cx="60" cy="85" r="4" fill="#00acc1" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="180" cy="50" r="4" fill="#00acc1" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="290" cy="28" r="5" fill="#0891b2" stroke="#ffffff" strokeWidth="2.5" />
                  <circle cx="420" cy="48" r="4" fill="#00acc1" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="490" cy="70" r="4" fill="#00acc1" stroke="#ffffff" strokeWidth="2" />
                </svg>

                {/* X-Axis Date Labels */}
                <div className="flex justify-between pl-8 pr-2 pt-1 text-[11px] font-bold text-slate-400">
                  <span>10 Oct</span>
                  <span>17 Oct</span>
                  <span className="text-cyan-800 font-extrabold">24 Oct</span>
                  <span>31 Oct</span>
                  <span>6 Nov</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* RIGHT COLUMN: Live Tracking Card + Mascot Card + Quick Act */}
          {/* ========================================================== */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-5">
            {/* 1. LIVE TANKER TRACKING CARD (With Mini Route Map & Stepper) */}
            <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-ping" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <MapPin size={16} className="text-cyan-700" />
                    <span>Live Tanker Tracking</span>
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('radar')}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-0.5 cursor-pointer hover:underline"
                >
                  <span>View on Map</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Mini Interactive Leaflet Map Preview with ETA Badge */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner">
                <LeafletMap
                  center={[18.545, 73.798]}
                  zoom={12}
                  className="h-36 sm:h-40 w-full"
                  markers={[
                    {
                      id: 'tanker-1',
                      lat: 18.528,
                      lng: 73.815,
                      title: 'Live Water Tanker MH-12 AB 4821',
                      type: 'truck',
                      etaMin: 25,
                      subLabel: 'MH-12 AB 4821',
                    },
                    {
                      id: 'delivery-1',
                      lat: 18.552,
                      lng: 73.788,
                      title: 'Delivery Point (Baner)',
                      type: 'delivery',
                    },
                  ]}
                  routePolyline={[
                    [18.4985, 73.8475],
                    [18.515, 73.825],
                    [18.528, 73.815],
                    [18.552, 73.788],
                  ]}
                />

                {/* Overlaid ETA Badge */}
                <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Clock size={13} className="text-cyan-600 animate-pulse" />
                  <span>Arriving in 25 min</span>
                </div>
              </div>

              {/* 3-Step Horizontal Stepper: On the Way -> Near You -> Delivered */}
              <div className="pt-1">
                <div className="relative flex items-center justify-between">
                  {/* Connecting Line */}
                  <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-100 -z-0">
                    <div className="w-1/2 h-full bg-cyan-500 rounded-full" />
                  </div>

                  {/* Step 1: On the Way */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/25">
                      <Truck size={14} />
                    </div>
                    <span className="text-[11px] font-bold text-cyan-950 mt-1.5">On the Way</span>
                  </div>

                  {/* Step 2: Near You */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-cyan-400 text-cyan-700 flex items-center justify-center shadow-xs">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 mt-1.5">Near You</span>
                  </div>

                  {/* Step 3: Delivered */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-300 flex items-center justify-center">
                      <Home size={14} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 mt-1.5">Delivered</span>
                  </div>
                </div>
              </div>

              {/* Driver Footer Bar with Call Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    R
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Driver</span>
                    <span className="text-xs font-black text-slate-900">Rohit S.</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCallDriverModal(true)}
                  className="px-3.5 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 text-cyan-800 border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Phone size={13} className="text-cyan-700" />
                  <span>Call</span>
                </button>
              </div>
            </div>

            {/* 2. SAVE WATER, SAVE LIFE ♡ MASCOT CARD (Featuring our cute 3D mascot) */}
            <div className="rounded-3xl bg-gradient-to-r from-sky-100/90 via-cyan-100/80 to-teal-100/90 p-4 sm:p-5 border border-sky-200/80 shadow-2xs flex items-center justify-between gap-3 relative overflow-hidden">
              {/* Mascot Graphic on Left */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden bg-white/40 p-1 shadow-xs border border-white/60">
                <img
                  src="/assets/water_drop_mascot.jpg"
                  alt="Water Drop Mascot"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Message & Learn More Button */}
              <div className="flex-1 space-y-2">
                <h4 className="text-sm sm:text-base font-black text-cyan-950 tracking-tight leading-tight">
                  Save Water, Save Life ♡
                </h4>
                <p className="text-[11px] text-cyan-900/80 font-medium">
                  PMC Pune greywater recycling guide & rainwater harvesting credits.
                </p>
                <button
                  onClick={() => setShowConservationModal(true)}
                  className="px-4 py-1.5 rounded-full bg-[#0a5265] hover:bg-[#073b49] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 group"
                >
                  <span>Learn More</span>
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* 3. BOTTOM SPLIT: Recent Notifications + Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Recent Notifications Card */}
              <div className="bg-white rounded-3xl p-4 border border-sky-100/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Bell size={14} className="text-cyan-700" />
                    <span>Recent Notifications</span>
                  </h4>
                  <button
                    onClick={() => useAppStore.getState().toggleNotifCenter()}
                    className="text-[10px] font-bold text-cyan-700 hover:underline cursor-pointer"
                  >
                    See All →
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-800 block truncate">
                          Tanker delivered successfully
                        </span>
                        <span className="text-[10px] text-slate-400">2 hrs ago</span>
                      </div>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 shrink-0" />
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-800 block truncate">
                          Water outage in Sector 12
                        </span>
                        <span className="text-[10px] text-slate-400">3 hrs ago</span>
                      </div>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 shrink-0" />
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-800 block truncate">
                          Pay your water bill
                        </span>
                        <span className="text-[10px] text-slate-400">1 day ago</span>
                      </div>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-3xl p-4 border border-sky-100/90 shadow-2xs space-y-3">
                <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Sparkles size={14} className="text-cyan-700" />
                  <span>Quick Actions</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  {/* Action 1: Report Leak */}
                  <button
                    onClick={() => setShowReportLeakModal(true)}
                    className="p-2.5 rounded-2xl bg-sky-50/60 hover:bg-sky-100/80 border border-sky-100 flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer"
                  >
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span className="text-[10px] font-bold text-slate-800">Report Leak</span>
                  </button>

                  {/* Action 2: Pay Bill */}
                  <button
                    onClick={() => setShowTopUpModal(true)}
                    className="p-2.5 rounded-2xl bg-teal-50/60 hover:bg-teal-100/80 border border-teal-100 flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer"
                  >
                    <Wallet size={16} className="text-teal-600" />
                    <span className="text-[10px] font-bold text-slate-800">Pay Bill</span>
                  </button>

                  {/* Action 3: Contact Support */}
                  <button
                    onClick={toggleAquaBot}
                    className="p-2.5 rounded-2xl bg-cyan-50/60 hover:bg-cyan-100/80 border border-cyan-100 flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer"
                  >
                    <HelpCircle size={16} className="text-cyan-700" />
                    <span className="text-[10px] font-bold text-slate-800">Contact Support</span>
                  </button>

                  {/* Action 4: More */}
                  <button
                    onClick={() => setActiveTab('pool')}
                    className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer"
                  >
                    <Layers size={16} className="text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-800">More Pools</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SUB-VIEW: BOOK TANKER FLOW                                  */}
      {/* ============================================================== */}
      {activeTab === 'book' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-sky-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black">
                <Truck size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Book Water Tanker (PMC Fair-Cap Protected)
                </h2>
                <p className="text-xs text-slate-500">
                  Step {bookStep} of 5: {bookStep === 1 ? 'Volume & Purpose' : bookStep === 2 ? 'Delivery Slot' : bookStep === 3 ? 'Fair Price Quote' : bookStep === 4 ? 'Escrow Payment' : 'Confirmed'}
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

          {/* Step 1: Volume & Purpose */}
          {bookStep === 1 && (
            <div className="space-y-5 max-w-xl">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Select Water Volume
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[5000, 10000, 20000].map((vol) => (
                    <button
                      key={vol}
                      onClick={() => setBookVolume(vol)}
                      className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        bookVolume === vol
                          ? 'border-cyan-500 bg-cyan-50/80 text-cyan-950 font-black shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-bold'
                      }`}
                    >
                      <span className="text-base block">{vol.toLocaleString()} L</span>
                      <span className="text-[10px] text-slate-400">
                        {vol === 5000 ? 'Small Household' : vol === 10000 ? 'Standard Tanker' : 'Society Tanker'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Water Quality Purpose
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBookPurpose('general')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      bookPurpose === 'general'
                        ? 'border-cyan-500 bg-cyan-50/80 text-cyan-950 font-black shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-xs block font-extrabold">Domestic / General Water</span>
                    <span className="text-[10px] text-slate-500">For washing, bathing & gardening</span>
                  </button>
                  <button
                    onClick={() => setBookPurpose('drinking')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      bookPurpose === 'drinking'
                        ? 'border-cyan-500 bg-cyan-50/80 text-cyan-950 font-black shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-xs block font-extrabold">Potable / RO Certified</span>
                    <span className="text-[10px] text-slate-500">PMC lab tested drinking water</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setBookStep(2)}
                className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md shadow-cyan-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Slot Selection</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Step 2: Slot Selection */}
          {bookStep === 2 && (
            <div className="space-y-5 max-w-xl">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Select Delivery Slot
                </label>
                <div className="space-y-2.5">
                  {[
                    { id: 'express', title: 'Express Delivery (< 2 Hours)', desc: 'Emergency priority dispatch via nearest tanker' },
                    { id: 'today', title: 'Today Standard (2:00 PM – 5:00 PM)', desc: 'Guaranteed afternoon delivery window' },
                    { id: 'scheduled', title: 'Tomorrow Morning (7:00 AM – 10:00 AM)', desc: 'Pre-scheduled society filling slot' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setBookSlotType(s.id as any)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        bookSlotType === s.id
                          ? 'border-cyan-500 bg-cyan-50/80 text-cyan-950 font-black shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-bold'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-extrabold block">{s.title}</span>
                        <span className="text-[10px] text-slate-500">{s.desc}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${bookSlotType === s.id ? 'border-cyan-600 bg-cyan-600' : 'border-slate-300'}`}>
                        {bookSlotType === s.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setBookStep(1)}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleGetQuote}
                  className="flex-1 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md shadow-cyan-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Fetch Fair-Price Quote</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Fair Price Breakdown */}
          {bookStep === 3 && bookQuote && (
            <div className="space-y-5 max-w-xl">
              <PriceBreakdown price={bookQuote} volumeL={bookVolume} purpose={bookPurpose} />

              <div className="flex gap-2">
                <button
                  onClick={() => setBookStep(2)}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setBookStep(4)}
                  className="flex-1 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md shadow-cyan-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Escrow Checkout</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Escrow Payment */}
          {bookStep === 4 && bookQuote && (
            <div className="space-y-5 max-w-xl">
              <UpiQrPaymentCard
                amountPaise={bookQuote.total}
                volumeL={bookVolume}
                purpose={bookPurpose}
                orderId="AQUA-RES-9481"
                onPaySuccess={handleConfirmBooking}
                isSubmitting={isBookingSubmitting}
              />
            </div>
          )}

          {/* Step 5: Confirmed */}
          {bookStep === 5 && (
            <div className="p-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Water Tanker Dispatched! 🚰
              </h3>
              <p className="text-xs text-slate-500">
                Payment held securely in AquaFlow escrow. Funds will only be released to the driver upon your dynamic 30-second PoD QR scan at your doorstep.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setActiveTab('radar')}
                  className="px-5 py-2.5 rounded-2xl bg-cyan-600 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Track on Live Radar →
                </button>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. SUB-VIEW: LIVE TANKER RADAR (CORRIDOR MAP)                  */}
      {/* ============================================================== */}
      {activeTab === 'radar' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-sky-100 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black">
                <Navigation size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Pune Municipal Live Tanker Radar
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time GPS telemetry from certified filling stations to Baner delivery point
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

          <div className="relative rounded-2xl overflow-hidden border border-slate-200">
            <LeafletMap
              center={[18.535, 73.805]}
              zoom={13}
              className="h-96 sm:h-[450px] w-full"
              markers={[
                {
                  id: 'truck-main',
                  lat: 18.535,
                  lng: 73.805,
                  title: 'Tanker MH-12 AB 4821',
                  type: 'truck',
                  etaMin: 22,
                  subLabel: 'MH-12 AB 4821',
                  popupContent: 'Driver: Santosh Jadhav • PMC Parvati Source Verified • Speed: 28 km/h',
                },
                {
                  id: 'source-pune',
                  lat: 18.4985,
                  lng: 73.8475,
                  title: 'PMC Parvati Water Works',
                  type: 'source',
                  popupContent: 'PMC Licensed Water Filling Station',
                },
                {
                  id: 'dest-baner',
                  lat: 18.552,
                  lng: 73.788,
                  title: 'Baner Sector 9 Delivery',
                  type: 'delivery',
                  popupContent: 'Your Verified Delivery Address',
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
      )}

      {/* ============================================================== */}
      {/* 5. SUB-VIEW: MUNICIPAL SUPPLY & OUTAGES                        */}
      {/* ============================================================== */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-sky-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black">
                <Calendar size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Municipal Water Supply & Scheduled Outages
                </h2>
                <p className="text-xs text-slate-500">
                  Official PMC timetables and crowd-verified neighborhood tap status
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl border border-sky-100 bg-sky-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{item.type.toUpperCase()} Notice</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                    {item.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{item.message.en}</p>
                <div className="text-[11px] text-slate-400 font-medium">
                  Window: {format(new Date(item.startsAt), 'HH:mm')} – {format(new Date(item.endsAt), 'HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. SUB-VIEW: COMMUNITY POOLS                                  */}
      {/* ============================================================== */}
      {activeTab === 'pool' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-sky-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Neighborhood Water Pooling
                </h2>
                <p className="text-xs text-slate-500">
                  Split large 10kL or 20kL tankers with neighbors to save up to 40% on delivery costs
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pools.map((p) => {
              const filledL = p.members.reduce((acc, m) => acc + m.litres, 0);
              return (
                <div key={p.id} className="p-4 rounded-2xl border border-sky-100 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{p.dropPoint.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {p.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Filled: {filledL.toLocaleString()} L</span>
                      <span>Target: {p.targetL.toLocaleString()} L</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-cyan-600 rounded-full"
                        style={{ width: `${Math.min(100, (filledL / p.targetL) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => alert(`Joined pool! Your share: 1,500 L reserved.`)}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Join This Tanker Pool
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. SUB-VIEW: ORDER HISTORY & TAX INVOICES                      */}
      {/* ============================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-sky-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Order History & GST Tax Invoices
                </h2>
                <p className="text-xs text-slate-500">
                  Every tanker transaction protected by AquaFlow escrow with instant tax receipts
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {allBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{b.id}</td>
                    <td className="py-3 px-3">
                      {b.timeline && b.timeline.length > 0 && b.timeline[0].ts
                        ? format(new Date(b.timeline[0].ts), 'dd MMM yyyy, HH:mm')
                        : 'Today'}
                    </td>
                    <td className="py-3 px-3">{b.volumeL.toLocaleString()} L</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{formatINR(b.price.total)}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        b.status === 'DELIVERED' || b.status === 'SETTLED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-cyan-50 text-cyan-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setShowReceiptBooking(b)}
                        className="text-xs font-bold text-cyan-700 hover:underline cursor-pointer"
                      >
                        Receipt 🧾
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS: Next Supply Details, Conservation Tips, Call Driver   */}
      {/* ============================================================== */}
      {/* 1. Next Supply Details Modal */}
      {showSupplyDetailsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-sky-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Droplets className="w-5 h-5 text-cyan-600" />
                <span>Municipal Water Supply Schedule</span>
              </div>
              <button
                onClick={() => setShowSupplyDetailsModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-100 space-y-2 text-xs">
              <div className="font-bold text-slate-900">Today's Evening Window: 6:00 PM – 8:30 PM</div>
              <p className="text-slate-600">
                Pumping from Parvati Water Works to Baner reservoir is confirmed at normal pressure (2.8 bar). Expected flow duration is 2.5 hours.
              </p>
              <div className="text-[11px] font-bold text-cyan-800">
                Tip: Keep your society sump inlet valve open before 5:45 PM.
              </div>
            </div>

            <button
              onClick={() => setShowSupplyDetailsModal(false)}
              className="w-full py-2.5 rounded-2xl bg-cyan-600 text-white font-black text-xs cursor-pointer hover:bg-cyan-700"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* 2. Conservation Tips Modal */}
      {showConservationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-sky-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>Save Water, Save Life ♡</span>
              </div>
              <button
                onClick={() => setShowConservationModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100">
                <span className="font-bold text-slate-900 block mb-1">🌱 Aerators & Pressure Regulators</span>
                Install 3 LPM tap aerators to reduce domestic sink water wastage by 40% without losing pressure.
              </div>
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-100">
                <span className="font-bold text-slate-900 block mb-1">🌧️ PMC Rainwater Harvesting Rebate</span>
                Pune Municipal Corporation offers a 5% to 10% property tax rebate for societies with functional RWH pits.
              </div>
            </div>

            <button
              onClick={() => setShowConservationModal(false)}
              className="w-full py-2.5 rounded-2xl bg-cyan-600 text-white font-black text-xs cursor-pointer hover:bg-cyan-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 3. Call Driver Modal */}
      {showCallDriverModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-sky-100 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto">
              <Phone size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Calling Driver Rohit S.</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tanker MH-12 AB 4821</p>
              <div className="mt-2 text-base font-mono font-black text-cyan-800">+91 98231 44210</div>
            </div>
            <p className="text-[11px] text-slate-400">
              For safety while driving, please keep calls brief.
            </p>
            <button
              onClick={() => setShowCallDriverModal(false)}
              className="w-full py-2.5 rounded-2xl bg-slate-900 text-white font-black text-xs cursor-pointer"
            >
              End Call Simulation
            </button>
          </div>
        </div>
      )}

      {/* 4. Report Leak Modal */}
      {showReportLeakModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-sky-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Report Water Leakage / Low Pressure</span>
              </div>
              <button
                onClick={() => setShowReportLeakModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              value={leakText}
              onChange={(e) => setLeakText(e.target.value)}
              placeholder="Describe the leak location, pipeline burst, or tap problem..."
              className="w-full h-28 p-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:border-cyan-500 resize-none"
            />

            <button
              onClick={handleSubmitLeakReport}
              disabled={isSubmittingLeak || !leakText.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmittingLeak ? 'Submitting with AI Triage...' : 'Submit Grievance to PMC SLA Desk'}
            </button>
          </div>
        </div>
      )}

      {/* 5. Wallet Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-sky-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Wallet className="w-5 h-5 text-teal-600" />
                <span>Top Up AquaFlow Wallet</span>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Add funds for 1-click escrow tanker orders and fair-capped dispatches.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                    topUpAmount === amt
                      ? 'bg-teal-50 border-teal-500 text-teal-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleTopUpWallet}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-teal-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard size={15} />
              <span>Simulate Instant UPI Credit (₹{topUpAmount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptBooking && (
        <ReceiptModal
          booking={showReceiptBooking}
          onClose={() => setShowReceiptBooking(null)}
        />
      )}
    </div>
  );
};
