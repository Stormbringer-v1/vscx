import { useQuery } from '@tanstack/react-query'
import { Shield, Server, Bug, AlertTriangle, Activity } from 'lucide-react'
import { findings, scans, assets } from '../lib/api'
import { useProjects } from '../context/ProjectContext'

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
  const scansList = scansData?.data || []

  const recentScans = scansList.slice(0, 5)
  const totalRiskScore = summary.by_severity?.critical * 10 + 
                          summary.by_severity?.high * 5 + 
                          summary.by_severity?.medium * 2 || 0

  const stats = [
    { label: 'Total Assets', value: assetsCount, icon: Server, color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'Vulnerabilities', value: summary.total, icon: Bug, color: 'text-red-500', bg: 'bg-red-100' },
    { label: 'Critical Issues', value: summary.by_severity?.critical || 0, icon: AlertTriangle, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Risk Score', value: totalRiskScore.toFixed(1), icon: Shield, color: totalRiskScore > 50 ? 'text-red-600' : totalRiskScore > 20 ? 'text-yellow-600' : 'text-green-600', bg: totalRiskScore > 50 ? 'bg-red-100' : totalRiskScore > 20 ? 'bg-yellow-100' : 'bg-green-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your security posture</p>
      </div>

      {!selectedProject ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
          {projects.length === 0 ? (
            <p className="text-gray-500">No projects yet. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm text-gray-500 mb-2">Current Project:</p>
            <h2 className="text-xl font-semibold">{selectedProject.name}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${bg}`}>
                    <Icon size={24} className={color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Vulnerability Breakdown</h2>
              <div className="space-y-3">
                {['critical', 'high', 'medium', 'low', 'info'].map((severity) => {
                  const count = summary.by_severity?.[severity] || 0
                  const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0
                  const colors: Record<string, string> = {
                    critical: 'bg-purple-600',
                    high: 'bg-red-600',
                    medium: 'bg-yellow-500',
                    low: 'bg-blue-500',
                    info: 'bg-gray-400'
                  }
                  return (
                    <div key={severity}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700">{severity}</span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${colors[severity]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">
                <Activity size={18} className="inline mr-2" />
                Recent Scans
              </h2>
              {recentScans.length === 0 ? (
                <p className="text-gray-500 text-sm">No scans yet. Start a scan to see results.</p>
              ) : (
                <div className="space-y-3">
                  {recentScans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{scan.name}</p>
                        <p className="text-xs text-gray-500">{new Date(scan.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        scan.status === 'completed' ? 'bg-green-100 text-green-700' :
                        scan.status === 'running' ? 'bg-blue-100 text-blue-700' :
                        scan.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {scan.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
