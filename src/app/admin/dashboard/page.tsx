'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import {
  Users,
  GraduationCap,
  BookOpen,
  Lock,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';
import { AuditLog } from '@/lib/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    totalCourses: 0,
    activeSession: '2025/2026',
    encryptedRecordsCount: 0,
    approvedCount: 0,
    submittedCount: 0,
  });
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/academic?type=overview');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setActivities(data.recentActivity || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Administration Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            System overview and cryptographic processing metrics for Academic Session{' '}
            <strong className="text-slate-700">{stats.activeSession}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/results"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Master Results Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Enrolled in active programmes"
          icon={GraduationCap}
        />
        <StatCard
          title="Academic Lecturers"
          value={stats.totalLecturers}
          subtitle="Assigned to course allocations"
          icon={Users}
        />
        <StatCard
          title="Accredited Courses"
          value={stats.totalCourses}
          subtitle="First & Second Semesters"
          icon={BookOpen}
        />
        <StatCard
          title="Encrypted Records"
          value={stats.encryptedRecordsCount}
          subtitle="Protected via Microsoft SEAL BFV"
          icon={Lock}
          badge="BFV 128-bit"
          badgeType="accent"
        />
      </div>

      {/* Processing Status Sub-grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Results Processing Pipeline Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Academic Result Status Breakdown
            </h2>
            <Link
              href="/admin/results"
              className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-sky-50 border border-sky-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sky-800">Submitted / Encrypted</span>
                <Clock className="w-4 h-4 text-sky-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-sky-950">{stats.submittedCount}</div>
              <p className="mt-1 text-[11px] text-sky-700">Awaiting authorized approval</p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-800">Approved & Decrypted</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-950">{stats.approvedCount}</div>
              <p className="mt-1 text-[11px] text-emerald-700">Released to student transcripts</p>
            </div>
          </div>
        </div>

        {/* Cryptographic Engine Health Card */}
        <div className="bg-slate-800 text-slate-100 rounded-xl p-6 border border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Cryptographic Engine State
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700">
                Active & Verified
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-700">
                <span className="text-slate-400">HE Scheme:</span>
                <span className="text-white">Brakerski-Fan-Vercauteren (BFV)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700">
                <span className="text-slate-400">Security Standard:</span>
                <span className="text-white">128-bit Post-Quantum (HE-standard)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700">
                <span className="text-slate-400">Polynomial Modulus:</span>
                <span className="text-white">4096 coefficients</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Plaintext Modulus:</span>
                <span className="text-white">40961 (SIMD Batching)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center text-xs">
            <span className="text-slate-400">WASM Runtime: node-seal v5.x</span>
            <Link href="/security-demo" className="text-sky-400 hover:text-sky-300 font-medium">
              Open Crypto Sandbox &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Cryptographic Activities & Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Cryptographic Operations & Audit Logs
            </h2>
          </div>
          <Link
            href="/admin/audit"
            className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
          >
            View Full Audit Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No recent cryptographic activities recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {activities.slice(0, 5).map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 font-mono text-[11px]">
                    {log.action}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Initiator: {log.user_name || 'System Process'} | Entity: {log.entity_type}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(log.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
