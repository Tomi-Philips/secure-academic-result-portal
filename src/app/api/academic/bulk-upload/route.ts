import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';

interface BulkUploadRequest {
  type: 'students' | 'lecturers' | 'scores';
  rows: Record<string, any>[];
  // For scores: need course context
  courseId?: string;
  academicSession?: string;
  semester?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: BulkUploadRequest = await req.json();
    const { type, rows, courseId, academicSession, semester } = body;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    let successCount = 0;
    const errors: string[] = [];

    if (type === 'students') {
      const departments = await db.getDepartments();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const name = String(row.name || '').trim();
          const matric_number = String(row.matric_number || row.matric || '').trim();
          const department_code = String(row.department_code || row.dept || '').trim();
          const level = Number(row.level) || 400;

          if (!name || !matric_number) {
            errors.push(`Row ${i + 1}: Missing name or matric number`);
            continue;
          }

          // Find department by code
          const dept = departments.find(
            (d) => d.code.toUpperCase() === department_code.toUpperCase()
          );
          if (!dept) {
            errors.push(`Row ${i + 1}: Department "${department_code}" not found`);
            continue;
          }

          // Check for duplicate matric
          const allStudents = await db.getStudents();
          const existing = allStudents.find(
            (s) => s.matric_number.toUpperCase() === matric_number.toUpperCase()
          );
          if (existing) {
            errors.push(`Row ${i + 1}: Matric number "${matric_number}" already exists`);
            continue;
          }

          await db.addStudent(
            name,
            `${matric_number.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.institution.edu.ng`,
            matric_number,
            dept.id,
            level
          );

          await db.addAuditLog({
            action: 'STUDENT_REGISTERED',
            entity_type: 'student',
            details: { name, matric_number, source: 'bulk_upload' },
          });

          successCount++;
        } catch (err: any) {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }
    } else if (type === 'lecturers') {
      const departments = await db.getDepartments();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const name = String(row.name || '').trim();
          const staff_number = String(row.staff_number || row.staff_no || '').trim();
          const department_code = String(row.department_code || row.dept || '').trim();

          if (!name || !staff_number) {
            errors.push(`Row ${i + 1}: Missing name or staff number`);
            continue;
          }

          // Find department by code
          const dept = departments.find(
            (d) => d.code.toUpperCase() === department_code.toUpperCase()
          );
          if (!dept) {
            errors.push(`Row ${i + 1}: Department "${department_code}" not found`);
            continue;
          }

          // Check for duplicate staff number
          const allLecturers = await db.getLecturers();
          const existing = allLecturers.find(
            (l) => l.staff_number.toUpperCase() === staff_number.toUpperCase()
          );
          if (existing) {
            errors.push(`Row ${i + 1}: Staff number "${staff_number}" already exists`);
            continue;
          }

          const cleanEmail = `${name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '.')}@institution.edu.ng`;

          await db.addLecturer(name, cleanEmail, staff_number, dept.id);

          await db.addAuditLog({
            action: 'LECTURER_APPOINTED',
            entity_type: 'lecturer',
            details: { name, staff_number, source: 'bulk_upload' },
          });

          successCount++;
        } catch (err: any) {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }
    } else if (type === 'scores') {
      if (!courseId) {
        return NextResponse.json({ error: 'courseId is required for score uploads' }, { status: 400 });
      }

      const activeSession = await db.getActiveSession();
      const session = academicSession || activeSession?.name || '2025/2026';
      const sem = semester || 'First';

      const allStudents = await db.getStudents();
      const allCourses = await db.getCourses();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const matric_number = String(row.matric_number || row.matric || '').trim();
          const ca = Number(row.ca);
          const exam = Number(row.exam);

          if (!matric_number) {
            errors.push(`Row ${i + 1}: Missing matric number`);
            continue;
          }
          if (isNaN(ca) || ca < 0 || ca > 30) {
            errors.push(`Row ${i + 1}: CA score must be 0-30`);
            continue;
          }
          if (isNaN(exam) || exam < 0 || exam > 70) {
            errors.push(`Row ${i + 1}: Exam score must be 0-70`);
            continue;
          }

          // Find student by matric
          const student = allStudents.find(
            (s) => s.matric_number.toUpperCase() === matric_number.toUpperCase()
          );
          if (!student) {
            errors.push(`Row ${i + 1}: Student with matric "${matric_number}" not found`);
            continue;
          }

          // Check course exists
          const course = allCourses.find((c) => c.id === courseId);
          if (!course) {
            errors.push(`Row ${i + 1}: Course not found`);
            continue;
          }

          // Calculate grade
          const totalScore = ca + exam;
          let grade = 'F';
          let gradePoint = 0;
          if (totalScore >= 70) { grade = 'A'; gradePoint = 5; }
          else if (totalScore >= 60) { grade = 'B'; gradePoint = 4; }
          else if (totalScore >= 50) { grade = 'C'; gradePoint = 3; }
          else if (totalScore >= 45) { grade = 'D'; gradePoint = 2; }
          else if (totalScore >= 40) { grade = 'E'; gradePoint = 1; }

          // Omit `id` — results.id is a UUID PK with a DB default.
          await db.saveResult({
            student_id: student.id,
            course_id: courseId,
            academic_session: session,
            semester: sem as any,
            decrypted_ca_score: ca,
            decrypted_exam_score: exam,
            decrypted_total_score: totalScore,
            grade,
            grade_point: gradePoint,
            status: 'submitted',
            encryption_scheme: 'SEAL-BFV-128',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          await db.addAuditLog({
            action: 'SCORES_BULK_UPLOADED',
            entity_type: 'result',
            details: { matric_number, ca, exam, total: totalScore, courseId, source: 'bulk_upload' },
          });

          successCount++;
        } catch (err: any) {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result: { success: successCount, errors },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
