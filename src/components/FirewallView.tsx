import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { FirewallRule, BannedIp } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';

interface FirewallViewProps {
  rules: FirewallRule[];
  bannedIps: BannedIp[];
  onUpdateRules: (rules: FirewallRule[]) => void;
  onUpdateBannedIps: (ips: BannedIp[]) => void;
}

export const FirewallView: React.FC<FirewallViewProps> = ({
  rules,
  bannedIps,
  onUpdateRules,
  onUpdateBannedIps,
}) => {
  const [activeTab, setActiveTab] = useState<'ufw_rules' | 'fail2ban'>('ufw_rules');
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [isUfwEnabled, setIsUfwEnabled] = useState(true);

  // Check live UFW status from VPS
  useEffect(() => {
    ApiService.getFirewallStatus().then((status) => {
      if (status && typeof status.active === 'boolean') {
        setIsUfwEnabled(status.active);
      }
    });
  }, []);

  const [portInput, setPortInput] = useState<string>('8080');
  const [protocolInput, setProtocolInput] = useState<FirewallRule['protocol']>('TCP');
  const [actionInput, setActionInput] = useState<FirewallRule['action']>('ALLOW');
  const [sourceIpInput, setSourceIpInput] = useState<string>('Anywhere');
  const [commentInput, setCommentInput] = useState<string>('');

  const [manualBanIp, setManualBanIp] = useState('');
  const [manualBanReason, setManualBanReason] = useState('');

  const handleToggleUfw = () => {
    const newState = !isUfwEnabled;
    setIsUfwEnabled(newState);
    ApiService.toggleFirewall(newState).catch((e) => console.warn('UFW toggle notify:', e));
    StorageService.logAudit('FIREWALL_STATUS', `UFW ${newState ? 'Aktif' : 'Nonaktif'}`, newState ? 'success' : 'warning');
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: FirewallRule = {
      id: `fw-${Date.now()}`,
      port: portInput,
      protocol: protocolInput,
      action: actionInput,
      direction: 'IN',
      sourceIp: sourceIpInput || 'Anywhere',
      comment: commentInput || `Rule port ${portInput}`,
      enabled: true,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    const updated = [...rules, newRule];
    onUpdateRules(updated);
    StorageService.saveFirewallRules(updated);
    ApiService.addFirewallRule(newRule).catch((e) => console.warn('UFW add notify:', e));
    StorageService.logAudit('FIREWALL_RULE_ADD', `${actionInput} ${portInput}/${protocolInput}`, 'success');

    setIsAddRuleOpen(false);
    setPortInput('');
    setCommentInput('');
  };

  const handleDeleteRule = (ruleId: string) => {
    const r = rules.find((x) => x.id === ruleId);
    if (!r) return;

    if (r.port === 22 || r.port === 3000) {
      if (!confirm(`Peringatan: Menghapus port ${r.port} berisiko mengunci akses panel atau SSH Anda. Lanjutkan?`)) {
        return;
      }
    }

    const updated = rules.filter((x) => x.id !== ruleId);
    onUpdateRules(updated);
    StorageService.saveFirewallRules(updated);
    ApiService.deleteFirewallRule(r).catch((e) => console.warn('UFW delete notify:', e));
    StorageService.logAudit('FIREWALL_RULE_DELETE', `Rule ${r.port}/${r.protocol} removed`, 'warning');
  };

  const handleUnbanIp = (ipToUnban: string) => {
    const updated = bannedIps.filter((x) => x.ip !== ipToUnban);
    onUpdateBannedIps(updated);
    StorageService.saveBannedIps(updated);
    StorageService.logAudit('FAIL2BAN_UNBAN', `IP ${ipToUnban} unbanned`, 'success');
  };

  const handleManualBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBanIp.trim()) return;

    const newBan: BannedIp = {
      ip: manualBanIp.trim(),
      reason: manualBanReason || 'Manual drop by Admin Bram',
      bannedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      jail: 'manual-drop',
      attempts: 1,
    };

    const updated = [newBan, ...bannedIps];
    onUpdateBannedIps(updated);
    StorageService.saveBannedIps(updated);
    StorageService.logAudit('FAIL2BAN_BAN_MANUAL', `IP ${manualBanIp} banned`, 'warning');

    setManualBanIp('');
    setManualBanReason('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Firewall & Keamanan Jaringan (UFW)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Atur filter paket masuk (ALLOW, DENY, LIMIT) dan proteksi intrusi otomatis Fail2ban.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleUfw}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isUfwEnabled
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            UFW: {isUfwEnabled ? 'Active (Protected)' : 'Disabled'}
          </button>

          <button
            onClick={() => setIsAddRuleOpen(true)}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Rule</span>
          </button>
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg w-fit text-xs">
        <button
          onClick={() => setActiveTab('ufw_rules')}
          className={`px-3 py-1 font-medium rounded transition-colors ${
            activeTab === 'ufw_rules' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Aturan Port UFW ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('fail2ban')}
          className={`px-3 py-1 font-medium rounded transition-colors ${
            activeTab === 'fail2ban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Fail2ban Banned IPs ({bannedIps.length})
        </button>
      </div>

      {activeTab === 'ufw_rules' ? (
        /* UFW Rules Table */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Port / Layanan</th>
                  <th className="py-2.5 px-4 font-medium">Aksi</th>
                  <th className="py-2.5 px-4 font-medium">Protokol</th>
                  <th className="py-2.5 px-4 font-medium">Sumber IP</th>
                  <th className="py-2.5 px-4 font-medium">Keterangan</th>
                  <th className="py-2.5 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      :{rule.port}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium">
                      <span className={
                        rule.action === 'ALLOW' ? 'text-emerald-700' : rule.action === 'LIMIT' ? 'text-sky-700' : 'text-rose-700'
                      }>
                        {rule.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rule.protocol}</td>
                    <td className="py-3 px-4 text-slate-500">{rule.sourceIp}</td>
                    <td className="py-3 px-4 font-sans text-slate-500 text-[11px]">{rule.comment}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Fail2ban Tab */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
            <h3 className="font-semibold text-xs text-slate-700 uppercase tracking-wider mb-2">
              Blokir Alamat IP Manual
            </h3>
            <form onSubmit={handleManualBan} className="flex gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                required
                value={manualBanIp}
                onChange={(e) => setManualBanIp(e.target.value)}
                placeholder="Alamat IP (cth: 198.51.100.42)"
                className="w-full sm:w-60 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none"
              />
              <input
                type="text"
                value={manualBanReason}
                onChange={(e) => setManualBanReason(e.target.value)}
                placeholder="Alasan pemblokiran..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors whitespace-nowrap"
              >
                Blokir IP
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">IP Penyerang</th>
                    <th className="py-2.5 px-4 font-medium">Alasan / Jail</th>
                    <th className="py-2.5 px-4 font-medium">Upaya</th>
                    <th className="py-2.5 px-4 font-medium">Waktu</th>
                    <th className="py-2.5 px-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {bannedIps.map((b) => (
                    <tr key={b.ip} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-rose-700">{b.ip}</td>
                      <td className="py-3 px-4 font-sans text-slate-700">
                        {b.reason} <span className="text-slate-400 font-mono">({b.jail})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums">{b.attempts} kali</td>
                      <td className="py-3 px-4 text-slate-400">{b.bannedAt}</td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => handleUnbanIp(b.ip)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 transition-colors"
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Rule */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Tambah Aturan UFW
              </h3>
              <button onClick={() => setIsAddRuleOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddRule} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Port Target
                  </label>
                  <input
                    type="text"
                    required
                    value={portInput}
                    onChange={(e) => setPortInput(e.target.value)}
                    placeholder="8080"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Protokol
                  </label>
                  <select
                    value={protocolInput}
                    onChange={(e) => setProtocolInput(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ANY">ANY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aksi
                  </label>
                  <select
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="ALLOW">ALLOW</option>
                    <option value="DENY">DENY</option>
                    <option value="LIMIT">LIMIT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sumber IP
                  </label>
                  <input
                    type="text"
                    value={sourceIpInput}
                    onChange={(e) => setSourceIpInput(e.target.value)}
                    placeholder="Anywhere"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Keterangan aturan..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRuleOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg"
                >
                  Simpan Aturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
