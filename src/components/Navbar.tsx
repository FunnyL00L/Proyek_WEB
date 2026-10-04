import React, { useState, useEffect } from 'react';
import {
  Menu,
  Lock,
  Plus
} from 'lucide-react';
import { SystemMetrics } from '../types';
import { VPS_INFO } from '../services/systemSimulator';

interface NavbarProps {
  metrics: SystemMetrics;
  activePortCount: number;
  tunnelActive: boolean;
  onToggleSidebar: () => void;
  onLockSession: () => void;
  onOpenDeployModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  metrics,
  activePortCount,
  tunnelActive,
  onToggleSidebar,
  onLockSession,
  onOpenDeployModal,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const ramUsedGb = (metrics.ramUsedMb / 1024).toFixed(1);
  const ramTotalGb = (metrics.ramTotalMb / 1024).toFixed(0);

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Zone 1: Single Brand Element */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle Menu"
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a href="/" className="flex items-baseline gap-2 group">
          <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-sky-700 transition-colors">
            BramCloud
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            vps-sg-01
          </span>
        </a>
      </div>

      {/* Zone 2: Quiet unboxed telemetry with typographic separators (NO PILLS) */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-slate-700 font-medium">Node 1</span>
        </div>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>CPU <strong className="text-slate-800 font-semibold">{metrics.cpuUsage.toFixed(1)}%</strong></span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>RAM <strong className="text-slate-800 font-semibold">{ramUsedGb}/{ramTotalGb}GB</strong></span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>Port <strong className="text-slate-800 font-semibold">{activePortCount}</strong></span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span className="text-slate-600">Tunnel <strong className="text-sky-700 font-semibold">Active</strong></span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span className="text-slate-400">{time}</span>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenDeployModal}
          className="px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer active:scale-98 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Deploy Proyek</span>
        </button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block mx-1" />

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-800 hidden sm:inline">Bram</span>
          <button
            type="button"
            onClick={onLockSession}
            title="Kunci Sesi"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
