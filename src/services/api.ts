import { SystemMetrics, AppProject, CloudflareTunnel, PortBinding, FirewallRule } from '../types';

export const ApiService = {
  // Real-time live system metrics (CPU, RAM, Disk, Net, Loadavg, Uptime)
  async getLiveMetrics(): Promise<SystemMetrics | null> {
    try {
      const res = await fetch('/api/system/metrics');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Fallback to client simulator
    }
    return null;
  },

  // Real host system specs (OS, kernel, hostname, IP, engines)
  async getSystemInfo(): Promise<any | null> {
    try {
      const res = await fetch('/api/system/info');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  // Real listening ports scan on VPS host
  async getLivePorts(): Promise<PortBinding[] | null> {
    try {
      const res = await fetch('/api/system/ports');
      if (res.ok) {
        const data = await res.json();
        return data.ports || null;
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  // Kernel drop_caches 3 memory flush
  async dropCaches(): Promise<{ success: boolean; freedMb: number } | null> {
    try {
      const res = await fetch('/api/system/drop-caches', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  // Real port conflict check
  async checkPortConflict(port: number): Promise<{ isConflict: boolean; reason?: string; occupyingService?: string } | null> {
    try {
      const res = await fetch('/api/ports/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  // Deploy project to VPS filesystem and launch HTTP listener
  async deployProject(project: Partial<AppProject>): Promise<any | null> {
    try {
      const res = await fetch('/api/projects/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  // Update build without downtime
  async updateProject(project: Partial<AppProject>): Promise<any | null> {
    try {
      const res = await fetch('/api/projects/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  // Start or stop project server
  async toggleProject(slug: string, port: number, status: 'running' | 'stopped', name?: string): Promise<any | null> {
    try {
      const res = await fetch('/api/projects/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, port, status, name }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  // Execute terminal shell command
  async executeCommand(cmd: string): Promise<{ stdout: string; stderr: string; code: number } | null> {
    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  // Write multi-tunnel config to ~/.cloudflared/config.yml
  async syncCloudflare(tunnels: CloudflareTunnel[]): Promise<any | null> {
    try {
      const res = await fetch('/api/cloudflare/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tunnels }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  // Real UFW Firewall API
  async getFirewallStatus(): Promise<{ active: boolean; rawOutput: string } | null> {
    try {
      const res = await fetch('/api/firewall/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  async toggleFirewall(enable: boolean): Promise<any | null> {
    try {
      const res = await fetch('/api/firewall/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  async addFirewallRule(rule: Partial<FirewallRule>): Promise<any | null> {
    try {
      const res = await fetch('/api/firewall/rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  async deleteFirewallRule(rule: Partial<FirewallRule>): Promise<any | null> {
    try {
      const res = await fetch('/api/firewall/rule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },

  // Fetch real system journalctl logs
  async getSystemLogs(): Promise<any[] | null> {
    try {
      const res = await fetch('/api/system/logs');
      if (res.ok) {
        const data = await res.json();
        return data.logs || null;
      }
    } catch (e) {
      // Ignore
    }
    return null;
  },
};
