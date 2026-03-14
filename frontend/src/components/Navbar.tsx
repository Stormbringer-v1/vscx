import { User, LogOut } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option>Default Project</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <User size={18} />
          <span>Admin</span>
        </button>
        <button className="text-gray-500 hover:text-gray-700">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
