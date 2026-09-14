/**
 * Supabase Persistence Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * All functions are async and call the Supabase database.
 * Uses the service-role admin client (bypasses RLS) for server-side mutations.
 * Function signatures are preserved so API routes and services need only `await`.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  Faculty,
  Department,
  Programme,
  UserProfile,
  Student,
  Lecturer,
  Course,
  CourseAllocation,
  CourseRegistration,
  AcademicResult,
  AuditLog,
  AcademicSession,
  Semester,
} from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase/supabase-admin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Throw a readable error from a Supabase error object */
function throwIfError(error: { message: string } | null, context: string): void {
  if (error) {
    throw new Error(`[DB:${context}] ${error.message}`);
  }
}

/**
 * Guard for Postgres uuid columns: returns the value only when it is a valid
 * UUID literal, otherwise null. Prevents "invalid input syntax for type uuid"
 * errors when app-level identifiers (e.g. "res-1234-abcd") leak into the DB.
 */
function asUuidOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return UUID_RE.test(value) ? value : null;
}

// ---------------------------------------------------------------------------
// Exported db adapter
// ---------------------------------------------------------------------------

export const db = {

  // ─── Users & Profiles ────────────────────────────────────────────────────

  getUsers: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: true });
    throwIfError(error, 'getUsers');
    return (data ?? []) as UserProfile[];
  },

  getUserById: async (id: string): Promise<UserProfile | undefined> => {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIfError(error, 'getUserById');
    return data as UserProfile | undefined;
  },

  addUser: async (user: UserProfile): Promise<UserProfile> => {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: user.id || generateId(),
        auth_user_id: user.auth_user_id ?? null,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      })
      .select()
      .single();
    throwIfError(error, 'addUser');
    return data as UserProfile;
  },

  /**
   * Look up a user by email, matric number, or staff number.
   * Returns the UserProfile and a roleHint, exactly as the old in-memory version did.
   */
  findUserByCredential: async (
    identifier: string
  ): Promise<{ user: UserProfile | null; roleHint?: 'admin' | 'lecturer' | 'student' }> => {
    const clean = identifier.trim().toLowerCase();
    const cleanNormalized = clean.replace(/[^a-z0-9]/g, '');

    // 1. Direct email / normalised-email match
    const { data: byEmail } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .ilike('email', clean)
      .maybeSingle();

    if (byEmail) {
      return { user: byEmail as UserProfile, roleHint: byEmail.role };
    }

    // 2. Normalised email (strip dots/symbols) — fetch all and filter in JS
    const { data: allUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('*');

    if (allUsers) {
      const match = (allUsers as UserProfile[]).find(
        (u) =>
          u.email.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNormalized
      );
      if (match) return { user: match, roleHint: match.role };
    }

    // 3. Student matric number match
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('*, user_profiles(*)')
      .order('created_at', { ascending: true });

    if (students) {
      const matchedStudent = (students as any[]).find(
        (s) =>
          s.matric_number.toLowerCase() === clean ||
          s.matric_number.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNormalized
      );
      if (matchedStudent?.user_profiles) {
        return { user: matchedStudent.user_profiles as UserProfile, roleHint: 'student' };
      }
    }

    // 4. Lecturer staff number match
    const { data: lecturers } = await supabaseAdmin
      .from('lecturers')
      .select('*, user_profiles(*)')
      .order('created_at', { ascending: true });

    if (lecturers) {
      const matchedLecturer = (lecturers as any[]).find(
        (l) =>
          l.staff_number.toLowerCase() === clean ||
          l.staff_number.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNormalized
      );
      if (matchedLecturer?.user_profiles) {
        return { user: matchedLecturer.user_profiles as UserProfile, roleHint: 'lecturer' };
      }
    }

    // 5. Name match (partial)
    if (allUsers) {
      const byName = (allUsers as UserProfile[]).find((u) => {
        const uName = u.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          uName.includes(cleanNormalized) ||
          (cleanNormalized.length >= 4 && cleanNormalized.includes(uName))
        );
      });
      if (byName) return { user: byName, roleHint: byName.role };
    }

    return { user: null };
  },

  // ─── Faculties ───────────────────────────────────────────────────────────

  getFaculties: async (): Promise<Faculty[]> => {
    const { data, error } = await supabaseAdmin
      .from('faculties')
      .select('*, departments(*)')
      .order('created_at', { ascending: true });
    throwIfError(error, 'getFaculties');
    return (data ?? []) as Faculty[];
  },

  addFaculty: async (name: string, code: string): Promise<Faculty> => {
    const { data, error } = await supabaseAdmin
      .from('faculties')
      .insert({ name, code: code.toUpperCase() })
      .select()
      .single();
    throwIfError(error, 'addFaculty');
    return data as Faculty;
  },

  updateFaculty: async (id: string, name: string, code: string): Promise<Faculty | null> => {
    const { data, error } = await supabaseAdmin
      .from('faculties')
      .update({ name, code: code.toUpperCase() })
      .eq('id', id)
      .select()
      .maybeSingle();
    throwIfError(error, 'updateFaculty');
    return data as Faculty | null;
  },

  deleteFaculty: async (id: string): Promise<boolean> => {
    const { error } = await supabaseAdmin
      .from('faculties')
      .delete()
      .eq('id', id);
    throwIfError(error, 'deleteFaculty');
    return true;
  },

  // ─── Departments ─────────────────────────────────────────────────────────

  getDepartments: async (): Promise<Department[]> => {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*, faculties(*)')
      .order('created_at', { ascending: true });
    throwIfError(error, 'getDepartments');
    // Remap `faculties` → `faculty` to match the TypeScript interface
    return ((data ?? []) as any[]).map((d) => ({
      ...d,
      faculty: d.faculties,
      faculties: undefined,
    })) as Department[];
  },

  getDepartmentsByFacultyId: async (facultyId: string): Promise<Department[]> => {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*, faculties(*)')
      .eq('faculty_id', facultyId)
      .order('created_at', { ascending: true });
    throwIfError(error, 'getDepartmentsByFacultyId');
    return ((data ?? []) as any[]).map((d) => ({
      ...d,
      faculty: d.faculties,
      faculties: undefined,
    })) as Department[];
  },

  addDepartment: async (facultyId: string, name: string, code: string): Promise<Department> => {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert({ faculty_id: facultyId, name, code: code.toUpperCase() })
      .select()
      .single();
    throwIfError(error, 'addDepartment');
    return data as Department;
  },

  updateDepartment: async (
    id: string,
    name: string,
    code: string,
    facultyId?: string
  ): Promise<Department | null> => {
    const payload: Record<string, string> = { name, code: code.toUpperCase() };
    if (facultyId) payload.faculty_id = facultyId;
    const { data, error } = await supabaseAdmin
      .from('departments')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();
    throwIfError(error, 'updateDepartment');
    return data as Department | null;
  },

  deleteDepartment: async (id: string): Promise<boolean> => {
    const { error } = await supabaseAdmin
      .from('departments')
      .delete()
      .eq('id', id);
    throwIfError(error, 'deleteDepartment');
    return true;
  },

  // ─── Courses ─────────────────────────────────────────────────────────────

  getCourses: async (): Promise<Course[]> => {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*, departments(*)')
      .order('created_at', { ascending: true });
    throwIfError(error, 'getCourses');
    return ((data ?? []) as any[]).map((c) => ({
      ...c,
      department: c.departments,
      departments: undefined,
    })) as Course[];
  },

  addCourse: async (course: Omit<Course, 'id' | 'created_at'>): Promise<Course> => {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({
        course_code: course.course_code,
        course_title: course.course_title,
        credit_unit: course.credit_unit,
        department_id: course.department_id,
        level: course.level,
        semester: course.semester,
      })
      .select()
      .single();
    throwIfError(error, 'addCourse');
    return data as Course;
  },

  updateCourse: async (id: string, course: Partial<Course>): Promise<Course | null> => {
    // Strip join fields before sending to Supabase
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { department, ...fields } = course as any;
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update(fields)
      .eq('id', id)
      .select()
      .maybeSingle();
    throwIfError(error, 'updateCourse');
    return data as Course | null;
  },

  deleteCourse: async (id: string): Promise<boolean> => {
    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', id);
    throwIfError(error, 'deleteCourse');
    return true;
  },

  // ─── Lecturers ───────────────────────────────────────────────────────────

  getLecturers: async (): Promise<Lecturer[]> => {
    const { data, error } = await supabaseAdmin
      .from('lecturers')
      .select('*, user_profiles(*), departments(*)')
      .order('created_at', { ascending: true });
    throwIfError(error, 'getLecturers');
    return ((data ?? []) as any[]).map((l) => ({
      ...l,
      user: l.user_profiles,
      department: l.departments,
      user_profiles: undefined,
      departments: undefined,
    })) as Lecturer[];
  },

  addLecturer: async (
    name: string,
    email: string,
    staffNumber: string,
    departmentId: string
  ): Promise<Lecturer> => {
    const userId = generateId();

    // 1. Insert user_profiles row
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        name,
        email,
        role: 'lecturer',
        status: 'active',
      })
      .select()
      .single();
    throwIfError(userError, 'addLecturer:user_profiles');

    // 2. Insert lecturers row
    const { data: lecturerRow, error: lecturerError } = await supabaseAdmin
      .from('lecturers')
      .insert({
        user_id: userId,
        staff_number: staffNumber,
        department_id: departmentId,
      })
      .select()
      .single();
    throwIfError(lecturerError, 'addLecturer:lecturers');

    // 3. Fetch department for the return value
    const { data: deptRow } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('id', departmentId)
      .maybeSingle();

    return {
      ...(lecturerRow as Lecturer),
      user: userRow as UserProfile,
      department: deptRow as Department | undefined,
    };
  },

  updateLecturer: async (
    id: string,
    data: { name?: string; staffNumber?: string; departmentId?: string }
  ): Promise<Lecturer | null> => {
    // Fetch existing lecturer record
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('lecturers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIfError(fetchError, 'updateLecturer:fetch');
    if (!existing) return null;

    // Update lecturer table
    const lecturerUpdates: Record<string, string> = {};
    if (data.staffNumber) lecturerUpdates.staff_number = data.staffNumber;
    if (data.departmentId) lecturerUpdates.department_id = data.departmentId;

    if (Object.keys(lecturerUpdates).length > 0) {
      const { error } = await supabaseAdmin
        .from('lecturers')
        .update(lecturerUpdates)
        .eq('id', id);
      throwIfError(error, 'updateLecturer:lecturers');
    }

    // Update user_profiles name if provided
    if (data.name) {
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({ name: data.name })
        .eq('id', existing.user_id);
      throwIfError(error, 'updateLecturer:user_profiles');
    }

    // Return enriched record
    const { data: updated } = await supabaseAdmin
      .from('lecturers')
      .select('*, user_profiles(*), departments(*)')
      .eq('id', id)
      .single();

    return updated
      ? {
          ...(updated as any),
          user: (updated as any).user_profiles,
          department: (updated as any).departments,
          user_profiles: undefined,
          departments: undefined,
        }
      : null;
  },

  deleteLecturer: async (id: string): Promise<boolean> => {
    // Fetch to get user_id before deleting (CASCADE will remove lecturer row)
    const { data: lecturer } = await supabaseAdmin
      .from('lecturers')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from('lecturers')
      .delete()
      .eq('id', id);
    throwIfError(error, 'deleteLecturer');

    // Remove the associated user_profile (CASCADE doesn't go upward)
    if (lecturer?.user_id) {
      await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', lecturer.user_id);
    }
    return true;
  },

  // ─── Students ────────────────────────────────────────────────────────────

  getStudents: async (): Promise<Student[]> => {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*, user_profiles(*), departments(*), programmes(*)')
      .order('created_at', { ascending: true });
    throwIfError(error, 'getStudents');
    return ((data ?? []) as any[]).map((s) => ({
      ...s,
      user: s.user_profiles,
      department: s.departments,
      programme: s.programmes,
      user_profiles: undefined,
      departments: undefined,
      programmes: undefined,
    })) as Student[];
  },

  addStudent: async (
    name: string,
    email: string,
    matricNumber: string,
    departmentId: string,
    level = 400
  ): Promise<Student> => {
    const userId = generateId();

    // 1. Insert user_profiles
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        name,
        email,
        role: 'student',
        status: 'active',
      })
      .select()
      .single();
    throwIfError(userError, 'addStudent:user_profiles');

    // 2. Resolve programme_id — use first programme in the department, else any programme
    const { data: programmes } = await supabaseAdmin
      .from('programmes')
      .select('id')
      .eq('department_id', departmentId)
      .limit(1);

    let programmeId: string;
    if (programmes && programmes.length > 0) {
      programmeId = programmes[0].id;
    } else {
      // Fallback: any programme
      const { data: anyProg } = await supabaseAdmin
        .from('programmes')
        .select('id')
        .limit(1);
      programmeId = anyProg?.[0]?.id ?? generateId(); // last resort
    }

    // 3. Insert students
    const { data: studentRow, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: userId,
        matric_number: matricNumber,
        department_id: departmentId,
        programme_id: programmeId,
        level,
      })
      .select()
      .single();
    throwIfError(studentError, 'addStudent:students');

    // 4. Fetch department for return
    const { data: deptRow } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('id', departmentId)
      .maybeSingle();

    const { data: progRow } = await supabaseAdmin
      .from('programmes')
      .select('*')
      .eq('id', programmeId)
      .maybeSingle();

    return {
      ...(studentRow as Student),
      user: userRow as UserProfile,
      department: deptRow as Department | undefined,
      programme: progRow as Programme | undefined,
    };
  },

  updateStudent: async (
    id: string,
    data: { name?: string; matricNumber?: string; departmentId?: string; level?: number }
  ): Promise<Student | null> => {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIfError(fetchError, 'updateStudent:fetch');
    if (!existing) return null;

    // Update students table
    const studentUpdates: Record<string, string | number> = {};
    if (data.matricNumber) studentUpdates.matric_number = data.matricNumber;
    if (data.departmentId) studentUpdates.department_id = data.departmentId;
    if (data.level !== undefined) studentUpdates.level = data.level;

    if (Object.keys(studentUpdates).length > 0) {
      const { error } = await supabaseAdmin
        .from('students')
        .update(studentUpdates)
        .eq('id', id);
      throwIfError(error, 'updateStudent:students');
    }

    // Update user_profiles name
    if (data.name) {
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({ name: data.name })
        .eq('id', existing.user_id);
      throwIfError(error, 'updateStudent:user_profiles');
    }

    // Return enriched record
    const { data: updated } = await supabaseAdmin
      .from('students')
      .select('*, user_profiles(*), departments(*), programmes(*)')
      .eq('id', id)
      .single();

    return updated
      ? {
          ...(updated as any),
          user: (updated as any).user_profiles,
          department: (updated as any).departments,
          programme: (updated as any).programmes,
          user_profiles: undefined,
          departments: undefined,
          programmes: undefined,
        }
      : null;
  },

  deleteStudent: async (id: string): Promise<boolean> => {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', id);
    throwIfError(error, 'deleteStudent');

    if (student?.user_id) {
      await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', student.user_id);
    }
    return true;
  },

  // ─── Course Allocations ───────────────────────────────────────────────────

  getAllocationsByLecturerId: async (identifier?: string): Promise<CourseAllocation[]> => {
    let query = supabaseAdmin
      .from('course_allocations')
      .select('*, courses(*, departments(*)), lecturers(*, user_profiles(*), departments(*))');

    if (identifier && identifier !== 'all') {
      const clean = identifier.trim().toLowerCase();

      // Try to resolve identifier to a lecturer row id or user_id
      const { data: allLecturers } = await supabaseAdmin
        .from('lecturers')
        .select('id, user_id, staff_number, user_profiles(email)');

      const matched = (allLecturers as any[])?.find(
        (l) =>
          l.id.toLowerCase() === clean ||
          l.user_id.toLowerCase() === clean ||
          l.staff_number.toLowerCase() === clean ||
          (l.user_profiles as any)?.email?.toLowerCase() === clean
      );

      if (matched) {
        query = query.eq('lecturer_id', matched.id);
      } else {
        // Fallback: try direct id match
        query = query.or(`lecturer_id.eq.${identifier}`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    throwIfError(error, 'getAllocationsByLecturerId');

    return ((data ?? []) as any[]).map((a) => ({
      ...a,
      course: a.courses
        ? { ...a.courses, department: a.courses.departments, departments: undefined }
        : undefined,
      lecturer: a.lecturers
        ? {
            ...a.lecturers,
            user: a.lecturers.user_profiles,
            department: a.lecturers.departments,
            user_profiles: undefined,
            departments: undefined,
          }
        : undefined,
      courses: undefined,
      lecturers: undefined,
    })) as CourseAllocation[];
  },

  allocateCourse: async (
    courseId: string,
    lecturerId: string,
    session = '2025/2026',
    semester: Semester = 'First'
  ): Promise<CourseAllocation> => {
    // Remove any existing allocation for this course in the same session
    await supabaseAdmin
      .from('course_allocations')
      .delete()
      .eq('course_id', courseId)
      .eq('academic_session', session);

    const { data, error } = await supabaseAdmin
      .from('course_allocations')
      .insert({
        course_id: courseId,
        lecturer_id: lecturerId,
        academic_session: session,
        semester,
      })
      .select()
      .single();
    throwIfError(error, 'allocateCourse');
    return data as CourseAllocation;
  },

  // ─── Course Registrations ─────────────────────────────────────────────────

  getRegistrationsByCourseId: async (courseId: string): Promise<CourseRegistration[]> => {
    // Check for explicit registrations first
    const { data: explicit, error: explicitError } = await supabaseAdmin
      .from('course_registrations')
      .select('*, students(*, user_profiles(*), departments(*), programmes(*))')
      .eq('course_id', courseId);
    throwIfError(explicitError, 'getRegistrationsByCourseId:explicit');

    if (explicit && explicit.length > 0) {
      return (explicit as any[]).map((r) => ({
        ...r,
        student: r.students
          ? {
              ...r.students,
              user: r.students.user_profiles,
              department: r.students.departments,
              programme: r.students.programmes,
              user_profiles: undefined,
              departments: undefined,
              programmes: undefined,
            }
          : undefined,
        students: undefined,
      })) as CourseRegistration[];
    }

    // Auto-enrolment fallback: match students by level + department
    const { data: courseData } = await supabaseAdmin
      .from('courses')
      .select('level, department_id, semester')
      .eq('id', courseId)
      .maybeSingle();

    if (!courseData) return [];

    const { data: eligibleStudents } = await supabaseAdmin
      .from('students')
      .select('*, user_profiles(*), departments(*), programmes(*)')
      .eq('level', courseData.level)
      .eq('department_id', courseData.department_id);

    if (!eligibleStudents || eligibleStudents.length === 0) return [];

    // Fetch active session name
    const { data: sessionData } = await supabaseAdmin
      .from('academic_sessions')
      .select('name')
      .eq('is_active', true)
      .maybeSingle();
    const session = sessionData?.name ?? '2025/2026';

    // Auto-register them
    const regRows = eligibleStudents.map((s) => ({
      student_id: s.id,
      course_id: courseId,
      academic_session: session,
      semester: courseData.semester as Semester,
      status: 'registered',
    }));

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('course_registrations')
      .insert(regRows)
      .select('*, students(*, user_profiles(*), departments(*), programmes(*))');
    throwIfError(insertError, 'getRegistrationsByCourseId:auto-enrol');

    return ((inserted ?? []) as any[]).map((r) => ({
      ...r,
      student: r.students
        ? {
            ...r.students,
            user: r.students.user_profiles,
            department: r.students.departments,
            programme: r.students.programmes,
            user_profiles: undefined,
            departments: undefined,
            programmes: undefined,
          }
        : undefined,
      students: undefined,
    })) as CourseRegistration[];
  },

  registerStudentToCourse: async (
    studentId: string,
    courseId: string,
    session = '2025/2026',
    semester: Semester = 'First'
  ): Promise<CourseRegistration> => {
    const { data, error } = await supabaseAdmin
      .from('course_registrations')
      .insert({
        student_id: studentId,
        course_id: courseId,
        academic_session: session,
        semester,
        status: 'registered',
      })
      .select()
      .single();
    throwIfError(error, 'registerStudentToCourse');
    return data as CourseRegistration;
  },

  getRegistrationsByStudentId: async (studentId: string): Promise<CourseRegistration[]> => {
    const { data, error } = await supabaseAdmin
      .from('course_registrations')
      .select('*, courses(*, departments(*))')
      .eq('student_id', studentId);
    throwIfError(error, 'getRegistrationsByStudentId');

    return ((data ?? []) as any[]).map((r) => ({
      ...r,
      course: r.courses
        ? { ...r.courses, department: r.courses.departments, departments: undefined }
        : undefined,
      courses: undefined,
    })) as CourseRegistration[];
  },

  // ─── Results ─────────────────────────────────────────────────────────────

  getResults: async (): Promise<AcademicResult[]> => {
    const { data, error } = await supabaseAdmin
      .from('results')
      .select('*, students(*, user_profiles(*), departments(*)), courses(*, departments(*))')
      .order('created_at', { ascending: false });
    throwIfError(error, 'getResults');

    return ((data ?? []) as any[]).map((r) => ({
      ...r,
      student: r.students
        ? {
            ...r.students,
            user: r.students.user_profiles,
            department: r.students.departments,
            user_profiles: undefined,
            departments: undefined,
          }
        : undefined,
      course: r.courses
        ? { ...r.courses, department: r.courses.departments, departments: undefined }
        : undefined,
      students: undefined,
      courses: undefined,
    })) as AcademicResult[];
  },

  saveResult: async (
    result: Omit<AcademicResult, 'id'> & { id?: string }
  ): Promise<AcademicResult> => {
    // Strip join fields and transient plaintexts before upsert
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { student, course, decrypted_ca_score, decrypted_exam_score, decrypted_total_score, ...dbRow } = result as any;

    // Supabase schema stores grade, grade_point. Transient decrypted scores are
    // attached at runtime post-decryption, never persisted.
    const payload: Record<string, unknown> = {
      ...dbRow,
      grade: result.grade ?? null,
      grade_point: result.grade_point ?? null,
    };

    // Guard uuid columns: `id` is a UUID PK whose DB default only applies when
    // the key is OMITTED — an explicit NULL violates NOT NULL — so drop the key
    // when no valid UUID was supplied. `submitted_by` → lecturers(id) and
    // `approved_by` → user_profiles(id) are nullable FKs, so explicit null is fine.
    const resultId = asUuidOrNull(result.id);
    if (resultId) {
      payload.id = resultId;
    } else {
      delete payload.id;
    }
    payload.submitted_by = asUuidOrNull(result.submitted_by);
    payload.approved_by = asUuidOrNull(result.approved_by);

    const { data, error } = await supabaseAdmin
      .from('results')
      .upsert(payload, {
        onConflict: 'student_id,course_id,academic_session,semester',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    throwIfError(error, 'saveResult');
    return data as AcademicResult;
  },

  // ─── Audit Logs ──────────────────────────────────────────────────────────

  addAuditLog: async (log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> => {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: log.user_id ?? null,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id ?? null,
        details: log.details ?? null,
        ip_address: log.ip_address ?? null,
      })
      .select()
      .single();
    throwIfError(error, 'addAuditLog');
    return {
      ...(data as AuditLog),
      user_name: log.user_name, // transient field not stored in DB
    };
  },

  getAuditLogs: async (limit = 50): Promise<AuditLog[]> => {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    throwIfError(error, 'getAuditLogs');
    return (data ?? []) as AuditLog[];
  },

  // ─── Sessions ────────────────────────────────────────────────────────────

  getActiveSession: async (): Promise<AcademicSession | undefined> => {
    const { data, error } = await supabaseAdmin
      .from('academic_sessions')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();
    throwIfError(error, 'getActiveSession');

    if (data) return data as AcademicSession;

    // Fallback: return the first session
    const { data: first } = await supabaseAdmin
      .from('academic_sessions')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    return first as AcademicSession | undefined;
  },

  // ─── Utility ─────────────────────────────────────────────────────────────

  clearAllUsers: async (): Promise<void> => {
    // Delete in FK-safe order: results → registrations → allocations → students/lecturers → user_profiles
    await supabaseAdmin.from('results').delete().neq('id', '');
    await supabaseAdmin.from('course_registrations').delete().neq('id', '');
    await supabaseAdmin.from('course_allocations').delete().neq('id', '');
    await supabaseAdmin.from('students').delete().neq('id', '');
    await supabaseAdmin.from('lecturers').delete().neq('id', '');
    // Remove non-admin user profiles
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .neq('role', 'admin');
  },
};
