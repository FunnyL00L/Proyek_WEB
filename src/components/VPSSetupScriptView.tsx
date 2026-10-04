import React, { useState } from 'react';
import {
  Copy,
  Check
} from 'lucide-react';
import { VPS_INFO } from '../services/systemSimulator';

export const VPSSetupScriptView: React.FC = () => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);
  const [copiedDocker, setCopiedDocker] = useState(false);

  const fullBashScript = `#!/bin/bash
# BramCloud VPS Manager - Automated Installer
# Target OS: Ubuntu 22.04 / 24.04 LTS
set -e

echo "[1/5] Updating packages..."
apt-get update -y && apt-get install -y curl wget git unzip ufw fail2ban htop net-tools

echo "[2/5] Installing Node.js v20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2 serve tsx

echo "[3/5] Configuring Nginx..."
apt-get install -y nginx
systemctl enable nginx && systemctl start nginx

echo "[4/5] Installing Cloudflared..."
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared.deb && rm cloudflared.deb

echo "[5/5] Configuring UFW Firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw limit 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

mkdir -p /var/www /root/.cloudflared
echo "BramCloud Setup Complete on Port 3000."
`;

  const dockerComposeYaml = `version: '3.8'

services:
  bramcloud-panel:
    image: node:20-alpine
    container_name: bramcloud-vps-manager
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - /var/www:/var/www
      - /root/.cloudflared:/root/.cloudflared
    environment:
      - NODE_ENV=production
      - PORT=3000
    command: npm run start
`;

  const copyToClipboard = (text: string, type: 'oneliner' | 'script' | 'docker') => {
    navigator.clipboard.writeText(text);
    if (type === 'oneliner') {
      setCopiedOneLiner(true);
      setTimeout(() => setCopiedOneLiner(false), 2000);
    } else if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedDocker(true);
      setTimeout(() => setCopiedDocker(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Script Otomatisasi Instalasi VPS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Jalankan skrip ini di VPS Ubuntu baru Anda untuk memasang dependensi (Node.js 20, Nginx, UFW, PM2, Cloudflared) secara otomatis dalam hitungan menit.
          </p>
        </div>

        <button
          onClick={() => copyToClipboard(fullBashScript, 'script')}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start md:self-auto"
        >
          {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedScript ? 'Tersalin' : 'Salin Skrip Penuh'}</span>
        </button>
      </div>

      {/* 1-Liner Quick Run Command */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
        <h3 className="font-semibold text-xs text-slate-700 uppercase tracking-wider mb-1">
          Perintah 1-Baris SSH
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Salin dan jalankan langsung pada sesi terminal SSH VPS Anda:
        </p>

        <div className="flex items-center justify-between bg-slate-950 text-slate-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
          <code>curl -fsSL https://bramcloud.my.id/install-vps.sh | sudo bash</code>
          <button
            onClick={() =>
              copyToClipboard('curl -fsSL https://bramcloud.my.id/install-vps.sh | sudo bash', 'oneliner')
            }
            className="ml-3 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Salin"
          >
            {copiedOneLiner ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Script Source Code Box */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">
            Source Code Shell (install-vps.sh)
          </span>
          <span className="text-slate-400 font-mono">Ubuntu 22.04 / 24.04</span>
        </div>
        <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed">
          {fullBashScript}
        </pre>
      </div>

      {/* Docker Compose Box */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">
            Docker Compose (docker-compose.yml)
          </span>
          <button
            onClick={() => copyToClipboard(dockerComposeYaml, 'docker')}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            {copiedDocker ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedDocker ? 'Tersalin' : 'Salin Docker Compose'}</span>
          </button>
        </div>
        <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed">
          {dockerComposeYaml}
        </pre>
      </div>
    </div>
  );
};
