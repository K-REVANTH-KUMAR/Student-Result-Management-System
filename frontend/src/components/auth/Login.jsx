import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Users, UserRound, ClipboardList, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react'
import { api } from '../../api'

function Login({ onLogin }) {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true)
    try { onLogin(await api('/auth/login', { method: 'POST', body: JSON.stringify({ login_id: loginId, password }) })) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  return <div className="login-screen"><div className="login-decoration"><div className="decor-circle circle-one"/><div className="decor-circle circle-two"/><div className="login-message"><div className="brand-mark large"><GraduationCap size={30}/></div><p className="eyebrow light">ACADEMIC MANAGEMENT PLATFORM</p><h1>Every result.<br/>One clear picture.</h1><p>Manage academic records, enter marks, and follow student progress in one secure workspace.</p><div className="login-points"><span><CheckCircle2 size={16}/> Role-based access</span><span><CheckCircle2 size={16}/> Centralized results</span></div></div></div><div className="login-panel"><form className="login-form" onSubmit={submit}><div className="form-icon"><LockKeyhole size={22}/></div><p className="eyebrow">WELCOME BACK</p><h2>Sign in to SRMS</h2><p className="muted">Enter your account credentials to continue.</p>{error && <div className="form-error">{error}</div>}<label>Login ID</label><input value={loginId} onChange={e=>setLoginId(e.target.value)} placeholder="Enter your login ID" required autoComplete="username"/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password"/><button className="primary-btn full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'} <span>→</span></button><p className="login-footnote">Use the credentials provided by your administrator.</p></form></div></div>
}

export default Login
