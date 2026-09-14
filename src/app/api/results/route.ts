import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import {
  submitAcademicScores,
  decryptAndApproveResult,
  computeHomomorphicCourseStatistics,
} from '@/lib/services/result-service';
import { decryptAcademicScore } from '@/lib/crypto/seal';

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
      const student = await db.getStudentByIdentifier(studentId);
      const targetId = student ? student.id : studentId;
      results = results.filter((r) => r.student_id === targetId);
    }

    // Decrypt approved scores on the fly so UI displays real CA, Exam, Total numbers
    results = await Promise.all(
      results.map(async (r) => {
        if (r.status === 'approved' && (r.decrypted_total_score === undefined || r.decrypted_total_score === null)) {
          try {
            const [ca, exam, total] = await Promise.all([
              r.encrypted_ca_score ? decryptAcademicScore(r.encrypted_ca_score) : null,
              r.encrypted_exam_score ? decryptAcademicScore(r.encrypted_exam_score) : null,
              r.encrypted_total_score ? decryptAcademicScore(r.encrypted_total_score) : null,
            ]);
            return {
              ...r,
              decrypted_ca_score: ca?.value,
              decrypted_exam_score: exam?.value,
              decrypted_total_score: total?.value,
            };
          } catch (decErr) {
            console.error('Decryption on result fetch failed:', decErr);
            return r;
          }
        }
        return r;
      })
    );

    // Role-based masking for students:
    // Approved results reveal scores and grades; pending results show status only
    if (role === 'student') {
      results = results.map((r) => {
        if (r.status !== 'approved') {
          return {
            ...r,
            decrypted_ca_score: undefined,
            decrypted_exam_score: undefined,
            decrypted_total_score: undefined,
            grade: undefined,
            grade_point: undefined,
          };
        }
        return r;
      });
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
