import { Search, Bell, User } from 'lucide-react'

export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search..."
            className="input pl-10 py-2"
            style={{ background: 'var(--bg-tertiary)' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Bell size={20} style={{ color: 'var(--text-secondary)' }} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--accent-primary)' }} />
        </button>
        <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid var(--border-color)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
            <User size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>
    </header>
  )
}
