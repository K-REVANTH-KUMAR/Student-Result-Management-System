import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Users, UserRound, ClipboardList, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react'
import { api } from '../../api'
import SectionHeading from '../common/SectionHeading'
import Field from '../common/Field'
import Modal from '../common/Modal'

function MarksManagement({role,notify}) {
  const [rows,setRows]=useState([]),[search,setSearch]=useState(''),[editing,setEditing]=useState(null),[value,setValue]=useState('')
  async function load(){try{setRows(await api(role==='admin'?'/admin/marks':'/teacher/marks'))}catch(e){notify(e.message,'error')}}
  useEffect(()=>{load()},[role])
  async function save(e){e.preventDefault();try{await api(role==='admin'?`/admin/marks/${editing.id}`:`/teacher/marks/${editing.id}`,{method:'PUT',body:JSON.stringify({marks:Number(value)})});notify('Marks updated successfully');setEditing(null);load()}catch(e){notify(e.message,'error')}}
  const filtered=rows.filter(r=>`${r.student_name} ${r.roll_number} ${r.subject_name} ${r.teacher_name||''}`.toLowerCase().includes(search.toLowerCase()))
  return <><SectionHeading title={role==='admin'?'All academic results':'Marks entered by me'} subtitle={role==='admin'?'Review and correct marks across all students.':'Review only the marks entered by your teacher account.'}/><div className="table-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search student or subject..."/></div><span className="result-count">{filtered.length} marks</span></div><div className="table-card"><table><thead><tr><th>Student</th><th>Roll number</th><th>Subject</th><th>Marks</th><th>{role==='admin'?'Entered by':'Last updated'}</th><th>Action</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><strong>{r.student_name}</strong></td><td>{r.roll_number}</td><td>{r.subject_name}</td><td><span className={`mark-chip ${r.marks>=35?'pass':'fail'}`}>{r.marks}/100</span></td><td>{role==='admin'?(r.teacher_name||'Admin'): '—'}</td><td><button className="icon-btn" onClick={()=>{setEditing(r);setValue(String(r.marks))}}><Pencil size={16}/></button></td></tr>)}{filtered.length===0&&<tr><td colSpan={6} className="empty-cell">No marks have been entered yet.</td></tr>}</tbody></table></div>{editing&&<Modal title="Update marks" onClose={()=>setEditing(null)}><form className="modal-form" onSubmit={save}><p className="muted">{editing.student_name} · {editing.subject_name}</p><Field label="Marks (0–100)"><input type="number" min="0" max="100" step="0.5" value={value} onChange={e=>setValue(e.target.value)} required/></Field><div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setEditing(null)}>Cancel</button><button className="primary-btn">Save marks</button></div></form></Modal>}</>
}

export default MarksManagement
