'use client';

import React, { useEffect, useState } from 'react';
import { Student, Lecturer, Department, Faculty } from '@/lib/types';
import { BulkUploadModal, BulkUploadColumn } from '@/components/ui/BulkUploadModal';
import {
  Users,
  GraduationCap,
  RefreshCw,
  Plus,
  X,
  Upload,
  Edit,
  Trash2,
  Key,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function AdminUsersPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'lecturers'>('students');

  // Bulk upload modals
  const [studentUploadOpen, setStudentUploadOpen] = useState(false);
  const [lecturerUploadOpen, setLecturerUploadOpen] = useState(false);

  // Bulk upload column definitions
  const studentUploadColumns: BulkUploadColumn[] = [
    { key: 'name', label: 'Full Name', required: true, type: 'string' },
    { key: 'matric_number', label: 'Matric Number', required: true, type: 'string' },
    { key: 'department_code', label: 'Department Code', required: true, type: 'string' },
    { key: 'level', label: 'Level', required: false, type: 'number', min: 100, max: 500 },
  ];

  const lecturerUploadColumns: BulkUploadColumn[] = [
    { key: 'name', label: 'Full Name', required: true, type: 'string' },
    { key: 'staff_number', label: 'Staff Number', required: true, type: 'string' },
    { key: 'department_code', label: 'Department Code', required: true, type: 'string' },
  ];

  const handleBulkStudentUpload = async (rows: Record<string, any>[]) => {
    const res = await fetch('/api/academic/bulk-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'students', rows }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data.result;
  };

  const handleBulkLecturerUpload = async (rows: Record<string, any>[]) => {
    const res = await fetch('/api/academic/bulk-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'lecturers', rows }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data.result;
  };

  // Modals - Create Student
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [stName, setStName] = useState('');
  const [stMatric, setStMatric] = useState('');
  const [stDeptId, setStDeptId] = useState('');
  const [stLevel, setStLevel] = useState(400);

  // Modals - Create Lecturer
  const [lecturerModalOpen, setLecturerModalOpen] = useState(false);
  const [lecName, setLecName] = useState('');
  const [lecStaffNo, setLecStaffNo] = useState('');
  const [lecDeptId, setLecDeptId] = useState('');

  // Modals - Edit Student
  const [editStudentModalOpen, setEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStName, setEditStName] = useState('');
  const [editStMatric, setEditStMatric] = useState('');
  const [editStDeptId, setEditStDeptId] = useState('');
  const [editStLevel, setEditStLevel] = useState(400);

  // Modals - Edit Lecturer
  const [editLecturerModalOpen, setEditLecturerModalOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [editLecName, setEditLecName] = useState('');
  const [editLecStaffNo, setEditLecStaffNo] = useState('');
  const [editLecDeptId, setEditLecDeptId] = useState('');

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'student' | 'lecturer'; id: string; name: string } | null>(null);

  // Reset Directory Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Faculty filter for modals
  const [stFacultyId, setStFacultyId] = useState('');
  const [lecFacultyId, setLecFacultyId] = useState('');

  const filteredDeptsForStudent = stFacultyId
    ? departments.filter((d) => d.faculty_id === stFacultyId)
    : departments;
  const filteredDeptsForLecturer = lecFacultyId
    ? departments.filter((d) => d.faculty_id === lecFacultyId)
    : departments;

  const fetchUsersAndDepts = async () => {
    try {
      setLoading(true);
      const [sRes, lRes, dRes, fRes] = await Promise.all([
        fetch('/api/academic?type=students'),
        fetch('/api/academic?type=lecturers'),
        fetch('/api/academic?type=departments'),
        fetch('/api/academic?type=faculties'),
      ]);
      const [sData, lData, dData, fData] = await Promise.all([
        sRes.json(), lRes.json(), dRes.json(), fRes.json(),
      ]);
      if (sData.success) setStudents(sData.students);
      if (lData.success) setLecturers(lData.lecturers);
      if (dData.success) {
        setDepartments(dData.departments);
        if (dData.departments.length > 0) {
          setStDeptId((prev) => prev || dData.departments[0].id);
          setLecDeptId((prev) => prev || dData.departments[0].id);
        }
      }
      if (fData.success) {
        setFaculties(fData.faculties);
        if (fData.faculties.length > 0) {
          setStFacultyId((prev) => prev || fData.faculties[0].id);
          setLecFacultyId((prev) => prev || fData.faculties[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load user directories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndDepts();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stName || !stMatric) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-student',
          name: stName,
          matric_number: stMatric,
          department_id: stDeptId || departments[0]?.id,
          level: stLevel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStName('');
        setStMatric('');
        setStudentModalOpen(false);
        fetchUsersAndDepts();
      } else {
        alert(`Failed to add student: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to add student: ${err.message}`);
    }
  };

  const handleCreateLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lecName || !lecStaffNo) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-lecturer',
          name: lecName,
          staff_number: lecStaffNo,
          department_id: lecDeptId || departments[0]?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLecName('');
        setLecStaffNo('');
        setLecturerModalOpen(false);
        fetchUsersAndDepts();
      } else {
        alert(`Failed to add lecturer: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to add lecturer: ${err.message}`);
    }
  };

  const openEditStudent = (st: Student) => {
    setEditingStudent(st);
    setEditStName(st.user?.name || '');
    setEditStMatric(st.matric_number);
    setEditStDeptId(st.department_id);
    setEditStLevel(st.level);
    setEditStudentModalOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editStName || !editStMatric) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-student',
          id: editingStudent.id,
          name: editStName,
          matric_number: editStMatric,
          department_id: editStDeptId,
          level: editStLevel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditStudentModalOpen(false);
        setEditingStudent(null);
        fetchUsersAndDepts();
      } else {
        alert(`Failed to update student: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to update student: ${err.message}`);
    }
  };

  const openEditLecturer = (lec: Lecturer) => {
    setEditingLecturer(lec);
    setEditLecName(lec.user?.name || '');
    setEditLecStaffNo(lec.staff_number);
    setEditLecDeptId(lec.department_id);
    setEditLecturerModalOpen(true);
  };

  const handleUpdateLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecturer || !editLecName || !editLecStaffNo) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-lecturer',
          id: editingLecturer.id,
          name: editLecName,
          staff_number: editLecStaffNo,
          department_id: editLecDeptId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditLecturerModalOpen(false);
        setEditingLecturer(null);
        fetchUsersAndDepts();
      } else {
        alert(`Failed to update lecturer: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to update lecturer: ${err.message}`);
    }
  };

  const confirmDelete = (type: 'student' | 'lecturer', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: deleteTarget.type === 'student' ? 'delete-student' : 'delete-lecturer',
          id: deleteTarget.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        fetchUsersAndDepts();
      } else {
        alert(`Failed to delete record: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to delete record: ${err.message}`);
    }
  };

  const executeResetUsers = async () => {
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-users' }),
      });
      const data = await res.json();
      if (data.success) {
        setResetModalOpen(false);
        fetchUsersAndDepts();
      } else {
        alert(`Failed to reset directory: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to reset directory: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional User Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered faculty members, academic lecturers, and enrolled students
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setResetModalOpen(true)}
            className="px-3 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Wipe previous sample/corrupted data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Directory</span>
          </button>

          {activeTab === 'students' ? (
            <>
              <button
                onClick={() => setStudentUploadOpen(true)}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Bulk Upload Students</span>
              </button>
              <button
                onClick={() => setStudentModalOpen(true)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Student</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setLecturerUploadOpen(true)}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Bulk Upload Lecturers</span>
              </button>
              <button
                onClick={() => setLecturerModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Appoint Lecturer</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Default Password & Authentication Helper Banner */}
      <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-3 shadow-xs">
        <Key className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="font-semibold text-sky-950">Default Authentication Credentials: </span>
          <span>
            The initial default password for all newly created or bulk-uploaded accounts is{' '}
            <strong className="font-mono bg-sky-100 px-1.5 py-0.5 rounded text-sky-900 border border-sky-300">
              password123
            </strong>
            . Users can log in using either their <strong className="font-medium">Institutional Email</strong> or their{' '}
            <strong className="font-medium">Matric Number / Staff ID</strong>.
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'students'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Enrolled Students ({students.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('lecturers')}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'lecturers'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Academic Lecturers ({lecturers.length})</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            <span>Loading user directory...</span>
          </div>
        ) : activeTab === 'students' ? (
          <div>
            <div className="px-6 py-3.5 bg-sky-50/50 border-b border-sky-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-sky-600" />
                  <span>Enrolled Students Ledger ({students.length} Total)</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Showing enrolled students with unique matriculation numbers
                </p>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No students enrolled yet. Click &quot;Register Student&quot; or &quot;Bulk Upload Students&quot; above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left academic-table">
                  <thead>
                    <tr>
                      <th>Matric Number</th>
                      <th>Full Name</th>
                      <th>Institutional Email</th>
                      <th>Department</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td>
                          <span className="font-bold text-slate-900 font-mono text-xs">{st.matric_number}</span>
                        </td>
                        <td>
                          <span className="font-semibold text-slate-800">{st.user?.name || 'Student'}</span>
                        </td>
                        <td>
                          <span className="text-xs font-mono text-slate-600">{st.user?.email}</span>
                        </td>
                        <td>
                          <span className="text-slate-600">{st.department?.name || 'Computer Science'}</span>
                        </td>
                        <td>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                            {st.level} Level
                          </span>
                        </td>
                        <td>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditStudent(st)}
                              title="Edit Student"
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => confirmDelete('student', st.id, st.user?.name || st.matric_number)}
                              title="Delete Student"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="px-6 py-3.5 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Appointed Academic Lecturers Ledger ({lecturers.length} Total)</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Showing appointed faculty members with staff identification numbers
                </p>
              </div>
            </div>

            {lecturers.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No lecturers appointed yet. Click &quot;Appoint Lecturer&quot; or &quot;Bulk Upload Lecturers&quot; above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left academic-table">
                  <thead>
                    <tr>
                      <th>Staff Number</th>
                      <th>Lecturer Name</th>
                      <th>Institutional Email</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lecturers.map((lec) => (
                      <tr key={lec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td>
                          <span className="font-bold text-slate-900 font-mono text-xs">{lec.staff_number}</span>
                        </td>
                        <td>
                          <span className="font-semibold text-slate-800">{lec.user?.name}</span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-600 font-mono">{lec.user?.email}</span>
                        </td>
                        <td>
                          <span className="text-slate-700">{lec.department?.name || 'Computer Science'}</span>
                        </td>
                        <td>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditLecturer(lec)}
                              title="Edit Lecturer"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => confirmDelete('lecturer', lec.id, lec.user?.name || lec.staff_number)}
                              title="Delete Lecturer"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Register New Student</h3>
              <button onClick={() => setStudentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bolanle Joy Alabi"
                  value={stName}
                  onChange={(e) => setStName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Matric Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSC/2022/1042"
                    value={stMatric}
                    onChange={(e) => setStMatric(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Academic Level</label>
                  <select
                    value={stLevel}
                    onChange={(e) => setStLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                  >
                    <option value={100}>100 Level</option>
                    <option value={200}>200 Level</option>
                    <option value={300}>300 Level</option>
                    <option value={400}>400 Level</option>
                    <option value={500}>500 Level</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Faculty</label>
                <select
                  value={stFacultyId}
                  onChange={(e) => {
                    setStFacultyId(e.target.value);
                    const firstDept = departments.filter((d) => d.faculty_id === e.target.value)[0];
                    if (firstDept) setStDeptId(firstDept.id);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                >
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={stDeptId}
                  onChange={(e) => setStDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                >
                  {filteredDeptsForStudent.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudentModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Student Record</h3>
              <button onClick={() => setEditStudentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={editStName}
                  onChange={(e) => setEditStName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Matric Number</label>
                  <input
                    type="text"
                    required
                    value={editStMatric}
                    onChange={(e) => setEditStMatric(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Academic Level</label>
                  <select
                    value={editStLevel}
                    onChange={(e) => setEditStLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                  >
                    <option value={100}>100 Level</option>
                    <option value={200}>200 Level</option>
                    <option value={300}>300 Level</option>
                    <option value={400}>400 Level</option>
                    <option value={500}>500 Level</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={editStDeptId}
                  onChange={(e) => setEditStDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditStudentModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Update Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lecturer Modal */}
      {lecturerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Appoint Academic Lecturer</h3>
              <button onClick={() => setLecturerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateLecturer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lecturer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Folashade Adeyemi"
                  value={lecName}
                  onChange={(e) => setLecName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Staff Identification Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STF/CSC/042"
                  value={lecStaffNo}
                  onChange={(e) => setLecStaffNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Faculty</label>
                <select
                  value={lecFacultyId}
                  onChange={(e) => {
                    setLecFacultyId(e.target.value);
                    const firstDept = departments.filter((d) => d.faculty_id === e.target.value)[0];
                    if (firstDept) setLecDeptId(firstDept.id);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                >
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={lecDeptId}
                  onChange={(e) => setLecDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                >
                  {filteredDeptsForLecturer.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLecturerModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Appoint Lecturer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lecturer Modal */}
      {editLecturerModalOpen && editingLecturer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Lecturer Record</h3>
              <button onClick={() => setEditLecturerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateLecturer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lecturer Full Name</label>
                <input
                  type="text"
                  required
                  value={editLecName}
                  onChange={(e) => setEditLecName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Staff Identification Number</label>
                <input
                  type="text"
                  required
                  value={editLecStaffNo}
                  onChange={(e) => setEditLecStaffNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={editLecDeptId}
                  onChange={(e) => setEditLecDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditLecturerModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Update Lecturer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 capitalize">
                  Delete {deleteTarget.type}
                </h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-700">
              Are you sure you want to permanently remove{' '}
              <strong className="text-slate-900 font-semibold">{deleteTarget.name}</strong> from the institutional database?
            </p>
            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}
                className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Directory Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Reset Institutional User Directory
                </h3>
                <p className="text-xs text-slate-500">Wipes all student & lecturer records.</p>
              </div>
            </div>
            <p className="text-xs text-slate-700">
              This will clear all registered students and appointed lecturers from the local database, allowing you to start fresh with clean bulk uploads. Academic faculties, departments, and courses will remain intact.
            </p>
            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeResetUsers}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold shadow-xs"
              >
                Yes, Reset Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Student Modal */}
      <BulkUploadModal
        isOpen={studentUploadOpen}
        onClose={() => { setStudentUploadOpen(false); fetchUsersAndDepts(); }}
        title="Bulk Register Students"
        description="Upload a CSV or Excel file with student details (columns: name, matric_number, department_code, level)"
        columns={studentUploadColumns}
        templateHeaders={['name', 'matric_number', 'department_code', 'level']}
        onUpload={handleBulkStudentUpload}
      />

      {/* Bulk Upload Lecturer Modal */}
      <BulkUploadModal
        isOpen={lecturerUploadOpen}
        onClose={() => { setLecturerUploadOpen(false); fetchUsersAndDepts(); }}
        title="Bulk Appoint Lecturers"
        description="Upload a CSV or Excel file with lecturer details (columns: name, staff_number, department_code)"
        columns={lecturerUploadColumns}
        templateHeaders={['name', 'staff_number', 'department_code']}
        onUpload={handleBulkLecturerUpload}
      />
    </div>
  );
}
