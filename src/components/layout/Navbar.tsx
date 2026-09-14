'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Shield, User, LogOut, Cpu, School, LogIn, Database } from 'lucide-react';

export function Navbar() {
  const { currentUser, role, logout, isSupabaseConnected } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-sky-100 text-sky-600 border border-sky-200 rounded-lg group-hover:bg-sky-200 transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-sm sm:text-base text-slate-900 tracking-tight block leading-tight">
                Secure Academic DBMS
              </span>
              <span className="text-[11px] text-sky-600 font-mono block leading-none">
                Homomorphic Encryption Engine
              </span>
            </div>
          </Link>

          {/* Database Connection Badge */}
          <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            <span>DB: <strong className="text-slate-900 font-medium">{isSupabaseConnected ? 'Supabase' : 'Local'}</strong></span>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-3">
          {/* Defense & Security Lab Shortcut */}
          <Link
            href="/security-demo"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-md text-xs font-medium transition-colors"
          >
            <Cpu className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">Defense Cryptographic Lab</span>
            <span className="sm:hidden">Crypto Lab</span>
          </Link>

          {/* Authentication State */}
          {currentUser ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-700">{currentUser.name}</div>
                <div className="text-[10px] text-sky-600 font-mono capitalize">
                  {currentUser.role} Portal
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Portal Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
