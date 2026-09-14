'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { StatCard } from '@/components/ui/StatCard';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  FileCheck,
  Lock,
  UserCheck,
  Building2,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { AcademicResult, CourseRegistration, Student } from '@/lib/types';

export default function StudentDashboardPage() {
  const { currentUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [results, setResults] = useState<AcademicResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      const identifier = currentUser?.id || currentUser?.email || '';
      if (!identifier) return;

      try {
        setLoading(true);
        const [profRes, regRes, resRes] = await Promise.all([
          fetch(`/api/academic?type=student-profile&studentId=${encodeURIComponent(identifier)}`),
          fetch(`/api/academic?type=student-registrations&studentId=${encodeURIComponent(identifier)}`),
          fetch(`/api/results?studentId=${encodeURIComponent(identifier)}&role=student`),
        ]);

        const [profData, regData, resData] = await Promise.all([
          profRes.json(),
          regRes.json(),
          resRes.json(),
        ]);

        if (profData.success && profData.student) setStudent(profData.student);
        if (regData.success && regData.registrations) setRegistrations(regData.registrations);
        if (resData.success && resData.results) setResults(resData.results);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [currentUser]);

  // Compute GPA if any approved results exist
  let totalQualityPoints = 0;
  let totalCreditUnits = 0;
  const approvedResults = results.filter((r) => r.status === 'approved');

  approvedResults.forEach((r) => {
    if (r.grade_point !== undefined && r.course?.credit_unit) {
      totalQualityPoints += r.grade_point * r.course.credit_unit;
      totalCreditUnits += r.course.credit_unit;
    }
  });

  const gpa = totalCreditUnits > 0 ? (totalQualityPoints / totalCreditUnits).toFixed(2) : '—';
  const studentName = student?.user?.name || currentUser?.name || 'Student';
  const matricNumber = student?.matric_number || 'Matric Pending';
  const deptName = student?.department?.name || 'Department of Computer Science';
  const progName = student?.programme?.name || 'B.Sc. Computer Science';
  const levelNum = student?.level || 400;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Academic Portal</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome, <strong className="text-slate-800">{studentName}</strong>. All academic records are protected via homomorphic encryption.
          </p>
        </div>
        <Link
          href="/student/results"
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start cursor-pointer"
        >
          <FileCheck className="w-4 h-4" />
          <span>View Statement of Results</span>
        </Link>
      </div>

      {/* Student Academic Information Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-700 rounded-lg border border-sky-100">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{studentName}</h2>
              <p className="text-xs text-slate-500 font-mono">{currentUser?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
              Active Student
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 font-medium">
              <Award className="w-3.5 h-3.5" />
              <span>Matriculation No.</span>
            </div>
            <div className="font-mono font-bold text-slate-900 text-sm">{matricNumber}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 font-medium">
              <Building2 className="w-3.5 h-3.5" />
              <span>Department</span>
            </div>
            <div className="font-semibold text-slate-900 truncate">{deptName}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 font-medium">
              <Layers className="w-3.5 h-3.5" />
              <span>Programme & Level</span>
            </div>
            <div className="font-semibold text-slate-900">{levelNum} Level ({progName})</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Academic Session</span>
            </div>
            <div className="font-semibold text-slate-900">
              {registrations[0]?.academic_session || '2025/2026'} (First Sem.)
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Registered Courses"
          value={registrations.length}
          subtitle={`Session ${registrations[0]?.academic_session || '2025/2026'}`}
          icon={BookOpen}
        />
        <StatCard
          title="Semester GPA"
          value={gpa}
          subtitle="Computed on authorized decrypted grades"
          icon={GraduationCap}
          badge={totalCreditUnits > 0 ? `${totalCreditUnits} Units Verified` : 'Pending Results'}
          badgeType={totalCreditUnits > 0 ? 'success' : 'default'}
        />
        <StatCard
          title="Data Security Status"
          value="Homomorphic BFV"
          subtitle="Microsoft SEAL WebAssembly"
          icon={ShieldCheck}
          badge="Zero Plaintext Leak"
          badgeType="accent"
        />
      </div>

      {/* Registered Courses Card Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Enrolled Academic Courses
            </h2>
          </div>
          <Link
            href="/student/courses"
            className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
          >
            Manage Registrations <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading courses...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No courses registered yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                        {reg.course?.course_code}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        {reg.course?.credit_unit} Credit Units
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {reg.course?.course_title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Level: {reg.course?.level}L | Semester: {reg.semester}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Status: Confirmed Enrolled
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Session: {reg.academic_session}
                    </span>
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
