import React, { useState, useEffect } from 'react';
import {
  AppProject,
  PortBinding,
  CloudflareTunnel,
  FirewallRule,
  BannedIp,
  VPSUser,
  AuditLog,
  SystemLogEntry,
  SystemMetrics
} from './types';
import { StorageService } from './services/storage';
import {
  getInitialMetrics,
  tickMetrics,
  generateRandomLog,
  updateVpsInfo
} from './services/systemSimulator';
import { ApiService } from './services/api';
import { LoginGate } from './components/LoginGate';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ProjectDeployer } from './components/ProjectDeployer';
import { PortManagerView } from './components/PortManagerView';
import { CloudflareTunnelView } from './components/CloudflareTunnelView';
import { FirewallView } from './components/FirewallView';
import { LogTerminalView } from './components/LogTerminalView';
import { UserAccessView } from './components/UserAccessView';
import { VPSSetupScriptView } from './components/VPSSetupScriptView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => StorageService.isLoggedIn());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Core Data States
  const [metrics, setMetrics] = useState<SystemMetrics>(() => getInitialMetrics());
  const [projects, setProjects] = useState<AppProject[]>(() => StorageService.getProjects());
  const [customPorts, setCustomPorts] = useState<PortBinding[]>(() => StorageService.getCustomPorts());
  const [tunnels, setTunnels] = useState<CloudflareTunnel[]>(() => StorageService.getTunnels());
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>(() => StorageService.getFirewallRules());
  const [bannedIps, setBannedIps] = useState<BannedIp[]>(() => StorageService.getBannedIps());
  const [users, setUsers] = useState<VPSUser[]>(() => StorageService.getUsers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());

  // Real-time logs buffer
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>(() => {
    return [
      { id: '1', timestamp: '02:00:15.102', level: 'info', category: 'system', message: 'BramCloud Core Daemon v2.5 started on port 3000.' },
      { id: '2', timestamp: '02:00:16.480', level: 'success', category: 'cloudflare', message: 'cloudflared[921]: Tunnel vps-singapore-primary-tunnel connected to SG edge.' },
      { id: '3', timestamp: '02:00:18.110', level: 'info', category: 'firewall', message: 'ufw: Rule active - 22/tcp (LIMIT), 80/tcp (ALLOW), 443/tcp (ALLOW).' },
      { id: '4', timestamp: '02:00:19.340', level: 'info', category: 'port', message: 'port-manager: Initialized port registry with 7 system ports and 3 app ports.' },
    ];
  });

  // Real-time metrics tick every 1.5s (queries live server API with local simulator fallback)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Load initial real system specs from server
    ApiService.getSystemInfo().then((info) => {
      if (info) {
        updateVpsInfo(info);
      }
    });

    // Check for real host system logs
    ApiService.getSystemLogs().then((realLogs) => {
      if (realLogs && realLogs.length > 0) {
        setSystemLogs((prev) => [...prev, ...realLogs.slice(-10)]);
      }
    });

    const interval = setInterval(async () => {
      const live = await ApiService.getLiveMetrics();
      if (live) {
        setMetrics(live);
      } else {
        setMetrics((prev) => tickMetrics(prev));
      }

      // Occasional realistic background log emission (35% chance every tick)
      if (Math.random() < 0.35) {
        const newLog = generateRandomLog();
        setSystemLogs((prev) => [...prev.slice(-150), newLog]);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLockSession = () => {
    StorageService.setLoggedIn(false);
    setIsAuthenticated(false);
  };

  const handleDropCaches = async () => {
    // Attempt real kernel drop-cache
    const realResult = await ApiService.dropCaches();

    setMetrics((prev) => {
      const freed = realResult?.freedMb || Math.round(prev.ramCachedMb * 0.65);
      return {
        ...prev,
        ramUsedMb: Math.max(1600, prev.ramUsedMb - 300),
        ramCachedMb: Math.max(300, prev.ramCachedMb - freed),
        ramFreeMb: prev.ramFreeMb + freed + 300,
      };
    });

    const logEntry: SystemLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      level: 'success',
      category: 'system',
      message: `kernel: drop_caches sync executed. ${realResult?.freedMb || 1240} MB pagecache freed.`,
    };
    setSystemLogs((prev) => [...prev, logEntry]);
  };

  if (!isAuthenticated) {
    return <LoginGate onSuccess={() => setIsAuthenticated(true)} />;
  }

  const activePortCount = 7 + projects.length + customPorts.length;
  const runningProjectsCount = projects.filter((p) => p.status === 'running').length;

  return (
    <div className="min-h-screen bg-sky-50/60 text-slate-800 flex flex-col font-sans selection:bg-sky-200 selection:text-sky-900">
      {/* Top Navbar */}
      <Navbar
        metrics={metrics}
        activePortCount={activePortCount}
        tunnelActive={tunnels[0]?.status === 'healthy'}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onLockSession={handleLockSession}
        onOpenDeployModal={() => setCurrentTab('deployer')}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeProjectsCount={runningProjectsCount}
          activePortsCount={activePortCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardOverview
              metrics={metrics}
              projects={projects}
              tunnels={tunnels}
              onNavigateTab={setCurrentTab}
              onDropCaches={handleDropCaches}
              onOpenDeployModal={() => setCurrentTab('deployer')}
            />
          )}

          {currentTab === 'deployer' && (
            <ProjectDeployer
              projects={projects}
              customPorts={customPorts}
              tunnels={tunnels}
              onUpdateProjects={setProjects}
              onUpdateTunnels={setTunnels}
            />
          )}

          {currentTab === 'ports' && (
            <PortManagerView
              projects={projects}
              customPorts={customPorts}
              onUpdateCustomPorts={setCustomPorts}
              onUpdateProjects={setProjects}
            />
          )}

          {currentTab === 'cloudflare' && (
            <CloudflareTunnelView
              tunnels={tunnels}
              projects={projects}
              onUpdateTunnels={setTunnels}
            />
          )}

          {currentTab === 'firewall' && (
            <FirewallView
              rules={firewallRules}
              bannedIps={bannedIps}
              onUpdateRules={setFirewallRules}
              onUpdateBannedIps={setBannedIps}
            />
          )}

          {currentTab === 'logs' && (
            <LogTerminalView
              logs={systemLogs}
              metrics={metrics}
              projects={projects}
              tunnels={tunnels}
              onClearLogs={() => setSystemLogs([])}
            />
          )}

          {currentTab === 'users' && (
            <UserAccessView
              users={users}
              auditLogs={auditLogs}
              onUpdateUsers={setUsers}
            />
          )}

          {currentTab === 'setup_script' && <VPSSetupScriptView />}
        </main>
      </div>
    </div>
  );
}
