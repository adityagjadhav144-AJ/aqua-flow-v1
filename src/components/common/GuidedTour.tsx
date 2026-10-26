import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Compass, ArrowRight, ArrowLeft, X, CheckCircle2 } from 'lucide-react';

const TOUR_STEPS = [
  {
    step: 1,
    title: '1. Resident Home (Neha Deshpande, Baner)',
    description:
      'Notice the next municipal water countdown window (PMC Parvati feeder), live neighbourhood "Water Running" feed, current demand chip, and AquaBot AI assistant.',
    persona: 'Resident',
    actionText: 'Next: Book a Fair-Price Tanker',
  },
  {
    step: 2,
    title: '2. Transparent Fair-Price Booking & Escrow',
    description:
      'Select 10,000 L domestic water. In summer surge, the Fair-Price Cap locks pricing to a 1.25x max (preventing 1.8x private exploitation). Payment is held in secure escrow.',
    persona: 'Resident',
    actionText: 'Next: Driver Source Check-in',
  },
  {
    step: 3,
    title: '3. Driver Daily Source Audit (Santosh Jadhav)',
    description:
      'Drivers cannot go online or accept trips without digital geo-verification at certified sources (e.g. PMC Parvati station) with valid certificate numbers.',
    persona: 'Driver',
    actionText: 'Next: Live GPS Tracking',
  },
  {
    step: 4,
    title: '4. Live Tracking & Arrival Dynamic QR',
    description:
      'Watch the tanker move on the Leaflet map with real-time ETA. Upon arrival at the gate, the resident app presents a cryptographic Dynamic QR that regenerates every 30s.',
    persona: 'Resident',
    actionText: 'Next: PoD Scan & Escrow Release',
  },
  {
    step: 5,
    title: '5. Digital Proof of Delivery (PoD) Verification',
    description:
      'Driver scans the QR. 5-point checklist passes (SHA-256 signature, 60s freshness, 150m GPS geofence). Escrow auto-releases: vendor paid, driver wallet credited instantly.',
    persona: 'Driver',
    actionText: 'Next: Municipal Broadcast & Crowd Reports',
  },
  {
    step: 6,
    title: '6. Municipal Alert Broadcast & Citizen Reports',
    description:
      'Municipal officer publishes an outage with Gemini AI translations (Marathi & Hindi). Citizens receive geo-targeted push and simulated WhatsApp messages, and confirm tap water resumption.',
    persona: 'Municipal Admin',
    actionText: 'Next: Society, Vendor & Ops Dashboards',
  },
  {
    step: 7,
    title: '7. B2B Society Automation & Platform Operations',
    description:
      'Explore Society gate logs & 135 L/person consumption alerts, Vendor 2-opt route batching saving ₹450 fuel, and Platform Ops GMV with "Without vs With AquaFlow" surge comparisons.',
    persona: 'Platform Ops',
    actionText: 'Finish Tour',
  },
];

export const GuidedTour: React.FC = () => {
  const { activeTourStep, nextTourStep, prevTourStep, closeTour } = useAppStore();

  if (activeTourStep === null || activeTourStep < 0 || activeTourStep >= TOUR_STEPS.length) {
    return null;
  }

  const current = TOUR_STEPS[activeTourStep];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-cyan-500/30 animate-in slide-in-from-bottom duration-200">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs">
            {current.step}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
              Guided Tour • Step {current.step} of 7
            </span>
            <h3 className="text-sm font-bold text-white">{current.title}</h3>
          </div>
        </div>
        <button
          onClick={closeTour}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-4">{current.description}</p>

      {/* Progress & Navigation Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1.5">
          {TOUR_STEPS.map((s, i) => (
            <div
              key={s.step}
              className={`h-1.5 rounded-full transition-all ${
                i === activeTourStep ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {activeTourStep > 0 && (
            <button
              onClick={prevTourStep}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}

          <button
            onClick={nextTourStep}
            className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <span>{current.actionText}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
