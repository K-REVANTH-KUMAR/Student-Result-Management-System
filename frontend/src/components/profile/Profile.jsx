import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Users, UserRound, ClipboardList, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react'
import { api } from '../../api'
import SectionHeading from '../common/SectionHeading'
import Field from '../common/Field'

function Profile({user,onUpdated}) {
  const [name,setName]=useState(user.name),[password,setPassword]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState('')
  async function submit(e){e.preventDefault();setSaving(true);setError('');try{await api('/auth/profile',{method:'PUT',body:JSON.stringify({name,password})});onUpdated(name);setPassword('')}catch(e){setError(e.message)}finally{setSaving(false)}}
  return <><SectionHeading title="My profile" subtitle="Update your display name or change your password."/><div className="profile-layout"><div className="profile-summary"><div className="profile-avatar">{user.name.slice(0,1).toUpperCase()}</div><h3>{user.name}</h3><span className="role-tag">{user.role}</span><p>{user.login_id}</p></div><div className="form-card profile-form"><h3>Account details</h3>{error&&<div className="form-error">{error}</div>}<form onSubmit={submit}><Field label="Full name"><input value={name} onChange={e=>setName(e.target.value)} required/></Field><Field label="Login ID"><input value={user.login_id} disabled/></Field><Field label="New password (optional)"><input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Leave blank to keep current password"/></Field><button className="primary-btn" disabled={saving}>{saving?'Saving...':'Save changes'}</button></form></div></div></>
}

export default Profile
