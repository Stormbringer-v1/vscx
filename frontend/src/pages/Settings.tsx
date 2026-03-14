import { useState, useEffect } from 'react'
import { Save, Check } from 'lucide-react'

const STORAGE_KEY = 'vscx-settings'

const defaultSettings = {
  orgName: 'Security Team Alpha',
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  scanProfile: 'standard',
  concurrentScans: 5,
  nmapOptions: '-sS -sV -O --top-ports 1000',
  selectedTemplates: ['cves', 'vulnerabilities', 'exposures'],
}

export default function Settings() {
  const [orgName, setOrgName] = useState(defaultSettings.orgName)
  const [timezone, setTimezone] = useState(defaultSettings.timezone)
  const [dateFormat, setDateFormat] = useState(defaultSettings.dateFormat)
  const [scanProfile, setScanProfile] = useState(defaultSettings.scanProfile)
  const [concurrentScans, setConcurrentScans] = useState(defaultSettings.concurrentScans)
  const [nmapOptions, setNmapOptions] = useState(defaultSettings.nmapOptions)
  const [selectedTemplates, setSelectedTemplates] = useState(defaultSettings.selectedTemplates)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        setOrgName(settings.orgName || defaultSettings.orgName)
        setTimezone(settings.timezone || defaultSettings.timezone)
        setDateFormat(settings.dateFormat || defaultSettings.dateFormat)
        setScanProfile(settings.scanProfile || defaultSettings.scanProfile)
        setConcurrentScans(settings.concurrentScans || defaultSettings.concurrentScans)
        setNmapOptions(settings.nmapOptions || defaultSettings.nmapOptions)
        setSelectedTemplates(settings.selectedTemplates || defaultSettings.selectedTemplates)
      } catch (e) {
        console.error('Failed to parse saved settings', e)
      }
    }
  }, [])

  const handleSave = () => {
    const settings = {
      orgName,
      timezone,
      dateFormat,
      scanProfile,
      concurrentScans,
      nmapOptions,
      selectedTemplates,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setSaveMessage('Settings saved')
    setTimeout(() => setSaveMessage(''), 2000)
  }

  const templates = ['cves', 'vulnerabilities', 'exposures', 'misconfigurations', 'default-logins', 'takeovers']

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="px-8 pt-8">
        <h1 className="text-3xl md:text-4xl font-black leading-tight text-white">Settings</h1>
        <p className="text-slate-400 text-base mt-2">Configure VSX Vulnerability Management Platform settings.</p>
      </div>

      <div className="px-8 grid grid-cols-1 gap-8">
        <section className="bg-[#1a3324] rounded-xl shadow-sm border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">General</h2>
            <p className="text-slate-400 text-sm mt-1">Basic platform configuration.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col">
                <span className="text-slate-300 text-sm font-medium mb-2">Organization Name</span>
                <input 
                  className="rounded-lg border-slate-700 bg-[#112117] text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] h-12 px-4"
                  type="text" 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </label>
              <label className="flex flex-col">
                <span className="text-slate-300 text-sm font-medium mb-2">Timezone</span>
                <select 
                  className="rounded-lg border-slate-700 bg-[#112117] text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] h-12 px-4"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option>UTC (Coordinated Universal Time)</option>
                  <option>America/New_York (EST/EDT)</option>
                  <option>America/Los_Angeles (PST/PDT)</option>
                  <option>Europe/London (GMT/BST)</option>
                </select>
              </label>
              <label className="flex flex-col">
                <span className="text-slate-300 text-sm font-medium mb-2">Date Format</span>
                <select 
                  className="rounded-lg border-slate-700 bg-[#112117] text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] h-12 px-4"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                >
                  <option>YYYY-MM-DD (e.g., 2023-10-27)</option>
                  <option>MM/DD/YYYY (e.g., 10/27/2023)</option>
                  <option>DD/MM/YYYY (e.g., 27/10/2023)</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="bg-[#1a3324] rounded-xl shadow-sm border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">Scan Configuration</h2>
            <p className="text-slate-400 text-sm mt-1">Default behavior for vulnerability scans.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col">
                <span className="text-slate-300 text-sm font-medium mb-2">Default Scan Profile</span>
                <select 
                  className="rounded-lg border-slate-700 bg-[#112117] text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] h-12 px-4"
                  value={scanProfile}
                  onChange={(e) => setScanProfile(e.target.value)}
                >
                  <option>Comprehensive (Slow)</option>
                  <option>Standard (Balanced)</option>
                  <option>Quick (Fast)</option>
                  <option>Custom Profile Alpha</option>
                </select>
              </label>
              <div className="flex flex-col justify-center">
                <label className="flex flex-col">
                  <span className="text-slate-300 text-sm font-medium mb-2 flex justify-between">
                    <span>Concurrent Scans</span>
                    <span className="text-[#22c55e] font-bold">{concurrentScans}</span>
                  </span>
                  <input 
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
                    type="range" 
                    min="1" 
                    max="10" 
                    value={concurrentScans}
                    onChange={(e) => setConcurrentScans(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </label>
              </div>
            </div>
            <label className="flex flex-col">
              <span className="text-slate-300 text-sm font-medium mb-2">Custom Nmap Options</span>
              <input 
                className="rounded-lg border-slate-700 bg-[#112117] text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] h-12 px-4 font-mono text-sm"
                type="text" 
                value={nmapOptions}
                onChange={(e) => setNmapOptions(e.target.value)}
              />
            </label>
            <label className="flex flex-col">
              <span className="text-slate-300 text-sm font-medium mb-2">Nuclei Templates Selector</span>
              <select 
                className="rounded-lg border-slate-700 bg-[#112117] text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] h-32 px-4 py-2"
                multiple
                value={selectedTemplates}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value)
                  setSelectedTemplates(options)
                }}
              >
                {templates.map(template => (
                  <option key={template} value={template}>{template}</option>
                ))}
              </select>
              <span className="text-xs text-slate-400 mt-1">Hold Cmd/Ctrl to select multiple.</span>
            </label>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-[#15291d] border-t border-slate-800 p-4 md:px-8 flex justify-end items-center gap-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {saveMessage && (
          <span className="text-green-400 text-sm font-medium flex items-center gap-2">
            <Check size={16} />
            {saveMessage}
          </span>
        )}
        <button 
          onClick={handleSave}
          className="bg-[#22c55e] hover:bg-[#22c55e]/90 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>
    </div>
  )
}
