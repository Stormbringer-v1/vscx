import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Server, Globe, Monitor, Trash2, ExternalLink } from 'lucide-react'
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
  created_at: string
}

const assetTypeIcons: Record<string, React.ReactNode> = {
  server: <Server size={18} />,
  website: <Globe size={18} />,
  workstation: <Monitor size={18} />,
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
        <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500">Please create a project first to add assets.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-500">Manage your scan targets</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
        >
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Asset</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Production Server"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="server">Server</option>
                  <option value="website">Website</option>
                  <option value="workstation">Workstation</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input
                  type="text"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="192.168.1.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
                <input
                  type="text"
                  value={formData.hostname}
                  onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="server.example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="url"
              value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Asset'}
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
          <p className="text-gray-500">Loading assets...</p>
        </div>
      ) : assetsList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500">No assets yet. Add your first target to scan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assetsList.map((asset) => (
            <div key={asset.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                    {assetTypeIcons[asset.asset_type] || <Server size={18} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{asset.asset_type}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(asset.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {asset.ip_address && <p>IP: {asset.ip_address}</p>}
                {asset.hostname && <p>Host: {asset.hostname}</p>}
                {asset.url && (
                  <a href={asset.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline">
                    {asset.url} <ExternalLink size={12} />
                  </a>
                )}
              </div>
              {asset.risk_score > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className={`text-sm font-medium ${asset.risk_score >= 7 ? 'text-red-600' : asset.risk_score >= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                    Risk Score: {asset.risk_score.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
