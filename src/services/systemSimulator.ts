import { SystemMetrics, SystemLogEntry } from '../types';

export const VPS_INFO = {
  hostname: 'gitainfo.online',
  publicIp: '103.143.220.18',
  privateIp: '192.168.30.135',
  location: 'Indonesia (Armbian S905x Node)',
  os: 'Armbian Linux (Ubuntu 24.04 noble)',
  kernel: 'Linux 6.1.137-ophub aarch64',
  virtualization: 'Baremetal ARMv8 (Aml.S905x Quad-Core)',
  cores: 4,
  cpuModel: 'Amlogic S905x ARMv8 Processor (Cortex-A53 @ 1.51GHz)',
  ramTotalMb: 788,
  swapTotalMb: 394,
  diskTotalGb: 246.5,
  installedEngines: ['Node.js v20.x', 'Nginx 1.24', 'cloudflared (Tunnel Active)', 'UFW Firewall', 'PM2', 'WebDAV Storage'],
};

let currentUptime = 13 * 24 * 3600 + 9 * 3600 + 480; // 13 days 9h
let currentCpu = 7.4;
let currentRamUsed = 458; // MB (58% of 788M)
let currentCached = 142; // MB
let currentRx = 240; // kbps
let currentTx = 380; // kbps

const sampleLogPool: Array<{ level: SystemLogEntry['level']; category: SystemLogEntry['category']; msg: string }> = [
  { level: 'info', category: 'system', msg: 'systemd[1]: BramCloud Daemon healthy on Armbian noble.' },
  { level: 'info', category: 'port', msg: 'kernel: TCP connection established on port 3000 from 192.168.30.1' },
  { level: 'info', category: 'cloudflare', msg: 'cloudflared[tunnel]: Connection to Cloudflare edge OK (RTT: 38ms)' },
  { level: 'info', category: 'system', msg: 'cron: (root) CMD (/usr/local/bin/armbian-ram-sync)' },
  { level: 'success', category: 'deploy', msg: 'pm2: App "proyek-web" online in fork mode on SSD /mnt/ssd_temp' },
  { level: 'info', category: 'firewall', msg: 'ufw: Rule active - 22/tcp (SSH), 3000/tcp (WEB), 8080/tcp (WEBDAV)' },
  { level: 'info', category: 'port', msg: 'cloudflared: Route app.gitainfo.online -> localhost:3000 200 OK' },
  { level: 'info', category: 'cloudflare', msg: 'cloudflared: Route folder.gitainfo.online -> localhost:8080 200 OK' },
  { level: 'info', category: 'system', msg: 'kernel: Storage auto-check /mnt/ssd_temp (ext4) mounted clean' }
];

export function getInitialMetrics(): SystemMetrics {
  return {
    cpuUsage: currentCpu,
    cpuCores: VPS_INFO.cores,
    cpuModel: VPS_INFO.cpuModel,
    loadAverage: [0.14, 0.22, 0.18],
    ramTotalMb: VPS_INFO.ramTotalMb,
    ramUsedMb: currentRamUsed,
    ramCachedMb: currentCached,
    ramFreeMb: Math.max(50, VPS_INFO.ramTotalMb - (currentRamUsed + currentCached)),
    swapTotalMb: VPS_INFO.swapTotalMb,
    swapUsedMb: 201, // Zram 51% of 394M
    zramTotalMb: 394,
    zramUsedMb: 201,
    diskTotalGb: 246.5,
    diskUsedGb: 23.2,
    diskReadMbs: 0.8,
    diskWriteMbs: 1.2,
    networkRxKbps: currentRx,
    networkTxKbps: currentTx,
    uptimeSeconds: currentUptime,
    temperatureC: 57.5,
    storageDevices: [
      {
        id: 'disk-root',
        name: 'Media 1: Penyimpanan Sistem Root (eMMC/SD)',
        device: '/dev/mmcblk0p1',
        mountPoint: '/',
        fsType: 'ext4',
        totalGb: 6.5,
        usedGb: 4.8,
        freeGb: 1.7,
        usedPercent: 74,
        isPrimary: true,
        role: 'system_root',
        status: 'warning',
        speedRate: '42 MB/s Read / 28 MB/s Write',
        notes: 'Partisi sistem utama OS Armbian. Ruang sisa 1.7 GB (Perlu monitoring & pembersihan berkala).'
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
        role: 'ssd_secondary',
        status: 'healthy',
        speedRate: '280 MB/s Read / 245 MB/s Write (High-Speed)',
        notes: 'Penyimpanan utama proyek web, folder upload, dist build, dan WebDAV storage.'
      }
    ]
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
