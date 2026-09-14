'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { CourseRegistration } from '@/lib/types';
import { BookOpen, RefreshCw } from 'lucide-react';

export default function StudentCoursesPage() {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        const studentId =
          currentUser?.id === 'u5'
            ? 'st2'
            : currentUser?.id === 'u6'
            ? 'st3'
            : currentUser?.id === 'u7'
            ? 'st4'
            : 'st1';

        const res = await fetch(`/api/academic?type=student-registrations&studentId=${studentId}`);
        const data = await res.json();
        if (data.success) setRegistrations(data.registrations);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, [currentUser]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registered Academic Courses</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Courses registered for Academic Session 2025/2026 under Department of Computer Science
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading courses...</div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No courses registered.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left academic-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Credit Units</th>
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
                      <span className="text-slate-600 text-xs">{reg.academic_session}</span>
                    </td>
                    <td>
                      <span className="text-slate-600 text-xs">{reg.semester}</span>
                    </td>
                    <td>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Confirmed
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
