import { useQuery } from '@tanstack/react-query'
import { Shield, Server, Bug, AlertTriangle, Activity, TrendingUp, TrendingDown, FileText, Plus, MoreVertical } from 'lucide-react'
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

  const recentScans = scansList.slice(0, 4)
  const totalRiskScore = (summary.by_severity?.critical || 0) * 10 + 
                          (summary.by_severity?.high || 0) * 5 + 
                          (summary.by_severity?.medium || 0) * 2 || 0

  const stats = [
    { label: 'Total Assets', value: assetsCount, icon: Server, trend: '+5%', trendUp: true },
    { label: 'Active Scans', value: scansList.filter(s => s.status === 'running').length, icon: Activity, trend: '+2%', trendUp: true },
    { label: 'Open Findings', value: summary.total, icon: Bug, trend: '-15%', trendUp: false },
    { label: 'Risk Score', value: 72, icon: TrendingDown, trend: '-3%', trendUp: false },
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
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-white text-3xl font-bold leading-tight">Vulnerability Dashboard</h2>
        <div className="flex gap-3">
          <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#1e293b] text-white hover:bg-slate-700 transition-colors text-sm font-semibold border border-slate-700">
            <FileText size={18} />
            Generate Report
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#22c55e] text-slate-900 hover:bg-[#22c55e]/90 transition-colors text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <Plus size={18} />
            New Scan
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1e293b] border border-slate-800">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Assets</p>
          <div className="flex items-end justify-between">
            <p className="text-white text-3xl font-bold leading-none">{assetsCount}</p>
            <p className="text-[#22c55e] flex items-center text-sm font-semibold bg-[#22c55e]/10 px-2 py-1 rounded">
              <TrendingUp size={14} className="mr-1" /> +5%
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1e293b] border border-slate-800">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Active Scans</p>
          <div className="flex items-end justify-between">
            <p className="text-white text-3xl font-bold leading-none">{scansList.filter(s => s.status === 'running').length}</p>
            <p className="text-[#22c55e] flex items-center text-sm font-semibold bg-[#22c55e]/10 px-2 py-1 rounded">
              <TrendingUp size={14} className="mr-1" /> +2%
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1e293b] border border-slate-800">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Open Findings</p>
          <div className="flex items-end justify-between">
            <p className="text-white text-3xl font-bold leading-none">{summary.total}</p>
            <p className="text-red-400 flex items-center text-sm font-semibold bg-red-400/10 px-2 py-1 rounded">
              <TrendingDown size={14} className="mr-1" /> -15%
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1e293b] border border-slate-800">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Risk Score</p>
          <div className="flex items-end justify-between">
            <p className="text-white text-3xl font-bold leading-none">{totalRiskScore}</p>
            <p className="text-red-400 flex items-center text-sm font-semibold bg-red-400/10 px-2 py-1 rounded">
              <TrendingDown size={14} className="mr-1" /> -3%
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 rounded-xl p-6 bg-[#1e293b] border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-lg font-bold">Vulnerability Trend</h3>
            <select className="bg-[#0b1120] border border-slate-700 text-slate-300 text-sm rounded-lg p-2">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Year to Date</option>
            </select>
          </div>
          <div className="flex-1 min-h-[300px] w-full bg-[#0b1120]/50 rounded-lg flex items-center justify-center border border-slate-800 border-dashed relative overflow-hidden">
            <div className="absolute inset-0 flex items-end px-8 pb-8 pt-12 justify-between gap-2 opacity-50">
              <div className="w-full bg-red-500/20 rounded-t h-[40%]"></div>
              <div className="w-full bg-red-500/20 rounded-t h-[60%]"></div>
              <div className="w-full bg-red-500/20 rounded-t h-[45%]"></div>
              <div className="w-full bg-red-500/20 rounded-t h-[75%]"></div>
              <div className="w-full bg-red-500/20 rounded-t h-[50%]"></div>
              <div className="w-full bg-red-500/20 rounded-t h-[80%]"></div>
              <div className="w-full bg-red-500/20 rounded-t h-[65%]"></div>
            </div>
            <p className="text-slate-500 font-medium z-10">Trend Chart Visualization</p>
          </div>
        </section>

        <section className="lg:col-span-1 rounded-xl bg-[#1e293b] border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-white text-lg font-bold">Recent Scans</h3>
            <a className="text-[#22c55e] text-sm font-medium hover:underline" href="#">View All</a>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-800">
                {recentScans.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center text-slate-400">No scans yet</td>
                  </tr>
                ) : (
                  recentScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-[#0b1120]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-white font-semibold">{scan.name}</span>
                          <span className="text-slate-400 text-xs">{scan.scan_type}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          scan.status === 'completed' ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' :
                          scan.status === 'running' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          scan.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {scan.status === 'running' && <Activity size={12} className="mr-1 animate-spin" />}
                          {scan.status}
                        </span>
                        <div className="text-slate-500 text-xs mt-1">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
