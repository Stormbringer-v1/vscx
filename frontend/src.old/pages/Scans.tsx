import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Plus, Trash2, Scan, CheckCircle, XCircle, Clock } from 'lucide-react'
import { scans } from '../lib/api'
import { useProjects } from '../context/ProjectContext'

interface Scan {
  id: number
  name: string
  scan_type: string
  targets: string
  status: string
  progress: number
  started_at?: string
  completed_at?: string
  created_at: string
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock size={16} />, color: 'text-gray-500' },
  running: { icon: <Scan size={16} className="animate-pulse" />, color: 'text-blue-500' },
  completed: { icon: <CheckCircle size={16} />, color: 'text-green-500' },
  failed: { icon: <XCircle size={16} />, color: 'text-red-500' },
}

const scanTypes = [
  { value: 'nmap', label: 'Nmap (Network Scan)', description: 'Port and service discovery' },
  { value: 'nuclei', label: 'Nuclei (Vulnerability Scan)', description: 'Security vulnerability detection' },
  { value: 'trivy', label: 'Trivy (Container Scan)', description: 'Container and OS vulnerability scanning' },
]

export default function Scans() {
  const { selectedProject } = useProjects()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    scan_type: 'nmap',
    targets: '',
  })

  const { data: scansData, isLoading } = useQuery({
    queryKey: ['scans', selectedProject?.id],
    queryFn: () => scans.list(selectedProject!.id),
    enabled: !!selectedProject,
    refetchInterval: 3000,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData & { project_id: number }) => scans.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans', selectedProject?.id] })
      setShowForm(false)
      setFormData({ name: '', scan_type: 'nmap', targets: '' })
    },
  })

  const executeMutation = useMutation({
    mutationFn: (id: number) => scans.execute(selectedProject!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans', selectedProject?.id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => scans.delete(selectedProject!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans', selectedProject?.id] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    createMutation.mutate({ ...formData, project_id: selectedProject.id })
  }

  const scansList: Scan[] = scansData?.data || []

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Scans</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500">Please create a project first to run scans.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scans</h1>
          <p className="text-gray-500">Run vulnerability scans</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
        >
          <Plus size={18} />
          New Scan
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Scan</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scan Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="Weekly Security Scan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scanner Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {scanTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.scan_type === type.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scan_type"
                      value={type.value}
                      checked={formData.scan_type === type.value}
                      onChange={(e) => setFormData({ ...formData, scan_type: e.target.value })}
                      className="sr-only"
                    />
                    <p className="font-medium text-gray-900">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Targets</label>
              <input
                type="text"
                required
                value={formData.targets}
                onChange={(e) => setFormData({ ...formData, targets: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder={formData.scan_type === 'trivy' ? 'nginx:latest' : '192.168.1.0/24 or example.com'}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.scan_type === 'trivy'
                  ? 'Container image name (e.g., nginx:latest)'
                  : 'IP addresses, CIDR ranges, or hostnames (comma-separated)'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Scan'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500">Loading scans...</p>
        </div>
      ) : scansList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500">No scans yet. Start your first scan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Targets</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scansList.map((scan) => {
                const status = statusConfig[scan.status] || statusConfig.pending
                return (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{scan.name}</p>
                      <p className="text-sm text-gray-500">
                        {scan.started_at ? new Date(scan.started_at).toLocaleString() : new Date(scan.created_at).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-gray-900">{scan.scan_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{scan.targets}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 ${status.color}`}>
                        {status.icon}
                        <span className="capitalize">{scan.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-brand-600 h-2 rounded-full transition-all"
                            style={{ width: `${scan.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{scan.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {scan.status !== 'running' && (
                          <button
                            onClick={() => executeMutation.mutate(scan.id)}
                            className="p-1 text-gray-400 hover:text-brand-600"
                            title="Run scan"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(scan.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Delete scan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
