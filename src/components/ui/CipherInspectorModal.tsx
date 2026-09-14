import React from 'react';
import { X, Shield, Binary, Copy, Check } from 'lucide-react';
import { AcademicResult } from '@/lib/types';

interface CipherInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AcademicResult | null;
}

export function CipherInspectorModal({ isOpen, onClose, result }: CipherInspectorModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!isOpen || !result) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-800 text-sky-300 rounded-md">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Cryptographic Ciphertext Inspector</h3>
              <p className="text-xs text-slate-500">Microsoft SEAL BFV Scheme (128-bit Security)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Metadata banner */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div>
              <span className="text-slate-500 block">Student</span>
              <span className="font-semibold text-slate-900">
                {result.student?.user?.name || result.student?.matric_number || result.student_id}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Course Code</span>
              <span className="font-semibold text-slate-900">
                {result.course?.course_code || result.course_id}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Encryption Scheme</span>
              <span className="font-mono font-medium text-sky-700">SEAL-BFV-4096</span>
            </div>
          </div>

          {/* CA Ciphertext */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700 tracking-wider">
                1. Encrypted Continuous Assessment (CA) Ciphertext
              </label>
              {result.encrypted_ca_score && (
                <button
                  onClick={() => copyToClipboard(result.encrypted_ca_score!, 'ca')}
                  className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  {copiedField === 'ca' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'ca' ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="ciphertext-display max-h-24 overflow-y-auto">
              {result.encrypted_ca_score || 'No CA ciphertext generated'}
            </div>
          </div>

          {/* Exam Ciphertext */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700 tracking-wider">
                2. Encrypted Examination Score Ciphertext
              </label>
              {result.encrypted_exam_score && (
                <button
                  onClick={() => copyToClipboard(result.encrypted_exam_score!, 'exam')}
                  className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  {copiedField === 'exam' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'exam' ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="ciphertext-display max-h-24 overflow-y-auto">
              {result.encrypted_exam_score || 'No Exam ciphertext generated'}
            </div>
          </div>

          {/* Homomorphic Total Ciphertext */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                3. Homomorphic Evaluated Total Ciphertext: $E(Total) = E(CA) \oplus E(Exam)$
              </label>
              {result.encrypted_total_score && (
                <button
                  onClick={() => copyToClipboard(result.encrypted_total_score!, 'total')}
                  className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  {copiedField === 'total' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'total' ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="ciphertext-display max-h-24 overflow-y-auto">
              {result.encrypted_total_score || 'No Total ciphertext evaluated'}
            </div>
          </div>

          {/* Decrypted summary (if authorized/approved) */}
          {result.status === 'approved' && result.decrypted_total_score !== undefined && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 block font-medium">Authorized Decrypted Value</span>
                <span className="text-base font-bold text-emerald-950">
                  CA: {result.decrypted_ca_score} | Exam: {result.decrypted_exam_score} | Total:{' '}
                  {result.decrypted_total_score} (Grade {result.grade})
                </span>
              </div>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded">
                Verified Match
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
