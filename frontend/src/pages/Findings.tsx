import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Search, Filter, Download, MoreVertical } from 'lucide-react'
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

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-500/10 text-red-500 border border-red-500/20'
    case 'high': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
    case 'medium': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
    case 'low': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    default: return 'bg-slate-700 text-slate-300'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'fixed': return 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
    case 'in_progress': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'open': default: return 'bg-slate-700 text-slate-300'
  }
}

export default function Findings() {
  const { selectedProject } = useProjects()
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: summaryData } = useQuery({
    queryKey: ['findings-summary', selectedProject?.id],
    queryFn: () => findings.summary(selectedProject!.id),
    enabled: !!selectedProject,
  })

  const { data: findingsData, isLoading } = useQuery({
    queryKey: ['findings', selectedProject?.id, severityFilter, statusFilter],
    queryFn: () => findings.list(selectedProject!.id, { 
      severity: severityFilter === 'all' ? undefined : severityFilter, 
      status: statusFilter === 'all' ? undefined : statusFilter 
    }),
    enabled: !!selectedProject,
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
    <div className="h-full flex flex-col animate-fade-in">
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800 bg-[#1e293b] flex-shrink-0">
        <h2 className="text-2xl font-bold">Security Findings</h2>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Filter size={16} />
            Filter
          </button>
          <button className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <p className="text-sm font-medium text-slate-400">Total Findings</p>
            <p className="text-2xl font-bold mt-2">{summary.total}</p>
          </div>
          <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-800 border-t-4 border-t-red-500">
            <p className="text-sm font-medium text-slate-400">Critical</p>
            <p className="text-2xl font-bold mt-2 text-red-500">{summary.by_severity?.critical || 0}</p>
          </div>
          <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-800 border-t-4 border-t-orange-500">
            <p className="text-sm font-medium text-slate-400">High</p>
            <p className="text-2xl font-bold mt-2 text-orange-500">{summary.by_severity?.high || 0}</p>
          </div>
          <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-800 border-t-4 border-t-yellow-500">
            <p className="text-sm font-medium text-slate-400">Medium</p>
            <p className="text-2xl font-bold mt-2 text-yellow-500">{summary.by_severity?.medium || 0}</p>
          </div>
          <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-800 border-t-4 border-t-blue-500">
            <p className="text-sm font-medium text-slate-400">Low</p>
            <p className="text-2xl font-bold mt-2 text-blue-400">{summary.by_severity?.low || 0}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#1e293b] p-4 rounded-xl border border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" size={16} />
            <input
              className="w-full bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-[#22c55e] placeholder:text-slate-500 text-white"
              placeholder="Search CVE or Description..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <select
              className="appearance-none w-full sm:w-auto bg-slate-800 border-none rounded-lg pl-4 pr-10 py-2 text-sm focus:ring-1 focus:ring-[#22c55e] text-slate-300"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              className="appearance-none w-full sm:w-auto bg-slate-800 border-none rounded-lg pl-4 pr-10 py-2 text-sm focus:ring-1 focus:ring-[#22c55e] text-slate-300"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status: All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-800/50 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4">CVE ID</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">CVSS</th>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading findings...</td>
                  </tr>
                ) : filteredFindings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No findings found</td>
                  </tr>
                ) : (
                  filteredFindings.map((finding) => (
                    <tr key={finding.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-blue-400 cursor-pointer hover:underline">
                        {finding.cve_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4">{finding.title}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityClass(finding.severity)}`}>
                          {finding.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{finding.cvss_score || 'N/A'}</span>
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-current" 
                              style={{ 
                                width: `${(finding.cvss_score || 0) * 10}%`,
                                color: finding.cvss_score && finding.cvss_score >= 9 ? '#ef4444' : finding.cvss_score && finding.cvss_score >= 7 ? '#f97316' : finding.cvss_score && finding.cvss_score >= 4 ? '#eab308' : '#3b82f6'
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{finding.affected_component || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(finding.status)}`}>
                          {finding.status === 'in_progress' ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                          ) : null}
                          {finding.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-slate-100 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-sm text-slate-400">
            <p>Showing 1-{filteredFindings.length} of {summary.total} findings</p>
            <div className="flex items-center gap-2">
              <button className="p-1 rounded hover:bg-slate-800 transition-colors disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button className="p-1 rounded hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
