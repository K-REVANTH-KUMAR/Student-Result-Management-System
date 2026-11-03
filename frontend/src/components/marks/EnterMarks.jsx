import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Users, UserRound, ClipboardList, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react'
import { api } from '../../api'
import SectionHeading from '../common/SectionHeading'
import Field from '../common/Field'

function EnterMarks({notify}) {
  const [students,setStudents]=useState([]),[subjects,setSubjects]=useState([]),[form,setForm]=useState({student_id:'',subject_id:'',marks:''}),[saving,setSaving]=useState(false)
  useEffect(()=>{Promise.all([api('/teacher/students'),api('/teacher/subjects')]).then(([s,sub])=>{setStudents(s);setSubjects(sub)}).catch(e=>notify(e.message,'error'))},[])
  async function submit(e){e.preventDefault();setSaving(true);try{await api('/teacher/marks',{method:'POST',body:JSON.stringify({...form,student_id:Number(form.student_id),subject_id:Number(form.subject_id),marks:Number(form.marks)})});notify('Marks saved successfully');setForm({...form,marks:''})}catch(e){notify(e.message,'error')}finally{setSaving(false)}}
  return <><SectionHeading title="Enter student marks" subtitle="Select a student and subject, then enter a mark out of 100."/><div className="form-card wide-form"><div className="form-card-icon"><ClipboardList size={22}/></div><h3>Marks entry</h3><form onSubmit={submit} className="modal-form"><Field label="Student"><select value={form.student_id} onChange={e=>setForm({...form,student_id:e.target.value})} required><option value="">Select student</option>{students.map(s=><option value={s.student_id} key={s.student_id}>{s.name} · {s.roll_number} · {s.class_name}</option>)}</select></Field><Field label="Subject"><select value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})} required><option value="">Select subject</option>{subjects.map(s=><option value={s.id} key={s.id}>{s.subject_name}</option>)}</select></Field><Field label="Marks (0–100)"><input type="number" min="0" max="100" step="0.5" placeholder="Enter marks" value={form.marks} onChange={e=>setForm({...form,marks:e.target.value})} required/></Field><button className="primary-btn" disabled={saving || !students.length || !subjects.length}>{saving?'Saving...':'Save marks'}</button><p className="helper-text">Saving marks for the same student and subject updates the existing record.</p></form></div></>
}

export default EnterMarks
