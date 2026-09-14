'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { CourseRegistration, Student } from '@/lib/types';
import { BookOpen, RefreshCw, GraduationCap } from 'lucide-react';

export default function StudentCoursesPage() {
  const { currentUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    const identifier = currentUser?.id || currentUser?.email || '';
    if (!identifier) return;

    try {
      setLoading(true);
      const [profRes, regRes] = await Promise.all([
        fetch(`/api/academic?type=student-profile&studentId=${encodeURIComponent(identifier)}`),
        fetch(`/api/academic?type=student-registrations&studentId=${encodeURIComponent(identifier)}`),
      ]);

      const [profData, regData] = await Promise.all([
        profRes.json(),
        regRes.json(),
      ]);

      if (profData.success && profData.student) setStudent(profData.student);
      if (regData.success && regData.registrations) setRegistrations(regData.registrations);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [currentUser]);

  const totalCredits = registrations.reduce((sum, r) => sum + (r.course?.credit_unit || 0), 0);
  const deptName = student?.department?.name || 'Computer Science';
  const matricNo = student?.matric_number || '';
  const sessionName = registrations[0]?.academic_session || '2025/2026';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registered Academic Courses</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Session {sessionName} | Department of {deptName}
            {matricNo ? ` | Matric: ${matricNo}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-md text-xs font-semibold flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Total: {totalCredits} Credit Units</span>
          </div>
          <button
            onClick={fetchRegistrations}
            disabled={loading}
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs transition-colors cursor-pointer"
            title="Refresh Courses"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading courses...</div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No courses registered for this academic session yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left academic-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Credit Units</th>
                  <th>Level</th>
                  <th>Session</th>
                  <th>Semester</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {reg.course?.course_code}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-slate-800">{reg.course?.course_title}</span>
                    </td>
                    <td>
                      <span className="text-slate-700 font-medium">{reg.course?.credit_unit} Units</span>
                    </td>
                    <td>
                      <span className="text-slate-600 text-xs">{reg.course?.level}L</span>
                    </td>
                    <td>
                      <span className="text-slate-600 text-xs">{reg.academic_session}</span>
                    </td>
                    <td>
                      <span className="text-slate-600 text-xs">{reg.semester}</span>
                    </td>
                    <td>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Confirmed Enrolled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
