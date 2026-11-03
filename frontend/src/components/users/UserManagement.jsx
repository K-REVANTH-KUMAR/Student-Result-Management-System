import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Users, UserRound, ClipboardList, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react'
import { api } from '../../api'
import SectionHeading from '../common/SectionHeading'
import Field from '../common/Field'
import Modal from '../common/Modal'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  loginId: ''
}

function UserManagement({ kind, notify }) {
  const isStudent = kind === 'student'
  const endpoint = isStudent ? '/admin/students' : '/admin/teachers'
  const [rows, setRows] = useState([]), [form, setForm] = useState(emptyForm), [editing, setEditing] = useState(null), [showForm, setShowForm] = useState(false), [search, setSearch] = useState(''), [loading, setLoading] = useState(true)
  async function load() { setLoading(true); try { setRows(await api(endpoint)) } catch(e) { notify(e.message,'error') } finally { setLoading(false) } }
  useEffect(() => { load() }, [endpoint])
  function startEdit(row) { setEditing(row); setForm({name:row.name,login_id:row.login_id,password:'',roll_number:row.roll_number||'',class_name:row.class_name||''}); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(null); setForm(emptyForm) }
  async function submit(e) { e.preventDefault(); try { await api(editing ? `${endpoint}/${editing.id}` : endpoint, {method:editing?'PUT':'POST',body:JSON.stringify(form)}); notify(`${isStudent?'Student':'Teacher'} ${editing?'updated':'created'} successfully`); closeForm(); load() } catch(err) { notify(err.message,'error') } }
  async function remove(row) { if (!window.confirm(`Delete ${row.name}? This action cannot be undone.`)) return; try { await api(`${endpoint}/${row.id}`,{method:'DELETE'}); notify('Record deleted successfully'); load() } catch(e) { notify(e.message,'error') } }
  const filtered = rows.filter(r => `${r.name} ${r.login_id} ${r.roll_number||''} ${r.class_name||''}`.toLowerCase().includes(search.toLowerCase()))
  return <><SectionHeading title={isStudent?'Student directory':'Teacher directory'} subtitle={isStudent?'Create and maintain student accounts and academic details.':'Create and maintain teacher accounts.'} action={<button className="primary-btn" onClick={()=>{setEditing(null);setForm(emptyForm);setShowForm(true)}}><Plus size={17}/> Add {isStudent?'student':'teacher'}</button>}/><div className="table-toolbar"><div className="search-box"><Search size={17}/><input placeholder={`Search ${kind}s...`} value={search} onChange={e=>setSearch(e.target.value)}/></div><span className="result-count">{filtered.length} records</span></div><div className="table-card"><table><thead><tr><th>Name</th><th>Login ID</th>{isStudent && <><th>Roll number</th><th>Class</th></>}<th>Actions</th></tr></thead><tbody>{loading?<tr><td colSpan={isStudent?5:3} className="empty-cell">Loading records...</td></tr>:filtered.length===0?<tr><td colSpan={isStudent?5:3} className="empty-cell">No records found.</td></tr>:filtered.map(row=><tr key={row.id}><td><div className="person-cell"><div className="mini-avatar">{row.name.slice(0,1).toUpperCase()}</div><strong>{row.name}</strong></div></td><td>{row.login_id}</td>{isStudent && <><td>{row.roll_number}</td><td>{row.class_name}</td></>}<td><div className="row-actions"><button className="icon-btn" title="Edit" onClick={()=>startEdit(row)}><Pencil size={16}/></button><button className="icon-btn danger" title="Delete" onClick={()=>remove(row)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>{showForm && <Modal title={`${editing?'Edit':'Add'} ${isStudent?'student':'teacher'}`} onClose={closeForm}><form onSubmit={submit} className="modal-form"><Field label="Full name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></Field><Field label="Login ID"><input value={form.login_id} onChange={e=>setForm({...form,login_id:e.target.value})} required/></Field>{isStudent && <><Field label="Roll number"><input value={form.roll_number} onChange={e=>setForm({...form,roll_number:e.target.value})} required/></Field><Field label="Class / Section"><input value={form.class_name} onChange={e=>setForm({...form,class_name:e.target.value})} placeholder="e.g. 10-A" required/></Field></> }<Field label={editing?'New password (optional)':'Initial password'}><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required={!editing} minLength={8} placeholder={editing?'Leave blank to keep current password':'At least 8 characters'}/></Field><div className="modal-actions"><button type="button" className="secondary-btn" onClick={closeForm}>Cancel</button><button className="primary-btn">{editing?'Save changes':'Create account'}</button></div></form></Modal>}</>
}

export default UserManagement
