import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, User, Server, AlertTriangle, Scan } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { assets, findings, scans } from '../lib/api'
import { useProjects } from '../context/ProjectContext'

interface SearchResult {
  type: 'asset' | 'finding' | 'scan'
  id: number
  title: string
  subtitle: string
}

export default function Header() {
  const navigate = useNavigate()
  const { selectedProject } = useProjects()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { data: assetsData } = useQuery({
    queryKey: ['assets', selectedProject?.id],
    queryFn: () => assets.list(selectedProject!.id),
    enabled: !!selectedProject,
  })

  const { data: findingsData } = useQuery({
    queryKey: ['findings', selectedProject?.id],
    queryFn: () => findings.list(selectedProject!.id, { limit: 100 }),
    enabled: !!selectedProject,
  })

  const { data: scansData } = useQuery({
    queryKey: ['scans', selectedProject?.id],
    queryFn: () => scans.list(selectedProject!.id),
    enabled: !!selectedProject,
  })

  const results: SearchResult[] = []

  if (selectedProject && query.length >= 2) {
    const q = query.toLowerCase()
    
    assetsData?.data?.forEach((asset: { id: number; name: string; ip_address?: string; hostname?: string }) => {
      if (asset.name.toLowerCase().includes(q) || asset.ip_address?.includes(q) || asset.hostname?.includes(q)) {
        results.push({
          type: 'asset',
          id: asset.id,
          title: asset.name,
          subtitle: asset.ip_address || asset.hostname || 'No IP',
        })
      }
    })

    findingsData?.data?.forEach((finding: { id: number; title: string; severity: string }) => {
      if (finding.title.toLowerCase().includes(q)) {
        results.push({
          type: 'finding',
          id: finding.id,
          title: finding.title,
          subtitle: finding.severity,
        })
      }
    })

    scansData?.data?.forEach((scan: { id: number; name: string; status: string }) => {
      if (scan.name.toLowerCase().includes(q)) {
        results.push({
          type: 'scan',
          id: scan.id,
          title: scan.name,
          subtitle: scan.status,
        })
      }
    })
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (result: SearchResult) => {
    setQuery('')
    setIsOpen(false)
    if (result.type === 'asset') navigate('/assets')
    else if (result.type === 'finding') navigate('/findings')
    else if (result.type === 'scan') navigate('/scans')
  }

  const icons = {
    asset: Server,
    finding: AlertTriangle,
    scan: Scan,
  }

  return (
    <header className="h-16 flex items-center justify-between px-6" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1" ref={wrapperRef}>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search assets, findings, scans..."
            className="input pl-10 py-2"
            style={{ background: 'var(--bg-tertiary)' }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(e.target.value.length >= 2)
            }}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
          />
          {isOpen && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-slate-700 bg-[#1c1c1f] shadow-xl z-50 max-h-80 overflow-auto">
              {results.slice(0, 10).map((result) => {
                const Icon = icons[result.type]
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left"
                  >
                    <Icon size={16} className="text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{result.title}</p>
                      <p className="text-xs text-slate-500">{result.subtitle}</p>
                    </div>
                    <span className="text-xs text-slate-500 capitalize">{result.type}</span>
                  </button>
                )
              })}
            </div>
          )}
          {isOpen && query.length >= 2 && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-slate-700 bg-[#1c1c1f] shadow-xl z-50 p-4 text-center text-slate-400 text-sm">
              No results found
            </div>
          )}
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
