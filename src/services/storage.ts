import {
  AppProject,
  CloudflareTunnel,
  FirewallRule,
  BannedIp,
  SystemLogEntry,
  VPSUser,
  AuditLog,
  PortBinding
} from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'bram_vps_projects',
  TUNNELS: 'bram_vps_tunnels',
  FIREWALL: 'bram_vps_firewall',
  BANNED_IPS: 'bram_vps_banned_ips',
  CUSTOM_PORTS: 'bram_vps_custom_ports',
  USERS: 'bram_vps_users',
  AUDIT_LOGS: 'bram_vps_audit_logs',
  SESSION: 'bram_vps_session',
  AUTO_PORT_ENABLED: 'bram_vps_auto_port_enabled',
};

// Initial Seed Projects
const INITIAL_PROJECTS: AppProject[] = [
  {
    id: 'proj-1',
    name: 'Toko Online Bram Store',
    slug: 'bram-store',
    type: 'spa_build',
    port: 3001,
    status: 'running',
    memoryMb: 84.5,
    cpuPercent: 1.2,
    createdAt: '2026-09-28 14:20:00',
    lastDeployedAt: '2026-10-02 09:15:22',
    entryPoint: 'dist/index.html',
    publicUrl: 'http://localhost:3001',
    cloudflareDomain: 'store.bram.my.id',
    cloudflareTunnelId: 'cf-tunnel-sg-01',
    tunnelActive: true,
    sourceType: 'preset',
    fileCount: 38,
    totalSizeBytes: 3420000,
    filesSummary: ['index.html', 'assets/index-Dk9.js', 'assets/index-Cc4.css', 'favicon.svg'],
    htmlPreviewContent: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bram Store</title><style>body{font-family:system-ui;padding:2rem;background:#f0f9ff;color:#0369a1}h1{font-size:1.8rem;margin-bottom:0.5rem}.card{background:#fff;border-radius:12px;padding:1.5rem;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);max-width:480px;border:1px solid #bae6fd}.badge{background:#e0f2fe;color:#0284c7;padding:4px 10px;border-radius:99px;font-size:0.8rem;font-weight:600;display:inline-block;margin-bottom:1rem}</style></head><body><div class="card"><span class="badge">PROYEK AKTIF DI PORT 3001</span><h1>Selamat Datang di Bram Store</h1><p>Aplikasi web e-commerce berhasil di-deploy di VPS. Terhubung otomatis dengan Cloudflare Tunnel via <b>store.bram.my.id</b>.</p><div style="margin-top:1rem;padding:0.75rem;background:#f8fafc;border-radius:8px;font-size:0.85rem;color:#64748b">⚡ Node Static Engine • HTTP 200 OK • Port 3001 Bebas Bentrok</div></div></body></html>`,
    envVars: {
      NODE_ENV: 'production',
      PORT: '3001',
      API_ENDPOINT: 'https://api.bram.my.id',
    },
    logs: [
      '[BUILD] Mengimpor aset build bundle dari /var/www/bram-store/dist...',
      '[PORT] Mengalokasikan port 3001 (Bebas dari bentrok)...',
      '[TUNNEL] Sinkronisasi ingress rule ke Cloudflare: store.bram.my.id -> :3001',
      '[DAEMON] Service bram-store berhasil dijalankan pada PID 3412',
      '[HEALTH] Health check status 200 OK - Response time 14ms'
    ]
  },
  {
    id: 'proj-2',
    name: 'Backend API Gateway Microservice',
    slug: 'api-gateway',
    type: 'node_api',
    port: 3002,
    status: 'running',
    memoryMb: 142.1,
    cpuPercent: 2.8,
    createdAt: '2026-09-30 10:10:00',
    lastDeployedAt: '2026-10-02 21:00:15',
    entryPoint: 'server.js',
    publicUrl: 'http://localhost:3002',
    cloudflareDomain: 'api.bram.my.id',
    cloudflareTunnelId: 'cf-tunnel-sg-01',
    tunnelActive: true,
    sourceType: 'preset',
    fileCount: 14,
    totalSizeBytes: 1840000,
    filesSummary: ['server.js', 'package.json', 'routes/auth.js', 'routes/vps.js'],
    htmlPreviewContent: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>API Gateway</title><style>body{font-family:monospace;padding:2rem;background:#0f172a;color:#38bdf8}pre{background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;color:#e2e8f0}</style></head><body><h2>🚀 BramCloud API Gateway Status</h2><pre>{\n  "status": "online",\n  "port": 3002,\n  "version": "v2.4.0",\n  "database": "PostgreSQL Connected (5432)",\n  "cache": "Redis Connected (6379)",\n  "uptime": "98.4 hours"\n}</pre></body></html>`,
    envVars: {
      NODE_ENV: 'production',
      PORT: '3002',
      DATABASE_URL: 'postgres://vps_user:secret@localhost:5432/main_db',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379'
    },
    logs: [
      '[SYSTEM] Memulai proses Node.js v20.12 LTS pada port 3002...',
      '[DB] Koneksi ke database PostgreSQL 5432 berhasil',
      '[CACHE] Terhubung ke Redis cache 6379',
      '[CLOUDFLARE] Routing hostname api.bram.my.id aktif',
      '[READY] Server listening on http://0.0.0.0:3002'
    ]
  },
  {
    id: 'proj-3',
    name: 'Landing Page Portofolio Bram',
    slug: 'bram-portfolio',
    type: 'static_html',
    port: 3003,
    status: 'running',
    memoryMb: 42.0,
    cpuPercent: 0.4,
    createdAt: '2026-10-01 08:00:00',
    lastDeployedAt: '2026-10-01 08:30:00',
    entryPoint: 'index.html',
    publicUrl: 'http://localhost:3003',
    cloudflareDomain: 'bramanda.dev',
    cloudflareTunnelId: 'cf-tunnel-sg-01',
    tunnelActive: true,
    sourceType: 'preset',
    fileCount: 8,
    totalSizeBytes: 890000,
    filesSummary: ['index.html', 'style.css', 'profile.webp', 'resume.pdf'],
    htmlPreviewContent: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Gede Bramanda Portfolio</title><style>body{font-family:sans-serif;background:linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%);padding:2rem;color:#0f172a}.box{max-width:500px;margin:2rem auto;background:#fff;border-radius:16px;padding:2rem;box-shadow:0 10px 25px -5px rgba(2,132,199,0.15);border:1px solid #bae6fd;text-align:center}.avatar{width:80px;height:80px;border-radius:50%;background:#0284c7;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:2rem;font-weight:bold;margin-bottom:1rem}</style></head><body><div class="box"><div class="avatar">B</div><h2>Gede Bramanda</h2><p style="color:#0284c7;font-weight:600">Full-Stack Engineer & DevOps VPS Specialist</p><p style="color:#64748b;font-size:0.9rem">Berjalan di port 3003 dengan static caching ultra cepat via Nginx + Cloudflare edge CDN.</p></div></body></html>`,
    envVars: {
      PORT: '3003'
    },
    logs: [
      '[DEPLOY] Static web assets di-upload',
      '[PORT] Alokasi port 3003 berhasil',
      '[STATIC] Nginx micro-cache diaktifkan',
      '[READY] Web online di http://localhost:3003'
    ]
  }
];

const INITIAL_TUNNELS: CloudflareTunnel[] = [
  {
    id: 'cf-tunnel-sg-01',
    name: 'vps-singapore-primary-tunnel',
    tunnelId: '8f7a91c0-43b2-4cd8-b0a1-7e829dc190a4',
    status: 'healthy',
    connectorVersion: '2026.8.0',
    connectedAt: '2026-09-27 11:00:00',
    accountName: 'Bram Cloudflare Organization (Free/Zero-Trust)',
    metrics: {
      requestsPerMin: 142,
      activeConnections: 18,
      dataTransferredMb: 852.4,
    },
    ingressRules: [
      {
        id: 'ing-1',
        hostname: 'panel.bram.my.id',
        servicePort: 3000,
        protocol: 'http',
        enabled: true,
        createdAt: '2026-09-27',
      },
      {
        id: 'ing-2',
        hostname: 'store.bram.my.id',
        servicePort: 3001,
        protocol: 'http',
        enabled: true,
        createdAt: '2026-09-28',
      },
      {
        id: 'ing-3',
        hostname: 'api.bram.my.id',
        servicePort: 3002,
        protocol: 'http',
        enabled: true,
        createdAt: '2026-09-30',
      },
      {
        id: 'ing-4',
        hostname: 'bramanda.dev',
        servicePort: 3003,
        protocol: 'http',
        enabled: true,
        createdAt: '2026-10-01',
      }
    ],
  },
  {
    id: 'cf-tunnel-staging',
    name: 'tunnel-staging-vps',
    tunnelId: '9f8e7d22-6c5b-4321-a0e4-1290bb819c33',
    status: 'healthy',
    connectorVersion: '2026.8.0',
    connectedAt: '2026-10-01 16:30:00',
    accountName: 'Bram Staging & Dev Projects',
    metrics: {
      requestsPerMin: 38,
      activeConnections: 4,
      dataTransferredMb: 114.2,
    },
    ingressRules: [
      {
        id: 'ing-stg-1',
        hostname: 'staging-api.bram.my.id',
        servicePort: 3005,
        protocol: 'http',
        enabled: true,
        createdAt: '2026-10-02',
      }
    ],
  }
];

const INITIAL_FIREWALL_RULES: FirewallRule[] = [
  {
    id: 'fw-1',
    port: 22,
    protocol: 'TCP',
    action: 'LIMIT',
    direction: 'IN',
    sourceIp: 'Anywhere',
    comment: 'SSH Secure Access (Rate limited against brute force)',
    enabled: true,
    createdAt: '2026-09-20',
  },
  {
    id: 'fw-2',
    port: 80,
    protocol: 'TCP',
    action: 'ALLOW',
    direction: 'IN',
    sourceIp: 'Anywhere',
    comment: 'Nginx HTTP Web Proxy Gateway',
    enabled: true,
    createdAt: '2026-09-20',
  },
  {
    id: 'fw-3',
    port: 443,
    protocol: 'TCP',
    action: 'ALLOW',
    direction: 'IN',
    sourceIp: 'Anywhere',
    comment: 'Nginx HTTPS SSL Web Traffic',
    enabled: true,
    createdAt: '2026-09-20',
  },
  {
    id: 'fw-4',
    port: 3000,
    protocol: 'TCP',
    action: 'ALLOW',
    direction: 'IN',
    sourceIp: 'Anywhere',
    comment: 'BramCloud Core Panel Web Port',
    enabled: true,
    createdAt: '2026-09-20',
  },
  {
    id: 'fw-5',
    port: 5432,
    protocol: 'TCP',
    action: 'DENY',
    direction: 'IN',
    sourceIp: 'Anywhere',
    comment: 'Block direct external PostgreSQL access (Internal only)',
    enabled: true,
    createdAt: '2026-09-21',
  },
  {
    id: 'fw-6',
    port: 6379,
    protocol: 'TCP',
    action: 'DENY',
    direction: 'IN',
    sourceIp: 'Anywhere',
    comment: 'Block external Redis access (Internal socket/localhost only)',
    enabled: true,
    createdAt: '2026-09-21',
  }
];

const INITIAL_BANNED_IPS: BannedIp[] = [
  {
    ip: '185.220.101.5',
    reason: 'SSH brute force (5 failed password attempts in 2m)',
    bannedAt: '2026-10-02 18:24:10',
    jail: 'sshd-fail2ban',
    attempts: 9,
  },
  {
    ip: '45.154.255.89',
    reason: 'WP-login scanner probe exploit attempt',
    bannedAt: '2026-10-03 01:12:04',
    jail: 'nginx-badbots',
    attempts: 14,
  },
  {
    ip: '194.26.29.112',
    reason: 'Port scanning syn-flood sequence',
    bannedAt: '2026-10-03 01:45:50',
    jail: 'ufw-recidive',
    attempts: 32,
  }
];

const INITIAL_USERS: VPSUser[] = [
  {
    id: 'u-1',
    username: 'Bram',
    role: 'superadmin',
    type: 'panel_user',
    hasSudo: true,
    lastLogin: 'Aktif saat ini (Sesi Berjalan)',
    createdAt: '2026-09-15',
    active: true,
  },
  {
    id: 'u-2',
    username: 'root',
    role: 'superadmin',
    type: 'linux_ssh',
    sshKeyCount: 2,
    hasSudo: true,
    lastLogin: '2026-10-01 14:02:18 via SSH',
    createdAt: '2026-09-15',
    active: true,
  },
  {
    id: 'u-3',
    username: 'bram-devops',
    role: 'superadmin',
    type: 'linux_ssh',
    sshKeyCount: 1,
    hasSudo: true,
    lastLogin: '2026-10-02 22:19:00 via Ed25519',
    createdAt: '2026-09-16',
    active: true,
  },
  {
    id: 'u-4',
    username: 'deploy-ci',
    role: 'operator',
    type: 'linux_ssh',
    sshKeyCount: 1,
    hasSudo: false,
    lastLogin: '2026-10-02 09:15:22 via GitHub Action',
    createdAt: '2026-09-20',
    active: true,
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-10-03 02:00:15',
    user: 'Bram',
    action: 'LOGIN_SUCCESS',
    target: 'Web Panel Dashboard',
    ipAddress: '180.252.164.88 (Indonesia)',
    status: 'success',
  },
  {
    id: 'aud-2',
    timestamp: '2026-10-02 21:00:15',
    user: 'Bram',
    action: 'DEPLOY_APP',
    target: 'Backend API Gateway (Port 3002)',
    ipAddress: '180.252.164.88',
    status: 'success',
  },
  {
    id: 'aud-3',
    timestamp: '2026-10-02 18:24:10',
    user: 'System (Fail2ban)',
    action: 'IP_BANNED',
    target: '185.220.101.5 (Jail: sshd)',
    ipAddress: 'vps-internal',
    status: 'warning',
  },
  {
    id: 'aud-4',
    timestamp: '2026-10-02 14:10:00',
    user: 'Bram',
    action: 'TUNNEL_SYNC',
    target: 'Cloudflare Ingress (bramanda.dev -> :3003)',
    ipAddress: '180.252.164.88',
    status: 'success',
  }
];

export const StorageService = {
  getProjects(): AppProject[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_PROJECTS;
    }
  },

  saveProjects(projects: AppProject[]): void {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  getTunnels(): CloudflareTunnel[] {
    const data = localStorage.getItem(STORAGE_KEYS.TUNNELS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TUNNELS, JSON.stringify(INITIAL_TUNNELS));
      return INITIAL_TUNNELS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_TUNNELS;
    }
  },

  saveTunnels(tunnels: CloudflareTunnel[]): void {
    localStorage.setItem(STORAGE_KEYS.TUNNELS, JSON.stringify(tunnels));
  },

  getFirewallRules(): FirewallRule[] {
    const data = localStorage.getItem(STORAGE_KEYS.FIREWALL);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.FIREWALL, JSON.stringify(INITIAL_FIREWALL_RULES));
      return INITIAL_FIREWALL_RULES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_FIREWALL_RULES;
    }
  },

  saveFirewallRules(rules: FirewallRule[]): void {
    localStorage.setItem(STORAGE_KEYS.FIREWALL, JSON.stringify(rules));
  },

  getBannedIps(): BannedIp[] {
    const data = localStorage.getItem(STORAGE_KEYS.BANNED_IPS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.BANNED_IPS, JSON.stringify(INITIAL_BANNED_IPS));
      return INITIAL_BANNED_IPS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_BANNED_IPS;
    }
  },

  saveBannedIps(ips: BannedIp[]): void {
    localStorage.setItem(STORAGE_KEYS.BANNED_IPS, JSON.stringify(ips));
  },

  getCustomPorts(): PortBinding[] {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_PORTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveCustomPorts(ports: PortBinding[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PORTS, JSON.stringify(ports));
  },

  getUsers(): VPSUser[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: VPSUser[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getAuditLogs(): AuditLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  logAudit(action: string, target: string, status: 'success' | 'warning' | 'failed' = 'success'): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'Bram',
      action,
      target,
      ipAddress: '180.252.164.88 (Panel Web)',
      status,
    };
    logs.unshift(newEntry);
    this.saveAuditLogs(logs.slice(0, 50));
  },

  saveAuditLogs(logs: AuditLog[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  },

  isLoggedIn(): boolean {
    return sessionStorage.getItem(STORAGE_KEYS.SESSION) === 'true';
  },

  setLoggedIn(val: boolean): void {
    if (val) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }
};
