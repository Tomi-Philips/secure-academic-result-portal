'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { CourseAllocation, CourseRegistration, AcademicResult } from '@/lib/types';
import { BulkUploadModal, BulkUploadColumn } from '@/components/ui/BulkUploadModal';
import { CipherBadge } from '@/components/ui/CipherBadge';
import { CipherInspectorModal } from '@/components/ui/CipherInspectorModal';
import {
  Binary,
  ShieldCheck,
  Zap,
  RefreshCw,
  Eye,
  CheckCircle2,
  Lock,
  Layers,
  BarChart2,
  Upload,
} from 'lucide-react';
import { truncateCipher } from '@/lib/utils';

// Shared default for score entry (used until the lecturer edits a field for a
// student). Keeping display and submit fallbacks identical guarantees the values
// shown in the inputs are exactly what gets encrypted and submitted.
const DEFAULT_SCORE_INPUT: { ca: number; exam: number } = { ca: 25, exam: 60 };

export default function LecturerScoresPage() {
  const { currentUser } = useAuth();
  const [allocations, setAllocations] = useState<CourseAllocation[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('c1');
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, AcademicResult>>({});
  const [loading, setLoading] = useState(true);

  // Input states per student
  const [scoreInputs, setScoreInputs] = useState<Record<string, { ca: number; exam: number }>>({});

  const [submittingStudentId, setSubmittingStudentId] = useState<string | null>(null);
  const [selectedResultForInspect, setSelectedResultForInspect] = useState<AcademicResult | null>(null);

  // Homomorphic Course Stats State
  const [courseStats, setCourseStats] = useState<any | null>(null);
  const [isComputingStats, setIsComputingStats] = useState(false);

  // Bulk upload state
  const [scoreUploadOpen, setScoreUploadOpen] = useState(false);

  const scoreUploadColumns: BulkUploadColumn[] = [
    { key: 'matric_number', label: 'Matric Number', required: true, type: 'string' },
    { key: 'ca', label: 'CA Score (30)', required: true, type: 'number', min: 0, max: 30 },
    { key: 'exam', label: 'Exam Score (70)', required: true, type: 'number', min: 0, max: 70 },
  ];

  const handleBulkScoreUpload = async (rows: Record<string, any>[]) => {
    const res = await fetch('/api/academic/bulk-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'scores',
        rows,
        courseId: selectedCourseId,
        academicSession: '2025/2026',
        semester: 'First',
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    // Refresh the course data
    if (selectedCourseId) await fetchCourseDetails(selectedCourseId);
    return data.result;
  };

  // Fetch Allocations and Initial Course Data
  useEffect(() => {
    const initLecturer = async () => {
      try {
        setLoading(true);
        // Use the real logged-in user's ID — the API resolves by user_id, email, or staff_number
        const lecturerId = currentUser?.id || '';
        if (!lecturerId) return;
        const res = await fetch(`/api/academic?type=lecturer-allocations&lecturerId=${encodeURIComponent(lecturerId)}`);
        const data = await res.json();
        if (data.success && data.allocations.length > 0) {
          setAllocations(data.allocations);
          setSelectedCourseId(data.allocations[0].course_id);
        }
      } catch (err) {
        console.error('Failed to init lecturer:', err);
      } finally {
        setLoading(false);
      }
    };
    initLecturer();
  }, [currentUser]);

  // Fetch Registrations & Results for Selected Course
  const fetchCourseDetails = async (courseId: string) => {
    try {
      setLoading(true);
      const [regRes, resRes] = await Promise.all([
        fetch(`/api/academic?type=course-registrations&courseId=${courseId}`),
        fetch(`/api/results?courseId=${courseId}`),
      ]);
      const [regData, resData] = await Promise.all([
        regRes.json(),
        resRes.json(),
      ]);
      if (regData.success) setRegistrations(regData.registrations);
      if (resData.success) {
        const mapping: Record<string, AcademicResult> = {};
        resData.results.forEach((r: AcademicResult) => {
          mapping[r.student_id] = r;
        });
        setResultsMap(mapping);
      }
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseDetails(selectedCourseId);
      setCourseStats(null);
    }
  }, [selectedCourseId]);

  const handleInputChange = (studentId: string, field: 'ca' | 'exam', value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    setScoreInputs((prev) => ({
      ...prev,
      [studentId]: {
        // Merge over the shared default so a partial edit (e.g. only the exam
        // field touched) can never produce an object missing `ca` or `exam`.
        ...DEFAULT_SCORE_INPUT,
        ...prev[studentId],
        [field]: safeValue,
      },
    }));
  };

  const handleEncryptAndSubmit = async (studentId: string) => {
    const input = scoreInputs[studentId] ?? DEFAULT_SCORE_INPUT;
    if (input.ca < 0 || input.ca > 30) {
      alert('Continuous Assessment (CA) score must be between 0 and 30.');
      return;
    }
    if (input.exam < 0 || input.exam > 70) {
      alert('Examination score must be between 0 and 70.');
      return;
    }

    try {
      setSubmittingStudentId(studentId);
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          courseId: selectedCourseId,
          academicSession: '2025/2026',
          semester: 'First',
          caScore: input.ca,
          examScore: input.exam,
          submittedByLecturerId: currentUser?.id || 'lecturer',
          lecturerName: currentUser?.name || 'Lecturer',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCourseDetails(selectedCourseId);
      } else {
        alert(`Submission Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmittingStudentId(null);
    }
  };

  const handleComputeCourseStats = async () => {
    try {
      setIsComputingStats(true);
      const res = await fetch('/api/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stats',
          courseId: selectedCourseId,
          session: '2025/2026',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCourseStats(data.stats);
      }
    } catch (err: any) {
      alert(`Stats computation error: ${err.message}`);
    } finally {
      setIsComputingStats(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academic Score Entry & Homomorphic Encryption
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Input CA (Max 30) & Exam (Max 70). Scores are encrypted via Microsoft SEAL BFV before persistence.
          </p>
        </div>

        {/* Course Selector & Bulk Upload */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 uppercase">Select Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 shadow-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            {allocations.map((a) => (
              <option key={a.course_id} value={a.course_id}>
                {a.course?.course_code} — {a.course?.course_title}
              </option>
            ))}
          </select>
          <button
            onClick={() => setScoreUploadOpen(true)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload Scores</span>
          </button>
        </div>
      </div>

      {/* Roster & Score Entry Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-sky-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Enrolled Student Roster & Score Encryption
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Session: 2025/2026 | Semester: First
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            <span>Loading enrolled roster...</span>
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No students currently registered for this course.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left academic-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Matric Number</th>
                  <th className="w-28">CA Score (30)</th>
                  <th className="w-28">Exam Score (70)</th>
                  <th>Status & Ciphertexts</th>
                  <th className="text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg) => {
                  const st = reg.student;
                  if (!st) return null;
                  const resRecord = resultsMap[st.id];
                  const currentInput = scoreInputs[st.id] ?? DEFAULT_SCORE_INPUT;

                  return (
                    <tr key={reg.id}>
                      <td>
                        <span className="font-semibold text-slate-900 block">{st.user?.name}</span>
                        <span className="text-[11px] text-slate-500">{st.user?.email}</span>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {st.matric_number}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={currentInput.ca}
                          onChange={(e) =>
                            handleInputChange(st.id, 'ca', Number(e.target.value))
                          }
                          className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="70"
                          value={currentInput.exam}
                          onChange={(e) =>
                            handleInputChange(st.id, 'exam', Number(e.target.value))
                          }
                          className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </td>
                      <td>
                        {resRecord ? (
                          <div className="space-y-1">
                            <CipherBadge status={resRecord.status} />
                            <div className="font-mono text-[10px] text-slate-500">
                              Total Cipher: {truncateCipher(resRecord.encrypted_total_score, 6, 4)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not Submitted</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {resRecord && (
                            <button
                              onClick={() => setSelectedResultForInspect(resRecord)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Inspect</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleEncryptAndSubmit(st.id)}
                            disabled={submittingStudentId === st.id}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            {submittingStudentId === st.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                            <span>{resRecord ? 'Re-Encrypt & Update' : 'Encrypt & Submit'}</span>
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

      {/* Homomorphic Course-Level Statistics Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Homomorphic Course Analytics & Pass Rate
              </h2>
              <p className="text-xs text-slate-500">
                Sum class ciphertexts without revealing individual student scores
              </p>
            </div>
          </div>

          <button
            onClick={handleComputeCourseStats}
            disabled={isComputingStats}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            {isComputingStats ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Class Ciphertexts...</span>
              </>
            ) : (
              <>
                <BarChart2 className="w-3.5 h-3.5 text-sky-300" />
                <span>Compute Class Aggregates</span>
              </>
            )}
          </button>
        </div>

        {courseStats && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Class Roster Size</span>
              <span className="text-xl font-bold text-slate-900">{courseStats.count} Students</span>
            </div>
            <div>
              <span className="text-slate-500 block">Decrypted Class Sum</span>
              <span className="text-xl font-bold text-slate-900">{courseStats.classTotalSum}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Calculated Mean Average</span>
              <span className="text-xl font-bold text-sky-700">{courseStats.classAverage} / 100</span>
            </div>
            <div>
              <span className="text-slate-500 block">Course Pass Rate</span>
              <span className="text-xl font-bold text-emerald-700">{courseStats.passRate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Ciphertext Inspector Modal */}
      <CipherInspectorModal
        isOpen={!!selectedResultForInspect}
        onClose={() => setSelectedResultForInspect(null)}
        result={selectedResultForInspect}
      />

      {/* Bulk Score Upload Modal */}
      <BulkUploadModal
        isOpen={scoreUploadOpen}
        onClose={() => setScoreUploadOpen(false)}
        title="Bulk Upload Scores"
        description={`Upload CA and Exam scores for ${allocations.find((a) => a.course_id === selectedCourseId)?.course?.course_code || 'selected course'}`}
        columns={scoreUploadColumns}
        templateHeaders={['matric_number', 'ca', 'exam']}
        onUpload={handleBulkScoreUpload}
      />
    </div>
  );
}
