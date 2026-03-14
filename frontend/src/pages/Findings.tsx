export default function Findings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Findings</h1>
        <p className="text-gray-500">Vulnerabilities discovered</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 p-6 text-center">No findings yet. Run a scan to discover vulnerabilities.</p>
      </div>
    </div>
  )
}
