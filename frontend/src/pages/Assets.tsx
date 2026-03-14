import { Plus } from 'lucide-react'

export default function Assets() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-500">Manage your scan targets</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          <Plus size={18} />
          Add Asset
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 p-6 text-center">No assets yet. Add your first target to scan.</p>
      </div>
    </div>
  )
}
