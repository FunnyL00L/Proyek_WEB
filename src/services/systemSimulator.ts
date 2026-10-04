import { SystemMetrics, SystemLogEntry } from '../types';

export const VPS_INFO = {
  hostname: 'vps-sg-01.bramnet.id',
  publicIp: '103.179.54.21',
  privateIp: '10.0.4.15',
  location: 'Singapore (Equinix SG3 Datacenter)',
  os: 'Ubuntu 24.04.1 LTS (Noble Numbat 64-bit)',
  kernel: 'Linux 6.8.0-45-generic x86_64',
  virtualization: 'KVM Dedicated vCPU',
  cores: 4,
  cpuModel: 'AMD EPYC 7702 4-Core Processor @ 3.35GHz',
  ramTotalMb: 8192,
  swapTotalMb: 4096,
  diskTotalGb: 80.0,
  installedEngines: ['Node.js v20.12.2', 'Nginx 1.24.0', 'cloudflared 2026.8.0', 'UFW 0.36.2', 'PM2 5.3.1', 'Docker 27.2.0'],
};

let currentUptime = 24 * 3600 * 18 + 3600 * 7 + 420; // 18d 7h 7m
let currentCpu = 18.4;
let currentRamUsed = 3140; // MB
let currentCached = 1850; // MB
let currentDiskUsed = 28.4; // GB
let currentRx = 450; // kbps
let currentTx = 780; // kbps

const sampleLogPool: Array<{ level: SystemLogEntry['level']; category: SystemLogEntry['category']; msg: string }> = [
  { level: 'info', category: 'system', msg: 'systemd[1]: Started BramCloud Process Monitor worker.' },
  { level: 'info', category: 'port', msg: 'kernel: TCP connection established on port 3001 from 108.162.245.12' },
  { level: 'info', category: 'cloudflare', msg: 'cloudflared[921]: Connection to Singapore edge cf-edge-03 OK (RTT: 4.2ms)' },
  { level: 'info', category: 'system', msg: 'cron[624]: (root) CMD (/usr/local/bin/vps-healthcheck > /dev/null 2>&1)' },
  { level: 'success', category: 'deploy', msg: 'pm2[3412]: App "bram-store" online - Health check passed in 12ms' },
  { level: 'warn', category: 'firewall', msg: 'ufw[audit]: [UFW BLOCK] IN=eth0 OUT= SRC=185.190.14.22 SPT=51290 DPT=23 PROTO=TCP' },
  { level: 'info', category: 'port', msg: 'nginx[1042]: 103.179.54.21 - "GET /api/v1/health HTTP/1.1" 200 48' },
  { level: 'info', category: 'cloudflare', msg: 'cloudflared[921]: Registered tunnel tunnel-sg-01 with 4 active routes' },
  { level: 'info', category: 'system', msg: 'kernel: [RAM] Page cache sync completed successfully' }
];

export function getInitialMetrics(): SystemMetrics {
  return {
    cpuUsage: currentCpu,
    cpuCores: VPS_INFO.cores,
    cpuModel: VPS_INFO.cpuModel,
    loadAverage: [0.42, 0.58, 0.65],
    ramTotalMb: VPS_INFO.ramTotalMb,
    ramUsedMb: currentRamUsed,
    ramCachedMb: currentCached,
    ramFreeMb: VPS_INFO.ramTotalMb - (currentRamUsed + currentCached),
    swapTotalMb: VPS_INFO.swapTotalMb,
    swapUsedMb: 320,
    diskTotalGb: VPS_INFO.diskTotalGb,
    diskUsedGb: currentDiskUsed,
    diskReadMbs: 1.4,
    diskWriteMbs: 3.8,
    networkRxKbps: currentRx,
    networkTxKbps: currentTx,
    uptimeSeconds: currentUptime,
    temperatureC: 41.5,
  };
}

export function tickMetrics(prev: SystemMetrics): SystemMetrics {
  currentUptime += 1;

  // Gentle realistic oscillation
  const deltaCpu = (Math.random() - 0.48) * 3.5;
  const newCpu = Math.max(5.2, Math.min(88.0, +(prev.cpuUsage + deltaCpu).toFixed(1)));

  const deltaRam = (Math.random() - 0.5) * 20;
  const newRamUsed = Math.max(1800, Math.min(6800, Math.round(prev.ramUsedMb + deltaRam)));
  const newFree = Math.max(200, prev.ramTotalMb - (newRamUsed + prev.ramCachedMb));

  const newRx = Math.max(120, Math.round(prev.networkRxKbps + (Math.random() - 0.5) * 140));
  const newTx = Math.max(200, Math.round(prev.networkTxKbps + (Math.random() - 0.5) * 180));

  const l1 = +(newCpu / 35 + 0.1).toFixed(2);
  const l5 = +(prev.loadAverage[1] * 0.98 + l1 * 0.02).toFixed(2);
  const l15 = +(prev.loadAverage[2] * 0.99 + l5 * 0.01).toFixed(2);

  return {
    ...prev,
    cpuUsage: newCpu,
    ramUsedMb: newRamUsed,
    ramFreeMb: newFree,
    networkRxKbps: newRx,
    networkTxKbps: newTx,
    uptimeSeconds: currentUptime,
    loadAverage: [l1, l5, l15],
    diskReadMbs: +(Math.random() * 2.2).toFixed(1),
    diskWriteMbs: +(Math.random() * 4.5).toFixed(1),
  };
}

export function generateRandomLog(): SystemLogEntry {
  const item = sampleLogPool[Math.floor(Math.random() * sampleLogPool.length)];
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

  return {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: timeStr,
    level: item.level,
    category: item.category,
    message: item.msg,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}h ${h}j ${m}m ${s}d`;
}

export function updateVpsInfo(info: Partial<typeof VPS_INFO>) {
  if (info.hostname) VPS_INFO.hostname = info.hostname;
  if (info.publicIp) VPS_INFO.publicIp = info.publicIp;
  if ((info as any).osDistro) VPS_INFO.os = (info as any).osDistro;
  if (info.kernel) VPS_INFO.kernel = info.kernel;
  if (info.cpuModel) VPS_INFO.cpuModel = info.cpuModel;
  if (info.cores) VPS_INFO.cores = info.cores;
  if (info.ramTotalMb) VPS_INFO.ramTotalMb = info.ramTotalMb;
  if (info.installedEngines && Array.isArray(info.installedEngines)) {
    VPS_INFO.installedEngines = info.installedEngines;
  }
}
