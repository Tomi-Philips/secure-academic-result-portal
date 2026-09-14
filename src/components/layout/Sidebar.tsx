'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  FileSpreadsheet,
  ShieldCheck,
  History,
  Binary,
  Settings,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();

  const adminLinks = [
    { label: 'System Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Academic & Courses', href: '/admin/academic', icon: BookOpen },
    { label: 'Lecturers & Students', href: '/admin/users', icon: Users },
    { label: 'Results Ledger', href: '/admin/results', icon: FileSpreadsheet },
    { label: 'Security & Audit Logs', href: '/admin/audit', icon: History },
  ];

  const lecturerLinks = [
    { label: 'Lecturer Dashboard', href: '/lecturer/dashboard', icon: LayoutDashboard },
    { label: 'Assigned Courses', href: '/lecturer/courses', icon: BookOpen },
    { label: 'Score Entry & Encryption', href: '/lecturer/scores', icon: Binary },
  ];

  const studentLinks = [
    { label: 'Student Portal', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Registered Courses', href: '/student/courses', icon: BookOpen },
    { label: 'My Academic Results', href: '/student/results', icon: GraduationCap },
  ];

  const commonLinks = [
    { label: 'Cryptographic Defense Lab', href: '/security-demo', icon: ShieldCheck },
  ];

  let currentRoleLinks = adminLinks;
  if (role === 'lecturer') currentRoleLinks = lecturerLinks;
  if (role === 'student') currentRoleLinks = studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {role ? `${role} Portal` : 'Navigation'}
          </div>
          <nav className="space-y-1">
            {currentRoleLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Research Lab
          </div>
          <nav className="space-y-1">
            {commonLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 border border-sky-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-sky-600" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer info in sidebar */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
        <div className="font-semibold text-slate-700">Microsoft SEAL Engine</div>
        <div>BFV 128-bit Post-Quantum</div>
      </div>
    </aside>
  );
}
