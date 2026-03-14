import { Settings as SettingsIcon, Shield, Database, Zap } from 'lucide-react'

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure your scanner</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <Shield size={24} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Scanner Configuration</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Configure scan settings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="text-sm font-medium text-white">Nmap</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Port & service discovery</p>
              </div>
              <span className="badge badge-info">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="text-sm font-medium text-white">Nuclei</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Vulnerability scanning</p>
              </div>
              <span className="badge badge-info">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="text-sm font-medium text-white">Trivy</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Container security</p>
              </div>
              <span className="badge badge-info">Enabled</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
              <Database size={24} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Vulnerability Databases</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>External sources</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="text-sm font-medium text-white">NVD (National Vulnerability Database)</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CVE information</p>
              </div>
              <span className="badge badge-info">Connected</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="text-sm font-medium text-white">OSV (Open Source Vulnerabilities)</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Package vulnerabilities</p>
              </div>
              <span className="badge badge-info">Connected</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="text-sm font-medium text-white">EPSS (Exploit Prediction)</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Exploit probability scores</p>
              </div>
              <span className="badge badge-info">Connected</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
              <Zap size={24} style={{ color: '#a855f7' }} />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Features</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Machine learning powered</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="text-sm font-medium text-white">Remediation Suggestions</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI-powered fix recommendations</p>
              </div>
              <span className="badge badge-info">Available</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="text-sm font-medium text-white">Report Generation</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Executive summaries</p>
              </div>
              <span className="badge badge-info">Available</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              <SettingsIcon size={24} color="#f59e0b" />
            </div>
            <div>
              <h3 className="font-semibold text-white">About</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Application info</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Version</span>
              <span className="text-white">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Backend</span>
              <span className="text-white">FastAPI + PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Frontend</span>
              <span className="text-white">React + Tailwind</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Queue</span>
              <span className="text-white">Celery + Redis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
