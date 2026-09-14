import { db } from '@/lib/database/db';
import {
  encryptAcademicScore,
  homomorphicAddScores,
  homomorphicSumScores,
  decryptAcademicScore,
  calculateAcademicGrade,
} from '@/lib/crypto/seal';
import { AcademicResult, Semester } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase/supabase-admin';
import { z } from 'zod';

export const ScoreInputSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  academicSession: z.string().default('2025/2026'),
  semester: z.enum(['First', 'Second']).default('First'),
  caScore: z.number().min(0, 'CA Score cannot be negative').max(30, 'CA Score maximum is 30'),
  examScore: z.number().min(0, 'Exam Score cannot be negative').max(70, 'Exam Score maximum is 70'),
});

export async function submitAcademicScores(input: {
  studentId: string;
  courseId: string;
  academicSession: string;
  semester: Semester;
  caScore: number;
  examScore: number;
  submittedByLecturerId: string;
  lecturerName?: string;
}) {
  // 1. Validate Input — flatten Zod issues into one readable message
  const parsed = ScoreInputSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid score input — ${issues}`);
  }
  const validated = parsed.data;

  // 2. Perform Real Homomorphic BFV Encryption
  // Encrypt CA Score
  const encCA = await encryptAcademicScore(validated.caScore);
  // Encrypt Exam Score
  const encExam = await encryptAcademicScore(validated.examScore);

  // 3. Perform Homomorphic Addition on Ciphertexts:
  // E(Total) = Evaluator.add(E(CA), E(Exam))
  const homomorphicTotal = await homomorphicAddScores(encCA.ciphertext, encExam.ciphertext);

  // 4. Create / Update Record with Ciphertexts (Plaintexts are NOT stored in the database record)
  // `results.id` is a UUID PK with a DB default — omit it so Postgres generates one.
  // `submitted_by` FK references lecturers(id); the client sends the user-profile id,
  // so resolve the matching lecturer row (user_id, row id, or staff number) in JS.
  const { data: allLecturers } = await supabaseAdmin.from('lecturers').select('id, user_id, staff_number');
  const submittedById = input.submittedByLecturerId?.trim().toLowerCase();
  const lecturerRow = (allLecturers as any[] | null)?.find(
    (l) =>
      submittedById &&
      (l.user_id.toLowerCase() === submittedById ||
        l.id.toLowerCase() === submittedById ||
        l.staff_number.toLowerCase() === submittedById)
  );

  const resultRecord: Omit<AcademicResult, 'id'> & { id?: string } = {
    student_id: validated.studentId,
    course_id: validated.courseId,
    academic_session: validated.academicSession,
    semester: validated.semester,
    encrypted_ca_score: encCA.ciphertext,
    encrypted_exam_score: encExam.ciphertext,
    encrypted_total_score: homomorphicTotal.ciphertext,
    status: 'submitted',
    submitted_by: lecturerRow?.id,
    encryption_scheme: 'SEAL-BFV-128',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const savedResult = await db.saveResult(resultRecord);

  // 5. Audit Logging
  await db.addAuditLog({
    action: 'HOMOMORPHIC_SCORES_ENCRYPTED_AND_EVALUATED',
    entity_type: 'result',
    entity_id: savedResult.id,
    user_name: input.lecturerName || 'Lecturer',
    details: {
      student_id: validated.studentId,
      course_id: validated.courseId,
      ca_encryption_time_ms: encCA.durationMs,
      exam_encryption_time_ms: encExam.durationMs,
      homomorphic_add_time_ms: homomorphicTotal.durationMs,
      noise_budget_bits: homomorphicTotal.noiseBudgetBits,
    },
  });

  return {
    success: true,
    result: savedResult,
    metrics: {
      caDurationMs: encCA.durationMs,
      examDurationMs: encExam.durationMs,
      homomorphicAddDurationMs: homomorphicTotal.durationMs,
      noiseBudgetBits: homomorphicTotal.noiseBudgetBits,
    },
  };
}

export async function decryptAndApproveResult(resultId: string, approverUserId: string, approverName = 'Admin') {
  const allResults = await db.getResults();
  const target = allResults.find((r) => r.id === resultId);

  if (!target) {
    throw new Error(`Result record with ID ${resultId} not found`);
  }

  if (!target.encrypted_total_score || !target.encrypted_ca_score || !target.encrypted_exam_score) {
    throw new Error('Incomplete cryptographic ciphertexts on academic result record');
  }

  // 1. Authorized Secret Key Decryption
  const decryptedTotal = await decryptAcademicScore(target.encrypted_total_score);
  const decryptedCA = await decryptAcademicScore(target.encrypted_ca_score);
  const decryptedExam = await decryptAcademicScore(target.encrypted_exam_score);

  // 2. Grade calculation based on decrypted total
  const { grade, gradePoint } = calculateAcademicGrade(decryptedTotal.value);

  // 3. Update Result Record
  const updatedResult: AcademicResult = {
    ...target,
    decrypted_ca_score: decryptedCA.value,
    decrypted_exam_score: decryptedExam.value,
    decrypted_total_score: decryptedTotal.value,
    grade,
    grade_point: gradePoint,
    status: 'approved',
    approved_by: approverUserId,
    updated_at: new Date().toISOString(),
  };

  await db.saveResult(updatedResult);

  // 4. Audit Log
  await db.addAuditLog({
    action: 'RESULT_AUTHORIZED_DECRYPTION_AND_APPROVAL',
    entity_type: 'result',
    entity_id: resultId,
    user_name: approverName,
    details: {
      decrypted_total: decryptedTotal.value,
      grade,
      decryption_time_ms: decryptedTotal.durationMs,
    },
  });

  return {
    success: true,
    result: updatedResult,
    decryptionDurationMs: decryptedTotal.durationMs,
  };
}

export async function computeHomomorphicCourseStatistics(courseId: string, session = '2025/2026') {
  const allResults = await db.getResults();
  const results = allResults.filter(
    (r) => r.course_id === courseId && r.academic_session === session && r.encrypted_total_score
  );

  if (results.length === 0) {
    return {
      count: 0,
      classAverage: 0,
      passRate: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
    };
  }

  // 1. Homomorphically sum all encrypted total score ciphertexts
  const ciphertexts = results.map((r) => r.encrypted_total_score!);
  const homomorphicSumResult = await homomorphicSumScores(ciphertexts);

  // 2. Decrypt only the aggregated class total
  const decryptedSum = await decryptAcademicScore(homomorphicSumResult.resultCiphertext);
  const classAverage = Number((decryptedSum.value / results.length).toFixed(1));

  // Compute grade distributions for approved results
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  let passCount = 0;

  for (const res of results) {
    if (res.grade && res.grade in gradeDistribution) {
      gradeDistribution[res.grade as keyof typeof gradeDistribution]++;
      if (res.grade !== 'F') passCount++;
    }
  }

  const passRate = results.length > 0 ? Number(((passCount / results.length) * 100).toFixed(1)) : 0;

  return {
    count: results.length,
    homomorphicSumDurationMs: homomorphicSumResult.durationMs,
    noiseBudgetBits: homomorphicSumResult.noiseBudgetBits,
    classTotalSum: decryptedSum.value,
    classAverage,
    passRate,
    gradeDistribution,
  };
}
