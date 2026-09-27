import React, { useState } from 'react';
import { NavigationPage, useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Cpu,
  Radio,
  Box,
  AlertTriangle,
  PlayCircle,
  CheckSquare,
  FileText,
  Map,
  Network,
  BookOpen,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Layers,
  Zap,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react';

interface NavItem {
  id: NavigationPage;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
  category: 'OPERATIONS' | 'SUBSYSTEMS' | 'ASSURANCE' | 'SPECIFICATION';
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activePage,
    setActivePage,
    obdsState,
    validationTests,
    activeFaults,
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const passedTests = validationTests.filter((t) => t.status === 'SIMULATED PASS').length;
  const activeFaultCount = activeFaults.filter((f) => f.active).length;

  const navItems: NavItem[] = [
    // OPERATIONS
    { id: 'overview', name: 'Flight Cockpit', icon: LayoutDashboard, category: 'OPERATIONS' },
    { id: 'digital-twin', name: 'Airframe 3D CAD', icon: Box, category: 'OPERATIONS' },
    { id: 'map', name: 'Ballistic Trajectory', icon: Map, category: 'OPERATIONS' },

    // SUBSYSTEMS
    { id: 'sensors', name: 'Transducer Suite', icon: Cpu, category: 'SUBSYSTEMS' },
    { id: 'telemetry', name: 'Telemetry Bus', icon: Radio, category: 'SUBSYSTEMS' },
    { id: 'state-estimation', name: 'State Estimator (EKF)', icon: Compass, category: 'SUBSYSTEMS' },
    { id: 'power-swapc', name: 'Power & SWaP-C', icon: Zap, category: 'SUBSYSTEMS' },

    // ASSURANCE & TESTING
    {
      id: 'diagnostics',
      name: 'Diagnostics & OBDS',
      icon: AlertTriangle,
      badge: obdsState.activeFaultCount > 0 ? obdsState.activeFaultCount : undefined,
      category: 'ASSURANCE',
    },
    {
      id: 'simulation',
      name: 'Simulation Testbed',
      icon: PlayCircle,
      badge: activeFaultCount > 0 ? `${activeFaultCount} active` : undefined,
      category: 'ASSURANCE',
    },
    {
      id: 'validation',
      name: 'Invariant Verification',
      icon: CheckSquare,
      badge: `${passedTests}/7`,
      category: 'ASSURANCE',
    },
    { id: 'logs', name: 'Event Audit Log', icon: FileText, category: 'ASSURANCE' },

    // SPECIFICATION & ARCHITECTURE
    { id: 'architecture', name: 'Hardware Architecture', icon: Network, category: 'SPECIFICATION' },
    { id: 'caa-research', name: 'Canard Actuation (CAS)', icon: Layers, category: 'SPECIFICATION' },
    { id: 'gnc-research', name: 'Guidance & Control Laws', icon: Compass, category: 'SPECIFICATION' },
    { id: 'environment', name: 'Environmental Hardening', icon: ShieldAlert, category: 'SPECIFICATION' },
    { id: 'traceability', name: 'Requirements Traceability', icon: ClipboardList, category: 'SPECIFICATION' },
    { id: 'research', name: 'Technical References', icon: BookOpen, category: 'SPECIFICATION' },
    { id: 'prototype-status', name: 'Compliance Status', icon: FileCheck, category: 'SPECIFICATION' },
  ];

  const categories = [
    { key: 'OPERATIONS', label: 'Flight Operations' },
    { key: 'SUBSYSTEMS', label: 'Avionics Subsystems' },
    { key: 'ASSURANCE', label: 'Assurance & Testing' },
    { key: 'SPECIFICATION', label: 'System Architecture' },
  ] as const;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 z-30 bg-black/60"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 bg-[#0d1017] border-r border-[#1e2330] flex flex-col shrink-0 select-none transition-all duration-150 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-14' : 'lg:w-60'} w-60`}
      >
        {/* Header / Collapse Bar */}
        <div className="h-11 px-3 flex items-center justify-between border-b border-[#1c212c]">
          {!isCollapsed && (
            <span className="text-[10px] font-mono uppercase text-slate-400 font-medium tracking-wider">
              Navigation
            </span>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1 rounded-sm text-slate-400 hover:text-white hover:bg-[#161a24] transition-colors"
              title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>

            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-sm text-slate-400 hover:text-white hover:bg-[#161a24] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-3 overflow-y-auto">
          {categories.map(({ key, label }) => {
            const items = navItems.filter((i) => i.category === key);
            if (items.length === 0) return null;

            return (
              <div key={key} className="space-y-0.5">
                {!isCollapsed && (
                  <div className="px-2 py-0.5 text-[10px] font-mono uppercase text-slate-500 font-medium tracking-wider">
                    {label}
                  </div>
                )}

                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activePage === item.id ||
                    (item.id === 'digital-twin' && activePage === 'missile-architecture');

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        onClose?.();
                      }}
                      title={item.name}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-1' : 'justify-between px-2.5'
                      } py-1.5 rounded-sm text-xs transition-colors group relative ${
                        isActive
                          ? 'bg-[#1b2230] text-white font-medium border border-[#2d384d]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-[#131720]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon
                          size={14}
                          className={isActive ? 'text-sky-400 shrink-0' : 'text-slate-400 shrink-0 group-hover:text-slate-300'}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </div>

                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-xs shrink-0 ${
                            typeof item.badge === 'number' && item.badge > 0
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-[#151922] text-slate-400 border border-[#252c3d]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Quiet Telemetry Footnote */}
        {!isCollapsed && (
          <div className="p-2.5 border-t border-[#1c212c] text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              10 Hz Stream
            </span>
            <span className="text-slate-400">BITE: PASS</span>
          </div>
        )}
      </aside>
    </>
  );
};
