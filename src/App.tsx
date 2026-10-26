import React, { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { DemoPanel } from './components/common/DemoPanel';
import { GuidedTour } from './components/common/GuidedTour';
import { NotificationCenter } from './components/common/NotificationCenter';

// Feature Views
import { ResidentView } from './features/resident/ResidentView';
import { DriverView } from './features/driver/DriverView';
import { SocietyView } from './features/society/SocietyView';
import { VendorView } from './features/vendor/VendorView';
import { MunicipalView } from './features/municipal/MunicipalView';
import { OpsView } from './features/ops/OpsView';

import { AuthPortal } from './features/auth/AuthPortal';

export default function App() {
  const { currentRole, isAuthenticated } = useAppStore();
  const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(false);

  // Strict Login & Registration Wall
  if (!isAuthenticated) {
    return <AuthPortal />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4FAFB] font-sans antialiased text-slate-900 w-full max-w-full overflow-x-hidden">
      {/* Universal Top Header */}
      <Header onOpenDemoPanel={() => setIsDemoPanelOpen(true)} />

      {/* Main Role-Specific Viewport */}
      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        {currentRole === 'resident' && (
          <div className="flex-1 w-full py-4">
            <ResidentView />
          </div>
        )}

        {currentRole === 'driver' && (
          <div className="flex-1 w-full py-4">
            <DriverView />
          </div>
        )}

        {currentRole === 'society' && (
          <div className="flex-1 w-full py-4">
            <SocietyView />
          </div>
        )}

        {currentRole === 'vendor' && (
          <div className="flex-1 w-full py-4">
            <VendorView />
          </div>
        )}

        {currentRole === 'municipal' && (
          <div className="flex-1 w-full py-4">
            <MunicipalView />
          </div>
        )}

        {currentRole === 'ops' && (
          <div className="flex-1 w-full py-4">
            <OpsView />
          </div>
        )}
      </main>

      {/* Interactive Global Drawers & Overlays */}
      <DemoPanel isOpen={isDemoPanelOpen} onClose={() => setIsDemoPanelOpen(false)} />
      <NotificationCenter />
      <GuidedTour />

      {/* Universal Footer Note */}
      <Footer />
    </div>
  );
}
