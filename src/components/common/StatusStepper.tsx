import React from 'react';
import { BookingStatus } from '../../types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface StatusStepperProps {
  currentStatus: BookingStatus;
  timeline?: { status: BookingStatus; ts: string; note?: string }[];
}

const STEPS: { status: BookingStatus; label: string; desc: string }[] = [
  { status: 'REQUESTED', label: 'Order Placed', desc: 'Escrow payment held' },
  { status: 'MATCHED', label: 'Vendor Matched', desc: 'Assigned best fleet' },
  { status: 'ACCEPTED', label: 'Driver Accepted', desc: 'Driver confirmed trip' },
  { status: 'FILLING', label: 'Filling at Source', desc: 'PMC certified point' },
  { status: 'EN_ROUTE', label: 'Tanker En Route', desc: 'Live GPS navigation' },
  { status: 'ARRIVED', label: 'Arrived at Gate', desc: 'Dynamic QR ready' },
  { status: 'DELIVERED', label: 'QR Verified & Delivered', desc: 'Quantity confirmed' },
  { status: 'SETTLED', label: 'Escrow Released', desc: 'Vendor & driver paid' },
];

export const StatusStepper: React.FC<StatusStepperProps> = ({ currentStatus, timeline = [] }) => {
  const getStepIndex = (status: BookingStatus): number => {
    switch (status) {
      case 'DRAFT':
        return -1;
      case 'REQUESTED':
        return 0;
      case 'MATCHED':
        return 1;
      case 'ACCEPTED':
        return 2;
      case 'FILLING':
        return 3;
      case 'EN_ROUTE':
        return 4;
      case 'ARRIVED':
        return 5;
      case 'DELIVERED':
        return 6;
      case 'SETTLED':
        return 7;
      case 'CANCELLED':
      case 'EXPIRED':
      case 'DISPUTED':
        return -2;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  if (currentStatus === 'CANCELLED') {
    return (
      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
        ⚠️ Booking Cancelled. Escrow refunded to wallet.
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="relative pl-6 space-y-4">
        {/* Vertical line connector */}
        <div className="absolute left-2.5 top-2 bottom-3 w-0.5 bg-slate-200" />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div key={step.status} className="relative flex items-start gap-3">
              {/* Step indicator dot */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all z-10 ${
                  isCompleted
                    ? 'bg-cyan-600 text-white'
                    : isCurrent
                    ? 'bg-cyan-500 text-white ring-4 ring-cyan-100 animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-transparent'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={13} className="stroke-[3]" />
                ) : isCurrent ? (
                  <Clock size={11} className="stroke-[2.5]" />
                ) : (
                  <Circle size={8} />
                )}
              </div>

              {/* Text content */}
              <div className="min-w-0">
                <div
                  className={`text-xs font-semibold ${
                    isCurrent
                      ? 'text-cyan-900 font-bold'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400 font-medium'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-500">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
