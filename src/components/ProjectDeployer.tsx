import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  UploadCloud,
  Play,
  Square,
  Trash2,
  Eye,
  FileCode,
  FileText,
  AlertTriangle,
  FolderArchive,
  Check,
  Plus,
  Monitor,
  Smartphone,
  RotateCw,
  X
} from 'lucide-react';
import { AppProject, CloudflareTunnel, PortBinding } from '../types';
import { findNextAvailablePort, checkPortConflict } from '../services/portManager';
import { StorageService } from '../services/storage';

interface ProjectDeployerProps {
  projects: AppProject[];
  customPorts: PortBinding[];
  tunnels: CloudflareTunnel[];
  onUpdateProjects: (projects: AppProject[]) => void;
  onUpdateTunnels: (tunnels: CloudflareTunnel[]) => void;
}

export const ProjectDeployer: React.FC<ProjectDeployerProps> = ({
  projects,
  customPorts,
  tunnels,
  onUpdateProjects,
  onUpdateTunnels,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewProject, setPreviewProject] = useState<AppProject | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [logsProject, setLogsProject] = useState<AppProject | null>(null);
  const [exportConfigProject, setExportConfigProject] = useState<AppProject | null>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [updateSuccessId, setUpdateSuccessId] = useState<string | null>(null);

  // Form states for new deployment
  const [projectName, setProjectName] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [projectType, setProjectType] = useState<AppProject['type']>('spa_build');
  const [autoPort, setAutoPort] = useState(true);
  const [customPortVal, setCustomPortVal] = useState<number>(3004);
  const [enableCloudflare, setEnableCloudflare] = useState(true);
  const [selectedTunnelId, setSelectedTunnelId] = useState<string>(tunnels[0]?.id || '');
  const [subdomain, setSubdomain] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedSummary, setExtractedSummary] = useState<string[]>([]);
  const [extractedHtml, setExtractedHtml] = useState<string | null>(null);
  const [extractedSize, setExtractedSize] = useState<number>(0);
  const [deployStep, setDeployStep] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateFileInputRef = useRef<HTMLInputElement>(null);
  const [targetUpdateProj, setTargetUpdateProj] = useState<AppProject | null>(null);

  const nextSafePort = findNextAvailablePort(projects, customPorts);
  const effectivePort = autoPort ? nextSafePort : customPortVal;
  const conflictCheck = checkPortConflict(effectivePort, projects, customPorts);

  const handleNameChange = (name: string) => {
    setProjectName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setProjectSlug(slug);
    if (!subdomain || subdomain.includes('.')) {
      setSubdomain(`${slug || 'app'}.bram.my.id`);
    }
  };

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    try {
      if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const fileNames = Object.keys(loadedZip.files);
        setExtractedSummary(fileNames.slice(0, 8));
        setExtractedSize(file.size);

        const indexHtmlFile = loadedZip.file(/(^|\/)index\.html$/i)[0];
        if (indexHtmlFile) {
          const content = await indexHtmlFile.async('text');
          setExtractedHtml(content);
        } else {
          setExtractedHtml(null);
        }

        if (!projectName) {
          const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          handleNameChange(baseName);
        }
      } else {
        setExtractedSummary([file.name]);
        setExtractedSize(file.size);
        const reader = new FileReader();
        reader.onload = (e) => {
          setExtractedHtml(e.target?.result as string);
        };
        reader.readAsText(file);
        if (!projectName) {
          handleNameChange(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err) {
      console.error('Error reading zip:', err);
      alert('Gagal membaca file zip build web.');
    }
  };

  // Zero-downtime update handler
  const handleTriggerUpdateModal = (project: AppProject) => {
    setTargetUpdateProj(project);
    updateFileInputRef.current?.click();
  };

  const handleUpdateFileSelected = async (file: File, project: AppProject) => {
    setActiveUploadId(project.id);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    try {
      let previewContent = project.htmlPreviewContent;
      if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const indexHtmlFile = loadedZip.file(/(^|\/)index\.html$/i)[0];
        if (indexHtmlFile) {
          previewContent = await indexHtmlFile.async('text');
        }
      }

      setTimeout(() => {
        const updated = projects.map((p) => {
          if (p.id === project.id) {
            return {
              ...p,
              lastDeployedAt: nowStr,
              totalSizeBytes: file.size || p.totalSizeBytes,
              htmlPreviewContent: previewContent,
              logs: [
                `[UPDATE ${nowStr}] Paket build baru diunggah (${file.name})`,
                `[RELOAD] Menimpa direktori /var/www/${p.slug} - Port :${p.port} dipertahankan`,
                `[PM2] Zero-downtime reload sukses pada worker PID ${Math.floor(2000 + Math.random() * 4000)}`,
                ...p.logs,
              ],
            };
          }
          return p;
        });

        onUpdateProjects(updated);
        StorageService.saveProjects(updated);
        StorageService.logAudit('UPDATE_BUILD', `${project.name} (Port ${project.port} dipertahankan)`, 'success');

        setActiveUploadId(null);
        setUpdateSuccessId(project.id);
        setTimeout(() => setUpdateSuccessId(null), 3000);
      }, 1200);
    } catch (err) {
      console.error('Failed to update build:', err);
      setActiveUploadId(null);
      alert('Gagal memproses file build baru.');
    }
  };

  const handleQuickUpdateSimulation = (project: AppProject) => {
    setActiveUploadId(project.id);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    setTimeout(() => {
      const updated = projects.map((p) => {
        if (p.id === project.id) {
          return {
            ...p,
            lastDeployedAt: nowStr,
            logs: [
              `[UPDATE ${nowStr}] Build diperbarui via CI/CD sync`,
              `[RELOAD] Menimpa file /var/www/${p.slug} - Port :${p.port} tetap aktif`,
              `[PM2] Zero-downtime reload selesai (0 downtime)`,
              ...p.logs,
            ],
          };
        }
        return p;
      });

      onUpdateProjects(updated);
      StorageService.saveProjects(updated);
      StorageService.logAudit('UPDATE_BUILD', `${project.name} (Port ${project.port} dipertahankan)`, 'success');

      setActiveUploadId(null);
      setUpdateSuccessId(project.id);
      setTimeout(() => setUpdateSuccessId(null), 3000);
    }, 1000);
  };

  const handlePresetSelect = (presetKey: string) => {
    if (presetKey === 'portfolio') {
      handleNameChange('Website Portofolio Gede Bram');
      setProjectType('static_html');
      setExtractedSummary(['index.html', 'style.css', 'avatar.png']);
      setExtractedSize(1240000);
      setExtractedHtml(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Portofolio</title><style>body{font-family:system-ui;background:#fafbfc;color:#0f172a;padding:3rem;text-align:center}.card{max-width:440px;margin:2rem auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:2rem;text-align:left}h1{font-size:1.4rem;margin-bottom:0.25rem}p{color:#64748b;font-size:0.875rem}</style></head><body><div class="card"><h1>Gede Bramanda</h1><p>Full-Stack Engineer & Server Specialist</p><div style="margin-top:1.5rem;font-size:0.8rem;color:#475569;font-family:monospace">Port: ${effectivePort} · Cloudflare Tunnel Active</div></div></body></html>`);
    } else if (presetKey === 'react') {
      handleNameChange('Dashboard React Vite Build');
      setProjectType('spa_build');
      setExtractedSummary(['index.html', 'assets/index.js', 'assets/index.css']);
      setExtractedSize(2940000);
      setExtractedHtml(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>React App</title><style>body{font-family:system-ui;background:#0f172a;color:#f8fafc;padding:2rem}.box{max-width:480px;margin:2rem auto;padding:2rem;background:#1e293b;border:1px solid #334155;border-radius:12px}</style></head><body><div class="box"><h2>React SPA Production Build</h2><p style="color:#94a3b8;font-size:0.875rem">Running on port ${effectivePort} via Nginx static engine.</p></div></body></html>`);
    }
  };

  const handleExecuteDeploy = () => {
    if (!projectName.trim()) {
      alert('Nama proyek wajib diisi.');
      return;
    }
    if (conflictCheck.isConflict) {
      alert(`Gagal: ${conflictCheck.reason}`);
      return;
    }

    setDeployStep('Mengalokasikan port terisolasi dan menyalin build web...');

    setTimeout(() => {
      const chosenTunnel = tunnels.find((t) => t.id === selectedTunnelId) || tunnels[0];

      const newProj: AppProject = {
        id: `proj-${Date.now()}`,
        name: projectName,
        slug: projectSlug || `app-${effectivePort}`,
        type: projectType,
        port: effectivePort,
        status: 'running',
        memoryMb: +(40 + Math.random() * 35).toFixed(1),
        cpuPercent: +(0.4 + Math.random() * 1.5).toFixed(1),
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastDeployedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        entryPoint: projectType === 'node_api' ? 'server.js' : 'dist/index.html',
        publicUrl: `http://localhost:${effectivePort}`,
        cloudflareDomain: enableCloudflare ? subdomain : undefined,
        cloudflareTunnelId: enableCloudflare ? chosenTunnel?.id : undefined,
        tunnelActive: enableCloudflare,
        sourceType: selectedFile ? 'zip_upload' : 'preset',
        fileCount: extractedSummary.length || 8,
        totalSizeBytes: extractedSize || 2100000,
        filesSummary: extractedSummary.length > 0 ? extractedSummary : ['index.html', 'bundle.js'],
        htmlPreviewContent:
          extractedHtml ||
          `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;background:#fafbfc;color:#0f172a"><h2>${projectName}</h2><p>Berjalan di port :${effectivePort}</p></body></html>`,
        envVars: {
          PORT: String(effectivePort),
          NODE_ENV: 'production',
        },
        logs: [
          `[INIT] Mengimpor paket proyek: ${projectName}`,
          `[PORT] Mengalokasikan port :${effectivePort} - Bebas tabrakan`,
          enableCloudflare ? `[TUNNEL] Ingress Cloudflare aktif (${chosenTunnel?.name}): ${subdomain} -> :${effectivePort}` : '[NET] Port lokal terbuka',
          `[READY] Service online`
        ],
      };

      const updatedProjects = [newProj, ...projects];
      onUpdateProjects(updatedProjects);
      StorageService.saveProjects(updatedProjects);

      if (enableCloudflare && chosenTunnel) {
        const updatedTunnels = tunnels.map((t) => {
          if (t.id === chosenTunnel.id) {
            return {
              ...t,
              ingressRules: [
                {
                  id: `ing-${Date.now()}`,
                  hostname: subdomain,
                  servicePort: effectivePort,
                  protocol: 'http' as const,
                  enabled: true,
                  createdAt: new Date().toISOString().substring(0, 10),
                },
                ...t.ingressRules,
              ],
            };
          }
          return t;
        });
        onUpdateTunnels(updatedTunnels);
        StorageService.saveTunnels(updatedTunnels);
      }

      StorageService.logAudit('DEPLOY_PROJECT', `${projectName} (Port ${effectivePort})`, 'success');

      setDeployStep(null);
      setIsModalOpen(false);
      resetForm();
    }, 600);
  };

  const resetForm = () => {
    setProjectName('');
    setProjectSlug('');
    setSelectedFile(null);
    setExtractedSummary([]);
    setExtractedHtml(null);
    setExtractedSize(0);
    setSubdomain('');
  };

  const handleToggleStatus = (project: AppProject) => {
    const newStatus = project.status === 'running' ? 'stopped' : 'running';
    const updated = projects.map((p) => {
      if (p.id === project.id) {
        return {
          ...p,
          status: newStatus as AppProject['status'],
          logs: [`[STATUS] Service diubah: ${newStatus}`, ...p.logs],
        };
      }
      return p;
    });
    onUpdateProjects(updated);
    StorageService.saveProjects(updated);
    StorageService.logAudit('TOGGLE_PROJECT', `${project.name} (${newStatus})`, 'success');
  };

  const handleDeleteProject = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;

    if (confirm(`Hapus proyek "${proj.name}"? Port ${proj.port} akan dibebaskan kembali.`)) {
      const updated = projects.filter((p) => p.id !== projectId);
      onUpdateProjects(updated);
      StorageService.saveProjects(updated);

      if (proj.cloudflareDomain) {
        const updatedTunnels = tunnels.map((t) => ({
          ...t,
          ingressRules: t.ingressRules.filter((r) => r.hostname !== proj.cloudflareDomain),
        }));
        onUpdateTunnels(updatedTunnels);
        StorageService.saveTunnels(updatedTunnels);
      }

      StorageService.logAudit('DELETE_PROJECT', `${proj.name} (Port ${proj.port} released)`, 'warning');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hidden file input for Update Build */}
      <input
        type="file"
        ref={updateFileInputRef}
        accept=".zip,.html,.htm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0] && targetUpdateProj) {
            handleUpdateFileSelected(e.target.files[0], targetUpdateProj);
          }
        }}
      />

      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Deployment Proyek & Manajemen Build
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Alokasi port otomatis bebas bentrok, re-deploy build baru tanpa downtime, serta integrasi Multi-Tunnel Cloudflare.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Deploy Proyek Baru</span>
        </button>
      </div>

      {/* High-Density Tabular Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Daftar Aplikasi yang Sedang Berjalan
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {projects.length} Proyek
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 font-medium">Nama Proyek</th>
                <th className="py-2.5 px-4 font-medium">Port</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium">Tunnel Bound</th>
                <th className="py-2.5 px-4 font-medium">Pembaruan Terakhir</th>
                <th className="py-2.5 px-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((project) => {
                const linkedTunnel = tunnels.find((t) => t.id === project.cloudflareTunnelId) || tunnels[0];
                const isUpdating = activeUploadId === project.id;
                const isUpdatedJustNow = updateSuccessId === project.id;

                return (
                  <tr key={project.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{project.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        /{project.slug} · {project.type}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      :{project.port}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-medium ${
                        project.status === 'running' ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {project.status === 'running' ? 'Running' : 'Stopped'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {project.cloudflareDomain ? (
                        <div>
                          <span className="text-sky-700">{project.cloudflareDomain}</span>
                          <span className="text-[10px] text-slate-400 block font-sans">
                            {linkedTunnel ? linkedTunnel.name : 'Primary'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Local Only</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                      {project.lastDeployedAt}
                      {isUpdatedJustNow && (
                        <span className="ml-2 text-emerald-600 font-sans text-[11px] font-medium">
                          ✓ Reloaded
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-3">
                      {/* Zero-downtime update button */}
                      <button
                        onClick={() => handleTriggerUpdateModal(project)}
                        disabled={isUpdating}
                        className="text-sky-600 hover:text-sky-800 font-medium transition-colors cursor-pointer disabled:opacity-50"
                        title="Upload file build .zip baru dan restart tanpa downtime"
                      >
                        {isUpdating ? 'Mengunggah...' : 'Update Build'}
                      </button>

                      <button
                        onClick={() => setPreviewProject(project)}
                        className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        Preview
                      </button>

                      <button
                        onClick={() => setLogsProject(project)}
                        className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Log Service"
                      >
                        Log
                      </button>

                      <button
                        onClick={() => handleToggleStatus(project)}
                        className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        {project.status === 'running' ? 'Stop' : 'Start'}
                      </button>

                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4 text-xs text-slate-600 leading-relaxed font-mono">
        <strong>Zero-Downtime Reload:</strong> Saat menekan tombol <strong>Update Build</strong>, sistem mengekstrak paket baru langsung ke direktori aplikasi tanpa mengubah port yang sudah terikat, lalu menjalankan reload worker transparan via PM2.
      </div>

      {/* Modal: New Deployment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Deploy Proyek Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Alokasi port otomatis bebas tabrakan & Multi-Tunnel
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {deployStep && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-sky-800 text-center font-medium">
                  {deployStep}
                </div>
              )}

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  File Build Web (.zip atau index.html)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-50 rounded-lg p-5 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".zip,.html,.htm"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <FolderArchive className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                  <p className="font-medium text-slate-700">
                    {selectedFile ? selectedFile.name : 'Pilih file build (.zip / dist)'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mendukung build Vite, Next.js static, Vue, atau file HTML biasa
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">Template uji:</span>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('portfolio')}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                  >
                    Portofolio
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('react')}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                  >
                    React Vite SPA
                  </button>
                </div>
              </div>

              {/* Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Proyek
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Contoh: Toko Online"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipe Proyek
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="spa_build">Single Page App (dist)</option>
                    <option value="static_html">Static HTML</option>
                    <option value="node_api">Node.js API</option>
                  </select>
                </div>
              </div>

              {/* Automatic Port Allocation Box */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    Alokasi Port Bebas Bentrok
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPort}
                      onChange={(e) => setAutoPort(e.target.checked)}
                      className="rounded"
                    />
                    <span>Otomatis</span>
                  </label>
                </div>

                {autoPort ? (
                  <div className="flex items-center justify-between py-1 font-mono">
                    <span className="text-slate-500">Port dialokasikan:</span>
                    <span className="font-bold text-sky-700">:{nextSafePort}</span>
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      value={customPortVal}
                      onChange={(e) => setCustomPortVal(parseInt(e.target.value) || 0)}
                      className="w-32 px-2.5 py-1 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                    {conflictCheck.isConflict && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{conflictCheck.reason}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Cloudflare Ingress with Multi-Tunnel Selector */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    Routing Cloudflare Multi-Tunnel
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableCloudflare}
                      onChange={(e) => setEnableCloudflare(e.target.checked)}
                      className="rounded"
                    />
                    <span>Aktifkan Ingress</span>
                  </label>
                </div>

                {enableCloudflare && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Pilih Tunnel ID Tujuan:
                      </label>
                      <select
                        value={selectedTunnelId}
                        onChange={(e) => setSelectedTunnelId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                      >
                        {tunnels.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.tunnelId.slice(0, 8)}...)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Public Hostname / Domain:
                      </label>
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value)}
                        placeholder="app.bram.my.id"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-900 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        https://{subdomain || 'app.bram.my.id'} ➔ localhost:{effectivePort}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={conflictCheck.isConflict || !projectName.trim() || !!deployStep}
                onClick={handleExecuteDeploy}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Deploy ke Port :{effectivePort}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web Preview Modal */}
      {previewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="font-semibold text-slate-900">{previewProject.name}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600">Port :{previewProject.port}</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1 rounded text-xs transition-colors ${
                    previewDevice === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1 rounded text-xs transition-colors ${
                    previewDevice === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setPreviewProject(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 overflow-auto">
              <div
                className={`bg-white shadow-sm border border-slate-300 transition-all overflow-hidden ${
                  previewDevice === 'mobile' ? 'w-[375px] h-[667px] rounded-2xl' : 'w-full h-full rounded-lg'
                }`}
              >
                <iframe
                  title="Web Preview"
                  srcDoc={previewProject.htmlPreviewContent}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-slate-950 text-slate-200 rounded-xl border border-slate-800 shadow-2xl w-full max-w-xl max-h-[75vh] flex flex-col font-mono text-xs">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between text-slate-400">
              <span>Log: {logsProject.name} (Port {logsProject.port})</span>
              <button onClick={() => setLogsProject(null)} className="hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-1 flex-1 text-slate-300">
              {logsProject.logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
