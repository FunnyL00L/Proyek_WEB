export interface StorageDevice {
  id: string;
  name: string; // e.g. "Root OS Storage (eMMC/SD)" or "SSD Eksternal (/mnt/ssd_temp)"
  device: string; // e.g. "/dev/mmcblk0p1" or "/dev/sda1"
  mountPoint: string; // e.g. "/" or "/mnt/ssd_temp"
  fsType?: string; // e.g. "ext4", "btrfs"
  totalGb: number;
  usedGb: number;
  freeGb: number;
  usedPercent: number;
  isPrimary: boolean;
  role: 'system_root' | 'ssd_secondary' | 'data_volume';
  status: 'healthy' | 'warning' | 'critical';
  speedRate?: string;
  notes?: string;
}

export interface SystemMetrics {
  cpuUsage: number; // percentage 0-100
  cpuCores: number;
  cpuModel: string;
  loadAverage: [number, number, number]; // 1m, 5m, 15m
  ramTotalMb: number;
  ramUsedMb: number;
  ramCachedMb: number;
  ramFreeMb: number;
  swapTotalMb: number;
  swapUsedMb: number;
  zramTotalMb?: number;
  zramUsedMb?: number;
  diskTotalGb: number;
  diskUsedGb: number;
  diskReadMbs: number;
  diskWriteMbs: number;
  networkRxKbps: number;
  networkTxKbps: number;
  uptimeSeconds: number;
  temperatureC: number;
  storageDevices?: StorageDevice[];
}

export type ProjectStatus = 'running' | 'stopped' | 'building' | 'error';
export type ProjectType = 'spa_build' | 'node_api' | 'static_html' | 'fullstack';

export interface AppProject {
  id: string;
  name: string;
  slug: string;
  type: ProjectType;
  port: number;
  status: ProjectStatus;
  memoryMb: number;
  cpuPercent: number;
  createdAt: string;
  lastDeployedAt: string;
  entryPoint: string;
  publicUrl?: string;
  cloudflareDomain?: string;
  cloudflareTunnelId?: string;
  tunnelActive: boolean;
  sourceType: 'zip_upload' | 'folder_upload' | 'preset';
  fileCount: number;
  totalSizeBytes: number;
  filesSummary?: string[];
  htmlPreviewContent?: string;
  envVars: Record<string, string>;
  logs: string[];
}

export interface PortBinding {
  port: number;
  protocol: 'TCP' | 'UDP';
  status: 'in_use' | 'reserved' | 'system' | 'free';
  serviceName: string;
  pid?: number;
  processName?: string;
  projectId?: string;
  isCustomReserved?: boolean;
  notes?: string;
}

export interface IngressRule {
  id: string;
  hostname: string;
  servicePort: number;
  protocol: 'http' | 'https' | 'tcp';
  targetPath?: string;
  enabled: boolean;
  createdAt: string;
}

export interface CloudflareTunnel {
  id: string;
  name: string;
  tunnelId: string;
  status: 'healthy' | 'degraded' | 'inactive';
  connectorVersion: string;
  connectedAt: string;
  ingressRules: IngressRule[];
  accountName: string;
  metrics: {
    requestsPerMin: number;
    activeConnections: number;
    dataTransferredMb: number;
  };
}

export interface FirewallRule {
  id: string;
  port: number | string; // e.g. 22 or "8000:8050"
  protocol: 'TCP' | 'UDP' | 'ANY';
  action: 'ALLOW' | 'DENY' | 'LIMIT';
  direction: 'IN' | 'OUT';
  sourceIp: string; // "Anywhere" or "192.168.1.0/24"
  comment: string;
  enabled: boolean;
  createdAt: string;
}

export interface BannedIp {
  ip: string;
  reason: string;
  bannedAt: string;
  jail: string;
  attempts: number;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  category: 'system' | 'port' | 'cloudflare' | 'firewall' | 'deploy' | 'auth';
  message: string;
}

export interface VPSUser {
  id: string;
  username: string;
  role: 'superadmin' | 'operator' | 'read_only';
  type: 'panel_user' | 'linux_ssh';
  sshKeyCount?: number;
  hasSudo: boolean;
  lastLogin: string;
  createdAt: string;
  active: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'failed';
}
