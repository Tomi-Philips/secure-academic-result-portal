import React from 'react';
import { Lock, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { ResultStatus } from '@/lib/types';

interface CipherBadgeProps {
  status?: ResultStatus | 'encrypted' | 'verified';
  className?: string;
}

export function CipherBadge({ status, className = '' }: CipherBadgeProps) {
  if (status === 'approved' || status === 'verified') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Decrypted & Verified
      </span>
    );
  }

  if (status === 'submitted' || status === 'encrypted') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-sky-50 text-sky-700 border border-sky-200 ${className}`}
      >
        <Lock className="w-3.5 h-3.5 text-sky-600" />
        BFV Encrypted
      </span>
    );
  }

  if (status === 'processing') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
        Processing Ciphertext
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
    >
      <Clock className="w-3.5 h-3.5 text-slate-500" />
      Pending Submission
    </span>
  );
}
