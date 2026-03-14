import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Server, Globe, Monitor, Trash2, ExternalLink, X } from 'lucide-react'
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
}

const assetTypeIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  server: { icon: <Server size={18} />, color: '#3b82f6' },
  website: { icon: <Globe size={18} />, color: '#10b981' },
  workstation: { icon: <Monitor size={18} />, color: '#f59e0b' },
}

export default function Assets() {
  const { selectedProject } = useProjects()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assets.delete(selectedProject!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', selectedProject?.id] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    createMutation.mutate({ ...formData, project_id: selectedProject.id })
  }

  const assetsList: Asset[] = assetsData?.data || []

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Assets</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your scan targets</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      {showForm && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Add New Asset</h2>
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
                  className="input"
                  placeholder="Production Server"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  className="input"
                >
                  <option value="server">Server</option>
                  <option value="website">Website</option>
                  <option value="workstation">Workstation</option>
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
                  className="input"
                  placeholder="192.168.1.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Hostname</label>
                <input
                  type="text"
                  value={formData.hostname}
                  onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                  className="input"
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
                className="input"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
                {createMutation.isPending ? 'Creating...' : 'Create Asset'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="card p-8 text-center">
          <p style={{ color: 'var(--text-muted)' }}>Loading assets...</p>
        </div>
      ) : assetsList.length === 0 ? (
        <div className="card p-8 text-center">
          <Server size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No assets yet. Add your first target to scan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assetsList.map((asset) => {
            const typeInfo = assetTypeIcons[asset.asset_type] || { icon: <Server size={18} />, color: '#71717a' }
            return (
              <div key={asset.id} className="card p-5 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${typeInfo.color}20` }}>
                      <span style={{ color: typeInfo.color }}>{typeInfo.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{asset.name}</h3>
                      <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{asset.asset_type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(asset.id)}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
                <div className="mt-4 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {asset.ip_address && <p>IP: {asset.ip_address}</p>}
                  {asset.hostname && <p>Host: {asset.hostname}</p>}
                  {asset.url && (
                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-400 hover:underline">
                      {asset.url} <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
