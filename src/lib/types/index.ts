export type UserRole = 'admin' | 'lecturer' | 'student';
export type ResultStatus = 'draft' | 'submitted' | 'processing' | 'processed' | 'approved';
export type Semester = 'First' | 'Second';

export interface UserProfile {
  id: string;
  auth_user_id?: string;
  role: UserRole;
  name: string;
  email: string;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface Faculty {
  id: string;
  name: string;
  code: string;
  created_at: string;
  // Joins
  departments?: Department[];
}

export interface Department {
  id: string;
  faculty_id: string;
  name: string;
  code: string;
  created_at: string;
  // Joins
  faculty?: Faculty;
}

export interface Programme {
  id: string;
  department_id: string;
  name: string;
  code: string;
  duration_years: number;
  created_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  matric_number: string;
  department_id: string;
  programme_id: string;
  level: number;
  created_at: string;
  // Joins
  user?: UserProfile;
  department?: Department;
  programme?: Programme;
}

export interface Lecturer {
  id: string;
  user_id: string;
  staff_number: string;
  department_id: string;
  created_at: string;
  // Joins
  user?: UserProfile;
  department?: Department;
}

export interface AcademicSession {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  course_code: string;
  course_title: string;
  credit_unit: number;
  department_id: string;
  level: number;
  semester: Semester;
  created_at: string;
  department?: Department;
}

export interface CourseAllocation {
  id: string;
  course_id: string;
  lecturer_id: string;
  academic_session: string;
  semester: Semester;
  created_at: string;
  course?: Course;
  lecturer?: Lecturer;
}

export interface CourseRegistration {
  id: string;
  student_id: string;
  course_id: string;
  academic_session: string;
  semester: Semester;
  status: 'registered' | 'dropped';
  created_at: string;
  student?: Student;
  course?: Course;
}

export interface AcademicResult {
  id: string;
  student_id: string;
  course_id: string;
  academic_session: string;
  semester: Semester;
  encrypted_ca_score?: string;     // BFV Ciphertext (Base64 string)
  encrypted_exam_score?: string;   // BFV Ciphertext (Base64 string)
  encrypted_total_score?: string;  // BFV Ciphertext (Result of Homomorphic Add)
  // Plaintext values only available upon authorized decryption
  decrypted_ca_score?: number;
  decrypted_exam_score?: number;
  decrypted_total_score?: number;
  grade?: string;                  // A, B, C, D, E, F
  grade_point?: number;            // 5.0, 4.0, 3.0, 2.0, 1.0, 0.0
  status: ResultStatus;
  submitted_by?: string;
  approved_by?: string;
  encryption_scheme: string;
  created_at: string;
  updated_at: string;
  // Joins
  student?: Student;
  course?: Course;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface EncryptionMetrics {
  scheme: 'SEAL-BFV';
  polyModulusDegree: number;
  plainModulus: number;
  securityLevel: string;
  noiseBudget: number; // in bits
  encryptionTimeMs: number;
  homomorphicAdditionTimeMs: number;
  decryptionTimeMs: number;
}
