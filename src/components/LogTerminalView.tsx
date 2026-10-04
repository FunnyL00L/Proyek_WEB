import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Trash2,
  Download,
  Search,
  Terminal,
  Activity
} from 'lucide-react';
import { SystemLogEntry, SystemMetrics, AppProject, CloudflareTunnel } from '../types';
import { VPS_INFO, formatUptime } from '../services/systemSimulator';

interface LogTerminalViewProps {
  logs: SystemLogEntry[];
  metrics: SystemMetrics;
  projects: AppProject[];
  tunnels: CloudflareTunnel[];
  onClearLogs: () => void;
}

export const LogTerminalView: React.FC<LogTerminalViewProps> = ({
  logs,
  metrics,
  projects,
  tunnels,
  onClearLogs,
}) => {
  const [activeView, setActiveView] = useState<'stream' | 'terminal'>('stream');
  const [isPaused, setIsPaused] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; output: string }>>([
    {
      cmd: 'neofetch',
      output: `       .---.          bram@vps-sg-01
      /     \\         --------------
     | () () |        OS: Ubuntu 24.04.1 LTS x86_64
      \\  _  /         Kernel: 6.8.0-45-generic
       \`---\`          Uptime: ${formatUptime(metrics.uptimeSeconds)}
                      CPU: AMD EPYC 7702 (4 Cores @ 3.35GHz)
                      Memory: ${metrics.ramUsedMb}MB / ${metrics.ramTotalMb}MB
                      Disk: ${metrics.diskUsedGb}GB / 80GB NVMe
                      Public IP: ${VPS_INFO.publicIp}
                      Cloudflare: Active (Singapore Edge)`
    }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  useEffect(() => {
    if (activeView === 'terminal' && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory, activeView]);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch = l.message.toLowerCase().includes(searchFilter.toLowerCase()) || l.category.includes(searchFilter.toLowerCase());
    const matchesCat = categoryFilter === 'all' || l.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleRunCommand = (e?: React.FormEvent, customCmd?: string) => {
    if (e) e.preventDefault();
    const cmdToRun = (customCmd || terminalInput).trim();
    if (!cmdToRun) return;

    let output = '';
    const lower = cmdToRun.toLowerCase();

    if (lower === 'help') {
      output = `Perintah didukung:
  neofetch                - Info host dan spesifikasi CPU/RAM
  ports / netstat         - Daftar port yang sedang listening
  ufw status              - Status aturan firewall
  cloudflared tunnel list - Status rute tunnel Cloudflare
  pm2 list                - Daftar proses proyek web
  free -m                 - Status memori RAM dan Swap
  df -h                   - Partisi disk NVMe
  whoami                  - Akun aktif
  clear                   - Bersihkan layar`;
    } else if (lower === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    } else if (lower === 'whoami') {
      output = 'Bram (Super Admin)';
    } else if (lower === 'free -m') {
      output = `               total        used        free      shared  buff/cache   available
Mem:            8192        ${metrics.ramUsedMb}        ${metrics.ramFreeMb}          12        ${metrics.ramCachedMb}        4820
Swap:           4096         ${metrics.swapUsedMb}        3776`;
    } else if (lower === 'df -h') {
      output = `Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        80G   ${metrics.diskUsedGb}G   ${(metrics.diskTotalGb - metrics.diskUsedGb).toFixed(1)}G  ${Math.round((metrics.diskUsedGb / metrics.diskTotalGb) * 100)}% /`;
    } else if (lower === 'ports' || lower.includes('netstat')) {
      output = `Proto Local Address           State       PID/Program
tcp   0.0.0.0:22              LISTEN      482/sshd
tcp   0.0.0.0:80              LISTEN      1042/nginx
tcp   0.0.0.0:443             LISTEN      1042/nginx
tcp   0.0.0.0:3000            LISTEN      2190/bramcloud
${projects.map((p) => `tcp   0.0.0.0:${p.port.toString().padEnd(16)}LISTEN      ${p.status === 'running' ? '3412/' + p.slug : 'STOPPED'}`).join('\n')}`;
    } else if (lower.includes('ufw')) {
      output = `Status: active
To                         Action      From
22/tcp                     LIMIT       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
3000/tcp                   ALLOW       Anywhere`;
    } else if (lower.includes('cloudflared')) {
      output = `Tunnel ID: ${tunnels[0]?.tunnelId}
Connections: 4 (Singapore edge established)
Ingress:
${tunnels[0]?.ingressRules.map((r) => `  - https://${r.hostname} -> :${r.servicePort}`).join('\n')}`;
    } else if (lower.includes('pm2') || lower.includes('ps')) {
      output = `App Name                      Port     Status   Memory    CPU
bramcloud-panel               3000     online   48.2 MB   0.8%
${projects.map((p) => `${p.slug.padEnd(30)} :${p.port.toString().padEnd(7)} ${p.status.padEnd(8)} ${(p.memoryMb.toFixed(1) + ' MB').padEnd(9)} ${p.cpuPercent}%`).join('\n')}`;
    } else {
      output = `bash: ${cmdToRun}: command not found. Ketik 'help' untuk daftar perintah.`;
    }

    setTerminalHistory((prev) => [...prev, { cmd: cmdToRun, output }]);
    setTerminalInput('');
  };

  const exportLogsAsText = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.category}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vps-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Log Sistem & Konsol Terminal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Aliran log server real-time (kernel, port, nginx, fail2ban) dan konsol shell interaktif web.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveView('stream')}
            className={`px-3 py-1 font-medium rounded transition-colors flex items-center gap-1.5 ${
              activeView === 'stream' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>Live Stream</span>
          </button>
          <button
            onClick={() => setActiveView('terminal')}
            className={`px-3 py-1 font-medium rounded transition-colors flex items-center gap-1.5 ${
              activeView === 'terminal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>Web Shell</span>
          </button>
        </div>
      </div>

      {activeView === 'stream' ? (
        /* Live Stream Viewer */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-[560px]">
          <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Cari pesan log..."
                  className="pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-48"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="system">System</option>
                <option value="port">Port</option>
                <option value="cloudflare">Cloudflare</option>
                <option value="firewall">Firewall</option>
                <option value="deploy">Deploy</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                <span>{isPaused ? 'Lanjut' : 'Jeda'}</span>
              </button>

              <button
                onClick={exportLogsAsText}
                className="p-1 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded transition-colors"
                title="Unduh (.txt)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onClearLogs}
                className="p-1 text-rose-600 hover:text-rose-800 bg-white border border-slate-200 rounded transition-colors"
                title="Bersihkan Log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={logContainerRef}
            className="flex-1 p-4 bg-slate-950 font-mono text-xs overflow-y-auto space-y-1 text-slate-300"
          >
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-600 font-sans">
                Tidak ada log yang sesuai filter.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/60 p-0.5 rounded">
                  <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className="text-slate-400 uppercase text-[10px] w-16 shrink-0">{log.category}</span>
                  <span className={
                    log.level === 'error' ? 'text-rose-400' : log.level === 'warn' ? 'text-amber-400' : 'text-slate-200'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Terminal Shell View */
        <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[560px] font-mono text-xs">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
            <span>bram@vps-sg-01: ~ (bash 5.2)</span>
            <span className="text-[11px] text-slate-500">Ubuntu 24.04</span>
          </div>

          <div className="px-4 py-1.5 bg-slate-900/40 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-500 mr-1 shrink-0 font-sans">Perintah cepat:</span>
            {['help', 'neofetch', 'ports', 'pm2 list', 'ufw status', 'free -m', 'df -h', 'clear'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleRunCommand(undefined, c)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2 text-slate-200">
            {terminalHistory.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-emerald-400 font-semibold">bram@vps-sg-01</span>
                  <span>:</span>
                  <span className="text-sky-400">~</span>
                  <span>$</span>
                  <span className="text-white">{item.cmd}</span>
                </div>
                {item.output && (
                  <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed pl-2 font-mono">
                    {item.output}
                  </pre>
                )}
              </div>
            ))}
            <div ref={terminalBottomRef} />
          </div>

          <form
            onSubmit={(e) => handleRunCommand(e)}
            className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
          >
            <div className="flex items-center gap-1.5 text-slate-400 font-mono">
              <span className="text-emerald-400">bram@vps-sg-01</span>
              <span>:~$</span>
            </div>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="help, ports, pm2 list, df -h..."
              className="flex-1 bg-transparent text-white focus:outline-none font-mono text-xs"
              autoFocus
            />
          </form>
        </div>
      )}
    </div>
  );
};
