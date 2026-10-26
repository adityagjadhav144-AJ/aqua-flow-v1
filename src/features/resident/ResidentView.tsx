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
import { AquaBotModal } from '../../components/common/AquaBotModal';
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
  User as UserIcon,
  Sparkles,
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
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const ResidentView: React.FC = () => {
  const { currentUser, currentLanguage, t, toggleAquaBot } = useAppStore();
  const [activeTab, setActiveTab] = useState<'home' | 'book' | 'schedule' | 'pool' | 'orders'>('home');
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

  // Complaint State
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [isTriaging, setIsTriaging] = useState(false);

  // Wallet Top-up
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(1000);

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
        countdown--;
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
  }, [activeBooking?.id, activeBooking?.status]);

  // Fetch price quote whenever booking params change
  useEffect(() => {
    const fetchQuote = async () => {
      const res = await mockApi.quoteBooking({
        volumeL: bookVolume,
        purpose: bookPurpose,
        distanceKm: 5.2,
        slotType: bookSlotType,
        demandIndex: 1.1,
      });
      setBookQuote(res);

      const vendors = await mockApi.getMatchingVendors(bookVolume, 18.5592, 73.7868);
      setMatchingVendors(vendors);
    };
    fetchQuote();
  }, [bookVolume, bookPurpose, bookSlotType]);

  // Quick Action for Water Running
  const handleReportWaterRunning = async (type: 'water_running' | 'water_stopped' | 'low_pressure') => {
    await mockApi.createCrowdReport({
      userId: currentUser.id,
      userName: currentUser.name,
      lat: 18.5592,
      lng: 73.7868,
      zoneId: 'z2',
      type,
    });
    alert(t('water_running_reported'));
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

  // Handle AquaBot auto-filling booking form
  const handlePreFillBooking = (params: { volumeL?: number; purpose?: 'general' | 'drinking' }) => {
    if (params.volumeL) setBookVolume(params.volumeL);
    if (params.purpose) setBookPurpose(params.purpose);
    setActiveTab('book');
    setBookStep(2);
  };

  // Handle complaint triage & submission
  const handleSubmitComplaint = async () => {
    if (!complaintText.trim()) return;
    setIsTriaging(true);
    try {
      const triage = await triageComplaintText(complaintText);
      await mockApi.createComplaint({
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        zoneId: 'z2',
        category: triage.category,
        urgency: triage.urgency,
        text: complaintText,
      });
      alert(`Complaint logged under category: ${triage.category.toUpperCase()} (Urgency: ${triage.urgency.toUpperCase()}). Support dispatched.`);
      setComplaintText('');
      setShowComplaintModal(false);
      refreshData();
    } finally {
      setIsTriaging(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6 select-none text-slate-800">
      {/* Website Citizen Sub-Header Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-cyan-600/20">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                Namaskar, {currentUser.name}
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                Baner • Zone 2 (PMC)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              3-Person Household • {currentUser.addresses[0]?.line}
            </p>
          </div>
        </div>

        {/* Citizen Financial & Trust Badges */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-200 flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-semibold">Wallet:</span>
            <span className="text-sm font-black text-slate-900">
              {formatINR(currentUser.walletPaise)}
            </span>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="text-[10px] font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              + Top Up
            </button>
          </div>

          <div className="bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-200 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Trust Score {currentUser.trustScore}/100</span>
          </div>

          <button
            onClick={toggleAquaBot}
            className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:brightness-105 text-white px-3.5 py-1.5 rounded-2xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Ask AquaBot AI</span>
          </button>
        </div>
      </div>

      {/* Website Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 scrollbar-none">
        {[
          { id: 'home', label: currentLanguage === 'mr' ? 'मुख्यपृष्ठ व थेट टँकर रडार' : 'Home & Live Tanker Radar', icon: Home },
          { id: 'book', label: t('book_tanker'), icon: Droplets },
          { id: 'schedule', label: currentLanguage === 'mr' ? 'मनपा पाणीपुरवठा वेळापत्रक' : 'Municipal Supply & Outages', icon: Calendar },
          { id: 'pool', label: t('community_pools'), icon: Users },
          { id: 'orders', label: currentLanguage === 'mr' ? 'ऑर्डर इतिहास आणि पावती' : 'Order History & Tax Invoices', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white text-cyan-950 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-cyan-600' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: WEBSITE HOME & LIVE TANKER RADAR (2-COLUMN DASHBOARD) */}
      {/* ============================================================== */}
      {activeTab === 'home' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Main Column (8/12 on desktop): Live Tanker Map & Supply */}
          <div className="lg:col-span-8 space-y-6">
            {/* Real-Time Live Tanker Tracking Card (Full Website Map Radar) */}
            {activeBooking ? (
              <div className="bg-white rounded-3xl p-5 border border-cyan-200 shadow-md shadow-cyan-950/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          {currentLanguage === 'mr' ? 'थेट टँकर वितरण सुरू आहे' : 'Active Tanker Delivery in Progress'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-900 font-bold border border-cyan-200">
                          {activeBooking.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {currentLanguage === 'mr'
                          ? 'वाहन MH-12 AB 4821 • श्री गणेश वॉटर सप्लायर्स (संतोष जाधव)'
                          : 'Vehicle MH-12 AB 4821 • Shree Ganesh Water Suppliers (Santosh Jadhav)'}
                      </p>
                    </div>
                  </div>

                  {/* Prominent Live ETA Badge */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-base font-black text-cyan-900 flex items-center gap-1.5 justify-end">
                        <Clock size={16} className="text-cyan-600 animate-pulse" />
                        <span>
                          {activeBooking.status === 'ARRIVED'
                            ? (currentLanguage === 'mr' ? 'टँकर गेटवर पोहोचला! 🚰' : 'Arrived at Gate! 🚰')
                            : (currentLanguage === 'mr' ? `ETA: ${activeBooking.etaMin} मिनिटे अंतर` : `ETA: ${activeBooking.etaMin} mins away`)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {activeBooking.status === 'ARRIVED'
                          ? (currentLanguage === 'mr' ? 'QR पडताळणीसाठी तयार' : 'Ready for QR Verification')
                          : (currentLanguage === 'mr' ? 'थेट GPS ट्रॅकिंग (२४ किमी/तास)' : 'Live GPS Telemetry (24 km/h)')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wide Real-Time Leaflet Tracking Map */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner">
                  <LeafletMap
                    center={[activeBooking.currentLat || 18.535, activeBooking.currentLng || 73.805]}
                    zoom={13}
                    className="h-60 sm:h-80 lg:h-96 w-full"
                    markers={[
                      {
                        id: 'truck',
                        lat: activeBooking.currentLat || 18.535,
                        lng: activeBooking.currentLng || 73.805,
                        title: currentLanguage === 'mr' ? 'थेट पाणी टँकर (MH-12 AB 4821)' : 'Live Water Tanker (MH-12 AB 4821)',
                        type: 'truck',
                        etaMin: activeBooking.etaMin,
                        subLabel: 'MH-12 AB 4821',
                        popupContent: `Driver: Santosh Jadhav • Speed: 24 km/h • ETA: ${
                          activeBooking.etaMin > 0 ? `${activeBooking.etaMin} mins` : 'Arrived at Gate'
                        }`,
                      },
                      {
                        id: 'source',
                        lat: 18.4985,
                        lng: 73.8475,
                        title: currentLanguage === 'mr' ? 'पर्वती मनपा जलकेंद्र' : 'PMC Parvati Water Station',
                        type: 'source',
                        popupContent: 'Water filling station • Certificate PMC-WTR-2026-PARV-094',
                      },
                      {
                        id: 'delivery',
                        lat: activeBooking.lat,
                        lng: activeBooking.lng,
                        title: currentLanguage === 'mr' ? 'माझे घर (बाणेर)' : 'My House Delivery Point (Baner)',
                        type: 'delivery',
                        popupContent: `${activeBooking.address.line} • 100% Escrow Protected`,
                      },
                    ]}
                    routePolyline={[
                      [18.4985, 73.8475],
                      [18.515, 73.825],
                      [activeBooking.currentLat || 18.535, activeBooking.currentLng || 73.805],
                      [18.545, 73.798],
                      [activeBooking.lat, activeBooking.lng],
                    ]}
                  />

                  {/* Map Telemetry Badges */}
                  <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-1.5 shadow-md">
                    <Navigation size={13} className="text-cyan-400 animate-spin" />
                    <span>{currentLanguage === 'mr' ? 'थेट GPS ट्रॅकिंग सुरू' : 'Real-Time GPS Tracking Active'}</span>
                  </div>

                  <button
                    onClick={() => {
                      setTrackingBooking(activeBooking);
                      setShowTrackingModal(true);
                    }}
                    className="absolute top-3 right-3 z-10 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 shadow-md backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Compass size={14} className="text-cyan-600" />
                    <span>{currentLanguage === 'mr' ? 'टेलिमॅटिक्स डेस्क ↗' : 'Open Telematics Desk ↗'}</span>
                  </button>

                  {/* Bottom Map Info Strip */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-black">
                        <Truck size={18} />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900">
                          {activeBooking.volumeL.toLocaleString('en-IN')} L {currentLanguage === 'mr' ? 'टँकर • मनपा प्रमाणित' : 'Tanker • PMC Certified'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {currentLanguage === 'mr' ? 'स्रोत: पर्वती मनपा जलकेंद्र (आज सकाळी ६:४२ पडताळणी)' : 'Source: PMC Parvati Filling Station (Verified Today 6:42 AM)'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeBooking.status === 'ARRIVED' ? (
                        <button
                          onClick={() => setShowQrModal(true)}
                          className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white rounded-xl text-xs font-extrabold shadow-md animate-pulse cursor-pointer flex items-center gap-1.5"
                        >
                          <QRCodeSVG value="qr" size={14} className="inline opacity-0 w-0" />
                          <span>{currentLanguage === 'mr' ? 'डिलिव्हरी QR दाखवा 📱' : 'Show Dynamic Delivery QR 📱'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setTrackingBooking(activeBooking);
                            setShowTrackingModal(true);
                          }}
                          className="py-2 px-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <span>{currentLanguage === 'mr' ? 'सविस्तर ETA रडार' : 'Detailed ETA Radar'}</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback Live Corridor Radar Map when no booking is currently in transit */
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                      <span className="text-sm font-black text-slate-900">
                        {currentLanguage === 'mr' ? 'पुणे थेट टँकर कॉरिडोअर रडार' : 'Pune Live Tanker Corridor Radar'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {currentLanguage === 'mr' ? '८ टँकर सेवेत' : '8 Tankers Active'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentLanguage === 'mr'
                        ? 'पर्वती जलकेंद्र, कात्रज आणि वारजे कॉरिडोअर थेट जीपीएस ट्रॅकिंग'
                        : 'Live GPS monitoring across Parvati, Katraj, and Warje water corridors'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const demoBk = allBookings[0];
                      if (demoBk) {
                        setTrackingBooking(demoBk);
                        setShowTrackingModal(true);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Compass size={14} className="text-cyan-600" />
                    <span>{currentLanguage === 'mr' ? 'थेट टेलिमॅटिक्स पहा' : 'View Live Telematics'}</span>
                  </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner">
                  <LeafletMap
                    center={[18.535, 73.805]}
                    zoom={12}
                    className="h-60 sm:h-80 lg:h-96 w-full"
                    markers={[
                      {
                        id: 'truck-1',
                        lat: 18.535,
                        lng: 73.805,
                        title: 'Santosh Jadhav (MH-12 AB 4821)',
                        type: 'truck',
                        etaMin: 14,
                        subLabel: 'Baner Corridor',
                        popupContent: 'Water Tanker en route to Baner • ETA: 14 mins • 24 km/h',
                      },
                      {
                        id: 'truck-2',
                        lat: 18.562,
                        lng: 73.785,
                        title: 'Suresh Mane (MH-12 CD 3390)',
                        type: 'truck',
                        etaMin: 28,
                        subLabel: 'Aundh Corridor',
                        popupContent: 'Delivering to Aundh • 10,000 L',
                      },
                      {
                        id: 'source-1',
                        lat: 18.4985,
                        lng: 73.8475,
                        title: 'PMC Parvati Water Station',
                        type: 'source',
                        popupContent: 'Major PMC Municipal filling hub • Quality audit verified',
                      },
                      {
                        id: 'source-2',
                        lat: 18.455,
                        lng: 73.861,
                        title: 'Katraj Spring & Borewell Cluster',
                        type: 'source',
                        popupContent: 'Certified private spring station',
                      },
                    ]}
                    routePolyline={[
                      [18.4985, 73.8475],
                      [18.515, 73.825],
                      [18.535, 73.805],
                      [18.5592, 73.7868],
                    ]}
                  />

                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 z-10 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl shadow-lg border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-900 block text-xs sm:text-sm">
                        {currentLanguage === 'mr' ? 'तुमच्या पत्त्यावर टँकर हवा आहे?' : 'Need a water tanker at your address?'}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500">
                        {currentLanguage === 'mr' ? 'वाजवी दर मर्यादा आणि थेट ट्रॅकिंगसह त्वरित बुक करा' : 'Instant auto-match with Fair-Price Cap protection'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('book');
                        setBookStep(1);
                      }}
                      className="py-1.5 sm:py-2 px-3 sm:px-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0 w-full sm:w-auto justify-center"
                    >
                      <span>{t('book_tanker')}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Municipal Tap Water Supply Window Card */}
            <div className="bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-cyan-950/20 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-6 -translate-y-6">
                <Droplets size={220} />
              </div>
              <div className="flex items-center justify-between text-xs text-cyan-300 mb-2">
                <span className="font-extrabold flex items-center gap-2 text-sm text-cyan-200">
                  <Clock size={16} />
                  <span>Next Municipal Tap Water Supply (PMC Parvati Feeder)</span>
                </span>
                <span className="text-[11px] bg-cyan-800/60 px-3 py-1 rounded-full text-cyan-200 border border-cyan-700 font-bold">
                  Baner Ward 2
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white my-2">
                Today, 6:00 PM – 8:30 PM (Evening Window)
              </div>
              <p className="text-xs text-cyan-100/80 mb-4 max-w-xl leading-relaxed">
                PMC water supply scheduled for Baner, Aundh and Balewadi. Normal pressure anticipated. An in-app push alert will be sent 30 minutes before valve opening.
              </p>
              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-cyan-800/50 gap-2">
                <button
                  onClick={() => alert('Reminder set! You will receive an SMS and push notification 30 minutes prior.')}
                  className="py-2 px-3.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-cyan-400/30"
                >
                  <Bell size={14} />
                  <span>Set 30-min Push Reminder</span>
                </button>
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Conduit Pressure: 3.2 bar (Normal)</span>
                </div>
              </div>
            </div>

            {/* Fair-Price Cap Protection Explainer Banner */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <ShieldCheck size={18} className="text-cyan-600" />
                  <span>How AquaFlow Fair-Price Cap Protects Pune Citizens</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Govt Pegged ₹0.09/L
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                During Pune's summer water stress, private operators frequently charge ₹2,500 – ₹3,000 for a 10,000 L tanker. AquaFlow mathematically enforces a strict <strong className="text-slate-900">1.25x maximum demand cap</strong>, saving Baner households over ₹1,200 per order while guaranteeing certified water source audits.
              </p>
            </div>
          </div>

          {/* Right Column (4/12 on desktop): Quick Actions, Crowd Reports, Pools */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Tanker Booking Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">Book a Tanker Now</h3>
                <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-md">
                  Instant Auto-Match
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose quantity to preview fair-capped pricing with certified source delivery:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[5000, 10000].map((vol) => (
                  <button
                    key={vol}
                    onClick={() => {
                      setBookVolume(vol);
                      setActiveTab('book');
                      setBookStep(2);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-cyan-600 hover:bg-cyan-50/50 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-sm font-black text-slate-900 group-hover:text-cyan-900">
                      {vol.toLocaleString('en-IN')} L
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {vol === 5000 ? 'Wing size' : 'Full tanker'}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setActiveTab('book');
                  setBookStep(1);
                }}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Open Tanker Booking Flow</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Crowd Water Running Reporting Widget */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900 text-sm">
                  {t('water_running_prompt')}
                </span>
                <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-md">
                  Live Feed
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tap to notify neighbours within 500m of your street:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleReportWaterRunning('water_running')}
                  className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold text-center border border-emerald-200 transition-colors cursor-pointer"
                >
                  💧 Running!
                </button>
                <button
                  onClick={() => handleReportWaterRunning('low_pressure')}
                  className="py-2.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold text-center border border-amber-200 transition-colors cursor-pointer"
                >
                  ⚡ Low Pressure
                </button>
                <button
                  onClick={() => handleReportWaterRunning('water_stopped')}
                  className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold text-center border border-rose-200 transition-colors cursor-pointer"
                >
                  🚫 Stopped
                </button>
              </div>

              {/* Recent Crowd Reports Feed */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Recent Neighbour Reports (Baner 500m):
                </span>
                <div className="space-y-1.5">
                  {crowdReports.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span>{r.type === 'water_running' ? '💧' : r.type === 'low_pressure' ? '⚡' : '🚫'}</span>
                        <div>
                          <div className="font-bold text-slate-800">{r.userName}</div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {r.type.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {r.confirmations} confirmed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Nearest Community Water Pool */}
            {pools.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900">Nearby Water Pool</h3>
                  <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                    Volume Discount Active
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-semibold">
                  {pools[0].dropPoint.label}
                </div>
                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Target Volume</span>
                    <span className="font-bold text-slate-900">
                      {pools[0].members.reduce((s, m) => s + m.litres, 0).toLocaleString('en-IN')} /{' '}
                      {pools[0].targetL.toLocaleString('en-IN')} L
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (pools[0].members.reduce((s, m) => s + m.litres, 0) / pools[0].targetL) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('pool')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  View All Community Pools ↗
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: BOOK TANKER (FULL WEBSITE 2-COLUMN WIZARD) */}
      {/* ============================================================== */}
      {activeTab === 'book' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('book_tanker')}</h2>
              <p className="text-xs text-slate-500">
                Direct auto-matching with Pune municipal certified fleets and Fair-Price Cap protection
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                    bookStep === s
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : bookStep > s
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {bookStep > s ? '✓' : s}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Step Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Volume & Purpose */}
              {bookStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      1. Select Tanker Capacity
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[1000, 3000, 5000, 10000, 12000].map((vol) => (
                        <button
                          key={vol}
                          onClick={() => setBookVolume(vol)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            bookVolume === vol
                              ? 'border-cyan-600 bg-cyan-50 text-cyan-950 ring-2 ring-cyan-200 font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="text-base font-black">{vol.toLocaleString('en-IN')} L</div>
                          <div className="text-[11px] text-slate-500">
                            {vol === 1000 ? 'Small Tank' : vol === 5000 ? 'Society Wing' : vol === 10000 ? 'Standard Tanker' : 'Bulk Society'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      2. Water Quality Specification
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setBookPurpose('general')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          bookPurpose === 'general'
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="text-sm font-extrabold">{t('purpose_general')}</div>
                        <div className="text-xs text-slate-500 mt-0.5">₹0.09 / Litre Base (PMC Parvati Point)</div>
                      </button>

                      <button
                        onClick={() => setBookPurpose('drinking')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          bookPurpose === 'drinking'
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="text-sm font-extrabold">{t('purpose_drinking')}</div>
                        <div className="text-xs text-slate-500 mt-0.5">₹0.30 / Litre Base (FDA Tested RO)</div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setBookStep(2)}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Proceed to Delivery Slot</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* Step 2: Slot Selection */}
              {bookStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Select Delivery Window
                    </label>
                    <div className="space-y-2.5">
                      <button
                        onClick={() => setBookSlotType('express')}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer ${
                          bookSlotType === 'express'
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-950 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-black">{t('slot_express')}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Priority dispatch within 120 minutes (+15%)</div>
                        </div>
                        <span className="text-xs font-black text-cyan-800 bg-cyan-100 px-2.5 py-1 rounded-md">
                          Fastest
                        </span>
                      </button>

                      <button
                        onClick={() => setBookSlotType('today')}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer ${
                          bookSlotType === 'today'
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-950 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-black">{t('slot_standard')} (10:00 AM – 12:00 PM)</div>
                          <div className="text-xs text-slate-500 mt-0.5">Standard 2-hour window (1.00x)</div>
                        </div>
                        <span className="text-xs font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                          Standard
                        </span>
                      </button>

                      <button
                        onClick={() => setBookSlotType('scheduled')}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer ${
                          bookSlotType === 'scheduled'
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-950 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-black">Tomorrow Morning (06:00 AM – 08:00 AM)</div>
                          <div className="text-xs text-slate-500 mt-0.5">Advance schedule up to 14 days</div>
                        </div>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                          Off-Peak
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setBookStep(1)}
                      className="py-3 px-5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setBookStep(3)}
                      className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <span>Review Fleet Matching</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Vendor Matching Selection */}
              {bookStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Auto-Matched Certified Fleet
                    </label>

                    {matchingVendors.map((cand, idx) => (
                      <button
                        key={cand.vendor.id}
                        onClick={() => setSelectedVendorIdx(idx)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                          selectedVendorIdx === idx
                            ? 'border-cyan-600 bg-cyan-50/70 text-cyan-950 ring-2 ring-cyan-200 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-black text-sm text-slate-900">{cand.vendor.name}</div>
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {cand.vendor.rating} ★ ({cand.vendor.onTimePct}% on-time)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{cand.whyThisVendor}</p>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setBookStep(2)}
                      className="py-3 px-5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setBookStep(4)}
                      className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <span>Proceed to Escrow Payment</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Pay & Escrow Protection */}
              {bookStep === 4 && bookQuote && (
                <div className="space-y-5">
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
                      <ShieldCheck size={18} className="text-emerald-700" />
                      <span>100% Escrow Protection Policy</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {t('escrow_notice')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Select Payment Mode
                    </label>

                    {/* Payment Mode Selector */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPayMode('upi_qr')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          payMode === 'upi_qr'
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-950 font-black ring-2 ring-cyan-200'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold'
                        }`}
                      >
                        <QrCode size={18} className={payMode === 'upi_qr' ? 'text-cyan-700' : 'text-slate-400'} />
                        <span className="text-xs">Dynamic UPI QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayMode('upi_vpa')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          payMode === 'upi_vpa'
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-950 font-black ring-2 ring-cyan-200'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold'
                        }`}
                      >
                        <Smartphone size={18} className={payMode === 'upi_vpa' ? 'text-cyan-700' : 'text-slate-400'} />
                        <span className="text-xs">UPI ID / VPA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayMode('wallet')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          payMode === 'wallet'
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-950 font-black ring-2 ring-cyan-200'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold'
                        }`}
                      >
                        <Wallet size={18} className={payMode === 'wallet' ? 'text-cyan-700' : 'text-slate-400'} />
                        <span className="text-xs">Citizen Wallet</span>
                      </button>
                    </div>

                    {/* Mode 1: Dynamic UPI QR */}
                    {payMode === 'upi_qr' && (
                      <div className="pt-2">
                        <UpiQrPaymentCard
                          amountPaise={bookQuote.price.total}
                          volumeL={bookVolume}
                          purpose={bookPurpose}
                          onPaySuccess={handleConfirmBooking}
                          isSubmitting={isBookingSubmitting}
                        />
                      </div>
                    )}

                    {/* Mode 2: UPI ID (VPA) input */}
                    {payMode === 'upi_vpa' && (
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                        <label className="text-xs font-bold text-slate-700">Enter your UPI ID / VPA</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={vpaInput}
                            onChange={(e) => setVpaInput(e.target.value)}
                            placeholder="username@okaxis / gpay"
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-cyan-600"
                          />
                          <button
                            type="button"
                            onClick={handleConfirmBooking}
                            disabled={isBookingSubmitting || !vpaInput.trim()}
                            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            Verify & Pay
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          A payment collect request of {formatINR(bookQuote.price.total)} will be sent to your UPI app.
                        </p>
                      </div>
                    )}

                    {/* Mode 3: Citizen Wallet */}
                    {payMode === 'wallet' && (
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-medium">Available Balance:</span>
                          <span className="text-sm font-black text-slate-900">{formatINR(currentUser.walletPaise)}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Funds will be held in AquaFlow Escrow until digital PoD verification.
                        </p>
                        <button
                          type="button"
                          onClick={handleConfirmBooking}
                          disabled={isBookingSubmitting}
                          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                        >
                          Deduct {formatINR(bookQuote.price.total)} from Wallet
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setBookStep(3)}
                      className="py-3 px-5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Confirmed */}
              {bookStep === 5 && bookingConfirmedObj && (
                <div className="bg-white rounded-3xl p-8 text-center space-y-4 border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{t('booking_confirmed')}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">Order ID: {bookingConfirmedObj.id}</p>
                  </div>

                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    Your {bookingConfirmedObj.volumeL.toLocaleString('en-IN')} L tanker has been matched to Shree Ganesh Water Suppliers. Driver Santosh Jadhav is en route to PMC Parvati station.
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setTrackingBooking(bookingConfirmedObj);
                        setShowTrackingModal(true);
                        setActiveTab('home');
                      }}
                      className="py-3 px-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:brightness-105 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Navigation size={15} />
                      <span>Track Tanker Live on Map (Real-Time ETA)</span>
                    </button>

                    <button
                      onClick={() => {
                        setBookStep(1);
                        setActiveTab('home');
                      }}
                      className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs cursor-pointer"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 Columns: Sticky Order Summary & Price Breakdown with Pay via UPI/QR */}
            <div className="lg:col-span-5 sticky top-24 space-y-4">
              {bookQuote ? (
                <>
                  <PriceBreakdown
                    price={bookQuote.price}
                    volumeL={bookVolume}
                    purpose={bookPurpose}
                    onPayViaUpi={() => setBookStep(4)}
                  />

                  {/* Feature: Pay via UPI/QR within ResidentView Order Summary */}
                  <UpiQrPaymentCard
                    amountPaise={bookQuote.price.total}
                    volumeL={bookVolume}
                    purpose={bookPurpose}
                    onPaySuccess={handleConfirmBooking}
                    isSubmitting={isBookingSubmitting}
                  />
                </>
              ) : (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
                  Calculating Fair-Price Cap quote...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MUNICIPAL SCHEDULE & OUTAGES */}
      {/* ============================================================== */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Left Column: Schedule Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Pune Municipal Water Timetable & Network Alerts
                </h2>
                <p className="text-xs text-slate-500">Zone 2: Baner, Aundh, Balewadi & Pashan</p>
              </div>
              <span className="text-xs font-bold bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full">
                PMC Water Dept
              </span>
            </div>

            <div className="space-y-3">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-3xl border shadow-xs space-y-2.5 ${
                    s.type === 'supply'
                      ? 'bg-white border-cyan-100'
                      : s.type === 'outage'
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                        s.type === 'supply'
                          ? 'bg-cyan-100 text-cyan-800'
                          : s.type === 'outage'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {format(new Date(s.startsAt), 'dd MMM yyyy, hh:mm a')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    {currentLanguage === 'mr'
                      ? s.message.mr
                      : currentLanguage === 'hi'
                      ? s.message.hi
                      : s.message.en}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span>Broadcast by: {s.createdBy}</span>
                    <span className="font-medium text-cyan-700">14,200 Citizens Notified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Zone 2 Map */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900">Zone 2 Distribution Network Map</h3>
              <LeafletMap
                center={[18.559, 73.787]}
                zoom={13}
                className="h-60 sm:h-72 lg:h-80 w-full rounded-2xl overflow-hidden"
                markers={[
                  { id: 'm1', lat: 18.559, lng: 73.787, title: 'Baner Ward Center', type: 'source' },
                  { id: 'm2', lat: 18.498, lng: 73.847, title: 'PMC Parvati Pump Station', type: 'source' },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: COMMUNITY POOLING (3-COLUMN WEBSITE GRID) */}
      {/* ============================================================== */}
      {activeTab === 'pool' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-gradient-to-r from-teal-800 via-cyan-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-extrabold text-cyan-300 tracking-wider">
                Neighbourhood Demand Aggregation
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Community Water Pools</h2>
              <p className="text-xs text-cyan-100/80 mt-1 max-w-xl">
                Combine orders with neighbours within 1 km to unlock volume discounts of up to 12%. Single drop point with proportional cost splits.
              </p>
            </div>

            <button
              onClick={() => setShowCreatePoolModal(true)}
              className="py-3 px-5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Create New Community Pool</span>
            </button>
          </div>

          {/* 3-Column Pools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((p) => {
              const committed = p.members.reduce((sum, m) => sum + m.litres, 0);
              const pct = Math.min(100, Math.round((committed / p.targetL) * 100));
              const shareLink = generateWhatsAppShareLink(p);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                        {p.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {p.members.length} Households
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {p.dropPoint.label}
                    </h3>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Volume Committed</span>
                      <span className="font-bold text-cyan-900">
                        {committed.toLocaleString('en-IN')} / {p.targetL.toLocaleString('en-IN')} L ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <a
                      href={shareLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200"
                    >
                      <Share2 size={13} />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      onClick={async () => {
                        await mockApi.joinPool(p.id, 1000, currentUser.id, currentUser.name);
                        refreshData();
                        alert('Joined pool with 1,000 Litres! Proportional share updated.');
                      }}
                      className="text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      Join (+1,000 L)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: ORDERS, TAX INVOICES & COMPLAINTS */}
      {/* ============================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Order History, Proof of Delivery & Digital Tax Invoices
              </h2>
              <p className="text-xs text-slate-500">
                Audit trail with SHA-256 cryptographic verification hashes and water source certificates
              </p>
            </div>

            <button
              onClick={() => setShowComplaintModal(true)}
              className="py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <AlertTriangle size={15} />
              <span>Raise Tanker / Quality Complaint</span>
            </button>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Volume & Quality</th>
                    <th className="p-4">Delivery Address</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allBookings.slice(0, 10).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">{b.id}</td>
                      <td className="p-4 text-slate-500">
                        {format(new Date(b.timeline[0]?.ts || Date.now()), 'dd MMM yyyy, hh:mm a')}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {b.volumeL.toLocaleString('en-IN')} L • {b.purpose}
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">{b.address.line}</td>
                      <td className="p-4 font-extrabold text-slate-900">{formatINR(b.price.total)}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            b.status === 'SETTLED' || b.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'EN_ROUTE'
                              ? 'bg-cyan-100 text-cyan-800 animate-pulse'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {b.status !== 'DELIVERED' && b.status !== 'SETTLED' && b.status !== 'CANCELLED' ? (
                          <button
                            onClick={() => {
                              setTrackingBooking(b);
                              setShowTrackingModal(true);
                            }}
                            className="py-1.5 px-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Navigation size={12} />
                            <span>Live Track</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setTrackingBooking(b);
                                setShowTrackingModal(true);
                              }}
                              className="py-1.5 px-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-xl font-bold text-xs inline-flex items-center gap-1 cursor-pointer border border-cyan-200"
                              title="View delivery route and source certification"
                            >
                              <Navigation size={11} className="text-cyan-600" />
                              <span>{currentLanguage === 'mr' ? 'मार्ग नकाशा' : 'Route Map'}</span>
                            </button>
                            <button
                              onClick={() => setShowReceiptBooking(b)}
                              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileText size={12} />
                              <span>{currentLanguage === 'mr' ? 'पावती' : 'Tax Invoice'}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Tanker Tracking Map Modal */}
      {showTrackingModal && trackingBooking && (
        <RealtimeTankerTrackerModal
          booking={trackingBooking}
          onClose={() => setShowTrackingModal(false)}
          onOpenQrModal={() => {
            setShowTrackingModal(false);
            setShowQrModal(true);
          }}
          onCancelBooking={(bookingId) => {
            mockApi.cancelBooking(bookingId);
            refreshData();
          }}
        />
      )}

      {/* Dynamic QR Modal when Tanker Arrives */}
      {showQrModal && qrPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">{t('show_qr_to_driver')}</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl inline-block border border-slate-200">
              <QRCodeSVG value={qrPayload.payloadString} size={200} level="H" />
            </div>

            {/* Countdown Ring */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-cyan-800 font-bold">
              <RefreshCw size={13} className="animate-spin" />
              <span>
                {t('qr_refreshes_in')} {qrPayload.secondsLeft}s
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cryptographically signed with SHA-256. Proof of Delivery automatically releases escrow to vendor upon successful scan.
            </p>
          </div>
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreatePoolModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">{t('create_new_pool')}</h3>
              <button onClick={() => setShowCreatePoolModal(false)} className="cursor-pointer text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Volume (L)</label>
                <select
                  value={poolTargetL}
                  onChange={(e) => setPoolTargetL(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                >
                  <option value={5000}>5,000 Litres (Wing size)</option>
                  <option value={10000}>10,000 Litres (Large tanker)</option>
                  <option value={12000}>12,000 Litres (Multi-society)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">My Initial Share (L)</label>
                <input
                  type="number"
                  value={poolMyShareL}
                  onChange={(e) => setPoolMyShareL(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Drop Point Label</label>
                <input
                  type="text"
                  value={poolDropPointLabel}
                  onChange={(e) => setPoolDropPointLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <button
              onClick={async () => {
                await mockApi.createPool({
                  leaderId: currentUser.id,
                  leaderName: currentUser.name,
                  targetL: poolTargetL,
                  minL: Math.round(poolTargetL * 0.6),
                  dropPoint: { lat: 18.558, lng: 73.784, label: poolDropPointLabel },
                  members: [
                    {
                      userId: currentUser.id,
                      name: currentUser.name,
                      litres: poolMyShareL,
                      sharePaise: Math.round(poolMyShareL * 0.14 * 100),
                      confirmedReceipt: false,
                    },
                  ],
                });
                setShowCreatePoolModal(false);
                refreshData();
              }}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs cursor-pointer"
            >
              Publish Pool
            </button>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">{t('raise_complaint')}</h3>
              <button onClick={() => setShowComplaintModal(false)} className="cursor-pointer text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-500 text-[11px]">
                Describe your issue. Gemini AI will auto-triage the category, urgency, and SLA time.
              </p>
              <textarea
                rows={3}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="e.g. Tap water smelling bad / Driver charged extra / Low pressure..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSubmitComplaint}
              disabled={isTriaging || !complaintText.trim()}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTriaging ? <span>Triaging with Gemini...</span> : <span>Submit Complaint</span>}
            </button>
          </div>
        </div>
      )}

      {/* Top Up Wallet Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Recharge AquaFlow Wallet</h3>
              <button onClick={() => setShowTopUpModal(false)} className="cursor-pointer text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                {[500, 1000, 2500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopUpAmount(amt)}
                    className={`flex-1 py-2.5 rounded-xl border font-bold text-xs cursor-pointer ${
                      topUpAmount === amt ? 'bg-cyan-50 border-cyan-600 text-cyan-900' : 'border-slate-200'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={async () => {
                await mockApi.topUpWallet(currentUser.id, topUpAmount * 100);
                setShowTopUpModal(false);
                refreshData();
                alert(`Wallet topped up by ₹${topUpAmount} successfully!`);
              }}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs cursor-pointer"
            >
              Pay via Demo UPI
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptBooking && (
        <ReceiptModal booking={showReceiptBooking} onClose={() => setShowReceiptBooking(null)} />
      )}

      {/* AquaBot Modal */}
      <AquaBotModal onPreFillBooking={handlePreFillBooking} />
    </div>
  );
};
