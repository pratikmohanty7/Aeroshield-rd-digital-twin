/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileNavBar } from './components/common/MobileNavBar';
import { DemoBanner } from './components/common/DemoBanner';
import { OperatorDock } from './components/common/OperatorDock';
import { OverviewPage } from './pages/OverviewPage';
import { SensorLabPage } from './pages/SensorLabPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { SimulationPage } from './pages/SimulationPage';
import { ValidationPage } from './pages/ValidationPage';
import { LogsPage } from './pages/LogsPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { ResearchPage } from './pages/ResearchPage';
import { PrototypeStatusPage } from './pages/PrototypeStatusPage';
import { TacticalMapPage } from './pages/TacticalMapPage';
import { StateEstimationPage } from './pages/StateEstimationPage';
import { GncResearchPage } from './pages/GncResearchPage';
import { CaaResearchPage } from './pages/CaaResearchPage';
import { SmartFuzeResearchPage } from './pages/SmartFuzeResearchPage';
import { PowerSwapcPage } from './pages/PowerSwapcPage';
import { EnvironmentRobustnessPage } from './pages/EnvironmentRobustnessPage';
import { TraceabilityPage } from './pages/TraceabilityPage';

const MainLayout: React.FC = () => {
  const { activePage } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage />;
      case 'architecture':
        return <ArchitecturePage />;
      case 'sensors':
        return <SensorLabPage />;
      case 'telemetry':
        return <TelemetryPage />;
      case 'state-estimation':
        return <StateEstimationPage />;
      case 'diagnostics':
        return <DiagnosticsPage />;
      case 'map':
        return <TacticalMapPage />;
      case 'digital-twin':
      case 'missile-architecture':
        return <DigitalTwinPage />;
      case 'simulation':
        return <SimulationPage />;
      case 'validation':
        return <ValidationPage />;
      case 'logs':
        return <LogsPage />;
      case 'gnc-research':
        return <GncResearchPage />;
      case 'caa-research':
        return <CaaResearchPage />;
      case 'smart-fuze':
        return <SmartFuzeResearchPage />;
      case 'power-swapc':
        return <PowerSwapcPage />;
      case 'environment':
        return <EnvironmentRobustnessPage />;
      case 'traceability':
        return <TraceabilityPage />;
      case 'research':
        return <ResearchPage />;
      case 'prototype-status':
        return <PrototypeStatusPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-200 flex flex-col selection:bg-sky-600 selection:text-white relative antialiased font-sans">
      {/* Top Header */}
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Demo Progress Banner if active */}
      <DemoBanner />

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden z-10">
        {/* Left Navigation Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 pb-28 lg:pb-20 max-w-[1780px] w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Operator Command Deck */}
      <OperatorDock />

      {/* Mobile Bottom Navigation Bar (Phone Devices) */}
      <MobileNavBar onOpenSidebar={() => setSidebarOpen(true)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
