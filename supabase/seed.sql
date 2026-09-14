-- ============================================================================
-- Seed Data: Homomorphic Encryption Academic DBMS
-- Minimal seed: Admin only + institutional structure
-- Lecturers and students are created by the Admin through the system
-- ============================================================================

-- 1. Faculties
INSERT INTO faculties (id, name, code) VALUES
('a1111111-1111-1111-1111-111111111111', 'Faculty of Computing & Informatics', 'FCI'),
('a2222222-2222-2222-2222-222222222222', 'Faculty of Engineering', 'FEN')
ON CONFLICT (code) DO NOTHING;

-- 2. Departments
INSERT INTO departments (id, faculty_id, name, code) VALUES
('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Computer Science', 'CSC'),
('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Software Engineering', 'SEN'),
('b3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Cybersecurity & Privacy', 'CYB')
ON CONFLICT (code) DO NOTHING;

-- 3. Programmes
INSERT INTO programmes (id, department_id, name, code, duration_years) VALUES
('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'B.Sc. Computer Science', 'BSC-CSC', 4),
('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'B.Sc. Software Engineering', 'BSC-SEN', 4)
ON CONFLICT (code) DO NOTHING;

-- 4. Academic Sessions
INSERT INTO academic_sessions (id, name, is_active) VALUES
('d1111111-1111-1111-1111-111111111111', '2025/2026', true),
('d2222222-2222-2222-2222-222222222222', '2024/2025', false)
ON CONFLICT (name) DO NOTHING;

-- 5. Admin User (Supabase Auth + Identities + Profile)
-- First clean up any incomplete previous insert
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'adegokefavour240@gmail.com');
DELETE FROM auth.users WHERE email = 'adegokefavour240@gmail.com';

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_encrypted_pw TEXT := crypt('afop1234', gen_salt('bf'));
BEGIN
  -- Insert complete auth.users record
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'adegokefavour240@gmail.com',
    v_encrypted_pw,
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Admin Adegoke Favour","role":"admin"}'::jsonb,
    false,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Insert matching auth.identities record required by Supabase Auth GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', 'adegokefavour240@gmail.com'),
    'email',
    v_user_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- Link user profile
  INSERT INTO public.user_profiles (id, auth_user_id, role, name, email, status)
  VALUES (
    v_user_id,
    v_user_id,
    'admin',
    'Admin Adegoke Favour',
    'adegokefavour240@gmail.com',
    'active'
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    role = 'admin',
    name = EXCLUDED.name,
    status = 'active';
END $$;

-- 6. Courses
INSERT INTO courses (id, course_code, course_title, credit_unit, department_id, level, semester) VALUES
('e1111111-1111-1111-1111-111111111111', 'CSC 401', 'Advanced Database Management Systems', 3, 'b1111111-1111-1111-1111-111111111111', 400, 'First'),
('e2222222-2222-2222-2222-222222222222', 'CSC 403', 'Applied Cryptography & Data Security', 3, 'b1111111-1111-1111-1111-111111111111', 400, 'First'),
('e3333333-3333-3333-3333-333333333333', 'SEN 402', 'Formal Methods in Software Security', 2, 'b2222222-2222-2222-2222-222222222222', 400, 'First')
ON CONFLICT (course_code) DO NOTHING;
