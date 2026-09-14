import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const lecturerId = searchParams.get('lecturerId');
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');

    if (type === 'overview') {
      const [students, lecturers, courses, results, activeSession, auditLogs] = await Promise.all([
        db.getStudents(),
        db.getLecturers(),
        db.getCourses(),
        db.getResults(),
        db.getActiveSession(),
        db.getAuditLogs(10),
      ]);

      const encryptedRecordsCount = results.filter((r) => r.encrypted_total_score).length;
      const approvedCount = results.filter((r) => r.status === 'approved').length;
      const submittedCount = results.filter((r) => r.status === 'submitted').length;

      return NextResponse.json({
        success: true,
        stats: {
          totalStudents: students.length,
          totalLecturers: lecturers.length,
          totalCourses: courses.length,
          activeSession: activeSession?.name || '2025/2026',
          encryptedRecordsCount,
          approvedCount,
          submittedCount,
        },
        recentActivity: auditLogs,
      });
    }

    if (type === 'courses') {
      const courses = await db.getCourses();
      return NextResponse.json({ success: true, courses });
    }

    if (type === 'faculties') {
      const faculties = await db.getFaculties();
      return NextResponse.json({ success: true, faculties });
    }

    if (type === 'departments') {
      const facultyId = searchParams.get('facultyId');
      const departments = facultyId
        ? await db.getDepartmentsByFacultyId(facultyId)
        : await db.getDepartments();
      return NextResponse.json({ success: true, departments });
    }

    if (type === 'students') {
      const students = await db.getStudents();
      return NextResponse.json({ success: true, students });
    }

    if (type === 'lecturers') {
      const lecturers = await db.getLecturers();
      return NextResponse.json({ success: true, lecturers });
    }

    if (type === 'lecturer-allocations') {
      const allocations = await db.getAllocationsByLecturerId(lecturerId || 'all');
      return NextResponse.json({ success: true, allocations });
    }

    if (type === 'course-registrations' && courseId) {
      const registrations = await db.getRegistrationsByCourseId(courseId);
      return NextResponse.json({ success: true, registrations });
    }

    if (type === 'student-registrations') {
      const registrations = await db.getRegistrationsByStudentId(studentId || '');
      return NextResponse.json({ success: true, registrations });
    }

    return NextResponse.json({ success: true, message: 'Specify a query type' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Faculty Actions
    if (action === 'create-faculty') {
      const { name, code } = body;
      if (!name || !code) return NextResponse.json({ error: 'Name and Code required' }, { status: 400 });
      const faculty = await db.addFaculty(name, code);
      await db.addAuditLog({
        action: 'FACULTY_CREATED',
        entity_type: 'faculty',
        entity_id: faculty.id,
        details: { name, code },
      });
      return NextResponse.json({ success: true, faculty });
    }

    if (action === 'update-faculty') {
      const { id, name, code } = body;
      if (!id || !name || !code) return NextResponse.json({ error: 'ID, Name and Code required' }, { status: 400 });
      const updated = await db.updateFaculty(id, name, code);
      if (!updated) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
      await db.addAuditLog({
        action: 'FACULTY_UPDATED',
        entity_type: 'faculty',
        entity_id: id,
        details: { name, code },
      });
      return NextResponse.json({ success: true, faculty: updated });
    }

    if (action === 'delete-faculty') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Faculty ID required' }, { status: 400 });
      const deleted = await db.deleteFaculty(id);
      await db.addAuditLog({
        action: 'FACULTY_DELETED',
        entity_type: 'faculty',
        entity_id: id,
        details: { id },
      });
      return NextResponse.json({ success: deleted });
    }

    // Department Actions
    if (action === 'create-department') {
      const { faculty_id, name, code } = body;
      if (!faculty_id || !name || !code) return NextResponse.json({ error: 'Faculty, Name and Code required' }, { status: 400 });
      const dept = await db.addDepartment(faculty_id, name, code);
      await db.addAuditLog({
        action: 'DEPARTMENT_CREATED',
        entity_type: 'department',
        entity_id: dept.id,
        details: { name, code, faculty_id },
      });
      return NextResponse.json({ success: true, department: dept });
    }

    if (action === 'update-department') {
      const { id, name, code, faculty_id } = body;
      if (!id || !name || !code) return NextResponse.json({ error: 'ID, Name and Code required' }, { status: 400 });
      const updated = await db.updateDepartment(id, name, code, faculty_id);
      if (!updated) return NextResponse.json({ error: 'Department not found' }, { status: 404 });
      await db.addAuditLog({
        action: 'DEPARTMENT_UPDATED',
        entity_type: 'department',
        entity_id: id,
        details: { name, code, faculty_id },
      });
      return NextResponse.json({ success: true, department: updated });
    }

    if (action === 'delete-department') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Department ID required' }, { status: 400 });
      const deleted = await db.deleteDepartment(id);
      await db.addAuditLog({
        action: 'DEPARTMENT_DELETED',
        entity_type: 'department',
        entity_id: id,
        details: { id },
      });
      return NextResponse.json({ success: deleted });
    }

    // Course Actions
    if (action === 'create-course') {
      const { course_code, course_title, credit_unit, department_id, level, semester } = body;
      if (!course_code || !course_title || !credit_unit) {
        return NextResponse.json({ error: 'Missing required course fields' }, { status: 400 });
      }
      const departments = await db.getDepartments();
      const course = await db.addCourse({
        course_code,
        course_title,
        credit_unit: Number(credit_unit),
        department_id: department_id || departments[0]?.id || '',
        level: Number(level) || 400,
        semester: semester || 'First',
      });
      await db.addAuditLog({
        action: 'COURSE_ACCREDITED',
        entity_type: 'course',
        entity_id: course.id,
        details: { course_code, course_title },
      });
      return NextResponse.json({ success: true, course });
    }

    if (action === 'update-course') {
      const { id, course_code, course_title, credit_unit, department_id, level, semester } = body;
      if (!id) return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
      const updated = await db.updateCourse(id, {
        course_code,
        course_title,
        credit_unit: credit_unit !== undefined ? Number(credit_unit) : undefined,
        department_id,
        level: level !== undefined ? Number(level) : undefined,
        semester,
      });
      if (!updated) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      await db.addAuditLog({
        action: 'COURSE_UPDATED',
        entity_type: 'course',
        entity_id: id,
        details: { course_code, course_title },
      });
      return NextResponse.json({ success: true, course: updated });
    }

    if (action === 'delete-course') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
      const deleted = await db.deleteCourse(id);
      await db.addAuditLog({
        action: 'COURSE_DELETED',
        entity_type: 'course',
        entity_id: id,
        details: { id },
      });
      return NextResponse.json({ success: deleted });
    }

    // Student Actions
    if (action === 'create-student') {
      const { name, email, matric_number, department_id, level } = body;
      if (!name || !matric_number) {
        return NextResponse.json({ error: 'Student Name and Matric Number required' }, { status: 400 });
      }
      const departments = await db.getDepartments();
      const student = await db.addStudent(
        name,
        email || `${matric_number.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.institution.edu.ng`,
        matric_number,
        department_id || departments[0]?.id || '',
        level ? Number(level) : 400
      );
      await db.addAuditLog({
        action: 'STUDENT_REGISTERED',
        entity_type: 'student',
        entity_id: student.id,
        details: { name, matric_number },
      });
      return NextResponse.json({ success: true, student });
    }

    if (action === 'update-student') {
      const { id, name, matric_number, department_id, level } = body;
      if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
      const updated = await db.updateStudent(id, {
        name,
        matricNumber: matric_number,
        departmentId: department_id,
        level: level ? Number(level) : undefined,
      });
      if (!updated) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      await db.addAuditLog({
        action: 'STUDENT_UPDATED',
        entity_type: 'student',
        entity_id: id,
        details: { name, matric_number },
      });
      return NextResponse.json({ success: true, student: updated });
    }

    if (action === 'delete-student') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
      const deleted = await db.deleteStudent(id);
      await db.addAuditLog({
        action: 'STUDENT_REMOVED',
        entity_type: 'student',
        entity_id: id,
        details: { id },
      });
      return NextResponse.json({ success: deleted });
    }

    // Lecturer Actions
    if (action === 'create-lecturer') {
      const { name, email, staff_number, department_id } = body;
      if (!name || !staff_number) {
        return NextResponse.json({ error: 'Lecturer Name and Staff Number required' }, { status: 400 });
      }
      const cleanEmail =
        email ||
        `${name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .trim()
          .replace(/\s+/g, '.')}@institution.edu.ng`;
      const departments = await db.getDepartments();
      const lecturer = await db.addLecturer(
        name,
        cleanEmail,
        staff_number,
        department_id || departments[0]?.id || ''
      );
      await db.addAuditLog({
        action: 'LECTURER_APPOINTED',
        entity_type: 'lecturer',
        entity_id: lecturer.id,
        details: { name, staff_number, email: cleanEmail },
      });
      return NextResponse.json({ success: true, lecturer });
    }

    if (action === 'update-lecturer') {
      const { id, name, staff_number, department_id } = body;
      if (!id) return NextResponse.json({ error: 'Lecturer ID required' }, { status: 400 });
      const updated = await db.updateLecturer(id, {
        name,
        staffNumber: staff_number,
        departmentId: department_id,
      });
      if (!updated) return NextResponse.json({ error: 'Lecturer not found' }, { status: 404 });
      await db.addAuditLog({
        action: 'LECTURER_UPDATED',
        entity_type: 'lecturer',
        entity_id: id,
        details: { name, staff_number },
      });
      return NextResponse.json({ success: true, lecturer: updated });
    }

    if (action === 'delete-lecturer') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Lecturer ID required' }, { status: 400 });
      const deleted = await db.deleteLecturer(id);
      await db.addAuditLog({
        action: 'LECTURER_REMOVED',
        entity_type: 'lecturer',
        entity_id: id,
        details: { id },
      });
      return NextResponse.json({ success: deleted });
    }

    // Allocations & Registrations
    if (action === 'allocate-course') {
      const { course_id, lecturer_id, session, semester } = body;
      const alloc = await db.allocateCourse(course_id, lecturer_id, session, semester);
      return NextResponse.json({ success: true, allocation: alloc });
    }

    if (action === 'register-course') {
      const { student_id, course_id, session, semester } = body;
      const reg = await db.registerStudentToCourse(student_id, course_id, session, semester);
      return NextResponse.json({ success: true, registration: reg });
    }

    if (action === 'clear-users') {
      await db.clearAllUsers();
      await db.addAuditLog({
        action: 'USER_DIRECTORY_CLEARED',
        entity_type: 'system',
        details: { status: 'cleared' },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
