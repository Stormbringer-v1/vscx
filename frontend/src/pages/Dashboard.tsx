import { useQuery } from '@tanstack/react-query'
import { Shield, Server, Bug, AlertTriangle, Activity, TrendingUp } from 'lucide-react'
import { findings, scans, assets } from '../lib/api'
import { useProjects } from '../context/ProjectContext'

interface Scan {
  id: number
  name: string
  scan_type: string
  status: string
  created_at: string
}

export default function Dashboard() {
  const { selectedProject, projects } = useProjects()

  const { data: summaryData } = useQuery({
    queryKey: ['findings-summary', selectedProject?.id],
    queryFn: () => findings.summary(selectedProject!.id),
    enabled: !!selectedProject,
  })

  const { data: assetsData } = useQuery({
    queryKey: ['assets', selectedProject?.id],
    queryFn: () => assets.list(selectedProject!.id),
    enabled: !!selectedProject,
  })

  const { data: scansData } = useQuery({
    queryKey: ['scans', selectedProject?.id],
    queryFn: () => scans.list(selectedProject!.id),
    enabled: !!selectedProject,
  })

  const summary = summaryData?.data || { total: 0, by_severity: {}, by_status: {} }
  const assetsCount = assetsData?.data?.length || 0
  const scansList: Scan[] = scansData?.data || []

  const recentScans = scansList.slice(0, 5)
  const totalRiskScore = (summary.by_severity?.critical || 0) * 10 + 
                          (summary.by_severity?.high || 0) * 5 + 
                          (summary.by_severity?.medium || 0) * 2 || 0

  const stats = [
    { label: 'Total Assets', value: assetsCount, icon: Server, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    { label: 'Vulnerabilities', value: summary.total, icon: Bug, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    { label: 'Critical Issues', value: summary.by_severity?.critical || 0, icon: AlertTriangle, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
    { label: 'Risk Score', value: totalRiskScore, icon: TrendingUp, color: totalRiskScore > 50 ? '#ef4444' : totalRiskScore > 20 ? '#f59e0b' : '#10b981', bg: totalRiskScore > 50 ? 'rgba(239, 68, 68, 0.15)' : totalRiskScore > 20 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)' },
  ]

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Overview of your security posture</p>
        </div>

        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--bg-tertiary)' }}>
            <Shield size={40} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Welcome to vscx</h2>
          <p style={{ color: 'var(--text-muted)' }} className="mb-6">
            {projects.length === 0 
              ? 'Create your first project to get started with vulnerability scanning.'
              : 'Select a project from the sidebar to view its dashboard.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>{selectedProject.name} Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-3xl font-bold mt-1 text-white">{value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={24} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Vulnerability Breakdown</h3>
          </div>
          <div className="space-y-4">
            {['critical', 'high', 'medium', 'low', 'info'].map((severity) => {
              const count = summary.by_severity?.[severity] || 0
              const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0
              const colors: Record<string, string> = {
                critical: '#a855f7',
                high: '#ef4444',
                medium: '#f59e0b',
                low: '#3b82f6',
                info: '#71717a'
              }
              return (
                <div key={severity}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{severity}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${percentage}%`, background: colors[severity] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              <Activity size={18} className="inline mr-2" style={{ color: 'var(--accent-primary)' }} />
              Recent Scans
            </h3>
          </div>
          {recentScans.length === 0 ? (
            <div className="text-center py-8">
              <Activity size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No scans yet. Start your first scan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${scan.status === 'completed' ? 'bg-green-500' : scan.status === 'running' ? 'bg-blue-500 animate-pulse' : scan.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{scan.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(scan.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`badge ${scan.status === 'completed' ? 'badge-info' : scan.status === 'running' ? 'badge-medium' : scan.status === 'failed' ? 'badge-high' : 'badge-info'}`}>
                    {scan.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
