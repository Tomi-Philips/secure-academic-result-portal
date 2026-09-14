'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { StatCard } from '@/components/ui/StatCard';
import { BookOpen, Users, Binary, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { CourseAllocation } from '@/lib/types';

export default function LecturerDashboardPage() {
  const { currentUser } = useAuth();
  const [allocations, setAllocations] = useState<CourseAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLecturerData = async () => {
    try {
      setLoading(true);
      // Use the real logged-in user's ID/email — the API resolves by user_id, email, or staff_number
      const lecturerId = currentUser?.id || '';
      if (!lecturerId) return;
      const res = await fetch(`/api/academic?type=lecturer-allocations&lecturerId=${encodeURIComponent(lecturerId)}`);
      const data = await res.json();
      if (data.success) {
        setAllocations(data.allocations);
      }
    } catch (err) {
      console.error('Failed to load lecturer allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLecturerData();
  }, [currentUser]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Lecturer Portal & Course Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome, <strong className="text-slate-800">{currentUser?.name || 'Dr. Adeyemi'}</strong>. Manage course allocations and submit encrypted academic scores.
          </p>
        </div>
        <Link
          href="/lecturer/scores"
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start"
        >
          <Binary className="w-4 h-4" />
          <span>Enter & Encrypt Scores</span>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Courses"
          value={allocations.length}
          subtitle="2025/2026 Academic Session"
          icon={BookOpen}
        />
        <StatCard
          title="Security Scheme"
          value="BFV 128-bit"
          subtitle="Microsoft SEAL WebAssembly"
          icon={Binary}
          badge="Active"
          badgeType="success"
        />
        <StatCard
          title="Score Processing"
          value="Homomorphic"
          subtitle="Zero plaintext exposure in DB"
          icon={CheckCircle2}
          badge="Enabled"
          badgeType="accent"
        />
      </div>

      {/* Allocated Courses Card Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Allocated Courses for Current Semester
            </h2>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading assigned courses...</div>
          ) : allocations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No courses currently allocated.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allocations.map((alloc) => (
                <div
                  key={alloc.id}
                  className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                        {alloc.course?.course_code}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {alloc.course?.credit_unit} Credit Units
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {alloc.course?.course_title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Level: {alloc.course?.level}L | Semester: {alloc.semester}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Enrolled Students: 3
                    </span>
                    <Link
                      href="/lecturer/scores"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Enter Scores</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
