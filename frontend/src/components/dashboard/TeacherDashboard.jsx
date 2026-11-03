import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Users, UserRound, ClipboardList, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react'
import { api } from '../../api'

function TeacherDashboard({ user }) { return <><div className="welcome-banner"><div><span className="eyebrow light">TEACHER WORKSPACE</span><h2>Hello, {user.name}</h2><p>View your students, explore subjects, and manage the marks you enter.</p></div><div className="banner-art"><BookOpen size={72}/></div></div><div className="quick-grid"><div className="quick-card"><GraduationCap/><h3>Student directory</h3><p>View the student roll numbers and class details.</p></div><div className="quick-card"><BookOpen/><h3>Subjects</h3><p>See the subjects available for marks entry.</p></div><div className="quick-card"><ClipboardList/><h3>Marks management</h3><p>Enter marks and review records you submitted.</p></div></div></> }

export default TeacherDashboard
