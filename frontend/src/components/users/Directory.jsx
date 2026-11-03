import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Users, UserRound, ClipboardList, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react'
import { api } from '../../api'
import SectionHeading from '../common/SectionHeading'

function Directory({kind}) {
  const [rows,setRows]=useState([]),[search,setSearch]=useState('')
  useEffect(()=>{api(kind==='students'?'/teacher/students':'/teacher/subjects').then(setRows).catch(()=>setRows([]))},[kind])
  const filtered=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))
  return <><SectionHeading title={kind==='students'?'Student directory':'Available subjects'} subtitle="Read-only information available to your teacher account."/><div className="search-box directory-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."/></div><div className="table-card"><table><thead><tr>{kind==='students'?<><th>Student</th><th>Roll number</th><th>Class</th><th>Login ID</th></>:<><th>#</th><th>Subject name</th></>}</tr></thead><tbody>{filtered.map((r,i)=><tr key={r.id}><td>{kind==='students'?r.name:i+1}</td>{kind==='students'?<><td>{r.roll_number}</td><td>{r.class_name}</td><td>{r.login_id}</td></>:<td>{r.subject_name}</td>}</tr>)}{filtered.length===0&&<tr><td className="empty-cell" colSpan={kind==='students'?4:2}>No records found.</td></tr>}</tbody></table></div></>
}

export default Directory
