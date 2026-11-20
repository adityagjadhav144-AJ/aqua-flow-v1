import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
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

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';

export default function App() {
  const { currentRole, isAuthenticated } = useAppStore();
  const [activeNav, setActiveNav] = useState('home');
  const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(false);
  const [showAuthPortal, setShowAuthPortal] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Reset active navigation item to 'home' whenever role changes
  useEffect(() => {
    setActiveNav('home');
  }, [currentRole]);

  // Listen for Tier 1 / Tier 2 Google Maps Platform quota alerts
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const renderContent = () => {
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
  };

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={['marker', 'routes', 'maps']}
      language="en"
      region="IN"
    >
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      {renderContent()}
    </APIProvider>
  );
}
