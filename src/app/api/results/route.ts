import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import {
  submitAcademicScores,
  decryptAndApproveResult,
  computeHomomorphicCourseStatistics,
} from '@/lib/services/result-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');
    const role = searchParams.get('role');

    let results = await db.getResults();

    if (courseId) {
      results = results.filter((r) => r.course_id === courseId);
    }

    if (studentId) {
      results = results.filter((r) => r.student_id === studentId);
    }

    // Role-based filtering / masking if needed
    if (role === 'student') {
      // Students only see approved results
      results = results.filter((r) => r.status === 'approved');
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await submitAcademicScores(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Submission failed' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, resultId, approverUserId, approverName, courseId, session } = body;

    if (action === 'approve') {
      const outcome = await decryptAndApproveResult(resultId, approverUserId, approverName);
      return NextResponse.json(outcome);
    }

    if (action === 'stats') {
      const stats = await computeHomomorphicCourseStatistics(courseId, session);
      return NextResponse.json({ success: true, stats });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}
