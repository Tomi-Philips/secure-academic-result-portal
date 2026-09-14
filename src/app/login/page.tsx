'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Shield, Lock, Mail, ArrowRight, UserCheck, AlertCircle, Database, CheckCircle2 } from 'lucide-react';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const { login, isSupabaseConnected } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your institutional email address');
      return;
    }
    setError(null);
    setLoading(true);

    const result = await login(email, password, role);
    if (!result.success) {
      setError(result.error || 'Authentication failed');
    }
    setLoading(false);
  };

  const handleQuickLogin = async (demoEmail: string, demoRole: UserRole) => {
    setEmail(demoEmail);
    setRole(demoRole);
    setLoading(true);
    setError(null);
    const result = await login(demoEmail, 'password123', demoRole);
    if (!result.success) {
      setError(result.error || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-white text-slate-900">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-sky-100 text-sky-600 border border-sky-200 rounded-xl mb-1">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional Portal Login
          </h1>
          <p className="text-xs text-slate-500">
            Homomorphic Encryption Academic DBMS Access
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
          isSupabaseConnected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-600" />
            <span>Database Backend:</span>
          </div>
          <span className="font-medium font-mono text-[11px]">
            {isSupabaseConnected ? 'Supabase Live' : 'Local Dynamic'}
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 font-medium uppercase tracking-wider mb-1.5 text-[11px]">
              Access Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'lecturer', 'student'] as UserRole[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-2 px-2.5 rounded-lg border capitalize font-medium transition-all ${
                    role === r
                      ? 'bg-sky-600 border-sky-500 text-white shadow-xs'
                      : 'bg-white border-slate-300 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-medium uppercase tracking-wider mb-1.5 text-[11px]">
              Institutional Email / Matric No / Staff ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. CSC/2022/1042, STF/CSC/042, or name@institution.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-600 font-medium uppercase tracking-wider text-[11px]">
                Password
              </label>
              <span className="text-[10px] text-sky-600 font-mono">Default: password123</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-slate-200 space-y-2.5">
          <div className="text-[11px] text-slate-400 font-medium text-center uppercase tracking-wider">
            Quick Persona Sign In
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@institution.edu.ng', 'admin')}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-[11px] text-slate-600 hover:text-slate-900 transition-colors text-center"
            >
              <div className="font-semibold">Admin</div>
              <div className="text-[9px] text-slate-400 truncate">Prof. Okafor</div>
            </button>

            <button
              onClick={() => handleQuickLogin('adeyemi.f@institution.edu.ng', 'lecturer')}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-[11px] text-slate-600 hover:text-slate-900 transition-colors text-center"
            >
              <div className="font-semibold">Lecturer</div>
              <div className="text-[9px] text-slate-400 truncate">Dr. Adeyemi</div>
            </button>

            <button
              onClick={() => handleQuickLogin('alabi.bj@student.institution.edu.ng', 'student')}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-[11px] text-slate-600 hover:text-slate-900 transition-colors text-center"
            >
              <div className="font-semibold">Student</div>
              <div className="text-[9px] text-slate-400 truncate">Bolanle Alabi</div>
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          New accounts are created by the system administrator.
        </div>
      </div>
    </div>
  );
}
