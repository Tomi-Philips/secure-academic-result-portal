# Build Brief: Homomorphic Encryption-Based Tertiary Institution Database Management System

## 1. PROJECT OVERVIEW

Build a complete, production-quality web application titled:

**Development of a Homomorphic Encryption-Based Tertiary Institution Database Management System for Secure Academic Data Processing**

This is an academic research and software development project. The system is not intended to be another generic student portal or ordinary CRUD dashboard.

The central purpose of the application is to demonstrate how **homomorphic encryption can be applied to sensitive academic data so that meaningful computations can be performed without exposing the original academic values**.

The application must therefore feel like a serious, professionally designed security-focused academic information system.

The most important concept in the entire application is:

> **Academic data should remain protected while it is being stored and processed.**

Do not build a website that merely stores encrypted data. The system must demonstrate the distinctive benefit of homomorphic encryption by allowing selected computations to be performed on encrypted academic values.

---

# 2. CORE RESEARCH AIM

The aim of this project is to develop a secure database management system for tertiary institutions that applies homomorphic encryption to sensitive academic data and enables secure processing of that data without exposing its original values.

The system should demonstrate that academic information can remain confidential during database operations while authorized users can still obtain meaningful academic results and statistics.

---

# 3. RESEARCH OBJECTIVES

The software should support the objectives of the research:

1. Examine the security challenges associated with existing database management systems used in tertiary institutions.

2. Investigate the application of homomorphic encryption in protecting sensitive academic data during storage and processing.

3. Design a secure database management system for tertiary institutions using homomorphic encryption.

4. Implement a functional homomorphic encryption-based database management system for secure academic data processing.

5. Evaluate the effectiveness of the proposed system in improving the security and privacy of academic data in tertiary institutions.

The implementation must clearly demonstrate these objectives rather than merely mentioning them in static text.

---

# 4. IMPORTANT PRODUCT POSITIONING

Do NOT build:

* A generic school management template
* A generic admin dashboard
* A generic student portal
* A generic SaaS dashboard
* A landing page pretending to be a finished system
* A dashboard filled with fake statistics
* A website full of unnecessary cards
* A UI full of gradients and decorative effects
* A system with meaningless AI-generated labels
* A system with unnecessary badges
* A system with fake activity feeds
* A system with irrelevant analytics
* A system with features that have nothing to do with secure academic data processing

The application must have a clear reason for every feature.

If a feature does not directly support:

1. Academic data management
2. Academic data security
3. Homomorphic encryption
4. Secure academic computation
5. User access control
6. System administration
7. Demonstration/evaluation of the research objectives

then do not add it.

---

# 5. TECHNOLOGY STACK

Use the following stack unless there is a strong technical reason to change something.

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* React

Use the Next.js App Router.

Use reusable components and proper feature-based organization.

## Backend

* Node.js
* Express.js
* TypeScript

The backend should be responsible for:

* Business logic
* Academic data processing
* Secure API operations
* Encryption operations
* Authorization checks
* Communication with Supabase

Do not place sensitive encryption logic directly inside arbitrary frontend components.

## Database

Use:

**Supabase PostgreSQL**

Supabase will provide:

* PostgreSQL database
* Authentication
* Row Level Security
* Database management
* Storage where genuinely required

## Authentication

Use:

**Supabase Auth**

Do not create a second unnecessary authentication system.

Support:

* Student
* Lecturer
* Administrator

Use role-based authorization.

## Database Security

Use:

**Supabase Row Level Security**

Students must only access records they are authorized to see.

Lecturers must only access academic records relevant to courses they teach.

Administrators have broader management privileges.

Never rely exclusively on frontend restrictions.

Authorization must also be enforced on the backend/database layer.

## Homomorphic Encryption

Use:

**node-seal / Microsoft SEAL**

The encryption implementation must be real.

Do not create fake encryption functions.

Do not simply Base64 encode data.

Do not hash academic scores and call it encryption.

Do not simulate homomorphic encryption with normal arithmetic.

The application must genuinely demonstrate homomorphic operations on encrypted academic values.

## Validation

Use:

* Zod
* React Hook Form where appropriate

## Charts

Use:

* Recharts

Only create charts that represent actual data retrieved from the database or generated from legitimate encrypted computations.

## API Testing

Use:

* Postman

## Version Control

Use:

* Git
* GitHub

---

# 6. CORE SYSTEM CONCEPT

The most important technical workflow is:

```text
Lecturer enters academic score
        ↓
Backend validates the score
        ↓
Homomorphic encryption module encrypts the value
        ↓
Encrypted value is stored in Supabase
        ↓
Authorized operation requests computation
        ↓
Backend retrieves encrypted values
        ↓
Homomorphic computation is performed
        ↓
Encrypted result is produced
        ↓
Authorized process decrypts the required result
        ↓
Result is displayed to the authorized user
```

The plaintext academic value should not be unnecessarily exposed during processing.

---

# 7. WHAT ACADEMIC DATA SHOULD BE PROTECTED?

Do not encrypt every single field.

Homomorphic encryption is computationally expensive, so the system should demonstrate it where it provides meaningful value.

### Sensitive academic values

The system should support protection of:

* Continuous Assessment score
* Examination score
* Total score
* Grade-related numerical values
* GPA-related numerical values
* CGPA-related numerical values
* Academic performance statistics

### Normal metadata

The following can remain normal database fields where encryption is not required for the research demonstration:

* Student name
* Matriculation number
* Email
* Department
* Programme
* Level
* Course code
* Course title
* Credit unit
* Academic session
* Semester

Passwords must never be stored as ordinary plaintext. Supabase Auth should manage authentication credentials.

---

# 8. THE MOST IMPORTANT HOMOMORPHIC ENCRYPTION DEMONSTRATION

Do not merely encrypt a student's result and then immediately decrypt it.

That would fail to demonstrate the real value of homomorphic encryption.

Instead, demonstrate computations such as:

### Example

Student scores:

```text
CA = 28
Examination = 63
```

The backend encrypts both values.

Instead of decrypting them to calculate:

```text
28 + 63 = 91
```

perform the addition using the encrypted values.

The result remains encrypted.

Only the authorized process decrypts the final required value.

The same principle should be demonstrated where technically appropriate for:

* Total score
* Aggregate score
* GPA-related computation
* Class average
* Course average
* Department performance statistics

Be careful not to claim that every possible GPA/CGPA operation is supported by the selected encryption scheme unless the actual implementation supports the required arithmetic.

---

# 9. SYSTEM USERS

## Administrator

The administrator manages the academic environment.

Administrator capabilities:

* Secure login
* Dashboard
* Manage students
* Manage lecturers
* Manage departments
* Manage courses
* Manage academic sessions
* Manage semesters
* Assign lecturers to courses
* View academic records according to authorization
* Manage system users
* Monitor encryption-related processing
* View legitimate academic analytics
* Manage system settings relevant to the project

Do not create dozens of unnecessary administrator settings.

---

# 10. LECTURER MODULE

The lecturer should be able to:

* Login
* View assigned courses
* View enrolled students
* Enter CA scores
* Enter examination scores
* Submit results
* Update results before final approval where permitted
* Trigger secure processing
* View calculated results for authorized students
* View legitimate course-level performance statistics

When a lecturer submits scores, the system should demonstrate the encryption process.

---

# 11. STUDENT MODULE

The student should be able to:

* Login
* View personal profile
* View registered courses
* View available academic results
* View semester GPA
* View cumulative academic performance where applicable
* View academic history
* View transcript-style academic information where appropriate

Students must never be able to access another student's academic records.

---

# 12. ACADEMIC DATA MODULE

Create proper academic entities.

At minimum:

### Users

* id
* auth_user_id
* role
* name
* email
* status
* created_at

### Students

* id
* user_id
* matric_number
* department_id
* programme
* level

### Lecturers

* id
* user_id
* staff_number
* department_id

### Departments

* id
* name
* code

### Courses

* id
* course_code
* course_title
* credit_unit
* department_id
* level
* semester

### Course Registrations

* id
* student_id
* course_id
* academic_session
* semester

### Results

The results table must be carefully designed because this is one of the most important parts of the research.

Possible fields:

* id
* student_id
* course_id
* academic_session
* semester
* encrypted_ca_score
* encrypted_exam_score
* encrypted_total_score
* grade
* status
* submitted_by
* created_at
* updated_at

Do not store plaintext sensitive scores unnecessarily.

---

# 13. ACADEMIC PROCESSING

The system should support a logical academic workflow:

```text
Course Registration
        ↓
Lecturer enters scores
        ↓
Score validation
        ↓
Encryption
        ↓
Encrypted storage
        ↓
Secure computation
        ↓
Result generation
        ↓
Authorized viewing
```

The workflow should be traceable.

---

# 14. SECURITY DEMONSTRATION

This is one of the features that should distinguish the project from an ordinary student portal.

Create a professional **Security / Encryption Demonstration** section.

It should not be a fake animation.

It should display information generated from actual system operations.

For example:

### Encryption Status

```text
Academic Score
Protected

Encryption Scheme
BFV / appropriate selected scheme

Storage Representation
Encrypted

Processing
Homomorphic

Plaintext Exposure
Restricted
```

Only display technical information that is actually true for the implementation.

The system may show a carefully formatted ciphertext preview for demonstration purposes, but do not dump huge cryptographic values across the UI.

---

# 15. ENCRYPTION DEMONSTRATION PAGE

Create a controlled demonstration page accessible to authorized administrators or researchers.

It can demonstrate:

### Input

```text
Score A: 28
Score B: 63
Operation: Addition
```

### Processing

```text
Encrypt A
Encrypt B
Perform Homomorphic Addition
```

### Output

```text
Encrypted Result
↓
Authorized Decryption
↓
91
```

The interface should make it visually obvious that the computation happened while the values were encrypted.

This page is important for the project defense.

---

# 16. SECURITY COMPARISON

Create a small but meaningful comparison within the system:

### Conventional Processing

```text
Plaintext Data
      ↓
Database
      ↓
Decrypt
      ↓
Compute
```

### Proposed Processing

```text
Plaintext Input
      ↓
Encrypt
      ↓
Encrypted Database
      ↓
Compute on Ciphertext
      ↓
Encrypted Result
      ↓
Authorized Decryption
```

This should be implemented as an interactive visual explanation rather than a static wall of text.

Keep it concise and professional.

---

# 17. ADMIN DASHBOARD

The dashboard should be useful rather than decorative.

Display only real dynamic information such as:

* Total students
* Total lecturers
* Total courses
* Active academic session
* Results submitted
* Results pending
* Encrypted records
* Recent legitimate academic processing activities

Do not invent statistics.

If the database contains no records, show a proper empty state.

Example:

> No academic processing activity yet.

Do not display fake numbers such as:

> 12,430 secure records

unless the database actually contains 12,430 records.

---

# 18. ACADEMIC ANALYTICS

The system may provide useful academic analytics such as:

* Course average
* Grade distribution
* Pass rate
* Department average
* GPA distribution
* Performance by semester

However, these must be tied to the project's secure processing objective.

Where possible, demonstrate that sensitive underlying values remain protected while aggregate calculations are performed.

Do not build an unrelated business analytics dashboard.

---

# 19. RESULT MANAGEMENT

The result management interface should feel professional.

A lecturer should see something like:

```text
CSC 401
Advanced Database Systems

Student          CA       Exam       Status
------------------------------------------------
Student A        28       63         Encrypted
Student B        31       59         Encrypted
Student C        24       71         Encrypted
```

But sensitive values should only be displayed according to the user's authorization and the application's security model.

Use proper states:

* Draft
* Submitted
* Processing
* Processed
* Approved

Only implement states that are actually supported by the backend.

---

# 20. SEARCH AND FILTERING

Implement useful filtering where needed:

* Search students
* Filter by department
* Filter by level
* Filter by course
* Filter by academic session
* Filter by semester
* Filter result status

Do not add unnecessary global search functionality.

---

# 21. ERROR HANDLING

Every important operation should have proper error handling.

Examples:

* Failed login
* Unauthorized access
* Invalid score
* Missing course
* Duplicate registration
* Encryption failure
* Database failure
* Invalid academic session
* Unauthorized result access

Errors should be understandable to normal users.

Do not expose cryptographic secrets, database errors, stack traces, or internal implementation details.

---

# 22. LOADING STATES

Use meaningful loading states.

Examples:

```text
Encrypting academic data...
Processing encrypted scores...
Retrieving academic record...
Calculating secure aggregate...
```

Do not use generic:

```text
Loading...
```

everywhere when a more meaningful state is available.

However, these messages must correspond to actual operations.

Do not fake an encryption animation simply to make the interface look sophisticated.

---

# 23. EMPTY STATES

Every data-heavy screen needs a useful empty state.

Examples:

```text
No courses assigned

No students registered for this course

No results have been submitted

No academic processing has been performed
```

Provide an appropriate action where necessary.

---

# 24. UI/UX DIRECTION

This is extremely important.

The interface must look like it was designed by a **professional UI/UX designer**, not generated from a generic AI dashboard template.

The visual direction should be:

* Modern
* Professional
* Clean
* Elegant
* Minimal
* Academic
* Security-focused
* Trustworthy
* Sophisticated
* Calm
* Highly usable

The design should communicate:

**Trust + Security + Academic professionalism**

It should NOT communicate:

**AI startup + crypto dashboard + flashy SaaS template**

---

# 25. COLOR SYSTEM

Do not use a color riot.

Use a restrained professional palette.

Prefer:

* White / off-white
* Deep navy or charcoal
* Neutral gray
* One controlled accent color
* Subtle success/warning/error colors only when necessary

Avoid:

* Rainbow gradients
* Excessive purple
* Neon green
* Bright cyan
* Multiple competing accent colors
* Excessive glassmorphism
* Huge gradient backgrounds

The interface should look good even if all decorative effects are removed.

---

# 26. TYPOGRAPHY

Use a professional modern typeface.

Prioritize:

* Excellent readability
* Clear hierarchy
* Consistent font sizes
* Comfortable spacing
* Strong table readability
* Professional headings

Do not use oversized headings everywhere.

Do not make every section look like a marketing landing page.

---

# 27. LAYOUT

Use a clean application layout.

For authenticated users:

```text
┌──────────────────────────────────────────┐
│ Topbar                                   │
├──────────────┬───────────────────────────┤
│ Sidebar      │ Main Content               │
│              │                            │
│ Dashboard    │ Page heading               │
│ Students     │                            │
│ Courses      │ Content                    │
│ Results      │                            │
│ Security     │                            │
│ Settings     │                            │
└──────────────┴───────────────────────────┘
```

Keep the sidebar compact.

Do not fill it with 20 navigation items.

Navigation should depend on the user's role.

---

# 28. LANDING PAGE

The public landing page should be minimal.

It should explain:

### What the system does

Secure academic data processing using homomorphic encryption.

### Why it matters

Sensitive academic information can remain protected during computation.

### What makes the system different

Traditional systems typically protect data at rest and in transit, while this project demonstrates computation over encrypted academic values.

Do not turn the landing page into a giant marketing website.

No:

* Pricing
* Testimonials
* Fake partner logos
* Fake statistics
* Blog
* Newsletter
* Customer stories
* Unrelated sections

This is an academic software project, not a SaaS company.

---

# 29. DASHBOARD DESIGN PRINCIPLE

Avoid the common AI-generated dashboard pattern:

```text
Card Card Card Card
Chart Chart
Table
Card Card
```

Instead, establish visual hierarchy.

For example:

```text
Dashboard

Welcome back, Admin

Academic Session
2025/2026

[Academic overview]

Students        Courses       Results
1,240           82            3,482

[Secure Processing Overview]

Encrypted Records
Processing Activity

[Recent Academic Activity]
```

Every section must have a purpose.

---

# 30. TABLE DESIGN

Academic tables are extremely important.

Use:

* Good column spacing
* Sticky headers where useful
* Pagination
* Search
* Filtering
* Clear status indicators
* Responsive behavior
* Proper empty states

Do not overload tables with unnecessary columns.

---

# 31. BADGES

Use badges only when they communicate meaningful status.

Good:

```text
Encrypted
Pending
Approved
Processing
```

Bad:

```text
AI Powered
Ultra Secure
Next Generation
Smart
Premium
Advanced
```

Do not use promotional labels inside the application.

---

# 32. ICONS

Use a consistent icon library such as Lucide.

Icons should support comprehension.

Do not put an icon beside every sentence.

Do not use icons as decoration without purpose.

---

# 33. RESPONSIVENESS

The application must work properly on:

* Desktop
* Laptop
* Tablet
* Mobile

However, prioritize desktop because this is an institutional database management application.

Tables should remain usable on smaller screens.

Do not simply shrink everything.

---

# 34. ACCESSIBILITY

Implement:

* Proper labels
* Keyboard navigation
* Good contrast
* Focus states
* Semantic HTML
* Accessible buttons
* Accessible form controls
* Meaningful error messages

---

# 35. NO STATIC FAKE CONTENT

This is a strict requirement.

Do not hardcode:

```text
1,245 students
86 courses
4,892 encrypted records
98.7% security score
```

unless these values come from actual data.

All dashboard statistics must be generated dynamically.

All academic tables must come from Supabase.

All result processing must come from actual backend logic.

All encryption status must reflect actual encryption operations.

---

# 36. NO FAKE CRYPTOGRAPHY

This is even more important.

Never implement:

```ts
encryptedScore = btoa(score)
```

and call it encryption.

Never implement:

```ts
encryptedScore = score + "encrypted"
```

Never create fake ciphertext.

Never create fake "homomorphic computation" merely for the interface.

The cryptographic implementation must be genuine and isolated in a dedicated service/module.

---

# 37. SECURITY REQUIREMENTS

Implement:

* Supabase Auth
* Row Level Security
* Server-side authorization
* Secure environment variables
* Input validation
* Proper API authorization
* No secret keys in frontend code
* No service role key exposed to browser
* Secure handling of encryption keys
* Proper error handling
* Least privilege access
* Database constraints
* Auditability where necessary

Never expose:

* Supabase service role key
* Encryption secret keys
* Private cryptographic parameters
* Database credentials

in frontend code.

---

# 38. ENCRYPTION KEY MANAGEMENT

Do not hardcode encryption keys inside source files.

Create a secure key management strategy appropriate for the prototype.

Separate:

* Public encryption parameters
* Evaluation keys
* Secret decryption key

The secret key must only be accessible to authorized backend processes.

Do not store private keys in the database as ordinary plaintext.

For a prototype, document the chosen key management approach clearly so it can be explained during project defense.

---

# 39. PROJECT STRUCTURE

Use a clean architecture similar to:

```text
secure-academic-dbms/

├── frontend/
│
├── backend/
│
├── docs/
│
├── database/
│
└── README.md
```

If using a monorepo is appropriate:

```text
apps/
  web/
  api/

packages/
  encryption/
  shared/
```

The final architecture should keep encryption logic clearly separated from UI code.

---

# 40. BACKEND STRUCTURE

Use something similar to:

```text
backend/

src/

├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
│   ├── encryption/
│   ├── academic/
│   ├── results/
│   └── analytics/
├── repositories/
├── validators/
├── types/
├── utils/
└── app.ts
```

Do not put everything inside one massive route file.

---

# 41. ENCRYPTION SERVICE

Create a dedicated encryption service.

Conceptually:

```text
EncryptionService

encryptScore()
encryptValue()
addEncryptedValues()
multiplyEncryptedValue()
decryptValue()
```

Only expose operations that the selected homomorphic encryption scheme genuinely supports.

Do not pretend that arbitrary SQL queries can magically execute over ciphertext.

---

# 42. DATABASE PRINCIPLES

Use:

* Foreign keys
* Unique constraints
* Check constraints
* Proper indexes
* Timestamps
* Appropriate nullable fields
* Referential integrity

Avoid unnecessary duplication.

Use proper relationships between:

```text
Department
    ↓
Programme
    ↓
Student

Course
    ↓
Registration
    ↓
Result
```

---

# 43. AUDIT TRAIL

A small audit system is appropriate because this is a security-focused application.

Record meaningful security-sensitive actions such as:

* Login
* Result submission
* Result modification
* Secure processing
* Result approval
* Unauthorized access attempt

Do not create a giant surveillance system.

Only record actions relevant to security and academic data management.

---

# 44. LEAST IMPORTANT FEATURES

Even the smallest features should be purposeful.

Examples:

### Profile

Allow users to view basic account information.

### Logout

Securely terminate the current session.

### Password recovery

Use Supabase Auth's supported recovery flow.

### Academic session selection

Allow authorized administrators to configure active sessions.

### Semester configuration

Allow administrators to define semesters.

### Pagination

Prevent huge datasets from being loaded at once.

### Confirmation dialogs

Use them before destructive actions.

### Toast notifications

Use them sparingly for successful or failed operations.

These features should support the core system rather than distract from it.

---

# 45. FEATURES TO EXPLICITLY AVOID

Do not implement:

* Chatbot
* AI assistant
* AI-generated recommendations
* Dark mode unless necessary
* Gamification
* Social features
* Notifications center unless genuinely required
* Messaging system
* Forums
* Blog
* Payment system
* Subscription system
* Marketplace
* Unrelated document management
* Fake cybersecurity score
* Fake AI security assistant
* Fake blockchain features
* Cryptocurrency
* Facial recognition
* Fingerprint authentication
* Unrelated attendance systems
* Hostel management
* Library management
* Fee payment
* Medical records
* Transport management

These features would dilute the project.

---

# 46. SYSTEM QUALITY

The final application should feel like something a real institution could realistically use as a prototype.

It must have:

* Consistent spacing
* Consistent typography
* Consistent component design
* Professional tables
* Clear forms
* Good empty states
* Good loading states
* Good error states
* Responsive layouts
* Proper validation
* Proper authorization
* Real database operations
* Real encryption operations
* No fake data presented as real data

---

# 47. DEVELOPMENT APPROACH

Do not generate the entire application blindly in one pass.

Build incrementally.

### Stage 1

Project foundation.

### Stage 2

Supabase integration.

### Stage 3

Authentication.

### Stage 4

Database schema.

### Stage 5

Role-based dashboards.

### Stage 6

Academic management.

### Stage 7

Result processing.

### Stage 8

Homomorphic encryption.

### Stage 9

Secure analytics.

### Stage 10

Security hardening.

### Stage 11

Testing.

### Stage 12

UI refinement.

### Stage 13

Deployment.

At the end of every stage, verify that the implementation actually works before moving forward.

---

# 48. TESTING REQUIREMENTS

Test:

### Authentication

* Correct login
* Incorrect login
* Logout
* Session persistence
* Unauthorized access

### Authorization

* Student accessing another student's result
* Lecturer accessing another lecturer's course
* Student attempting administrative operations

### Academic Data

* Invalid score
* Score above 100
* Negative score
* Duplicate course registration
* Missing course
* Invalid student

### Encryption

* Encryption works
* Decryption works
* Encrypted values are not stored as plaintext
* Homomorphic addition produces the correct result
* Invalid encrypted operations fail safely

### Database

* Foreign key integrity
* Duplicate prevention
* RLS policies
* Unauthorized queries

---

# 49. DEMONSTRATION SCENARIO FOR PROJECT DEFENSE

The finished system should support a simple but powerful demonstration.

### Step 1

Login as lecturer.

### Step 2

Open assigned course.

### Step 3

Select student.

### Step 4

Enter:

```text
CA = 28
Exam = 63
```

### Step 5

Submit result.

### Step 6

System encrypts the values.

### Step 7

Show that the database contains encrypted representations rather than plaintext academic scores.

### Step 8

Request total score.

### Step 9

Backend performs homomorphic addition.

### Step 10

Authorized process decrypts the result.

### Step 11

Display:

```text
Total = 91
```

### Step 12

Demonstrate an aggregate operation where supported.

This single demonstration should make the project's contribution immediately understandable.

---

# 50. FINAL DESIGN PHILOSOPHY

The application should follow one principle:

> **Build less, but build it exceptionally well.**

Every page must answer:

**Why does this page exist?**

Every feature must answer:

**How does this support secure academic data processing?**

Every UI element must answer:

**Does this improve usability or communicate meaningful information?**

If the answer is no, remove it.

The final result should feel:

**Professional. Calm. Secure. Academic. Modern. Purposeful.**

It should look like a serious software engineering project designed by an experienced product designer, not an AI-generated template.

The UI should never attempt to impress through excessive visual effects. It should impress through **clarity, hierarchy, consistency, usability, and the quality of the working functionality**.

Most importantly, the application must not merely claim to use homomorphic encryption. The implementation must actually demonstrate the research contribution:

> **Sensitive academic data remains encrypted while selected academic computations are performed on that encrypted data.**

That principle is the heart of the entire project.
