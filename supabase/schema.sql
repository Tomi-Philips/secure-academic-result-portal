-- ============================================================================
-- Homomorphic Encryption-Based Tertiary Institution Database Management System
-- Database Schema (PostgreSQL / Supabase)
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumerations (Idempotent creation)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'lecturer', 'student');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE result_status AS ENUM ('draft', 'submitted', 'processing', 'processed', 'approved');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE semester_type AS ENUM ('First', 'Second');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Faculties Table
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Academic Programmes
CREATE TABLE IF NOT EXISTS programmes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    duration_years INT NOT NULL DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. User Profiles (Linked with Supabase Auth or Local Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    matric_number VARCHAR(50) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE RESTRICT,
    level INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Lecturers Table
CREATE TABLE IF NOT EXISTS lecturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    staff_number VARCHAR(50) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Academic Sessions
CREATE TABLE IF NOT EXISTS academic_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g. "2025/2026"
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_title VARCHAR(255) NOT NULL,
    credit_unit INT NOT NULL CHECK (credit_unit > 0 AND credit_unit <= 6),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level IN (100, 200, 300, 400, 500)),
    semester semester_type NOT NULL DEFAULT 'First',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Course Allocations (Lecturers -> Courses)
CREATE TABLE IF NOT EXISTS course_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lecturer_id UUID NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    academic_session VARCHAR(50) NOT NULL,
    semester semester_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (course_id, lecturer_id, academic_session, semester)
);

-- 11. Course Registrations (Students -> Courses)
CREATE TABLE IF NOT EXISTS course_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_session VARCHAR(50) NOT NULL,
    semester semester_type NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'registered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, course_id, academic_session, semester)
);

-- 12. Results Table (Sensitive Academic Data Protected with Homomorphic Encryption)
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_session VARCHAR(50) NOT NULL,
    semester semester_type NOT NULL,
    -- Homomorphic BFV Encrypted Scores (Stored as Base64 Ciphertext byte sequences)
    encrypted_ca_score TEXT,
    encrypted_exam_score TEXT,
    encrypted_total_score TEXT,
    -- Decrypted / Authorized Metadata (calculated post-computation under authorized keys)
    grade VARCHAR(5),
    grade_point NUMERIC(3, 2),
    status result_status NOT NULL DEFAULT 'draft',
    submitted_by UUID REFERENCES lecturers(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    encryption_scheme VARCHAR(50) DEFAULT 'SEAL-BFV-128',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, course_id, academic_session, semester)
);

-- 13. Audit Logs (Security & Compliance Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'SCORE_ENCRYPTED', 'HOMOMORPHIC_ADDITION', 'RESULT_DECRYPTED', 'RESULT_APPROVED'
    entity_type VARCHAR(50) NOT NULL, -- 'result', 'course', 'auth', 'student'
    entity_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_course_id ON results(course_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_student ON course_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_course_allocations_lecturer ON course_allocations(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 15. Row Level Security (RLS)
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS read_faculties ON faculties;
DROP POLICY IF EXISTS read_departments ON departments;
DROP POLICY IF EXISTS read_programmes ON programmes;
DROP POLICY IF EXISTS read_sessions ON academic_sessions;
DROP POLICY IF EXISTS read_courses ON courses;

DROP POLICY IF EXISTS admin_all_faculties ON faculties;
DROP POLICY IF EXISTS admin_all_departments ON departments;
DROP POLICY IF EXISTS admin_all_programmes ON programmes;
DROP POLICY IF EXISTS admin_all_sessions ON academic_sessions;
DROP POLICY IF EXISTS admin_all_profiles ON user_profiles;
DROP POLICY IF EXISTS admin_all_students ON students;
DROP POLICY IF EXISTS admin_all_lecturers ON lecturers;
DROP POLICY IF EXISTS admin_all_courses ON courses;
DROP POLICY IF EXISTS admin_all_allocations ON course_allocations;
DROP POLICY IF EXISTS admin_all_registrations ON course_registrations;
DROP POLICY IF EXISTS admin_all_results ON results;
DROP POLICY IF EXISTS admin_all_audit ON audit_logs;

DROP POLICY IF EXISTS user_view_own_profile ON user_profiles;
DROP POLICY IF EXISTS user_update_own_profile ON user_profiles;
DROP POLICY IF EXISTS student_view_own_record ON students;
DROP POLICY IF EXISTS student_view_own_results ON results;
DROP POLICY IF EXISTS student_view_registrations ON course_registrations;
DROP POLICY IF EXISTS lecturer_view_own_record ON lecturers;
DROP POLICY IF EXISTS lecturer_manage_allocated_results ON results;
DROP POLICY IF EXISTS lecturer_view_allocations ON course_allocations;
DROP POLICY IF EXISTS insert_audit_logs ON audit_logs;
DROP POLICY IF EXISTS view_audit_logs ON audit_logs;

-- Universal Read Policies for institutional structures
CREATE POLICY read_faculties ON faculties FOR SELECT USING (true);
CREATE POLICY read_departments ON departments FOR SELECT USING (true);
CREATE POLICY read_programmes ON programmes FOR SELECT USING (true);
CREATE POLICY read_sessions ON academic_sessions FOR SELECT USING (true);
CREATE POLICY read_courses ON courses FOR SELECT USING (true);

-- Admin Full Management Policies
CREATE POLICY admin_all_faculties ON faculties FOR ALL USING (is_admin());
CREATE POLICY admin_all_departments ON departments FOR ALL USING (is_admin());
CREATE POLICY admin_all_programmes ON programmes FOR ALL USING (is_admin());
CREATE POLICY admin_all_sessions ON academic_sessions FOR ALL USING (is_admin());
CREATE POLICY admin_all_profiles ON user_profiles FOR ALL USING (is_admin());
CREATE POLICY admin_all_students ON students FOR ALL USING (is_admin());
CREATE POLICY admin_all_lecturers ON lecturers FOR ALL USING (is_admin());
CREATE POLICY admin_all_courses ON courses FOR ALL USING (is_admin());
CREATE POLICY admin_all_allocations ON course_allocations FOR ALL USING (is_admin());
CREATE POLICY admin_all_registrations ON course_registrations FOR ALL USING (is_admin());
CREATE POLICY admin_all_results ON results FOR ALL USING (is_admin());
CREATE POLICY admin_all_audit ON audit_logs FOR ALL USING (is_admin());

-- User Profiles Self Access
CREATE POLICY user_view_own_profile ON user_profiles
    FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY user_update_own_profile ON user_profiles
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Students: view their own record and results
CREATE POLICY student_view_own_record ON students
    FOR SELECT USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY student_view_own_results ON results
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE user_id IN (
                SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
            )
        )
    );
CREATE POLICY student_view_registrations ON course_registrations
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students WHERE user_id IN (
                SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Lecturers: view and manage results for allocated courses
CREATE POLICY lecturer_view_own_record ON lecturers
    FOR SELECT USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY lecturer_manage_allocated_results ON results
    FOR ALL USING (
        course_id IN (
            SELECT course_id FROM course_allocations WHERE lecturer_id IN (
                SELECT id FROM lecturers WHERE user_id IN (
                    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
                )
            )
        )
    );
CREATE POLICY lecturer_view_allocations ON course_allocations
    FOR SELECT USING (
        lecturer_id IN (
            SELECT id FROM lecturers WHERE user_id IN (
                SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Audit logs insertion for all authenticated users
CREATE POLICY insert_audit_logs ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY view_audit_logs ON audit_logs FOR SELECT USING (is_admin());
