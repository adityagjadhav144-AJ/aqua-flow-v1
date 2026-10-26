import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { simulationEngine } from '../../services/simulation';
import { Role } from '../../types';
import {
  X,
  Play,
  RotateCcw,
  Zap,
  Sun,
  CloudSun,
  WifiOff,
  Compass,
  AlertTriangle,
  Radio,
  Flame,
  CheckCircle,
} from 'lucide-react';

interface DemoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateGpsDrift?: () => void;
}

export const DemoPanel: React.FC<DemoPanelProps> = ({ isOpen, onClose, onSimulateGpsDrift }) => {
  const {
    currentRole,
    setRole,
    season,
    setSeason,
    isOffline,
    setOffline,
    startTour,
  } = useAppStore();

  const simConfig = simulationEngine.getConfig();

  if (!isOpen) return null;

  const roles: { id: Role; label: string; icon: string }[] = [
    { id: 'resident', label: 'Resident (Neha)', icon: '🏡' },
    { id: 'society', label: 'Society Admin (Rajesh)', icon: '🏢' },
    { id: 'driver', label: 'Driver (Santosh)', icon: '🚚' },
    { id: 'vendor', label: 'Vendor / Fleet (Meena)', icon: '💼' },
    { id: 'municipal', label: 'Municipal (PMC)', icon: '🏛️' },
    { id: 'ops', label: 'Platform Ops', icon: '📊' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-cyan-950 text-white">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold tracking-tight">Demo Control Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-6 text-xs text-slate-700">
          {/* Guided Tour Banner */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl p-3 text-white space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <Compass size={16} />
              <span>7-Step Guided Tour</span>
            </div>
            <p className="text-[11px] text-cyan-50">
              Interactive narrative showing the complete lifecycle: booking, fair-cap, PoD QR delivery, outage broadcast, and society logs.
            </p>
            <button
              onClick={() => {
                onClose();
                startTour();
              }}
              className="w-full py-1.5 px-3 bg-white text-cyan-900 font-bold rounded-xl hover:bg-cyan-50 transition-colors shadow-xs cursor-pointer"
            >
              Start Guided Tour
            </button>
          </div>

          {/* Role Switcher */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Switch Persona Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all flex items-center gap-2 cursor-pointer ${
                    currentRole === r.id
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-base">{r.icon}</span>
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Time Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Simulation Speed
              </label>
              <span className="text-[10px] text-cyan-700 font-bold">{simConfig.timeSpeed}x Speed</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 10, 60].map((speed) => (
                <button
                  key={speed}
                  onClick={() => simulationEngine.setTimeSpeed(speed as any)}
                  className={`py-1.5 rounded-xl border font-bold text-center cursor-pointer ${
                    simConfig.timeSpeed === speed
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Season Toggle: Normal vs Summer Surge */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Season Demand Scenario
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSeason('normal')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${
                  season === 'normal'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-900 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CloudSun size={16} className="text-cyan-600" />
                <div className="text-left">
                  <div>Normal Season</div>
                  <div className="text-[10px] text-slate-400">Demand: ~1.0x</div>
                </div>
              </button>

              <button
                onClick={() => setSeason('summer')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${
                  season === 'summer'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Sun size={16} className="text-amber-600" />
                <div className="text-left">
                  <div>Summer Surge 🔥</div>
                  <div className="text-[10px] text-amber-700">Fair-Cap Active</div>
                </div>
              </button>
            </div>
          </div>

          {/* Autopilot & Offline Toggles */}
          <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">Autopilot Drivers</div>
                <div className="text-[10px] text-slate-400">Simulate autonomous trip lifecycle</div>
              </div>
              <input
                type="checkbox"
                checked={simConfig.autopilotDrivers}
                onChange={(e) => simulationEngine.setAutopilot(e.target.checked)}
                className="w-4 h-4 accent-cyan-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
              <div>
                <div className="font-semibold text-slate-900">Simulate Offline Mode</div>
                <div className="text-[10px] text-slate-400">Queues actions to local outbox</div>
              </div>
              <input
                type="checkbox"
                checked={isOffline}
                onChange={(e) => setOffline(e.target.checked)}
                className="w-4 h-4 accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Trigger Event Quick Actions */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Interactive Event Triggers
            </label>
            <div className="space-y-1.5">
              <button
                onClick={() => simulationEngine.triggerDriverArriveNow()}
                className="w-full text-left p-2 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>🚚 Fast-Forward: Driver Arrives Now</span>
                <Play size={12} />
              </button>

              <button
                onClick={() => simulationEngine.triggerMunicipalOutage()}
                className="w-full text-left p-2 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-900 text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>⚠️ Municipal Outage in Baner (Zone 2)</span>
                <AlertTriangle size={12} />
              </button>

              <button
                onClick={() => simulationEngine.triggerNeighbourWaterRunning()}
                className="w-full text-left p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>🚰 Neighbour Reports Water Running</span>
                <Radio size={12} />
              </button>

              <button
                onClick={() => simulationEngine.triggerVendorDeclineReassign()}
                className="w-full text-left p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>🔄 Driver Declines / Timeout (Auto-Reassign)</span>
                <RotateCcw size={12} />
              </button>

              <button
                onClick={() => {
                  if (onSimulateGpsDrift) onSimulateGpsDrift();
                  alert('GPS Drift mode active for next QR verification: driver will appear 1.85 km away to test geofence rejection!');
                }}
                className="w-full text-left p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-900 text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>📍 Test GPS Drift (PoD Rejection)</span>
                <AlertTriangle size={12} />
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                if (confirm('Reset all demo data back to initial Pune seed?')) {
                  simulationEngine.resetDemoData();
                  alert('Demo database reset to seed successfully.');
                  onClose();
                }
              }}
              className="w-full py-2 px-3 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
