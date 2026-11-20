import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { DashboardShell } from './components/layout/DashboardShell';
import { DemoPanel } from './components/common/DemoPanel';
import { GuidedTour } from './components/common/GuidedTour';
import { NotificationCenter } from './components/common/NotificationCenter';
import { AquaBotModal } from './components/common/AquaBotModal';

// Feature Views
import { ResidentView } from './features/resident/ResidentView';
import { DriverView } from './features/driver/DriverView';
import { SocietyView } from './features/society/SocietyView';
import { VendorView } from './features/vendor/VendorView';
import { MunicipalView } from './features/municipal/MunicipalView';
import { OpsView } from './features/ops/OpsView';

import { AuthPortal } from './features/auth/AuthPortal';
import { AboutPage } from './features/about/AboutPage';

export default function App() {
  const { currentRole, isAuthenticated } = useAppStore();
  const [activeNav, setActiveNav] = useState('home');
  const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(false);
  const [showAuthPortal, setShowAuthPortal] = useState(false);

  // Reset active navigation item to 'home' whenever role changes
  useEffect(() => {
    setActiveNav('home');
  }, [currentRole]);

  // Visitor Landing / About Page -> Get Started -> Login & Registration Wall
  if (!isAuthenticated) {
    if (!showAuthPortal) {
      return (
        <AboutPage
          onGetStarted={() => {
            setShowAuthPortal(true);
            window.scrollTo({ top: 0 });
          }}
        />
      );
    }

    return (
      <AuthPortal
        onBackToAbout={() => {
          setShowAuthPortal(false);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <DashboardShell
      activeNav={activeNav}
      onNavChange={setActiveNav}
      onOpenDemoPanel={() => setIsDemoPanelOpen(true)}
    >
      {currentRole === 'resident' && (
        <ResidentView activeNav={activeNav} onNavChange={setActiveNav} />
      )}
      {currentRole === 'driver' && (
        <DriverView activeNav={activeNav} onNavChange={setActiveNav} />
      )}
      {currentRole === 'society' && (
        <SocietyView activeNav={activeNav} onNavChange={setActiveNav} />
      )}
      {currentRole === 'vendor' && (
        <VendorView activeNav={activeNav} onNavChange={setActiveNav} />
      )}
      {currentRole === 'municipal' && (
        <MunicipalView activeNav={activeNav} onNavChange={setActiveNav} />
      )}
      {currentRole === 'ops' && (
        <OpsView activeNav={activeNav} onNavChange={setActiveNav} />
      )}

      {/* Global Interactive Overlays */}
      <DemoPanel isOpen={isDemoPanelOpen} onClose={() => setIsDemoPanelOpen(false)} />
      <NotificationCenter />
      <GuidedTour />
      <AquaBotModal />
    </DashboardShell>
  );
}
