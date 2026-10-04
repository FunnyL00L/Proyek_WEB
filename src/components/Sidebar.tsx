import React from 'react';
import {
  LayoutDashboard,
  Rocket,
  Network,
  Globe2,
  Shield,
  Terminal,
  Users,
  Code2,
  X,
  Server
} from 'lucide-react';
import { VPS_INFO } from '../services/systemSimulator';

export type NavTab =
  | 'dashboard'
  | 'deployer'
  | 'ports'
  | 'cloudflare'
  | 'firewall'
  | 'logs'
  | 'users'
  | 'setup_script';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  activeProjectsCount: number;
  activePortsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  activeProjectsCount,
  activePortsCount,
}) => {
  const menuItems: Array<{
    id: NavTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    counter?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Ringkasan Server',
      sublabel: 'Metrik & Performa Live',
      icon: LayoutDashboard,
    },
    {
      id: 'deployer',
      label: 'Deploy Proyek',
      sublabel: 'Upload Build & Port Otomatis',
      icon: Rocket,
      counter: activeProjectsCount,
    },
    {
      id: 'ports',
      label: 'Manajemen Port',
      sublabel: 'Peta Alokasi Bebas Bentrok',
      icon: Network,
      counter: activePortsCount,
    },
    {
      id: 'cloudflare',
      label: 'Cloudflare Tunnel',
      sublabel: 'Zero Trust Ingress Routing',
      icon: Globe2,
    },
    {
      id: 'firewall',
      label: 'Firewall & UFW',
      sublabel: 'Aturan Port & Fail2ban',
      icon: Shield,
    },
    {
      id: 'logs',
      label: 'Log & Web Shell',
      sublabel: 'Live Stream & Konsol Linux',
      icon: Terminal,
    },
    {
      id: 'users',
      label: 'Akses & SSH',
      sublabel: 'Akun Sudo & Kunci Publik',
      icon: Users,
    },
    {
      id: 'setup_script',
      label: 'Script Auto VPS',
      sublabel: 'Installer Shell & Docker',
      icon: Code2,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-14 z-50 lg:z-20 h-screen lg:h-[calc(100vh-3.5rem)] w-64 bg-slate-50/90 lg:bg-transparent border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header inside drawer */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 lg:hidden bg-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-slate-900">BramCloud</span>
            <span className="text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-mono">vps-sg-01</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="p-3 space-y-0.5 overflow-y-auto flex-1">
          <div className="px-3 pt-3 pb-2 text-[11px] font-medium tracking-wider uppercase text-slate-400">
            Infrastruktur
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <div className="truncate">
                    <p className={`leading-tight truncate ${isActive ? 'text-white font-semibold' : 'text-slate-800'}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] leading-tight truncate ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                      {item.sublabel}
                    </p>
                  </div>
                </div>

                {item.counter !== undefined && (
                  <span
                    className={`ml-2 text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded font-semibold ${
                      isActive ? 'bg-sky-700 text-white' : 'text-slate-500 bg-slate-200/60'
                    }`}
                  >
                    {item.counter}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quiet Server Node Telemetry Box */}
        <div className="p-3 border-t border-slate-200/80">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-500 font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-700 font-sans font-semibold mb-1 text-xs">
              <span>Node SG-01</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Nominal
              </span>
            </div>
            <p className="flex justify-between">
              <span className="text-slate-400">Kernel:</span>
              <span className="text-slate-700">6.8.0 Linux</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">IP:</span>
              <span className="text-sky-700 font-medium">{VPS_INFO.publicIp}</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
