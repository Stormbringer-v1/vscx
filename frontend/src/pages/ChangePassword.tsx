import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertCircle, Eye, EyeOff, CheckCircle, Lock } from 'lucide-react'
import { auth } from '../lib/api'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const response = await auth.changePassword(formData.currentPassword, formData.newPassword)
      localStorage.setItem('token', response.data.access_token)
      setSuccess('Password changed successfully')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join('. '))
      } else {
        setError(detail || 'Failed to change password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-800 px-10 py-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 text-[#22c55e] flex items-center justify-center">
            <Shield size={24} />
          </div>
          <h2 className="text-slate-100 text-xl font-bold tracking-tight">VSX</h2>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-2xl p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock size={24} className="text-orange-400" />
            </div>
            <h1 className="text-slate-100 text-2xl font-black tracking-tight">Change Password</h1>
            <p className="text-slate-400 text-sm font-normal">You must change your password before continuing</p>
          </div>

          {error && (
            <div className="p-4 rounded-lg flex items-center gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg flex items-center gap-3" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
              <span className="text-sm text-green-300">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-slate-200 text-sm font-medium ml-1" htmlFor="currentPassword">Current Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all text-sm"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-200 focus:outline-none flex items-center justify-center"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-200 text-sm font-medium ml-1" htmlFor="newPassword">New Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all text-sm"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-200 focus:outline-none flex items-center justify-center"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 ml-1 mt-1">At least 8 characters with uppercase, lowercase, and digit</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-200 text-sm font-medium ml-1" htmlFor="confirmPassword">Confirm New Password</label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all text-sm"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-200 focus:outline-none flex items-center justify-center"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22c55e] hover:bg-[#22c55e]/90 text-slate-900 font-bold py-3 px-4 rounded-lg mt-2 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Changing password...' : 'Change Password'}</span>
            </button>
          </form>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-slate-500 text-xs">© 2024 VSX Platform. All rights reserved.</p>
      </footer>
    </div>
  )
}
