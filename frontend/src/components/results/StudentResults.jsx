import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Users, UserRound, ClipboardList, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react'
import { api } from '../../api'
import SectionHeading from '../common/SectionHeading'
import StatCard from '../common/StatCard'

function StudentResults() {
  const [data,setData]=useState(null),[error,setError]=useState('')
  useEffect(()=>{api('/student/results').then(setData).catch(e=>setError(e.message))},[])
  if(error)return <div className="empty-panel">{error}</div>
  if(!data)return <div className="empty-panel">Loading your results...</div>
  return <><div className="result-hero"><div><span className="eyebrow light">ACADEMIC REPORT</span><h2>{data.student.name}</h2><p>{data.student.roll_number} <span>•</span> {data.student.class_name}</p></div><div className={`result-status ${data.status.toLowerCase()}`}>{data.status}</div></div><div className="stats-grid result-stats"><StatCard label="Total marks" value={`${data.total} / ${data.maximum}`} icon={ClipboardList} tone="purple"/><StatCard label="Percentage" value={`${data.percentage}%`} icon={LayoutDashboard} tone="blue"/><StatCard label="Grade" value={data.grade} icon={CheckCircle2} tone="green"/><StatCard label="Subjects completed" value={`${data.completed_subjects} / ${data.total_subjects}`} icon={BookOpen} tone="orange"/></div><SectionHeading title="Subject-wise performance" subtitle="Your marks are visible only to your student account."/><div className="table-card"><table><thead><tr><th>Subject</th><th>Maximum marks</th><th>Marks obtained</th><th>Status</th></tr></thead><tbody>{data.subjects.map(s=><tr key={s.subject_id}><td><strong>{s.subject_name}</strong></td><td>100</td><td>{s.marks===null?'Not published':s.marks}</td><td>{s.marks===null?<span className="status-pending">Pending</span>:<span className={`mark-chip ${s.marks>=35?'pass':'fail'}`}>{s.marks>=35?'Pass':'Fail'}</span>}</td></tr>)}</tbody></table>{data.subjects.length===0&&<p className="empty-message">No subjects have been configured yet.</p>}</div><p className="result-note">Pass mark: 35 per subject. Overall result remains Pending until marks are entered for every configured subject.</p></>
}

export default StudentResults
