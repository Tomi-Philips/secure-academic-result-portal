'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { BookOpen, Users, ArrowRight, Binary } from 'lucide-react';
import { CourseAllocation } from '@/lib/types';

export default function LecturerCoursesPage() {
  const { currentUser } = useAuth();
  const [allocations, setAllocations] = useState<CourseAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const lecturerId = currentUser?.id || '';
        if (!lecturerId) return;
        const res = await fetch(`/api/academic?type=lecturer-allocations&lecturerId=${encodeURIComponent(lecturerId)}`);
        const data = await res.json();
        if (data.success) setAllocations(data.allocations);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllocations();
  }, [currentUser]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Course Allocations</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Courses assigned to your faculty profile for Academic Session 2025/2026
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading courses...</div>
        ) : allocations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No courses allocated.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left academic-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Credit Units</th>
                  <th>Academic Session</th>
                  <th>Semester</th>
                  <th className="text-right">Score Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((alloc) => (
                  <tr key={alloc.id}>
                    <td>
                      <span className="font-bold text-slate-900 font-mono text-xs">
                        {alloc.course?.course_code}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-slate-800">{alloc.course?.course_title}</span>
                    </td>
                    <td>
                      <span className="text-slate-700 font-medium">{alloc.course?.credit_unit} Units</span>
                    </td>
                    <td>
                      <span className="text-slate-600 text-xs">{alloc.academic_session}</span>
                    </td>
                    <td>
                      <span className="text-slate-600 text-xs">{alloc.semester}</span>
                    </td>
                    <td className="text-right">
                      <Link
                        href="/lecturer/scores"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        <Binary className="w-3.5 h-3.5 text-sky-400" />
                        <span>Enter Scores</span>
                      </Link>
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
