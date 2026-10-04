import { PortBinding, AppProject } from '../types';

export const SYSTEM_PORTS: PortBinding[] = [
  { port: 22, protocol: 'TCP', status: 'system', serviceName: 'OpenSSH Server', pid: 482, processName: 'sshd', notes: 'Remote Admin Access' },
  { port: 53, protocol: 'UDP', status: 'system', serviceName: 'systemd-resolved', pid: 312, processName: 'systemd-resolve', notes: 'Local DNS Resolver' },
  { port: 80, protocol: 'TCP', status: 'system', serviceName: 'Nginx Gateway (Edge)', pid: 1042, processName: 'nginx: master', notes: 'HTTP Web Reverse Proxy' },
  { port: 443, protocol: 'TCP', status: 'system', serviceName: 'Nginx Gateway (SSL)', pid: 1042, processName: 'nginx: master', notes: 'HTTPS Web Reverse Proxy' },
  { port: 3000, protocol: 'TCP', status: 'system', serviceName: 'BramCloud Core Panel', pid: 2190, processName: 'node vps-panel', notes: 'Sistem Manajemen Utama VPS' },
  { port: 5432, protocol: 'TCP', status: 'system', serviceName: 'PostgreSQL Database', pid: 890, processName: 'postgres', notes: 'Relational Database Engine' },
  { port: 6379, protocol: 'TCP', status: 'system', serviceName: 'Redis Server Cache', pid: 745, processName: 'redis-server', notes: 'In-memory Cache Store' },
];

export const APP_PORT_RANGE = { min: 3001, max: 9999 };

/**
 * Gather all currently occupied ports from system bindings and app projects
 */
export function getAllAllocatedPorts(projects: AppProject[], customBindings: PortBinding[]): Map<number, PortBinding> {
  const map = new Map<number, PortBinding>();

  // Add system ports
  SYSTEM_PORTS.forEach((p) => map.set(p.port, p));

  // Add custom manual reserved ports
  customBindings.forEach((p) => map.set(p.port, p));

  // Add active and stopped projects (ports are kept bound to projects unless deleted)
  projects.forEach((proj) => {
    map.set(proj.port, {
      port: proj.port,
      protocol: 'TCP',
      status: proj.status === 'running' ? 'in_use' : 'reserved',
      serviceName: proj.name,
      pid: proj.status === 'running' ? Math.floor(1000 + Math.random() * 8000) : undefined,
      processName: `${proj.slug}-worker`,
      projectId: proj.id,
      notes: `Aplikasi Web: ${proj.type} (Status: ${proj.status})`,
    });
  });

  return map;
}

/**
 * Finds the next available port that is completely conflict-free
 */
export function findNextAvailablePort(projects: AppProject[], customBindings: PortBinding[], preferPort?: number): number {
  const allocated = getAllAllocatedPorts(projects, customBindings);

  if (preferPort && preferPort >= 1024 && preferPort <= 65535 && !allocated.has(preferPort)) {
    return preferPort;
  }

  for (let p = APP_PORT_RANGE.min; p <= APP_PORT_RANGE.max; p++) {
    // Avoid common conflicting databases or reserved infra ports
    if (p === 3306 || p === 5432 || p === 6379 || p === 8080 || p === 27017) {
      if (allocated.has(p)) continue;
    }
    if (!allocated.has(p)) {
      return p;
    }
  }

  // Fallback
  return 10001;
}

/**
 * Validates if a requested port is conflicting
 */
export function checkPortConflict(
  port: number,
  projects: AppProject[],
  customBindings: PortBinding[],
  ignoreProjectId?: string
): { isConflict: boolean; reason?: string; occupyingService?: string } {
  if (port < 1 || port > 65535) {
    return { isConflict: true, reason: 'Port harus berada di rentang 1 - 65535.' };
  }

  if (port < 1024 && port !== 80 && port !== 443) {
    return {
      isConflict: true,
      reason: `Port ${port} adalah sistem privilege port (< 1024). Disarankan memakai port di atas 1024.`,
    };
  }

  const allocated = getAllAllocatedPorts(projects, customBindings);
  const binding = allocated.get(port);

  if (binding) {
    if (ignoreProjectId && binding.projectId === ignoreProjectId) {
      return { isConflict: false };
    }
    return {
      isConflict: true,
      reason: `Port ${port} sedang digunakan oleh: ${binding.serviceName} (${binding.status === 'in_use' ? 'Aktif' : 'Tereservasi'}).`,
      occupyingService: binding.serviceName,
    };
  }

  return { isConflict: false };
}
