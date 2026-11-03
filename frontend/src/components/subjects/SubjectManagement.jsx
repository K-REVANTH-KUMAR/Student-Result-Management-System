import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Users, UserRound, ClipboardList, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react'
import { api } from '../../api'
import SectionHeading from '../common/SectionHeading'
import Field from '../common/Field'

function SubjectManagement({ notify }) {
  const [rows,setRows]=useState([]),[name,setName]=useState(''),[editing,setEditing]=useState(null)
  async function load(){try{setRows(await api('/admin/subjects'))}catch(e){notify(e.message,'error')}}
  useEffect(()=>{load()},[])
  async function submit(e){e.preventDefault();try{await api(editing?`/admin/subjects/${editing}`:'/admin/subjects',{method:editing?'PUT':'POST',body:JSON.stringify({subject_name:name})});notify(`Subject ${editing?'updated':'created'} successfully`);setName('');setEditing(null);load()}catch(e){notify(e.message,'error')}}
  async function remove(id){if(!window.confirm('Delete this subject? Existing marks for it will also be deleted.'))return;try{await api(`/admin/subjects/${id}`,{method:'DELETE'});notify('Subject deleted');load()}catch(e){notify(e.message,'error')}}
  return <><SectionHeading title="Subject management" subtitle="Maintain the subjects used for student results."/><div className="split-layout"><div className="form-card"><h3>{editing?'Edit subject':'Add a subject'}</h3><form onSubmit={submit}><Field label="Subject name"><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mathematics" required/></Field><div className="inline-actions"><button className="primary-btn">{editing?'Save changes':'Add subject'}</button>{editing&&<button type="button" className="secondary-btn" onClick={()=>{setEditing(null);setName('')}}>Cancel</button>}</div></form></div><div className="table-card"><div className="card-heading"><h3>Available subjects</h3><span className="pill-count">{rows.length}</span></div>{rows.length===0?<p className="empty-message">No subjects have been added yet.</p>:rows.map((row,i)=><div className="subject-row" key={row.id}><div className="subject-number">{String(i+1).padStart(2,'0')}</div><strong>{row.subject_name}</strong><div className="row-actions"><button className="icon-btn" onClick={()=>{setEditing(row.id);setName(row.subject_name)}}><Pencil size={16}/></button><button className="icon-btn danger" onClick={()=>remove(row.id)}><Trash2 size={16}/></button></div></div>)}</div></div></>
}

export default SubjectManagement
