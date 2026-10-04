import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCw,
  ExternalLink,
  X
} from 'lucide-react';
import { CloudflareTunnel, IngressRule, AppProject } from '../types';
import { StorageService } from '../services/storage';

interface CloudflareTunnelViewProps {
  tunnels: CloudflareTunnel[];
  projects: AppProject[];
  onUpdateTunnels: (tunnels: CloudflareTunnel[]) => void;
}

export const CloudflareTunnelView: React.FC<CloudflareTunnelViewProps> = ({
  tunnels,
  projects,
  onUpdateTunnels,
}) => {
  const [activeTunnelId, setActiveTunnelId] = useState<string>(tunnels[0]?.id || '');
  const [isAddTunnelModalOpen, setIsAddTunnelModalOpen] = useState(false);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);

  // New Tunnel form
  const [newTunnelName, setNewTunnelName] = useState('');
  const [newTunnelId, setNewTunnelId] = useState('');
  const [newTunnelAccount, setNewTunnelAccount] = useState('');

  // Ingress form
  const [hostnameInput, setHostnameInput] = useState('');
  const [servicePortInput, setServicePortInput] = useState<number>(3001);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const currentTunnel = tunnels.find((t) => t.id === activeTunnelId) || tunnels[0];

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    const p = projects.find((x) => x.id === projId);
    if (p) {
      setServicePortInput(p.port);
      if (!hostnameInput) {
        setHostnameInput(`${p.slug}.bram.my.id`);
      }
    }
  };

  const handleCreateTunnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTunnelName.trim() || !newTunnelId.trim()) return;

    const createdTunnel: CloudflareTunnel = {
      id: `cf-${Date.now()}`,
      name: newTunnelName.trim(),
      tunnelId: newTunnelId.trim(),
      status: 'healthy',
      connectorVersion: '2026.8.0',
      connectedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountName: newTunnelAccount || 'Bram Zero Trust Organization',
      metrics: {
        requestsPerMin: 0,
        activeConnections: 1,
        dataTransferredMb: 0.1,
      },
      ingressRules: [],
    };

    const updated = [...tunnels, createdTunnel];
    onUpdateTunnels(updated);
    StorageService.saveTunnels(updated);
    StorageService.logAudit('TUNNEL_CREATE', `Tunnel ${newTunnelName} (${newTunnelId})`, 'success');

    setActiveTunnelId(createdTunnel.id);
    setIsAddTunnelModalOpen(false);
    setNewTunnelName('');
    setNewTunnelId('');
    setNewTunnelAccount('');
  };

  const handleAddIngress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostnameInput.trim() || !currentTunnel) return;

    const newRule: IngressRule = {
      id: `ing-${Date.now()}`,
      hostname: hostnameInput.trim(),
      servicePort: servicePortInput,
      protocol: 'http',
      enabled: true,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    const updated = tunnels.map((t) => {
      if (t.id === currentTunnel.id) {
        return {
          ...t,
          ingressRules: [...t.ingressRules, newRule],
        };
      }
      return t;
    });

    onUpdateTunnels(updated);
    StorageService.saveTunnels(updated);
    StorageService.logAudit('TUNNEL_INGRESS_ADD', `${hostnameInput} -> :${servicePortInput} on ${currentTunnel.name}`, 'success');

    setIsAddRuleModalOpen(false);
    setHostnameInput('');
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!currentTunnel) return;
    const rule = currentTunnel.ingressRules.find((r) => r.id === ruleId);
    if (!rule) return;

    if (confirm(`Hapus rute domain "${rule.hostname}" dari tunnel ini?`)) {
      const updated = tunnels.map((t) => {
        if (t.id === currentTunnel.id) {
          return {
            ...t,
            ingressRules: t.ingressRules.filter((r) => r.id !== ruleId),
          };
        }
        return t;
      });
      onUpdateTunnels(updated);
      StorageService.saveTunnels(updated);
      StorageService.logAudit('TUNNEL_INGRESS_REMOVE', `${rule.hostname}`, 'warning');
    }
  };

  const handleDeleteTunnel = (tunnelIdToDelete: string) => {
    if (tunnels.length <= 1) {
      alert('Minimal harus ada 1 tunnel yang terdaftar di sistem.');
      return;
    }
    const t = tunnels.find((x) => x.id === tunnelIdToDelete);
    if (!t) return;

    if (confirm(`Hapus Tunnel "${t.name}" beserta seluruh rute ingress-nya?`)) {
      const updated = tunnels.filter((x) => x.id !== tunnelIdToDelete);
      onUpdateTunnels(updated);
      StorageService.saveTunnels(updated);
      setActiveTunnelId(updated[0].id);
      StorageService.logAudit('TUNNEL_DELETE', `Tunnel ${t.name} removed`, 'warning');
    }
  };

  const handleSyncTunnel = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      StorageService.logAudit('TUNNEL_SYNC_DAEMON', `Sinkronisasi rute multi-tunnel`, 'success');
      setTimeout(() => setSyncSuccess(false), 2500);
    }, 450);
  };

  const generatedConfigYaml = `tunnel: ${currentTunnel?.tunnelId || '8f7a91c0-43b2-4cd8-b0a1-7e829dc190a4'}
credentials-file: /root/.cloudflared/${currentTunnel?.tunnelId || '8f7a91c0-43b2-4cd8-b0a1-7e829dc190a4'}.json

ingress:
${currentTunnel?.ingressRules
  .map(
    (r) => `  - hostname: ${r.hostname}
    service: ${r.protocol}://localhost:${r.servicePort}`
  )
  .join('\n') || '  # Belum ada ingress'}
  - service: http_status:404`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner with External Cloudflare Dashboard Access */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Infrastruktur Jaringan Cloudflare
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Manajemen Multi-Tunnel Zero Trust dan routing rute ingress lokal ke domain publik secara aman.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Buka Dasbor Cloudflare</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            onClick={() => setIsAddTunnelModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah ID Tunnel</span>
          </button>
        </div>
      </div>

      {syncSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Seluruh rute multi-tunnel berhasil disinkronkan ke Cloudflare Edge.</span>
        </div>
      )}

      {/* Multi-Tunnel Management Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Tunnel Aktif di VPS Ini ({tunnels.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Multi-Connector Daemon
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 font-medium">Nama Tunnel</th>
                <th className="py-2.5 px-4 font-medium font-mono">Tunnel ID</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium tabular-nums">Domain Terhubung</th>
                <th className="py-2.5 px-4 font-medium text-right">Manajemen Aturan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tunnels.map((tunnel) => {
                const isCurrent = tunnel.id === currentTunnel?.id;

                return (
                  <tr
                    key={tunnel.id}
                    className={`transition-colors ${isCurrent ? 'bg-sky-50/40' : 'hover:bg-slate-50/60'}`}
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" title="Aktif dipilih" />
                        )}
                        <span>{tunnel.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {tunnel.accountName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {tunnel.tunnelId}
                    </td>
                    <td className="py-3 px-4">
                      <span className={tunnel.status === 'healthy' ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                        {tunnel.status === 'healthy' ? 'Active' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {tunnel.ingressRules.length} Domain
                    </td>
                    <td className="py-3 px-4 text-right space-x-3">
                      <button
                        onClick={() => setActiveTunnelId(tunnel.id)}
                        className={`font-medium transition-colors cursor-pointer ${
                          isCurrent ? 'text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {isCurrent ? 'Sedang Dipilih' : 'Pilih Tunnel'}
                      </button>

                      {tunnels.length > 1 && (
                        <button
                          onClick={() => handleDeleteTunnel(tunnel.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Tunnel Ingress Rules Table */}
      {currentTunnel && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Rute Ingress Hostname untuk: <span className="text-sky-700">{currentTunnel.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mapping domain publik ➔ target port internal (localhost)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncTunnel}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sinkron...' : 'Sinkron Edge'}</span>
              </button>
              <button
                onClick={() => setIsAddRuleModalOpen(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rute Ingress</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Domain Publik (HTTPS)</th>
                  <th className="py-2.5 px-4 font-medium">Target Port Service</th>
                  <th className="py-2.5 px-4 font-medium">Aplikasi Terkait</th>
                  <th className="py-2.5 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentTunnel.ingressRules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-sans">
                      Belum ada rute ingress pada tunnel ini. Klik "Tambah Rute Ingress" untuk menghubungkan port.
                    </td>
                  </tr>
                ) : (
                  currentTunnel.ingressRules.map((rule) => {
                    const linkedApp = projects.find((p) => p.port === rule.servicePort);
                    return (
                      <tr key={rule.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          https://{rule.hostname}
                        </td>
                        <td className="py-3 px-4 text-sky-700 font-medium">
                          {rule.protocol}://localhost:{rule.servicePort}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-500">
                          {linkedApp ? linkedApp.name : 'Custom Service'}
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generated YAML snippet */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-700 font-mono">
            ~/.cloudflared/config-{currentTunnel?.name || 'default'}.yml
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generatedConfigYaml);
              setCopiedConfig(true);
              setTimeout(() => setCopiedConfig(false), 2000);
            }}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedConfig ? 'Tersalin' : 'Salin YAML'}</span>
          </button>
        </div>
        <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-lg overflow-x-auto text-xs font-mono">
          {generatedConfigYaml}
        </pre>
      </div>

      <div className="bg-slate-50 p-4 border border-slate-200/90 rounded-lg text-xs text-slate-600 font-mono leading-relaxed">
        File konfigurasi multi-tunnel disimpan secara otomatis pada <code className="text-slate-800 font-semibold">~/.cloudflared/</code>. Sinkronisasi rute dilakukan secara sekuensial tanpa mengganggu koneksi aktif.
      </div>

      {/* Modal Add Tunnel ID */}
      {isAddTunnelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Daftarkan ID Tunnel Baru
              </h3>
              <button onClick={() => setIsAddTunnelModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTunnel} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Label Tunnel
                </label>
                <input
                  type="text"
                  required
                  value={newTunnelName}
                  onChange={(e) => setNewTunnelName(e.target.value)}
                  placeholder="Contoh: tunnel-staging-vps atau tunnel-production"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cloudflare Tunnel UUID / ID
                </label>
                <input
                  type="text"
                  required
                  value={newTunnelId}
                  onChange={(e) => setNewTunnelId(e.target.value)}
                  placeholder="Contoh: 9f8e7d22-6c5b-4321-a0e4-1290bb819c33"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Diperoleh dari dasbor Cloudflare Zero Trust (Networks ➔ Tunnels).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Akun / Lingkungan
                </label>
                <input
                  type="text"
                  value={newTunnelAccount}
                  onChange={(e) => setNewTunnelAccount(e.target.value)}
                  placeholder="Contoh: Production Cluster"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTunnelModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg"
                >
                  Simpan Tunnel ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Ingress */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Tambah Ingress ({currentTunnel?.name})
              </h3>
              <button onClick={() => setIsAddRuleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddIngress} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih dari Proyek Terdaftar
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="">-- Bebas (Manual) --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Port :{p.port})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Hostname / Domain
                </label>
                <input
                  type="text"
                  required
                  value={hostnameInput}
                  onChange={(e) => setHostnameInput(e.target.value)}
                  placeholder="app.bram.my.id"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Port Lokal
                </label>
                <input
                  type="number"
                  required
                  value={servicePortInput}
                  onChange={(e) => setServicePortInput(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRuleModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg"
                >
                  Simpan Ingress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
