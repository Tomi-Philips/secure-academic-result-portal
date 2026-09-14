'use client';

import React, { useEffect, useState } from 'react';
import { Course, Department, Faculty, Lecturer, CourseAllocation } from '@/lib/types';
import {
  BookOpen,
  Building2,
  Plus,
  RefreshCw,
  X,
  ChevronRight,
  GraduationCap,
  Edit,
  Trash2,
  AlertTriangle,
  UserCheck,
  User,
} from 'lucide-react';

export default function AdminAcademicPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [allocations, setAllocations] = useState<CourseAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-down state
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Modals - Create
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [facName, setFacName] = useState('');
  const [facCode, setFacCode] = useState('');

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [creditUnits, setCreditUnits] = useState(3);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [level, setLevel] = useState(400);
  const [semester, setSemester] = useState<'First' | 'Second'>('First');

  // Modals - Edit Faculty
  const [editFacultyModalOpen, setEditFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [editFacName, setEditFacName] = useState('');
  const [editFacCode, setEditFacCode] = useState('');

  // Modals - Edit Department
  const [editDeptModalOpen, setEditDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editDeptFacultyId, setEditDeptFacultyId] = useState('');

  // Modals - Edit Course
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCreditUnits, setEditCreditUnits] = useState(3);
  const [editCourseDeptId, setEditCourseDeptId] = useState('');
  const [editCourseLevel, setEditCourseLevel] = useState(400);
  const [editCourseSemester, setEditCourseSemester] = useState<'First' | 'Second'>('First');

  // Modals - Assign Lecturer
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignCourse, setAssignCourse] = useState<Course | null>(null);
  const [selectedLecId, setSelectedLecId] = useState<string>('');

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'faculty' | 'department' | 'course';
    id: string;
    name: string;
  } | null>(null);

  const fetchAcademicData = async () => {
    try {
      setLoading(true);
      const [fRes, dRes, cRes, lRes, aRes] = await Promise.all([
        fetch('/api/academic?type=faculties'),
        fetch('/api/academic?type=departments'),
        fetch('/api/academic?type=courses'),
        fetch('/api/academic?type=lecturers'),
        fetch('/api/academic?type=lecturer-allocations&lecturerId=all'),
      ]);
      const [fData, dData, cData, lData, aData] = await Promise.all([
        fRes.json(),
        dRes.json(),
        cRes.json(),
        lRes.json(),
        aRes.json(),
      ]);
      if (fData.success) setFaculties(fData.faculties);
      if (dData.success) {
        setDepartments(dData.departments);
        if (dData.departments.length > 0 && !selectedDeptId) {
          setSelectedDeptId(dData.departments[0].id);
        }
      }
      if (cData.success) setCourses(cData.courses);
      if (lData.success) {
        setLecturers(lData.lecturers);
        if (lData.lecturers.length > 0) {
          setSelectedLecId(lData.lecturers[0].id);
        }
      }
      if (aData.success) setAllocations(aData.allocations);
    } catch (err) {
      console.error('Failed to fetch academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicData();
  }, []);

  // Filtered data for drill-down
  const departmentsInFaculty = selectedFaculty
    ? departments.filter((d) => d.faculty_id === selectedFaculty.id)
    : departments;

  const coursesInDepartment = selectedDepartment
    ? courses.filter((c) => c.department_id === selectedDepartment.id)
    : selectedFaculty
      ? courses.filter((c) =>
          departmentsInFaculty.some((d) => d.id === c.department_id)
        )
      : courses;

  // Handlers - Create
  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName || !facCode) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-faculty', name: facName, code: facCode }),
      });
      const data = await res.json();
      if (data.success) {
        setFacName('');
        setFacCode('');
        setFacultyModalOpen(false);
        fetchAcademicData();
      } else {
        alert(`Failed to create faculty: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to create faculty: ${err.message}`);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-department',
          faculty_id: selectedFaculty?.id || faculties[0]?.id,
          name: deptName,
          code: deptCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDeptName('');
        setDeptCode('');
        setDeptModalOpen(false);
        fetchAcademicData();
      } else {
        alert(`Failed to create department: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to create department: ${err.message}`);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !courseTitle) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-course',
          course_code: courseCode,
          course_title: courseTitle,
          credit_unit: Number(creditUnits),
          department_id: selectedDeptId || selectedDepartment?.id || departments[0]?.id,
          level: Number(level),
          semester,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCourseCode('');
        setCourseTitle('');
        setCourseModalOpen(false);
        fetchAcademicData();
      } else {
        alert(`Failed to create course: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to create course: ${err.message}`);
    }
  };

  // Handlers - Edit
  const openEditFaculty = (fac: Faculty, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFaculty(fac);
    setEditFacName(fac.name);
    setEditFacCode(fac.code);
    setEditFacultyModalOpen(true);
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty || !editFacName || !editFacCode) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-faculty',
          id: editingFaculty.id,
          name: editFacName,
          code: editFacCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditFacultyModalOpen(false);
        setEditingFaculty(null);
        fetchAcademicData();
      } else {
        alert(`Failed to update faculty: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to update faculty: ${err.message}`);
    }
  };

  const openEditDept = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDept(dept);
    setEditDeptName(dept.name);
    setEditDeptCode(dept.code);
    setEditDeptFacultyId(dept.faculty_id);
    setEditDeptModalOpen(true);
  };

  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editDeptName || !editDeptCode) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-department',
          id: editingDept.id,
          name: editDeptName,
          code: editDeptCode,
          faculty_id: editDeptFacultyId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditDeptModalOpen(false);
        setEditingDept(null);
        fetchAcademicData();
      } else {
        alert(`Failed to update department: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to update department: ${err.message}`);
    }
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditCourseCode(course.course_code);
    setEditCourseTitle(course.course_title);
    setEditCreditUnits(course.credit_unit);
    setEditCourseDeptId(course.department_id);
    setEditCourseLevel(course.level);
    setEditCourseSemester(course.semester);
    setEditCourseModalOpen(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editCourseCode || !editCourseTitle) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-course',
          id: editingCourse.id,
          course_code: editCourseCode,
          course_title: editCourseTitle,
          credit_unit: Number(editCreditUnits),
          department_id: editCourseDeptId,
          level: Number(editCourseLevel),
          semester: editCourseSemester,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditCourseModalOpen(false);
        setEditingCourse(null);
        fetchAcademicData();
      } else {
        alert(`Failed to update course: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to update course: ${err.message}`);
    }
  };

  // Handlers - Assign Lecturer
  const openAssignModal = (course: Course) => {
    setAssignCourse(course);
    const existingAlloc = allocations.find((a) => a.course_id === course.id);
    if (existingAlloc && existingAlloc.lecturer_id) {
      setSelectedLecId(existingAlloc.lecturer_id);
    } else if (lecturers.length > 0) {
      setSelectedLecId(lecturers[0].id);
    }
    setAssignModalOpen(true);
  };

  const handleAssignLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCourse || !selectedLecId) return;
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'allocate-course',
          course_id: assignCourse.id,
          lecturer_id: selectedLecId,
          session: '2025/2026',
          semester: assignCourse.semester,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignModalOpen(false);
        setAssignCourse(null);
        fetchAcademicData();
      } else {
        alert(`Failed to assign lecturer: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to assign lecturer: ${err.message}`);
    }
  };

  // Handlers - Delete
  const confirmDelete = (
    type: 'faculty' | 'department' | 'course',
    id: string,
    name: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setDeleteTarget({ type, id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const actionMap = {
        faculty: 'delete-faculty',
        department: 'delete-department',
        course: 'delete-course',
      };
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionMap[deleteTarget.type],
          id: deleteTarget.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        if (deleteTarget.type === 'faculty' && selectedFaculty?.id === deleteTarget.id) {
          setSelectedFaculty(null);
          setSelectedDepartment(null);
        }
        if (deleteTarget.type === 'department' && selectedDepartment?.id === deleteTarget.id) {
          setSelectedDepartment(null);
        }
        setDeleteTarget(null);
        fetchAcademicData();
      } else {
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const getAssignedLecturerForCourse = (courseId: string) => {
    const alloc = allocations.find((a) => a.course_id === courseId);
    if (!alloc) return null;
    return (
      lecturers.find((l) => l.id === alloc.lecturer_id || l.user_id === alloc.lecturer_id) ||
      alloc.lecturer
    );
  };

  const breadcrumbs = [
    { label: 'All Faculties', onClick: () => { setSelectedFaculty(null); setSelectedDepartment(null); } },
    ...(selectedFaculty
      ? [{ label: selectedFaculty.name, onClick: () => setSelectedDepartment(null) }]
      : []),
    ...(selectedDepartment
      ? [{ label: selectedDepartment.name, onClick: undefined }]
      : []),
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academic Structure & Course Allocation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Faculties, departments, course catalogue, and faculty teaching assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!selectedFaculty && (
            <button
              onClick={() => setFacultyModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Faculty</span>
            </button>
          )}
          {selectedFaculty && !selectedDepartment && (
            <button
              onClick={() => setDeptModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          )}
          <button
            onClick={() => {
              if (selectedDepartment) setSelectedDeptId(selectedDepartment.id);
              setCourseModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-xs">
        {breadcrumbs.map((bc, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
            {bc.onClick ? (
              <button
                onClick={bc.onClick}
                className="text-sky-600 hover:text-sky-700 font-medium"
              >
                {bc.label}
              </button>
            ) : (
              <span className="text-slate-700 font-semibold">{bc.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          <span>Loading academic structure...</span>
        </div>
      ) : !selectedFaculty ? (
        /* ── FACULTY LIST ── */
        faculties.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
            No faculties found. Click &quot;Add Faculty&quot; above to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculties.map((fac) => {
              const deptCount = departments.filter((d) => d.faculty_id === fac.id).length;
              const courseCount = courses.filter((c) =>
                departments.filter((d) => d.faculty_id === fac.id).some((d) => d.id === c.department_id)
              ).length;
              return (
                <div
                  key={fac.id}
                  onClick={() => { setSelectedFaculty(fac); setSelectedDepartment(null); }}
                  className="p-5 bg-white border border-slate-200 rounded-xl hover:border-sky-300 hover:shadow-md transition-all group cursor-pointer relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-sky-50 transition-colors">
                        <GraduationCap className="w-5 h-5 text-slate-600 group-hover:text-sky-600" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">
                          {fac.code}
                        </span>
                        <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => openEditFaculty(fac, e)}
                            title="Edit Faculty"
                            className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => confirmDelete('faculty', fac.id, fac.name, e)}
                            title="Delete Faculty"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{fac.name}</h3>
                  </div>
                  <div className="flex gap-3 text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-2">
                    <span>{deptCount} department{deptCount !== 1 ? 's' : ''}</span>
                    <span>{courseCount} course{courseCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : !selectedDepartment ? (
        /* ── DEPARTMENT LIST (within faculty) ── */
        departmentsInFaculty.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
            No departments in this faculty. Click &quot;Add Department&quot; above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentsInFaculty.map((dept) => {
              const courseCount = courses.filter((c) => c.department_id === dept.id).length;
              return (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept)}
                  className="p-5 bg-white border border-slate-200 rounded-xl hover:border-sky-300 hover:shadow-md transition-all group cursor-pointer relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-sky-50 transition-colors">
                        <Building2 className="w-5 h-5 text-slate-600 group-hover:text-sky-600" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">
                          {dept.code}
                        </span>
                        <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => openEditDept(dept, e)}
                            title="Edit Department"
                            className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => confirmDelete('department', dept.id, dept.name, e)}
                            title="Delete Department"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{dept.name}</h3>
                  </div>
                  <div className="pt-3 border-t border-slate-100 mt-2">
                    <span className="text-[11px] text-slate-500">
                      {courseCount} course{courseCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── COURSE LIST (within department) ── */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Courses in {selectedDepartment.name}
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedDeptId(selectedDepartment.id);
                setCourseModalOpen(true);
              }}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
          </div>
          {coursesInDepartment.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No courses in this department. Click &quot;Create Course&quot; above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left academic-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Title</th>
                    <th>Level</th>
                    <th>Semester</th>
                    <th>Credit Units</th>
                    <th>Assigned Lecturer</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coursesInDepartment.map((course) => {
                    const assignedLecturer = getAssignedLecturerForCourse(course.id);
                    return (
                      <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                        <td>
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            {course.course_code}
                          </span>
                        </td>
                        <td>
                          <span className="font-medium text-slate-800">{course.course_title}</span>
                        </td>
                        <td>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                            {course.level}L
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-700">{course.semester}</span>
                        </td>
                        <td>
                          <span className="font-semibold text-slate-900">{course.credit_unit} Units</span>
                        </td>
                        <td>
                          {assignedLecturer ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
                              <User className="w-3 h-3 text-indigo-600" />
                              <span className="font-semibold">{assignedLecturer.user?.name || 'Lecturer'}</span>
                              <span className="font-mono text-[10px] text-indigo-600 font-normal">
                                ({assignedLecturer.staff_number})
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAssignModal(course)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 border border-slate-200 px-2 py-0.5 rounded transition-colors"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Assign Lecturer</span>
                            </button>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openAssignModal(course)}
                              title="Assign / Reassign Lecturer"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditCourse(course)}
                              title="Edit Course"
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => confirmDelete('course', course.id, course.course_code)}
                              title="Delete Course"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Assign Lecturer to Course Modal ── */}
      {assignModalOpen && assignCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Assign Lecturer to Course</h3>
                  <p className="text-[11px] text-slate-500">
                    {assignCourse.course_code} — {assignCourse.course_title}
                  </p>
                </div>
              </div>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {lecturers.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs space-y-2">
                <p className="font-semibold">No lecturers appointed yet!</p>
                <p>Please appoint a lecturer in the Institutional User Directory first.</p>
              </div>
            ) : (
              <form onSubmit={handleAssignLecturer} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Select Faculty Lecturer
                  </label>
                  <select
                    value={selectedLecId}
                    onChange={(e) => setSelectedLecId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                  >
                    {lecturers.map((lec) => (
                      <option key={lec.id} value={lec.id}>
                        {lec.user?.name} ({lec.staff_number}) — {lec.department?.name || 'Department'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Academic Session:</span>
                    <span className="font-semibold text-slate-800">2025/2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Semester:</span>
                    <span className="font-semibold text-slate-800">{assignCourse.semester}</span>
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold shadow-xs"
                  >
                    Save Allocation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Create Faculty Modal ── */}
      {facultyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Academic Faculty</h3>
              <button onClick={() => setFacultyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFaculty} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Faculty Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faculty of Engineering"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Faculty Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FEN"
                  value={facCode}
                  onChange={(e) => setFacCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none uppercase font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFacultyModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Save Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Faculty Modal ── */}
      {editFacultyModalOpen && editingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Academic Faculty</h3>
              <button onClick={() => setEditFacultyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateFaculty} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Faculty Name</label>
                <input
                  type="text"
                  required
                  value={editFacName}
                  onChange={(e) => setEditFacName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Faculty Code</label>
                <input
                  type="text"
                  required
                  value={editFacCode}
                  onChange={(e) => setEditFacCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none uppercase font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditFacultyModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Update Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Department Modal ── */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Add Department {selectedFaculty ? `to ${selectedFaculty.name}` : ''}
              </h3>
              <button onClick={() => setDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cybersecurity & Privacy"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CYB"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none uppercase font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Department Modal ── */}
      {editDeptModalOpen && editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Department</h3>
              <button onClick={() => setEditDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateDept} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  value={editDeptCode}
                  onChange={(e) => setEditDeptCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Faculty</label>
                <select
                  value={editDeptFacultyId}
                  onChange={(e) => setEditDeptFacultyId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                >
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditDeptModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Update Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Course Modal ── */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create New Academic Course</h3>
              <button onClick={() => setCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSC 405"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Credit Units</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={creditUnits}
                    onChange={(e) => setCreditUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Privacy Enhancing Technologies"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                  >
                    <option value={100}>100 Level</option>
                    <option value={200}>200 Level</option>
                    <option value={300}>300 Level</option>
                    <option value={400}>400 Level</option>
                    <option value={500}>500 Level</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                  >
                    <option value="First">First Semester</option>
                    <option value="Second">Second Semester</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Course Modal ── */}
      {editCourseModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Academic Course</h3>
              <button onClick={() => setEditCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateCourse} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={editCourseCode}
                    onChange={(e) => setEditCourseCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Credit Units</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={editCreditUnits}
                    onChange={(e) => setEditCreditUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={editCourseTitle}
                  onChange={(e) => setEditCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={editCourseDeptId}
                  onChange={(e) => setEditCourseDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Level</label>
                  <select
                    value={editCourseLevel}
                    onChange={(e) => setEditCourseLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                  >
                    <option value={100}>100 Level</option>
                    <option value={200}>200 Level</option>
                    <option value={300}>300 Level</option>
                    <option value={400}>400 Level</option>
                    <option value={500}>500 Level</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semester</label>
                  <select
                    value={editCourseSemester}
                    onChange={(e) => setEditCourseSemester(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                  >
                    <option value="First">First Semester</option>
                    <option value="Second">Second Semester</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCourseModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Update Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
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
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 font-semibold">{deleteTarget.name}</strong>?
              {deleteTarget.type === 'faculty' && ' All affiliated departments and courses will also be removed.'}
              {deleteTarget.type === 'department' && ' All affiliated courses will also be removed.'}
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
    </div>
  );
}
