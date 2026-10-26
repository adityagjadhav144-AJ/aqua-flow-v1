import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatINR } from '../../services/pricing';
import { useAppStore } from '../../store/useAppStore';
import {
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  RefreshCw,
  Smartphone,
  Lock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface UpiQrPaymentCardProps {
  amountPaise: number;
  volumeL?: number;
  purpose?: 'general' | 'drinking';
  orderId?: string;
  onPaySuccess: () => void | Promise<void>;
  isSubmitting?: boolean;
  compact?: boolean;
}

export const UpiQrPaymentCard: React.FC<UpiQrPaymentCardProps> = ({
  amountPaise,
  volumeL = 10000,
  purpose = 'general',
  orderId,
  onPaySuccess,
  isSubmitting = false,
  compact = false,
}) => {
  const { currentLanguage, t } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes validity
  const [txRef, setTxRef] = useState<string>(() => `AQF-PUNE-${Date.now().toString().slice(-6)}`);
  const [simulatingStep, setSimulatingStep] = useState<'idle' | 'scanning' | 'verifying' | 'success'>('idle');

  // Amount in INR rupees
  const amountRupees = (amountPaise / 100).toFixed(2);
  const upiVpa = 'aquaflow.pune.escrow@icici';

  // Construct official UPI Deep Link & QR URI standard (NPCI specification)
  const upiPayload = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
    'AquaFlow Pune Escrow'
  )}&mc=5499&tid=${txRef}&tr=${txRef}&tn=${encodeURIComponent(
    `Tanker Order ${orderId || 'Instant'} ${volumeL}L ${purpose}`
  )}&am=${amountRupees}&cu=INR`;

  // Countdown timer for dynamic QR freshness
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Regenerate new transaction ref for security
          setTxRef(`AQF-PUNE-${Date.now().toString().slice(-6)}`);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(upiVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    if (simulatingStep !== 'idle' || isSubmitting) return;

    setSimulatingStep('scanning');
    await new Promise((r) => setTimeout(r, 600));

    setSimulatingStep('verifying');
    await new Promise((r) => setTimeout(r, 700));

    setSimulatingStep('success');
    await new Promise((r) => setTimeout(r, 500));

    await onPaySuccess();
    setSimulatingStep('idle');
  };

  return (
    <div className="bg-gradient-to-b from-white to-slate-50/80 rounded-3xl p-5 border border-cyan-200/90 shadow-sm shadow-cyan-950/5 space-y-4">
      {/* Header with Escrow & Dynamic Status */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <QrCode size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-slate-900 tracking-tight">
                {t('pay_via_upi_qr')}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              {currentLanguage === 'mr' ? 'थेट डायनॅमिक QR • NPCI प्रमाणित' : 'Live Dynamic UPI QR • NPCI Verified'}
            </p>
          </div>
        </div>

        {/* Live Freshness Countdown */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200">
          <Clock size={12} className="text-cyan-600 animate-pulse" />
          <span>{formatTime(countdown)}</span>
        </div>
      </div>

      {/* Main QR Display with Viewfinder Frame & Badging */}
      <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-inner relative group">
        {/* Subtle Water Droplet Background Hologram */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <QrCode size={200} />
        </div>

        {/* Dynamic Scan Target with Corner Brackets */}
        <div className="relative p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
          {/* Top-left bracket */}
          <div className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-600 rounded-tl-sm pointer-events-none" />
          {/* Top-right bracket */}
          <div className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-600 rounded-tr-sm pointer-events-none" />
          {/* Bottom-left bracket */}
          <div className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-600 rounded-bl-sm pointer-events-none" />
          {/* Bottom-right bracket */}
          <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-600 rounded-br-sm pointer-events-none" />

          {/* SVG QR Code */}
          <div className="relative flex items-center justify-center">
            <QRCodeSVG
              value={upiPayload}
              size={compact ? 140 : 160}
              level="H"
              includeMargin={false}
              className="rounded-md"
            />

            {/* Central Badge Overlay */}
            <div className="absolute w-8 h-8 rounded-full bg-white shadow-md border-2 border-cyan-600 flex items-center justify-center text-cyan-700 pointer-events-none font-black text-xs">
              💧
            </div>
          </div>
        </div>

        {/* Live Amount Banner under QR */}
        <div className="mt-3 text-center">
          <div className="text-xs text-slate-500 font-medium">
            {currentLanguage === 'mr' ? 'एकूण देय रक्कम' : 'Amount to Pay'}
          </div>
          <div className="text-2xl font-black text-cyan-950 tracking-tight">
            {formatINR(amountPaise)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Ref: {txRef}
          </div>
        </div>

        {/* UPI Apps Icons Row */}
        <div className="mt-3 flex items-center justify-center gap-2 pt-2 border-t border-slate-100 w-full">
          <span className="text-[10px] text-slate-400 font-semibold mr-1">Scan with:</span>
          {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Cred'].map((app) => (
            <span
              key={app}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
            >
              {app}
            </span>
          ))}
        </div>
      </div>

      {/* Copy VPA Section */}
      <div className="bg-slate-50 rounded-2xl p-2.5 px-3 border border-slate-200/80 flex items-center justify-between gap-2">
        <div className="truncate">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            AquaFlow Escrow VPA
          </span>
          <span className="text-xs font-mono font-bold text-slate-800 truncate block">
            {upiVpa}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyVpa}
          className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-600" />
              <span className="text-emerald-700">{t('copied')}</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>{t('copy_upi_id')}</span>
            </>
          )}
        </button>
      </div>

      {/* Escrow Guarantee Pill */}
      <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 px-3 py-2 rounded-2xl border border-emerald-200 font-medium">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
        <span className="leading-tight">
          {currentLanguage === 'mr'
            ? '१००% एस्क्रो सुरक्षित: टँकर प्रत्यक्ष गेटवर आल्यानंतरच पैसे व्हेंडरला मिळतात.'
            : '100% Escrow Protected: Funds locked safely until digital delivery verification at your gate.'}
        </span>
      </div>

      {/* Primary Action Button: Simulate Instant UPI Payment */}
      <button
        type="button"
        onClick={handleSimulatePayment}
        disabled={simulatingStep !== 'idle' || isSubmitting}
        className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:brightness-105 active:scale-[0.99] text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {simulatingStep === 'scanning' ? (
          <>
            <Smartphone size={15} className="animate-bounce" />
            <span>{currentLanguage === 'mr' ? 'UPI अ‍ॅप स्कॅन ओळखत आहे...' : 'Detecting UPI App Scan...'}</span>
          </>
        ) : simulatingStep === 'verifying' ? (
          <>
            <RefreshCw size={15} className="animate-spin text-cyan-200" />
            <span>{currentLanguage === 'mr' ? 'NPCI गेटवे पडताळणी सुरू...' : 'Verifying with NPCI Gateway...'}</span>
          </>
        ) : simulatingStep === 'success' ? (
          <>
            <CheckCircle2 size={16} className="text-emerald-300" />
            <span>{currentLanguage === 'mr' ? 'पेमेंट यशस्वी! एस्क्रो सुरक्षित लॉक ✓' : 'Payment Approved! Escrow Locked ✓'}</span>
          </>
        ) : (
          <>
            <Sparkles size={15} />
            <span>{t('simulate_upi_success')} ({formatINR(amountPaise)})</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </div>
  );
};
