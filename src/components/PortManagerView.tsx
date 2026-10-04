import React, { useState } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { PortBinding, AppProject } from '../types';
import { getAllAllocatedPorts, checkPortConflict, findNextAvailablePort, SYSTEM_PORTS } from '../services/portManager';
import { StorageService } from '../services/storage';

interface PortManagerViewProps {
  projects: AppProject[];
  customPorts: PortBinding[];
  onUpdateCustomPorts: (ports: PortBinding[]) => void;
  onUpdateProjects: (projects: AppProject[]) => void;
}

export const PortManagerView: React.FC<PortManagerViewProps> = ({
  projects,
  customPorts,
  onUpdateCustomPorts,
  onUpdateProjects,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'apps' | 'reserved'>('all');
  const [testPortInput, setTestPortInput] = useState<string>('');
  const [testResult, setTestResult] = useState<{ isConflict: boolean; reason?: string; occupyingService?: string } | null>(null);

  // Reserve modal state
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reservePort, setReservePort] = useState<number>(8080);
  const [reserveService, setReserveService] = useState('');
  const [reserveNotes, setReserveNotes] = useState('');

  const allocatedMap = getAllAllocatedPorts(projects, customPorts);
  const allList = Array.from(allocatedMap.values()).sort((a, b) => a.port - b.port);

  const filteredList = allList.filter((item) => {
    const matchesSearch =
      item.port.toString().includes(searchQuery) ||
      item.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.processName && item.processName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'system') return item.status === 'system';
    if (filterType === 'apps') return !!item.projectId;
    if (filterType === 'reserved') return item.isCustomReserved;
    return true;
  });

  const handleTestPort = (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = parseInt(testPortInput, 10);
    if (isNaN(portNum)) return;
    const res = checkPortConflict(portNum, projects, customPorts);
    setTestResult(res);
  };

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    const check = checkPortConflict(reservePort, projects, customPorts);
    if (check.isConflict) {
      alert(`Port tidak dapat direservasi: ${check.reason}`);
      return;
    }

    const newBinding: PortBinding = {
      port: reservePort,
      protocol: 'TCP',
      status: 'reserved',
      serviceName: reserveService || `Custom Reserved Port ${reservePort}`,
      isCustomReserved: true,
      notes: reserveNotes || 'Direservasi secara manual oleh Admin',
    };

    const updated = [...customPorts, newBinding];
    onUpdateCustomPorts(updated);
    StorageService.saveCustomPorts(updated);
    StorageService.logAudit('PORT_RESERVE', `Port ${reservePort} (${reserveService})`, 'success');

    setIsReserveModalOpen(false);
    setReservePort(findNextAvailablePort(projects, updated));
    setReserveService('');
    setReserveNotes('');
  };

  const handleReleasePort = (portNum: number) => {
    const item = allocatedMap.get(portNum);
    if (!item) return;

    if (item.status === 'system') {
      alert('Port sistem inti tidak dapat dihapus.');
      return;
    }

    if (item.projectId) {
      if (confirm(`Port ini digunakan oleh proyek "${item.serviceName}". Hentikan proyek ini?`)) {
        const updatedProjects = projects.filter((p) => p.id !== item.projectId);
        onUpdateProjects(updatedProjects);
        StorageService.saveProjects(updatedProjects);
        StorageService.logAudit('PORT_RELEASE', `Port ${portNum} released from ${item.serviceName}`, 'warning');
      }
      return;
    }

    if (item.isCustomReserved) {
      const updated = customPorts.filter((p) => p.port !== portNum);
      onUpdateCustomPorts(updated);
      StorageService.saveCustomPorts(updated);
      StorageService.logAudit('PORT_RELEASE', `Reserved port ${portNum} unreserved`, 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Port VPS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Peta port terdaftar (1–65535). Sistem menjamin tidak ada port yang saling tumpang tindih antar layanan web atau container.
          </p>
        </div>

        <button
          onClick={() => setIsReserveModalOpen(true)}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Reservasi Port Manual</span>
        </button>
      </div>

      {/* Collision Tester Box */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500 mb-1">
          Cek Tabrakan Port
        </h3>
        <p className="text-xs text-slate-600 mb-3">
          Verifikasi nomor port secara instan sebelum menjalankan aplikasi atau database eksternal.
        </p>

        <form onSubmit={handleTestPort} className="flex gap-2 max-w-md">
          <input
            type="number"
            value={testPortInput}
            onChange={(e) => {
              setTestPortInput(e.target.value);
              setTestResult(null);
            }}
            placeholder="Cth: 3001, 8080, 5432..."
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Uji Port
          </button>
        </form>

        {testResult && (
          <div
            className={`mt-3 p-3 rounded-lg border text-xs font-mono ${
              testResult.isConflict
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {testResult.isConflict ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Bentrok: {testResult.reason}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Port {testPortInput} tersedia dan aman untuk dialokasikan.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* High-Density Port Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari port atau nama service..."
              className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 w-56"
            />
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({allList.length})
            </button>
            <button
              onClick={() => setFilterType('system')}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                filterType === 'system' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sistem ({SYSTEM_PORTS.length})
            </button>
            <button
              onClick={() => setFilterType('apps')}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                filterType === 'apps' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aplikasi ({projects.length})
            </button>
            <button
              onClick={() => setFilterType('reserved')}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                filterType === 'reserved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reservasi ({customPorts.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 font-medium">Port</th>
                <th className="py-2.5 px-4 font-medium">Protokol</th>
                <th className="py-2.5 px-4 font-medium">Service / Aplikasi</th>
                <th className="py-2.5 px-4 font-medium">PID</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium">Keterangan</th>
                <th className="py-2.5 px-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredList.map((item) => (
                <tr key={item.port} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    :{item.port}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-medium">
                    {item.protocol}
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-800">
                    {item.serviceName}
                  </td>
                  <td className="py-3 px-4 text-slate-500 tabular-nums">
                    {item.pid ? `PID ${item.pid}` : '—'}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className={`text-[11px] ${
                      item.status === 'in_use' ? 'text-emerald-700 font-medium' : 'text-slate-500'
                    }`}>
                      {item.status === 'system' ? 'System' : item.status === 'in_use' ? 'Listening' : 'Reserved'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-400 text-[11px] max-w-xs truncate">
                    {item.notes || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    {item.status !== 'system' ? (
                      <button
                        onClick={() => handleReleasePort(item.port)}
                        className="text-xs text-rose-600 hover:text-rose-800 transition-colors"
                      >
                        Bebaskan
                      </button>
                    ) : (
                      <span className="text-slate-300 text-[11px]">Terkunci</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Reserve Port Modal */}
      {isReserveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Reservasi Port Baru
              </h3>
              <button onClick={() => setIsReserveModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateReservation} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Port
                </label>
                <input
                  type="number"
                  required
                  value={reservePort}
                  onChange={(e) => setReservePort(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Layanan / Keperluan
                </label>
                <input
                  type="text"
                  required
                  value={reserveService}
                  onChange={(e) => setReserveService(e.target.value)}
                  placeholder="Contoh: Docker Jenkins"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={reserveNotes}
                  onChange={(e) => setReserveNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReserveModalOpen(false)}
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
