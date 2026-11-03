import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Users, UserRound, ClipboardList, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react'
import { api } from '../../api'
import SectionHeading from '../common/SectionHeading'
import StatCard from '../common/StatCard'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  useEffect(() => { api('/admin/dashboard').then(setStats).catch(()=>setStats({teachers:0,students:0,subjects:0,marks:0})) }, [])
  return <><div className="welcome-banner"><div><span className="eyebrow light">ADMIN OVERVIEW</span><h2>Welcome to your workspace</h2><p>Manage users, subjects, and academic performance from one place.</p></div><div className="banner-art"><GraduationCap size={74}/></div></div><SectionHeading title="Overview" subtitle="A quick snapshot of your academic workspace."/><div className="stats-grid"><StatCard label="Total Teachers" value={stats?.teachers} icon={Users} tone="purple"/><StatCard label="Total Students" value={stats?.students} icon={GraduationCap} tone="blue"/><StatCard label="Subjects" value={stats?.subjects} icon={BookOpen} tone="orange"/><StatCard label="Marks Entered" value={stats?.marks} icon={ClipboardList} tone="green"/></div><div className="info-panel"><div className="info-icon"><LockKeyhole size={20}/></div><div><strong>Account security</strong><p>Only administrators can create teacher and student accounts. Access to each workspace is controlled by the signed-in role.</p></div></div></>
}

export default AdminDashboard
