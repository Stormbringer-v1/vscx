import { Shield, Server, Bug, AlertTriangle } from 'lucide-react'

const stats = [
  { label: 'Total Assets', value: '0', icon: Server, color: 'text-blue-500' },
  { label: 'Vulnerabilities', value: '0', icon: Bug, color: 'text-red-500' },
  { label: 'Critical Issues', value: '0', icon: AlertTriangle, color: 'text-red-600' },
  { label: 'Risk Score', value: '0.0', icon: Shield, color: 'text-green-500' },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your security posture</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gray-50 ${color}`}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-500 text-sm">No recent activity. Start a scan to see results.</p>
      </div>
    </div>
  )
}
