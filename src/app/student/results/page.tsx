'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { AcademicResult, Student } from '@/lib/types';
import {
  GraduationCap,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  Lock,
  Clock,
  Award,
} from 'lucide-react';
import { getGradeColor } from '@/lib/utils';

export default function StudentResultsPage() {
  const { currentUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [results, setResults] = useState<AcademicResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentResults = async () => {
    const identifier = currentUser?.id || currentUser?.email || '';
    if (!identifier) return;

    try {
      setLoading(true);
      const [profRes, resRes] = await Promise.all([
        fetch(`/api/academic?type=student-profile&studentId=${encodeURIComponent(identifier)}`),
        fetch(`/api/results?studentId=${encodeURIComponent(identifier)}&role=student`),
      ]);

      const [profData, resData] = await Promise.all([
        profRes.json(),
        resRes.json(),
      ]);

      if (profData.success && profData.student) setStudent(profData.student);
      if (resData.success && resData.results) setResults(resData.results);
    } catch (err) {
      console.error('Failed to load student results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentResults();
  }, [currentUser]);

  // Calculations
  let totalCreditUnits = 0;
  let totalQualityPoints = 0;

  results.forEach((r) => {
    if (r.status === 'approved' && r.grade_point !== undefined && r.course?.credit_unit) {
      totalCreditUnits += r.course.credit_unit;
      totalQualityPoints += r.grade_point * r.course.credit_unit;
    }
  });

  const gpa = totalCreditUnits > 0 ? (totalQualityPoints / totalCreditUnits).toFixed(2) : '—';
  const studentName = student?.user?.name || currentUser?.name || 'Student';
  const matricNumber = student?.matric_number || '';
  const deptName = student?.department?.name || 'Computer Science';
  const sessionName = results[0]?.academic_session || '2025/2026';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Official Academic Statement of Results
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Academic Session {sessionName} | Department of {deptName}
            {matricNumber ? ` | Matric No: ${matricNumber}` : ''} | Student:{' '}
            <strong className="text-slate-800">{studentName}</strong>
          </p>
        </div>
        <button
          onClick={fetchStudentResults}
          disabled={loading}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Results</span>
        </button>
      </div>

      {/* GPA Banner Card */}
      <div className="bg-slate-800 text-white rounded-xl p-6 border border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-mono mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographically Verified Academic Record</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Semester Grade Point Average (GPA)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Evaluated Units: {totalCreditUnits} | Quality Points: {totalQualityPoints.toFixed(1)}
          </p>
        </div>

        <div className="flex items-baseline gap-3 bg-slate-700/80 px-6 py-3 rounded-xl border border-slate-600">
          <span className="text-3xl font-black text-white tracking-tight">{gpa}</span>
          <span className="text-xs text-slate-400">/ 5.00</span>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Course Results Breakdown
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading student results...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No academic results have been published for your profile yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left academic-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Credit Units</th>
                  <th>CA Score</th>
                  <th>Exam Score</th>
                  <th>Total Score</th>
                  <th>Letter Grade</th>
                  <th>Status</th>
                  <th>Quality Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => {
                  const credit = r.course?.credit_unit || 3;
                  const isApproved = r.status === 'approved';
                  const qp = isApproved && r.grade_point !== undefined ? (r.grade_point * credit).toFixed(1) : '—';

                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {r.course?.course_code}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-800">{r.course?.course_title}</span>
                      </td>
                      <td>
                        <span className="text-slate-700 font-medium">{credit} Units</span>
                      </td>
                      <td>
                        {isApproved ? (
                          <span className="font-mono text-slate-800 font-semibold">{r.decrypted_ca_score ?? '—'}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Lock className="w-3 h-3 text-sky-500" />
                            Encrypted
                          </span>
                        )}
                      </td>
                      <td>
                        {isApproved ? (
                          <span className="font-mono text-slate-800 font-semibold">{r.decrypted_exam_score ?? '—'}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Lock className="w-3 h-3 text-sky-500" />
                            Encrypted
                          </span>
                        )}
                      </td>
                      <td>
                        {isApproved ? (
                          <span className="font-mono font-bold text-slate-900">
                            {r.decrypted_total_score ?? '—'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Lock className="w-3 h-3 text-sky-500" />
                            Encrypted
                          </span>
                        )}
                      </td>
                      <td>
                        {isApproved && r.grade ? (
                          <span
                            className={`font-bold text-xs px-2 py-0.5 rounded border ${getGradeColor(
                              r.grade
                            )}`}
                          >
                            {r.grade}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td>
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                            <Clock className="w-3 h-3" />
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="font-mono font-bold text-slate-900">{qp}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cryptographic Protection Guarantee Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            This record was evaluated using <strong>Microsoft SEAL BFV</strong> homomorphic encryption. Underlying scores remain confidential in ciphertext representation.
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 uppercase shrink-0">Scheme: BFV-128</span>
      </div>
    </div>
  );
}
