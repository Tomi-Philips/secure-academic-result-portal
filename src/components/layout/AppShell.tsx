'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import { ShieldAlert, LogIn, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, role, isLoading } = useAuth();
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/security-demo';

  if (isPublicPage) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            <span>Verifying institutional session...</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated on a protected route
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-lg space-y-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Authentication Required</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              You must be signed in with an authorized institutional profile to access academic management portals and encrypted data.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Sign In Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Portal Frame
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}
