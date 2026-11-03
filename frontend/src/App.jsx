
import { useEffect, useState } from 'react'

import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  UserRound,
  ClipboardList,
  Plus,
  LockKeyhole,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

import Login from './components/auth/Login'
import AdminDashboard from './components/dashboard/AdminDashboard'
import TeacherDashboard from './components/dashboard/TeacherDashboard'
import UserManagement from './components/users/UserManagement'
import SubjectManagement from './components/subjects/SubjectManagement'
import Directory from './components/users/Directory'
import MarksManagement from './components/marks/MarksManagement'
import EnterMarks from './components/marks/EnterMarks'
import StudentResults from './components/results/StudentResults'
import Profile from './components/profile/Profile'

function App() {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('srms_user') || 'null')
  )

  const [token, setToken] = useState(() =>
    localStorage.getItem('srms_token')
  )

  const [page, setPage] = useState('Dashboard')
  const [notice, setNotice] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function logout() {
    localStorage.removeItem('srms_token')
    localStorage.removeItem('srms_user')

    setToken(null)
    setUser(null)
    setPage('Dashboard')
  }

  useEffect(() => {
    const handleLogout = () => logout()

    window.addEventListener('srms-logout', handleLogout)

    return () => {
      window.removeEventListener('srms-logout', handleLogout)
    }
  }, [])

  function showNotice(message, type = 'success') {
    setNotice({
      message: message,
      type: type
    })

    window.setTimeout(() => {
      setNotice(null)
    }, 3500)
  }

  if (!token || !user) {
    return (
      <Login
        onLogin={(data) => {
          setToken(data.token)
          setUser(data.user)

          localStorage.setItem('srms_token', data.token)
          localStorage.setItem('srms_user', JSON.stringify(data.user))
        }}
      />
    )
  }

  let menu = []

  if (user.role === 'admin') {
    menu = [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Teachers', icon: Users },
      { label: 'Students', icon: GraduationCap },
      { label: 'Subjects', icon: BookOpen },
      { label: 'Results', icon: ClipboardList },
      { label: 'My Profile', icon: UserRound }
    ]
  } else if (user.role === 'teacher') {
    menu = [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Students', icon: GraduationCap },
      { label: 'Subjects', icon: BookOpen },
      { label: 'My Marks', icon: ClipboardList },
      { label: 'Enter Marks', icon: Plus },
      { label: 'My Profile', icon: UserRound }
    ]
  } else {
    menu = [
      { label: 'My Results', icon: ClipboardList },
      { label: 'My Profile', icon: UserRound }
    ]
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <GraduationCap size={22} />
          </div>

          <div>
            <strong>SRMS</strong>
            <span>Academic Portal</span>
          </div>
        </div>

        <div className="nav-caption">WORKSPACE</div>

        <nav>
          {menu.map((item) => (
            <button
              key={item.label}
              className={`nav-link ${page === item.label ? 'active' : ''}`}
              onClick={() => {
                setPage(item.label)
                setSidebarOpen(false)
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="secure-note">
            <LockKeyhole size={16} />
            <span>Secure role-based access</span>
          </div>

          <button className="nav-link logout-link" onClick={logout}>
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </button>

          <div>
            <span className="top-eyebrow">
              STUDENT RESULT MANAGEMENT
            </span>
            <h1>{page}</h1>
          </div>

          <div className="top-user">
            <div className="avatar">
              {user.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
            </div>

            <div className="user-meta">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
          </div>
        </header>

        {notice && (
          <div className={`notice ${notice.type}`}>
            <span>
              {notice.type === 'success'
                ? <CheckCircle2 size={17} />
                : <AlertCircle size={17} />
              }
            </span>
            {notice.message}
          </div>
        )}

        <section className="page-content">
          {user.role === 'admin' && page === 'Dashboard' && (
            <AdminDashboard />
          )}

          {user.role === 'admin' && page === 'Teachers' && (
            <UserManagement kind="teacher" notify={showNotice} />
          )}

          {user.role === 'admin' && page === 'Students' && (
            <UserManagement kind="student" notify={showNotice} />
          )}

          {user.role === 'admin' && page === 'Subjects' && (
            <SubjectManagement notify={showNotice} />
          )}

          {user.role === 'admin' && page === 'Results' && (
            <MarksManagement role="admin" notify={showNotice} />
          )}

          {user.role === 'teacher' && page === 'Dashboard' && (
            <TeacherDashboard user={user} />
          )}

          {user.role === 'teacher' && page === 'Students' && (
            <Directory role="teacher" kind="students" />
          )}

          {user.role === 'teacher' && page === 'Subjects' && (
            <Directory role="teacher" kind="subjects" />
          )}

          {user.role === 'teacher' && page === 'My Marks' && (
            <MarksManagement role="teacher" notify={showNotice} />
          )}

          {user.role === 'teacher' && page === 'Enter Marks' && (
            <EnterMarks notify={showNotice} />
          )}

          {user.role === 'student' && page === 'My Results' && (
            <StudentResults />
          )}

          {page === 'My Profile' && (
            <Profile
              user={user}
              onUpdated={(name) => {
                const next = {
                  ...user,
                  name: name
                }

                setUser(next)

                localStorage.setItem(
                  'srms_user',
                  JSON.stringify(next)
                )

                showNotice('Profile updated successfully')
              }}
            />
          )}
        </section>

        <footer className="footer">
          Student Result Management System
          <span>•</span>
          Academic records portal
        </footer>
      </main>
    </div>
  )
}

export default App
