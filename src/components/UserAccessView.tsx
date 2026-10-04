import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { VPSUser, AuditLog } from '../types';
import { StorageService } from '../services/storage';

interface UserAccessViewProps {
  users: VPSUser[];
  auditLogs: AuditLog[];
  onUpdateUsers: (users: VPSUser[]) => void;
}

export const UserAccessView: React.FC<UserAccessViewProps> = ({
  users,
  auditLogs,
  onUpdateUsers,
}) => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<VPSUser['role']>('operator');
  const [newType, setNewType] = useState<VPSUser['type']>('panel_user');
  const [newHasSudo, setNewHasSudo] = useState(false);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const newUser: VPSUser = {
      id: `u-${Date.now()}`,
      username: newUsername.trim(),
      role: newRole,
      type: newType,
      hasSudo: newHasSudo,
      sshKeyCount: newType === 'linux_ssh' ? 1 : undefined,
      lastLogin: 'Belum pernah login',
      createdAt: new Date().toISOString().substring(0, 10),
      active: true,
    };

    const updated = [...users, newUser];
    onUpdateUsers(updated);
    StorageService.saveUsers(updated);
    StorageService.logAudit('USER_CREATE', `User ${newUsername} (${newRole})`, 'success');

    setIsAddUserOpen(false);
    setNewUsername('');
  };

  const handleDeleteUser = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;

    if (u.username === 'Bram' || u.username === 'root') {
      alert('Pengguna sistem utama / Super Admin Bram tidak dapat dihapus.');
      return;
    }

    if (confirm(`Hapus pengguna "${u.username}"?`)) {
      const updated = users.filter((x) => x.id !== userId);
      onUpdateUsers(updated);
      StorageService.saveUsers(updated);
      StorageService.logAudit('USER_DELETE', `User ${u.username} deleted`, 'warning');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Akses Pengguna & SSH Key
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola hak akses panel BramCloud, pengguna Linux sistem, autentikasi kunci publik SSH, dan riwayat audit.
          </p>
        </div>

        <button
          onClick={() => setIsAddUserOpen(true)}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">{u.username}</h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {u.type === 'panel_user' ? 'Panel Web' : 'Linux SSH User'}
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-500 uppercase">
                  {u.role}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Hak Sudo:</span>
                  <span className={u.hasSudo ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {u.hasSudo ? 'NOPASSWD' : 'None'}
                  </span>
                </div>
                {u.sshKeyCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">SSH Keys:</span>
                    <span className="text-slate-800">{u.sshKeyCount} Key</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 font-sans truncate mt-2">
                  {u.lastLogin}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-mono">{u.createdAt}</span>
              {u.username !== 'Bram' && u.username !== 'root' ? (
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Hapus
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">System</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">
            Jejak Audit Keamanan Server (Audit Trail)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 font-medium">Waktu</th>
                <th className="py-2.5 px-4 font-medium">Pengguna</th>
                <th className="py-2.5 px-4 font-medium">Aksi</th>
                <th className="py-2.5 px-4 font-medium">Detail Target</th>
                <th className="py-2.5 px-4 font-medium">IP Asal</th>
                <th className="py-2.5 px-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 text-slate-400">{log.timestamp}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 font-sans">{log.user}</td>
                  <td className="py-2.5 px-4 text-slate-700">{log.action}</td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans">{log.target}</td>
                  <td className="py-2.5 px-4 text-slate-400">{log.ipAddress}</td>
                  <td className="py-2.5 px-4 text-right font-sans">
                    <span className={`text-[11px] font-medium ${
                      log.status === 'success' ? 'text-emerald-700' : log.status === 'warning' ? 'text-amber-700' : 'text-rose-700'
                    }`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Tambah Pengguna Baru
              </h3>
              <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="devops-bram"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipe
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="panel_user">Panel Web</option>
                    <option value="linux_ssh">Linux SSH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="operator">Operator</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="read_only">Read-Only</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newHasSudo}
                  onChange={(e) => setNewHasSudo(e.target.checked)}
                  className="rounded"
                />
                <span>Berikan Hak Akses Sudo</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
