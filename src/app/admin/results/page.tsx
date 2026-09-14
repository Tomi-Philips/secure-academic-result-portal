'use client';

import React, { useEffect, useState } from 'react';
import { AcademicResult } from '@/lib/types';
import { CipherBadge } from '@/components/ui/CipherBadge';
import { CipherInspectorModal } from '@/components/ui/CipherInspectorModal';
import {
  FileSpreadsheet,
  ShieldCheck,
  Binary,
  Search,
  CheckCircle2,
  RefreshCw,
  Eye,
  KeyRound,
  Filter,
} from 'lucide-react';
import { truncateCipher, getGradeColor } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminResultsPage() {
  const { currentUser } = useAuth();
  const [results, setResults] = useState<AcademicResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResultForInspect, setSelectedResultForInspect] = useState<AcademicResult | null>(null);
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/results');
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (err) {
      console.error('Failed to load academic results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleApprove = async (resultId: string) => {
    try {
      setIsApprovingId(resultId);
      const res = await fetch('/api/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          resultId,
          approverUserId: currentUser?.id || 'u1',
          approverName: currentUser?.name || 'Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchResults();
      } else {
        alert(`Approval Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsApprovingId(null);
    }
  };

  const filteredResults = results.filter((r) => {
    const studentName = r.student?.user?.name || '';
    const matric = r.student?.matric_number || '';
    const courseCode = r.course?.course_code || '';
    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matric.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courseCode.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && r.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Results & Cryptographic Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Master records ledger with encrypted CA/Exam ciphertexts and authorized secret-key decryption approvals
          </p>
        </div>
        <button
          onClick={fetchResults}
          disabled={loading}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student, matric no, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="all">All Result States</option>
            <option value="submitted">Submitted (Encrypted)</option>
            <option value="approved">Approved & Decrypted</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
            <span>Loading academic ledger...</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No academic results match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left academic-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Encrypted CA</th>
                  <th>Encrypted Exam</th>
                  <th>Homomorphic Total</th>
                  <th>Status</th>
                  <th>Decrypted Grade</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-semibold text-slate-900">
                        {r.student?.user?.name || 'Unknown Student'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {r.student?.matric_number || r.student_id}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900">{r.course?.course_code}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                        {r.course?.course_title}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        {truncateCipher(r.encrypted_ca_score, 6, 4)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        {truncateCipher(r.encrypted_exam_score, 6, 4)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[11px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                        {truncateCipher(r.encrypted_total_score, 6, 4)}
                      </span>
                    </td>
                    <td>
                      <CipherBadge status={r.status} />
                    </td>
                    <td>
                      {r.status === 'approved' && r.decrypted_total_score !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold text-xs px-2 py-0.5 rounded border ${getGradeColor(
                              r.grade
                            )}`}
                          >
                            {r.grade} ({r.decrypted_total_score})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Encrypted</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedResultForInspect(r)}
                          title="Inspect raw BFV ciphertexts"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Inspect</span>
                        </button>

                        {r.status === 'submitted' && (
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={isApprovingId === r.id}
                            title="Authorized Secret Key Decryption and Final Grade Approval"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded text-[11px] font-medium flex items-center gap-1 shadow-xs transition-colors"
                          >
                            {isApprovingId === r.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5" />
                            )}
                            <span>Decrypt & Approve</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ciphertext Inspector Modal */}
      <CipherInspectorModal
        isOpen={!!selectedResultForInspect}
        onClose={() => setSelectedResultForInspect(null)}
        result={selectedResultForInspect}
      />
    </div>
  );
}
