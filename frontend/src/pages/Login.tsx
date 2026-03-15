import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { auth } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await auth.register(formData.username, formData.email, formData.password)
        setIsRegister(false)
        setSuccess('Registration successful. Please sign in.')
        setError('')
      } else {
        const response = await auth.login(formData.username, formData.password)
        localStorage.setItem('token', response.data.access_token)
        navigate('/dashboard')
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join('. '))
      } else {
        setError(detail || 'An error occurred. Please try again.')
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
        <div className="flex items-center gap-4">
          <a className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors" href="#">Documentation</a>
          <a className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors" href="#">Support</a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-2xl p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-slate-100 text-3xl font-black tracking-tight">VSX Login</h1>
            <p className="text-slate-400 text-sm font-normal">Vulnerability Management Platform</p>
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
              <label className="text-slate-200 text-sm font-medium ml-1" htmlFor="username">Username</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all text-sm"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className="flex flex-col gap-1 animate-fade-in">
                <label className="text-slate-200 text-sm font-medium ml-1" htmlFor="email">Email</label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all text-sm"
                    placeholder="Enter your email address"
                    required={isRegister}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-slate-200 text-sm font-medium" htmlFor="password">Password</label>
                <a className="text-xs font-medium text-[#22c55e] hover:text-[#22c55e]/80 transition-colors" href="#">Forgot Password?</a>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all text-sm"
                  placeholder="Enter your password"
                  required
                  minLength={6}
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

            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900/50 text-[#22c55e] focus:ring-[#22c55e] focus:ring-offset-0 focus:ring-1 transition-colors cursor-pointer"
              />
              <label className="text-slate-300 text-sm font-normal cursor-pointer select-none" htmlFor="remember">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22c55e] hover:bg-[#22c55e]/90 text-slate-900 font-bold py-3 px-4 rounded-lg mt-2 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Please wait...' : 'Sign In'}</span>
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-4 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-slate-400 text-sm">
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError('')
                  setSuccess('')
                }}
                className="text-[#22c55e] hover:underline font-medium"
              >
                {isRegister ? 'Sign In' : 'Request Access'}
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-slate-500 text-xs">© 2024 VSX Platform. All rights reserved.</p>
      </footer>
    </div>
  )
}
