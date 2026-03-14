import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Server, X, Search, Filter, MoreVertical, Computer, HardDrive, Laptop, Network, ChevronLeft, ChevronRight } from 'lucide-react'
import { assets } from '../lib/api'
import { useProjects } from '../context/ProjectContext'

interface Asset {
  id: number
  name: string
  asset_type: string
  ip_address?: string
  hostname?: string
  url?: string
  description?: string
  risk_score: number
  os_info?: string
  status?: string
  last_scan?: string
}

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'server': return <Computer size={18} />
    case 'website': return <HardDrive size={18} />
    case 'workstation': return <Laptop size={18} />
    case 'network': return <Network size={18} />
    default: return <Server size={18} />
  }
}

const getSeverityClass = (count: number, severity: string) => {
  const baseClass = 'inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md text-xs font-semibold '
  if (count === 0) return baseClass + 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
  switch (severity) {
    case 'critical': return baseClass + 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
    case 'high': return baseClass + 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20'
    case 'medium': return baseClass + 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20'
    default: return baseClass + 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
  }
}

export default function Assets() {
  const { selectedProject } = useProjects()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'server',
    ip_address: '',
    hostname: '',
    url: '',
    description: '',
  })

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets', selectedProject?.id],
    queryFn: () => assets.list(selectedProject!.id),
    enabled: !!selectedProject,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData & { project_id: number }) => assets.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', selectedProject?.id] })
      setShowForm(false)
      setFormData({ name: '', asset_type: 'server', ip_address: '', hostname: '', url: '', description: '' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    createMutation.mutate({ ...formData, project_id: selectedProject.id })
  }

  const assetsList: Asset[] = assetsData?.data || []

  const filteredAssets = assetsList.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.ip_address?.includes(searchTerm) ||
                         asset.hostname?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
    const matchesType = typeFilter === 'all' || asset.asset_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Assets</h1>
        <div className="card p-8 text-center">
          <Server size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Please select a project to manage assets.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between border-b border-slate-800 bg-[#152620]/50 backdrop-blur-sm px-8 py-5">
        <div>
          <h2 className="text-2xl font-bold text-white">Assets Management</h2>
          <p className="text-sm text-slate-400 mt-1">Manage and monitor all discovered network assets.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-[#22c55e] text-white text-sm font-medium hover:bg-[#22c55e]/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Asset</span>
        </button>
      </header>

      {showForm && (
        <div className="bg-[#1a2d26] rounded-xl shadow-sm border border-slate-800 p-6 animate-fade-in mx-8 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Add New Asset</h2>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-lg">
              <X size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#12201b] border border-slate-700 rounded-lg text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                  placeholder="Production Server"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  className="w-full px-4 py-2 bg-[#12201b] border border-slate-700 rounded-lg text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                >
                  <option value="server">Server</option>
                  <option value="website">Website</option>
                  <option value="workstation">Workstation</option>
                  <option value="network">Network</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>IP Address</label>
                <input
                  type="text"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  className="w-full px-4 py-2 bg-[#12201b] border border-slate-700 rounded-lg text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                  placeholder="192.168.1.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Hostname</label>
                <input
                  type="text"
                  value={formData.hostname}
                  onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                  className="w-full px-4 py-2 bg-[#12201b] border border-slate-700 rounded-lg text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                  placeholder="server.example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 bg-[#12201b] border border-slate-700 rounded-lg text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-[#12201b] border border-slate-700 rounded-lg text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="bg-[#22c55e] hover:bg-[#22c55e]/90 text-white px-6 py-2 rounded-lg font-medium">
                {createMutation.isPending ? 'Creating...' : 'Create Asset'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="px-8">
        <div className="flex flex-col sm:flex-row justify-between gap-4 bg-[#1a2d26] p-4 rounded-xl border border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-2 bg-[#12201b] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
              placeholder="Search assets by IP, hostname, or tags..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <select
              className="appearance-none bg-[#12201b] border border-slate-700 rounded-lg pl-4 pr-10 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <select
              className="appearance-none bg-[#12201b] border border-slate-700 rounded-lg pl-4 pr-10 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="server">Server</option>
              <option value="website">Website</option>
              <option value="workstation">Workstation</option>
              <option value="network">Network</option>
            </select>
            <button className="flex items-center justify-center p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-8">
        <div className="bg-[#1a2d26] rounded-xl shadow-sm border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#152620] border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="p-4 w-12 text-center">
                    <input className="rounded border-slate-600 text-[#22c55e] focus:ring-[#22c55e] bg-transparent" type="checkbox" />
                  </th>
                  <th className="p-4 font-semibold">Asset</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">OS / Firmware</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Last Scan</th>
                  <th className="p-4 font-semibold">Findings</th>
                  <th className="p-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">Loading assets...</td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">No assets found</td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#1c312a] transition-colors group">
                      <td className="p-4 text-center">
                        <input className="rounded border-slate-600 text-[#22c55e] focus:ring-[#22c55e] bg-transparent" type="checkbox" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                            {getAssetIcon(asset.asset_type)}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">{asset.ip_address || asset.hostname || asset.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{asset.hostname || asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-300 capitalize">{asset.asset_type}</td>
                      <td className="p-4 text-sm text-slate-300">{asset.os_info || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          asset.status === 'online' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          <span className={`size-1.5 rounded-full ${asset.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                          {asset.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-300">{asset.last_scan || 'Never'}</td>
                      <td className="p-4">
                        <div className="flex gap-1.5">
                          <span className={getSeverityClass(0, 'critical')} title="Critical">0</span>
                          <span className={getSeverityClass(0, 'high')}>0</span>
                          <span className={getSeverityClass(0, 'medium')}>0</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#152620]/50">
            <p className="text-sm text-slate-400">Showing 1 to {filteredAssets.length} of {assetsList.length} entries</p>
            <div className="flex gap-1">
              <button className="flex items-center justify-center size-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50" disabled>
                <ChevronLeft size={20} />
              </button>
              <button className="flex items-center justify-center size-8 rounded-lg bg-[#22c55e] text-white text-sm font-medium">1</button>
              <button className="flex items-center justify-center size-8 rounded-lg text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">2</button>
              <button className="flex items-center justify-center size-8 rounded-lg text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
