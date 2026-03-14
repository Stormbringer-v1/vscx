import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle, Filter, XCircle } from 'lucide-react'
import { findings } from '../lib/api'
import { useProjects } from '../context/ProjectContext'

interface Finding {
  id: number
  title: string
  description?: string
  severity: string
  cve_id?: string
  cvss_score?: number
  affected_component?: string
  status: string
  created_at: string
}

const severityConfig: Record<string, { color: string; bg: string }> = {
  critical: { color: 'text-purple-600', bg: 'bg-purple-100' },
  high: { color: 'text-red-600', bg: 'bg-red-100' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-100' },
  low: { color: 'text-blue-600', bg: 'bg-blue-100' },
  info: { color: 'text-gray-600', bg: 'bg-gray-100' },
}

export default function Findings() {
  const { selectedProject } = useProjects()
  const queryClient = useQueryClient()
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: summaryData } = useQuery({
    queryKey: ['findings-summary', selectedProject?.id],
    queryFn: () => findings.summary(selectedProject!.id),
    enabled: !!selectedProject,
  })

  const { data: findingsData, isLoading } = useQuery({
    queryKey: ['findings', selectedProject?.id, severityFilter, statusFilter],
    queryFn: () => findings.list(selectedProject!.id, { severity: severityFilter || undefined, status: statusFilter || undefined }),
    enabled: !!selectedProject,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: string } }) => findings.update(selectedProject!.id, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', selectedProject?.id] })
      queryClient.invalidateQueries({ queryKey: ['findings-summary', selectedProject?.id] })
    },
  })

  const findingsList: Finding[] = findingsData?.data || []
  const summary = summaryData?.data || { total: 0, by_severity: {}, by_status: {} }

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Findings</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500">Please select a project to view findings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Findings</h1>
        <p className="text-gray-500">Vulnerabilities discovered</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Critical</p>
          <p className="text-2xl font-bold text-purple-600">{summary.by_severity?.critical || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">High</p>
          <p className="text-2xl font-bold text-red-600">{summary.by_severity?.high || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Medium</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.by_severity?.medium || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Low</p>
          <p className="text-2xl font-bold text-blue-600">{summary.by_severity?.low || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-2xl font-bold text-gray-900">{summary.by_status?.open || 0}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500">Loading findings...</p>
        </div>
      ) : findingsList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500">No findings yet. Run a scan to discover vulnerabilities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {findingsList.map((finding) => {
            const severity = severityConfig[finding.severity] || severityConfig.info
            return (
              <div key={finding.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${severity.bg}`}>
                      <AlertTriangle size={18} className={severity.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{finding.title}</h3>
                        {finding.cve_id && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            {finding.cve_id}
                          </span>
                        )}
                      </div>
                      {finding.description && (
                        <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {finding.affected_component && (
                          <span>Component: {finding.affected_component}</span>
                        )}
                        {finding.cvss_score !== undefined && finding.cvss_score > 0 && (
                          <span>CVSS: {finding.cvss_score.toFixed(1)}</span>
                        )}
                        <span>{new Date(finding.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {finding.status === 'open' ? (
                      <button
                        onClick={() => updateMutation.mutate({ id: finding.id, data: { status: 'resolved' } })}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 bg-green-100 rounded-lg hover:bg-green-200"
                      >
                        <CheckCircle size={14} />
                        Resolve
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg">
                        <CheckCircle size={14} />
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
