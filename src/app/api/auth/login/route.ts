import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { UserProfile, UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, roleHint } = body;

    if (!identifier) {
      return NextResponse.json({ error: 'Credential identifier is required' }, { status: 400 });
    }

    const cleanIdentifier = String(identifier).trim();

    // Look up user in Supabase database
    const matched = await db.findUserByCredential(cleanIdentifier);
    const userRole: UserRole =
      matched.roleHint ||
      roleHint ||
      (cleanIdentifier.toLowerCase().includes('admin')
        ? 'admin'
        : cleanIdentifier.toLowerCase().includes('lecturer') ||
          cleanIdentifier.toLowerCase().includes('adeyemi') ||
          cleanIdentifier.toLowerCase().includes('dr') ||
          cleanIdentifier.toUpperCase().startsWith('STF') ||
          cleanIdentifier.toUpperCase().startsWith('PPS') ||
          cleanIdentifier.toUpperCase().startsWith('PSS')
        ? 'lecturer'
        : 'student');

    const userProfile: UserProfile = matched.user || {
      id: `u-${Date.now()}`,
      name: cleanIdentifier.includes('@')
        ? cleanIdentifier.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        : `${userRole === 'lecturer' ? 'Lecturer' : 'Student'} (${cleanIdentifier})`,
      email: cleanIdentifier.includes('@')
        ? cleanIdentifier
        : `${cleanIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@${userRole === 'student' ? 'student.' : ''}institution.edu.ng`,
      role: userRole,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}
