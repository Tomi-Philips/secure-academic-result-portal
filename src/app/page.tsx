'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Shield,
  Binary,
  Cpu,
  ArrowRight,
  UserCheck,
  Server,
  LogIn,
  Database,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export default function LandingPage() {
  const { currentUser, isSupabaseConnected } = useAuth();

  return (
    <div className="flex flex-col bg-white text-slate-900 min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 md:py-24 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-200 text-sky-700 text-xs font-mono mb-6">
          <Binary className="w-3.5 h-3.5 text-sky-500" />
          <span>Microsoft SEAL BFV Homomorphic Encryption Engine</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          Homomorphic Encryption-Based Tertiary Institution Database Management System
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          A secure academic information system demonstrating how Continuous Assessment and Examination scores remain{' '}
          <strong className="text-slate-900">protected during both storage and computation</strong>, enabling legitimate grade evaluation and averages without intermediate plaintext exposure.
        </p>

        {/* Primary Call to Actions */}
        <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
          <Link
            href="/security-demo"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-lg shadow-sky-900/20 transition-colors"
          >
            <Cpu className="w-4 h-4" />
            Launch Cryptographic Defense Lab
          </Link>

          {currentUser ? (
            <Link
              href={
                currentUser.role === 'admin'
                  ? '/admin/dashboard'
                  : currentUser.role === 'lecturer'
                  ? '/lecturer/dashboard'
                  : '/student/dashboard'
              }          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold transition-colors shadow-xs"
          >
              <span>Go to {currentUser.role} Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          ) : (
            <Link
              href="/login"              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold transition-colors shadow-xs"
          >
              <LogIn className="w-4 h-4 text-sky-600" />
              <span>Portal Sign In</span>
            </Link>
          )}
        </div>
      </section>

      {/* Supabase Connection Setup Guide Card (if not yet configured) */}
      {!isSupabaseConnected && (
        <section className="px-4 sm:px-6 lg:px-8 pb-8 max-w-4xl mx-auto w-full">
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-5 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-sky-100 text-sky-600 rounded-md shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Supabase PostgreSQL Connection:</span>
                <span className="text-slate-600">
                  Currently operating in local dynamic mode. To connect live Supabase PostgreSQL, add <code className="text-sky-700 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-sky-700 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your <code className="text-slate-800">.env.local</code>. Schema script is ready in <code className="text-slate-800">supabase/schema.sql</code>.
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cryptographic Architecture Workflow */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 max-w-6xl mx-auto w-full border-t border-slate-200">
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cryptographic Architecture Workflow</h2>
          <p className="text-xs text-slate-500 mt-1">Homomorphic computation over ciphertext vs. traditional decrypt-and-compute</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Traditional Workflow */}
          <div className="bg-white border border-rose-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Conventional DBMS Architecture (Vulnerable In-Memory)
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700">
                1. Plaintext Input: CA (28), Exam (63)
              </div>
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded text-rose-700">
                2. Server Decrypts into Memory to compute: 28 + 63
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700">
                3. Total (91) written to database in plaintext
              </div>
              <div className="text-[11px] text-rose-600 font-sans mt-2">
                Risk: Memory dumps, malicious DBAs, and compromised APIs can expose raw academic results.
              </div>
            </div>
          </div>

          {/* Homomorphic Workflow */}
          <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Proposed Homomorphic Architecture (Zero Plaintext Exposure)
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700">
                1. BFV Encryption: $E(CA)$ and $E(Exam)$ generated
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded text-emerald-700">
                2. Homomorphic Addition: $E(Total) = Evaluator.add(E(CA), E(Exam))$
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700">
                3. Ciphertext stored; authorized Secret Key decrypts only on verified demand
              </div>
              <div className="text-[11px] text-emerald-600 font-sans mt-2">
                Advantage: Database and memory hold only encrypted polynomials. Plaintext is never exposed during arithmetic.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Academic Research Project &copy; 2026. Microsoft SEAL BFV Homomorphic DBMS.
      </footer>
    </div>
  );
}
