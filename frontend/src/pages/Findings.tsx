import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle, Search } from 'lucide-react'
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
  critical: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  low: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  info: { color: '#71717a', bg: 'rgba(113, 113, 122, 0.15)' },
}

export default function Findings() {
  const { selectedProject } = useProjects()
  const queryClient = useQueryClient()
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

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

  const filteredFindings = searchQuery
    ? findingsList.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.cve_id?.toLowerCase().includes(searchQuery.toLowerCase()))
    : findingsList

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Findings</h1>
        <div className="card p-8 text-center">
          <AlertTriangle size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Please select a project to view findings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Findings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Vulnerabilities discovered</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card p-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total</p>
          <p className="text-2xl font-bold text-white">{summary.total}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Critical</p>
          <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>{summary.by_severity?.critical || 0}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>High</p>
          <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{summary.by_severity?.high || 0}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Medium</p>
          <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{summary.by_severity?.medium || 0}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Low</p>
          <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{summary.by_severity?.low || 0}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Open</p>
          <p className="text-2xl font-bold text-white">{summary.by_status?.open || 0}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search findings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="input w-40"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="info">Info</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-32"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center">
          <p style={{ color: 'var(--text-muted)' }}>Loading findings...</p>
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="card p-8 text-center">
          <AlertTriangle size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No findings yet. Run a scan to discover vulnerabilities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            const severity = severityConfig[finding.severity] || severityConfig.info
            return (
              <div key={finding.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: severity.bg }}>
                      <AlertTriangle size={20} style={{ color: severity.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white">{finding.title}</h3>
                        {finding.cve_id && (
                          <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-primary)' }}>
                            {finding.cve_id}
                          </span>
                        )}
                        <span className={`badge badge-${finding.severity}`}>
                          {finding.severity}
                        </span>
                      </div>
                      {finding.description && (
                        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{finding.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {finding.affected_component && <span>Component: {finding.affected_component}</span>}
                        {finding.cvss_score !== undefined && finding.cvss_score > 0 && <span>CVSS: {finding.cvss_score.toFixed(1)}</span>}
                        <span>{new Date(finding.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {finding.status === 'open' ? (
                      <button
                        onClick={() => updateMutation.mutate({ id: finding.id, data: { status: 'resolved' } })}
                        className="btn btn-secondary text-sm"
                      >
                        <CheckCircle size={14} />
                        Resolve
                      </button>
                    ) : (
                      <span className="badge badge-info">Resolved</span>
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
