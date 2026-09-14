import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score?: number): string {
  if (score === undefined || score === null) return '—';
  return score.toFixed(1).replace(/\.0$/, '');
}

export function truncateCipher(cipher?: string, headLen = 12, tailLen = 8): string {
  if (!cipher) return 'None';
  if (cipher.length <= headLen + tailLen) return cipher;
  return `${cipher.slice(0, headLen)}...${cipher.slice(-tailLen)}`;
}

export function getGradeColor(grade?: string): string {
  switch (grade) {
    case 'A': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'B': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'C': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'D': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'E': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'F': return 'text-rose-700 bg-rose-50 border-rose-200';
    default: return 'text-slate-600 bg-slate-100 border-slate-200';
  }
}
