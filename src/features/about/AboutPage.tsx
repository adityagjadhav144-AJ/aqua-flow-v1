import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  Navigation,
  Users,
  Droplets,
  Building2,
  Truck,
  Landmark,
  Sliders,
  Check,
  Clock,
  QrCode,
  MapPin,
  FileText,
} from 'lucide-react';
import heroReservoirImg from '../../assets/images/about_hero_reservoir_1795148952944.jpg';
import residentialCampusImg from '../../assets/images/about_residential_campus_1795148953090.jpg';
import { useAppStore } from '../../store/useAppStore';
import { Role } from '../../types';

interface AboutPageProps {
  onGetStarted: () => void;
}

interface RolePreview {
  id: Role;
  label: string;
  headline: string;
  summary: string;
  workflows: string[];
  metricLabel: string;
  metricValue: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const ROLE_PREVIEWS: RolePreview[] = [
  {
    id: 'resident',
    label: 'Resident',
    headline: 'Direct household tanker booking with live radar and escrow security.',
    summary:
      'Compare verified municipal and RO water quotes at government-capped rates, track your tanker corridor on a live map, or split a delivery with nearby households.',
    workflows: [
      'Instant fair-price quote calculator with zero hidden surge charges',
      'Live GPS tanker corridor tracking from filling point to doorstep',
      'Dynamic 30-second QR proof of delivery releasing UPI escrow funds',
      'Neighborhood pooling to cut per-household tanker costs by up to 40%',
    ],
    metricLabel: 'Typical household wait time',
    metricValue: '28 mins',
    icon: Droplets,
  },
  {
    id: 'society',
    label: 'Society Admin',
    headline: 'Automated sump threshold monitoring and gate guard verification.',
    summary:
      'Keep multi-wing apartment complexes continuously supplied with recurring tanker schedules, dual committee sign-off for high-value dispatches, and digital gate logs.',
    workflows: [
      'Real-time underground sump reserve tracking with 30% auto-refill rules',
      'Gate Guard mode to verify PMC seals, plate numbers, and TDS readings',
      'Committee dual-approval workflow for dispatches exceeding budget limits',
      'Consolidated monthly GST invoices and flat-wise water quota statements',
    ],
    metricLabel: 'Average reserve buffer maintained',
    metricValue: '18 hrs',
    icon: Building2,
  },
  {
    id: 'driver',
    label: 'Tanker Driver',
    headline: 'Geofenced source check-ins, turn-by-turn routing, and instant payouts.',
    summary:
      'Complete daily water source audits at licensed PMC stations in seconds, receive 90-second priority job alerts, and get paid automatically upon scanning the customer QR.',
    workflows: [
      '500 m geofence check-in verification at PMC Parvati & Warje stations',
      'Clear 4-stage trip progression from filling to gate arrival',
      'Instant 12% per-trip driver incentive credited straight to wallet',
      'Zero paper slip disputes with cryptographic delivery confirmation',
    ],
    metricLabel: 'Per-trip incentive settlement',
    metricValue: 'Instant',
    icon: Truck,
  },
  {
    id: 'vendor',
    label: 'Vendor Fleet',
    headline: '2-Opt cluster routing and real-time compliance across every tanker.',
    summary:
      'Eliminate empty return miles by batching adjacent Baner and Balewadi orders automatically, while monitoring driver earnings and PMC source permits in one console.',
    workflows: [
      '2-Opt route optimization reducing fleet travel distance by 18%',
      'Live roster tracking for 5kL, 10kL, and 20kL registered tankers',
      'Automated driver payout ledger tied to verified PoD deliveries',
      'Centralized PMC water filling certificate & compliance tracking',
    ],
    metricLabel: 'Average fleet fuel & km reduction',
    metricValue: '18%',
    icon: Navigation,
  },
  {
    id: 'municipal',
    label: 'Municipal Officer',
    headline: 'Citywide ward outage publishing and 4-hour citizen grievance SLAs.',
    summary:
      'Coordinate Parvati, Warje, and Cantonment supply timetables, translate emergency shutoff notices into Marathi in one click, and deploy free emergency water hubs.',
    workflows: [
      'AI-assisted English-to-Marathi outage broadcast publisher by ward',
      'Live SLA grievance desk prioritizing low-pressure and leak reports',
      'Emergency free municipal tanker hub allocation during pipeline repairs',
      'Vendor price-cap audit trail preventing illegal summer hoarding',
    ],
    metricLabel: 'Fair-cap price compliance rate',
    metricValue: '99.4%',
    icon: Landmark,
  },
  {
    id: 'ops',
    label: 'Platform Ops',
    headline: 'Live citywide GMV telemetry, demand heatmaps, and summer surge caps.',
    summary:
      'Balance tanker supply and ward demand across Pune and Pimpri-Chinchwad, simulate seasonal drought surge caps, and audit cumulative citizen savings against market cartels.',
    workflows: [
      'Citywide hourly order velocity and fulfilment monitoring',
      'Seasonal fair-price ceiling controls protecting households in peak summer',
      'Ward-level demand index heatmap across Baner, Wakad, and Kothrud',
      'Transparent platform unit economics and escrow settlement verification',
    ],
    metricLabel: 'Fulfilment rate in peak season',
    metricValue: '97.8%',
    icon: Sliders,
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onGetStarted }) => {
  const { currentLanguage, setLanguage } = useAppStore();
  const [selectedRoleId, setSelectedRoleId] = useState<Role>('resident');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [campusImgFailed, setCampusImgFailed] = useState(false);

  const selectedRole = ROLE_PREVIEWS.find((r) => r.id === selectedRoleId) || ROLE_PREVIEWS[0];

  return (
    <div
      className="min-h-screen bg-[#F7FAFC] text-slate-900 antialiased selection:bg-[#0A5265] selection:text-white flex flex-col"
      style={{ fontFamily: "'DM Sans', 'Noto Sans Devanagari', sans-serif" }}
    >
      {/* ================================================================= */}
      {/* TOP BAR CONTRACT: 3 ZONES SEPARATED BY GAP-8, CLEAN TYPOGRAPHY    */}
      {/* ================================================================= */}
      <header className="sticky top-0 z-40 bg-[#F7FAFC]/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#overview"
            className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0A5265] rounded-md"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <img
              src="/assets/aistudio/image_a469dbfe.png"
              alt="AquaFlow"
              className="w-7 h-7 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <span>AquaFlow</span>
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#overview"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
            >
              Overview
            </a>
            <a
              href="#capabilities"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
            >
              Capabilities
            </a>
            <a
              href="#roles"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
            >
              Workspaces
            </a>
            <a
              href="#impact"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
            >
              Impact
            </a>
          </nav>

          {/* Zone 3: Single Primary Action at Top Right */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[40px] rounded-xl bg-[#0A5265] hover:bg-[#083F4E] active:scale-[0.98] text-white text-sm font-semibold tracking-tight transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5265]"
            >
              <span>{currentLanguage === 'mr' ? 'सुरू करा' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* =============================================================== */}
        {/* 1. PROPOSITION (HERO SECTION)                                   */}
        {/* =============================================================== */}
        <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Copy Column */}
            <div className="lg:col-span-6 flex flex-col justify-between py-2 space-y-8">
              <div className="space-y-5">
                {/* Quiet unboxed metadata line */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <span>Pune &amp; Pimpri-Chinchwad</span>
                  <span aria-hidden="true">·</span>
                  <span>Municipal Water &amp; Tanker Network</span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => setLanguage(currentLanguage === 'en' ? 'mr' : 'en')}
                    className="text-[#0A5265] font-semibold hover:underline cursor-pointer"
                  >
                    {currentLanguage === 'en' ? 'मराठी मध्ये पहा' : 'View in English'}
                  </button>
                </div>

                <h1
                  className="text-slate-950 font-extrabold tracking-tight leading-[1.1] max-w-xl"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Noto Sans Devanagari', sans-serif",
                    fontSize: 'clamp(2.25rem, 4vw, 3.6rem)',
                    textWrap: 'balance',
                  }}
                >
                  {currentLanguage === 'mr'
                    ? 'पुण्यासाठी पारदर्शक आणि रास्त दरातील पाणीपुरवठा व्यवस्था.'
                    : 'Fair-priced, verified water logistics for Pune.'}
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  {currentLanguage === 'mr'
                    ? 'अ‍ॅक्वाफ्लो नागरिक, गृहनिर्माण सोसायट्या, परवानाधारक टँकर चालक आणि महापालिका जल अभियंते यांना एकाच पारदर्शक मंचावर जोडते.'
                    : 'AquaFlow connects households, housing societies, licensed tanker fleets, and municipal water engineers on one transparent dispatch and escrow network.'}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={onGetStarted}
                    className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-[#0A5265] hover:bg-[#083F4E] text-white text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5265]"
                  >
                    <span>{currentLanguage === 'mr' ? 'पोर्टलमध्ये प्रवेश करा' : 'Get Started — Sign In'}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <a
                    href="#capabilities"
                    className="inline-flex items-center gap-1.5 px-4 py-3 min-h-[44px] text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Explore how it works</span>
                    <ArrowDown className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              </div>

              {/* Quiet trust statement at bottom of copy column */}
              <div className="pt-6 border-t border-slate-200/90 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0A5265]" />
                  <span>PMC &amp; PCMC Fair-Cap Enforced</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#0A5265]" />
                  <span>Cryptographic QR Proof of Delivery</span>
                </span>
              </div>
            </div>

            {/* Right Dominant Media Carrier (Full height match via items-stretch) */}
            <div className="lg:col-span-6 flex">
              <div className="relative w-full min-h-[280px] sm:min-h-[380px] lg:h-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                {!heroImgFailed ? (
                  <img
                    src={heroReservoirImg}
                    alt="Modern municipal water treatment reservoir and pipeline network overlooking green hills in Pune"
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#063b4f] to-[#0c6b84] flex flex-col items-center justify-center p-8 text-white">
                    <Droplets className="w-12 h-12 text-cyan-300 mb-3" />
                    <span className="text-base font-bold">PMC Water Supply &amp; Distribution Network</span>
                  </div>
                )}

                {/* Measured bottom contrast scrim (>= 4.5:1) */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="text-xs font-medium text-cyan-200 mb-1">
                    Parvati · Warje · Cantonment Corridors
                  </div>
                  <p className="text-sm sm:text-base font-semibold leading-snug max-w-md">
                    Every commercial tanker trip begins with a 500 m geofenced water source check-in before citizen dispatch.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width 4-Column Quantified Proof Strip (Below Hero Split) */}
          <div className="mt-10 sm:mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-1">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-slate-950 tabular-nums tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                ₹1,400
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-600">
                Regulated cap per 10,000 L tanker, down from ₹2,650 summer spikes
              </div>
            </div>

            <div className="space-y-1">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-slate-950 tabular-nums tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                28–42 min
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-600">
                Average dispatch-to-gate turnaround across Baner, Aundh, and Wakad
              </div>
            </div>

            <div className="space-y-1">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-slate-950 tabular-nums tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                100%
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-600">
                Water fillings checked against licensed PMC reservoir certificates
              </div>
            </div>

            <div className="space-y-1">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-slate-950 tabular-nums tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                6 Workspaces
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-600">
                Dedicated role views from residents to municipal command desks
              </div>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 2. MECHANISM & CAPABILITIES (ASYMMETRIC BENTO GRID)             */}
        {/* =============================================================== */}
        <section id="capabilities" className="bg-white border-y border-slate-200/80 py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-semibold text-[#0A5265] tracking-wide">
                Platform Architecture
              </div>
              <h2
                className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", textWrap: 'balance' }}
              >
                Built to replace phone tag, paper slips, and summer price gouging.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Unorganized water tanker markets fail residents during peak shortages. AquaFlow enforces transparent pricing, verifiable water sourcing, and cryptographic delivery proof from source to sump.
              </p>
            </div>

            {/* Asymmetric Bento Grid (Dynamic col-span-2 and col-span-1) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Feature 01 (Wide span 2) */}
              <div className="lg:col-span-2 bg-[#F7FAFC] rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500">
                    01. Pricing &amp; Payment Integrity
                  </div>
                  <h3
                    className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Fair-Cap Pricing with Automated UPI Escrow
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    Every quote calculates base water cost, exact corridor distance, and regulated municipal ceilings upfront. Your payment is held in escrow and released to the vendor only after the tanker arrives and delivers full volume.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/90 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">Domestic Supply</div>
                    <div className="text-slate-500 mt-0.5 tabular-nums">₹0.09 / Litre base rate</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Certified RO Potable</div>
                    <div className="text-slate-500 mt-0.5 tabular-nums">₹0.30 / Litre lab tested</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Short-Delivery Refund</div>
                    <div className="text-slate-500 mt-0.5">Automatic pro-rata credit</div>
                  </div>
                </div>
              </div>

              {/* Feature 02 (Span 1) */}
              <div className="bg-[#F7FAFC] rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500">
                    02. Cryptographic Verification
                  </div>
                  <h3
                    className="text-xl font-bold text-slate-950 tracking-tight"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    30-Second Dynamic QR Proof of Delivery
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Screenshots cannot spoof deliveries. Drivers scan a rotating 30-second SHA-256 QR token on the customer screen while GPS telemetry confirms gate proximity within 150 meters.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200/90 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>GPS Geofence: &le; 150 m</span>
                  <QrCode className="w-4 h-4 text-[#0A5265]" />
                </div>
              </div>

              {/* Visual Feature Card (Span 1 - Campus Photography) */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative min-h-[260px]">
                {!campusImgFailed ? (
                  <img
                    src={residentialCampusImg}
                    alt="Modern residential housing society courtyard in Pune with landscaped greenery"
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                    onError={() => setCampusImgFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center p-6 text-white">
                    <Building2 className="w-10 h-10 text-cyan-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
                  <div className="text-xs font-medium text-cyan-200">
                    03. Housing Societies &amp; Neighborhoods
                  </div>
                  <div className="text-base font-bold leading-snug">
                    Community Tanker Pooling &amp; Sump Automation
                  </div>
                </div>
              </div>

              {/* Feature 04 (Wide span 2) */}
              <div className="lg:col-span-2 bg-[#F7FAFC] rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500">
                    04. Neighborhood Pooling &amp; Municipal Outage Radar
                  </div>
                  <h3
                    className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Split 10,000 L Tankers &amp; Track Live Tap Supply Schedules
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    Individual homes can join neighborhood pools to reserve exact 1,500 L or 2,500 L shares in a single tanker, cutting delivery fees by up to 40%. Meanwhile, ward outage notices and crowd-verified tap reports keep every street informed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/90 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <MapPin className="w-4 h-4 text-[#0A5265] shrink-0" />
                    <span>Live Leaflet Corridor Radar</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Users className="w-4 h-4 text-[#0A5265] shrink-0" />
                    <span>WhatsApp Pool Share Invites</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <FileText className="w-4 h-4 text-[#0A5265] shrink-0" />
                    <span>Instant GST Tax Receipts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 3. INTERACTIVE ROLE WORKSPACES EXPLORER                         */}
        {/* =============================================================== */}
        <section id="roles" className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-semibold text-[#0A5265] tracking-wide">
                Six Isolated Civic Workspaces
              </div>
              <h2
                className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", textWrap: 'balance' }}
              >
                Tailored dashboards for every stakeholder in the water chain.
              </h2>
            </div>

            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A5265] hover:text-[#083F4E] hover:underline cursor-pointer whitespace-nowrap shrink-0 self-start md:self-auto"
            >
              <span>Sign in to access your workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Role Filter Segmented Bar */}
          <div
            role="tablist"
            aria-label="Platform roles"
            className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-200/70 rounded-xl scrollbar-none"
          >
            {ROLE_PREVIEWS.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRoleId === role.id;
              return (
                <button
                  key={role.id}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#0A5265]' : 'text-slate-500'}`} />
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Role Detail Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="text-xs font-semibold text-[#0A5265]">
                {selectedRole.label} Workspace
              </div>
              <h3
                className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight leading-snug"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {selectedRole.headline}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {selectedRole.summary}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[40px] rounded-xl bg-[#0A5265] hover:bg-[#083F4E] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Continue as {selectedRole.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#F7FAFC] rounded-xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-baseline justify-between pb-4 border-b border-slate-200">
                <span className="text-xs font-medium text-slate-500">{selectedRole.metricLabel}</span>
                <span
                  className="text-xl font-extrabold text-[#0A5265] tabular-nums"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {selectedRole.metricValue}
                </span>
              </div>

              <ul className="space-y-3">
                {selectedRole.workflows.map((wf) => (
                  <li key={wf} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-snug">
                    <Check className="w-4 h-4 text-[#0A5265] shrink-0 mt-0.5" />
                    <span>{wf}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 4. PROOF & MARKET COMPARISON + ATTRIBUTABLE OUTCOMES            */}
        {/* =============================================================== */}
        <section id="impact" className="bg-white border-t border-slate-200/80 py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-semibold text-[#0A5265] tracking-wide">
                Measured Civic Impact
              </div>
              <h2
                className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", textWrap: 'balance' }}
              >
                How regulated dispatch outperforms informal tanker calls.
              </h2>
            </div>

            {/* Clean Tabular Matrix */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F7FAFC] border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-4 px-5">Operational Metric</th>
                    <th className="py-4 px-5">Unorganized Informal Tankers</th>
                    <th className="py-4 px-5 text-[#0A5265]">AquaFlow Verified Network</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="py-4 px-5 font-semibold text-slate-900">Peak Summer 10,000 L Price</td>
                    <td className="py-4 px-5 text-slate-600 tabular-nums">₹2,400 – ₹2,650 (uncapped)</td>
                    <td className="py-4 px-5 font-semibold text-slate-950 tabular-nums">₹1,400 – ₹1,420 (Fair-Capped)</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-5 font-semibold text-slate-900">Average Delivery Wait Time</td>
                    <td className="py-4 px-5 text-slate-600 tabular-nums">3.2 – 6.5 hours</td>
                    <td className="py-4 px-5 font-semibold text-slate-950 tabular-nums">28 – 42 minutes</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-5 font-semibold text-slate-900">Water Source Audit</td>
                    <td className="py-4 px-5 text-slate-600">Unverified borewell or paper slip</td>
                    <td className="py-4 px-5 font-semibold text-slate-950">500 m PMC geofence &amp; certificate</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-5 font-semibold text-slate-900">Payment &amp; Volume Protection</td>
                    <td className="py-4 px-5 text-slate-600">Cash on gate, no short-fill recourse</td>
                    <td className="py-4 px-5 font-semibold text-slate-950">UPI escrow + 30s QR PoD verification</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Attributable Field Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <figure className="p-6 sm:p-8 rounded-2xl bg-[#F7FAFC] border border-slate-200 space-y-4">
                <blockquote className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  “Before AquaFlow, our 120-flat committee spent three hours every morning calling separate tanker brokers and arguing over cash slips at the gate. Automated sump thresholds and QR gate logging cut our summer tanker spend by 28% within two months.”
                </blockquote>
                <figcaption className="pt-3 border-t border-slate-200/80 text-xs">
                  <div className="font-bold text-slate-950">Rajesh Patil</div>
                  <div className="text-slate-500 mt-0.5">Secretary, Sunrise Heights Co-operative Housing Society · Baner, Pune</div>
                </figcaption>
              </figure>

              <figure className="p-6 sm:p-8 rounded-2xl bg-[#F7FAFC] border border-slate-200 space-y-4">
                <blockquote className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  “Checking in at Parvati station takes ten seconds on mobile, and batching three Baner drops on a single corridor eliminated wasted diesel runs. Driver payouts settle automatically as soon as the resident’s QR is scanned.”
                </blockquote>
                <figcaption className="pt-3 border-t border-slate-200/80 text-xs">
                  <div className="font-bold text-slate-950">Meena Shinde</div>
                  <div className="text-slate-500 mt-0.5">Fleet Owner, Shivneri Water Carriers (12 Tankers) · Pune West</div>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 5. CONVERSION BAND                                              */}
        {/* =============================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
          <div className="rounded-3xl bg-[#063b4f] text-white p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", textWrap: 'balance' }}
              >
                Ready to access the AquaFlow Pune portal?
              </h2>
              <p className="text-sm sm:text-base text-cyan-100/90 leading-relaxed">
                Sign in with an existing role account or register with instant 6-digit mobile verification.
              </p>
            </div>

            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[44px] rounded-xl bg-white hover:bg-cyan-50 text-[#063b4f] text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* ================================================================= */}
      {/* QUIET FOOTER                                                      */}
      {/* ================================================================= */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="font-semibold text-slate-800">
            AquaFlow Pune · Fair-Price Water Supply &amp; Tanker Logistics
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#overview" className="hover:text-slate-900 transition-colors">
              Overview
            </a>
            <a href="#capabilities" className="hover:text-slate-900 transition-colors">
              Capabilities
            </a>
            <a href="#roles" className="hover:text-slate-900 transition-colors">
              Workspaces
            </a>
            <button
              type="button"
              onClick={onGetStarted}
              className="font-semibold text-[#0A5265] hover:underline cursor-pointer"
            >
              Sign In
            </button>
            <span>© 2026 AquaFlow</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
