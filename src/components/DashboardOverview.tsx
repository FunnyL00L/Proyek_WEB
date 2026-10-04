import React, { useState } from 'react';
import {
  RotateCw,
  Trash2,
  ArrowUpRight,
  Check,
  Plus,
  Terminal,
  ExternalLink,
  Play,
  Square,
  HardDrive,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Database
} from 'lucide-react';
import { SystemMetrics, AppProject, CloudflareTunnel, StorageDevice } from '../types';
import { VPS_INFO, formatUptime } from '../services/systemSimulator';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';

interface DashboardOverviewProps {
  metrics: SystemMetrics;
  projects: AppProject[];
  tunnels: CloudflareTunnel[];
  onNavigateTab: (tab: any) => void;
  onDropCaches: () => void;
  onOpenDeployModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  metrics,
  projects,
  tunnels,
  onNavigateTab,
  onDropCaches,
  onOpenDeployModal,
}) => {
  const [cleaningCache, setCleaningCache] = useState(false);
  const [cacheCleanedSuccess, setCacheCleanedSuccess] = useState(false);
  const [cleaningStorage, setCleaningStorage] = useState(false);
  const [storageCleanedSuccess, setStorageCleanedSuccess] = useState<string | null>(null);

  const ramUsedPercent = Math.round((metrics.ramUsedMb / metrics.ramTotalMb) * 100);
  const diskUsedPercent = Math.round((metrics.diskUsedGb / metrics.diskTotalGb) * 100);
  const runningProjects = projects.filter((p) => p.status === 'running');

  const storageDevices = metrics.storageDevices && metrics.storageDevices.length > 0
    ? metrics.storageDevices
    : [
        {
          id: 'disk-root',
          name: 'Media 1: Sistem Root OS (eMMC/SD)',
          device: '/dev/mmcblk0p1',
          mountPoint: '/',
          fsType: 'ext4',
          totalGb: 6.5,
          usedGb: 4.8,
          freeGb: 1.7,
          usedPercent: 74,
          isPrimary: true,
          role: 'system_root' as const,
          status: 'warning' as const,
          speedRate: '42 MB/s Read / 28 MB/s Write',
          notes: 'Partisi sistem utama OS Armbian. Ruang sisa 1.7 GB (74% terpakai).',
        },
        {
          id: 'disk-ssd-secondary',
          name: 'Media 2: SSD Sekunder (/mnt/ssd_temp)',
          device: '/dev/sda1',
          mountPoint: '/mnt/ssd_temp',
          fsType: 'ext4',
          totalGb: 240.0,
          usedGb: 18.4,
          freeGb: 221.6,
          usedPercent: 8,
          isPrimary: false,
          role: 'ssd_secondary' as const,
          status: 'healthy' as const,
          speedRate: '280 MB/s Read / 245 MB/s Write (High-Speed)',
          notes: 'Penyimpanan utama proyek web, folder upload, dist build, dan WebDAV storage.',
        },
      ];

  const handleCleanStorage = async () => {
    setCleaningStorage(true);
    const res = await ApiService.cleanStorage();
    setCleaningStorage(false);
    setStorageCleanedSuccess(res?.message || 'Cache paket apt & vacuum log berhasil dibersihkan.');
    StorageService.logAudit('STORAGE_CLEANUP', 'Pembersihan Media 1 (Root eMMC)', 'success');
    setTimeout(() => setStorageCleanedSuccess(null), 4000);
  };

  const handleCleanCache = () => {
    setCleaningCache(true);
    setTimeout(() => {
      onDropCaches();
      setCleaningCache(false);
      setCacheCleanedSuccess(true);
      StorageService.logAudit('CACHE_DROP', 'system drop_caches sync', 'success');
      setTimeout(() => setCacheCleanedSuccess(false), 3000);
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Editorial Header Section */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-1.5">
              <span>{VPS_INFO.hostname}</span>
              <span aria-hidden="true">/</span>
              <span>{VPS_INFO.publicIp}</span>
              <span aria-hidden="true">/</span>
              <span className="text-emerald-700 font-medium">Nominal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Infrastruktur Server & Pemantau Real-Time
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Manajemen proses aplikasi terisolasi per port, ingress Cloudflare Tunnel otomatis, dan pemantauan beban server.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenDeployModal}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy Proyek Baru</span>
            </button>
            <button
              onClick={() => onNavigateTab('logs')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Buka Terminal</span>
            </button>
          </div>
        </div>

        {/* Server detail row with subtle hairline dividers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 mt-4 border-t border-slate-100 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Sistem Operasi</span>
            <span className="font-medium text-slate-800">Ubuntu 24.04 (6.8.0)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Prosesor</span>
            <span className="font-medium text-slate-800">4 vCPU EPYC @ 3.35GHz</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Uptime</span>
            <span className="font-medium text-slate-800">{formatUptime(metrics.uptimeSeconds)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Datacenter</span>
            <span className="font-medium text-slate-800">Singapore SG3 (4ms)</span>
          </div>
        </div>
      </div>

      {/* 4 Core Real-Time Metric Tiles (Single-elevation, hairline borders, tabular numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Beban CPU</span>
              <span className="font-mono text-[11px]">{metrics.temperatureC}°C</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
                {metrics.cpuUsage.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 4 Cores</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.cpuUsage > 80 ? 'bg-rose-500' : 'bg-sky-600'
                }`}
                style={{ width: `${Math.min(100, metrics.cpuUsage)}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
            <span>Load Avg (1/5/15m)</span>
            <span className="text-slate-700">{metrics.loadAverage.join(' · ')}</span>
          </div>
        </div>

        {/* RAM */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Memori RAM</span>
              <span className="font-mono text-[11px]">{ramUsedPercent}%</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
                {(metrics.ramUsedMb / 1024).toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {(metrics.ramTotalMb / 1024).toFixed(0)} GB
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-sky-600 transition-all duration-300"
                style={{ width: `${ramUsedPercent}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
            <span>Cache: {metrics.ramCachedMb} MB</span>
            <span>Free: {metrics.ramFreeMb} MB</span>
          </div>
        </div>

        {/* Dual Storage Drive (Root eMMC + Secondary SSD) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                <span>Dual Storage (2 Media)</span>
              </span>
              <span className="font-mono text-[11px] text-amber-600 font-semibold">Root 74% · SSD 8%</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
                {metrics.diskUsedGb.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {metrics.diskTotalGb} GB Total</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3 flex">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${(storageDevices[0]?.usedPercent || 74) * 0.4}%` }}
                title="Root eMMC Partisi"
              />
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${(storageDevices[1]?.usedPercent || 8) * 0.6}%` }}
                title="Secondary SSD"
              />
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
            <span className="text-amber-700">Root: 6.5G (74%)</span>
            <span className="text-emerald-700">SSD: 240G (8%)</span>
          </div>
        </div>

        {/* Network */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Trafik eth0</span>
              <span className="font-mono text-[11px] text-emerald-600 font-semibold">1 Gbps</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">RX (Download)</span>
                <span className="text-lg font-bold text-slate-800 tabular-nums">
                  {metrics.networkRxKbps} <span className="text-xs font-normal text-slate-400">KB/s</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">TX (Upload)</span>
                <span className="text-lg font-bold text-slate-800 tabular-nums">
                  {metrics.networkTxKbps} <span className="text-xs font-normal text-slate-400">KB/s</span>
                </span>
              </div>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
            <span>Transfer Bulan Ini</span>
            <span className="text-slate-700">142.8 GB</span>
          </div>
        </div>
      </div>

      {/* Middle Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Memory & Cache Management */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Pengelolaan Memori & Swap
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Bebaskan buffer cache Linux dan bersihkan file sementara.
            </p>

            {cacheCleanedSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Buffer cache dibebaskan: 1.2 GB memori siap pakai.</span>
              </div>
            )}

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-sans">Swap Memory</span>
                <span className="text-slate-800">{metrics.swapUsedMb} MB / {metrics.swapTotalMb} MB</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-sans">Web Storage (/var/www)</span>
                <span className="text-slate-800">6.4 GB ({projects.length} Proyek)</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={handleCleanCache}
              disabled={cleaningCache}
              className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3 h-3 ${cleaningCache ? 'animate-spin' : ''}`} />
              <span>{cleaningCache ? 'Membersihkan...' : 'Drop RAM Caches'}</span>
            </button>
            <button
              onClick={() => {
                alert('Pembersihan paket apt cache selesai.');
                StorageService.logAudit('DISK_CLEANUP', 'apt-get clean & logrotate', 'success');
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Bersihkan Paket APT"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cloudflare Tunnel Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-sm text-slate-900">
                Cloudflare Zero Trust
              </h3>
              <span className="text-xs text-emerald-600 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Tunneling aman tanpa mengekspos IP publik server.
            </p>

            {tunnels[0] && (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">Tunnel Name</span>
                  <span className="text-slate-800">{tunnels[0].name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">Ingress Routes</span>
                  <span className="text-sky-700 font-medium">{tunnels[0].ingressRules.length} Hostnames</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-sans">Tunnel Traffic</span>
                  <span className="text-slate-800">{tunnels[0].metrics.dataTransferredMb} MB</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('cloudflare')}
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Kelola Ingress Domain</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Port Status & Guard */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-sm text-slate-900">
                Alokasi Port Bebas Bentrok
              </h3>
              <span className="text-xs text-slate-400 font-mono">Guarded</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Sistem memverifikasi port agar tidak tumpang tindih.
            </p>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-sans">Port Terpakai</span>
                <span className="text-lg font-bold font-mono text-slate-800">
                  {7 + projects.length}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-sans">Port Tersedia</span>
                <span className="text-lg font-bold font-mono text-emerald-700">
                  {65535 - (7 + projects.length)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Port sistem (22, 80, 443, 3000) dan port aplikasi diisolasi secara ketat.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('ports')}
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Lihat Tabel Port Lengkap</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Dual Media Storage In-Depth Analyzer Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-sky-50 text-sky-700 rounded-lg">
                <HardDrive className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-base text-slate-900">
                Analisis Dual Media Penyimpanan (Auto-Discovered Multi-Drive)
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                2 Drive Terdeteksi
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Sistem secara otomatis mendeteksi partisi fisik Linux pada VPS Anda dan memberikan rekomendasi alokasi beban.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleCleanStorage}
              disabled={cleaningStorage}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${cleaningStorage ? 'animate-spin' : ''}`} />
              <span>{cleaningStorage ? 'Membersihkan Disk...' : 'Bersihkan Cache & Log Root'}</span>
            </button>
          </div>
        </div>

        {storageCleanedSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{storageCleanedSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {storageDevices.map((device, idx) => {
            const isWarning = device.usedPercent >= 70;
            return (
              <div
                key={device.id || idx}
                className={`rounded-xl p-4 sm:p-5 border transition-all ${
                  isWarning
                    ? 'bg-amber-50/40 border-amber-200/90 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200/90 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900">{device.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                          isWarning
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isWarning ? `⚠️ Kapasitas ${device.usedPercent}% (Perlu Diperhatikan)` : '✅ Lapang & Optimal'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                      <span>Mount: <strong>{device.mountPoint}</strong></span>
                      <span>•</span>
                      <span>Dev: {device.device}</span>
                      <span>•</span>
                      <span>FS: {device.fsType || 'ext4'}</span>
                    </div>
                  </div>

                  <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                    {device.usedPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      device.usedPercent > 80
                        ? 'bg-rose-500'
                        : device.usedPercent > 65
                        ? 'bg-amber-500'
                        : 'bg-sky-600'
                    }`}
                    style={{ width: `${Math.min(100, device.usedPercent)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-white/80 rounded-lg border border-slate-200/70 text-xs font-mono mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Total</span>
                    <span className="font-bold text-slate-800">{device.totalGb} GB</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Terpakai</span>
                    <span className={`font-bold ${isWarning ? 'text-amber-700' : 'text-slate-800'}`}>
                      {device.usedGb} GB
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Tersedia</span>
                    <span className="font-bold text-emerald-700">{device.freeGb} GB</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 leading-relaxed bg-white/60 p-2.5 rounded-lg border border-slate-200/60">
                  <span className="font-semibold text-slate-700 block mb-0.5">Analisis & Fungsi Rekomendasi:</span>
                  <p>{device.notes}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* High-Density Active Projects Data Grid (Clean table, unboxed metadata, no row dot scatter) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Proyek Web Berjalan di VPS
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {runningProjects.length} aplikasi aktif · Port unik terisolasi · Cloudflare Tunnel sinkron
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('deployer')}
            className="text-xs font-medium text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Buka Deployer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            Belum ada proyek yang di-deploy. Klik "Deploy Proyek Baru" untuk mengunggah build web Anda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Aplikasi</th>
                  <th className="py-2.5 px-4 font-medium">Port</th>
                  <th className="py-2.5 px-4 font-medium">Domain Tunnel</th>
                  <th className="py-2.5 px-4 font-medium">Penggunaan Memori</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{proj.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">/{proj.slug}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      :{proj.port}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {proj.cloudflareDomain ? (
                        <span className="text-sky-700">{proj.cloudflareDomain}</span>
                      ) : (
                        <span className="text-slate-400">localhost:{proj.port}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {proj.memoryMb.toFixed(1)} MB · {proj.cpuPercent}% CPU
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-medium ${
                        proj.status === 'running' ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {proj.status === 'running' ? 'Running' : 'Stopped'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigateTab('deployer')}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        Buka Kelola
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
