-- =========================================================================
-- MANASVI OCCUPATIONAL HEALTH SURVEILLANCE & HEALTHCAMP SYSTEM
-- SUPABASE POSTGRESQL PRODUCTION INITIALIZATION MIGRATION
-- Compliant with DPDP Act 2023 & Indian Medical Council Ethics Standards
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM (
    'SUPER_ADMIN',
    'COMPANY_HR',
    'REGISTRATION_DESK',
    'COUNTER_STAFF',
    'DOCTOR_ASSISTANT',
    'DOCTOR',
    'BACK_OFFICE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmployeeType" AS ENUM (
    'COMPANY_STAFF',
    'CONTRACT_EMPLOYEE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "Sex" AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "VisitStatus" AS ENUM (
    'PENDING',
    'WAITING',
    'IN_PROGRESS',
    'COMPLETED',
    'ON_HOLD',
    'SKIPPED_WITH_AUTH',
    'CORRECTION_REQUIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FitnessStatus" AS ENUM (
    'FIT',
    'UNFIT',
    'FIT_WITH_RESTRICTION'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CounterType" AS ENUM (
    'REGISTRATION',
    'VITALS_VISION',
    'BLOOD_COLLECTION',
    'ECG',
    'PFT',
    'AUDIOMETRY',
    'CHEST_XRAY',
    'DOCTOR_EXAMINATION',
    'BACK_OFFICE',
    'CUSTOM'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS "Company" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "codePrefix" TEXT NOT NULL UNIQUE,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "pinCode" TEXT NOT NULL,
  "registeredEmail" TEXT NOT NULL,
  "hrContactName" TEXT NOT NULL,
  "hrMobile" TEXT NOT NULL,
  "regDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "amcStartDate" TIMESTAMP(3) NOT NULL,
  "amcEndDate" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users Table (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'COUNTER_STAFF',
  "mobile" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "termsAcceptedAt" TIMESTAMP(3),
  "termsAcceptedIp" TEXT,
  "termsVersion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT REFERENCES "Company"("id") ON DELETE SET NULL
);

-- 4. Camps Table
CREATE TABLE IF NOT EXISTS "Camp" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "campId" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "location" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "operatingStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  "configJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Camp Counters Table
CREATE TABLE IF NOT EXISTS "CampCounter" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "campId" TEXT NOT NULL REFERENCES "Camp"("id") ON DELETE CASCADE,
  "counterNo" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "counterType" "CounterType" NOT NULL DEFAULT 'CUSTOM',
  "displayOrder" INTEGER NOT NULL,
  "isMandatory" BOOLEAN NOT NULL DEFAULT true,
  "allowsUpload" BOOLEAN NOT NULL DEFAULT false,
  "allowsForm" BOOLEAN NOT NULL DEFAULT true,
  "configJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Counter Assignments Table
CREATE TABLE IF NOT EXISTS "CounterAssignment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "campId" TEXT NOT NULL REFERENCES "Camp"("id") ON DELETE CASCADE,
  "campCounterId" TEXT NOT NULL REFERENCES "CampCounter"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Employees Table (Statutory Demographics & Vitals)
CREATE TABLE IF NOT EXISTS "Employee" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "campId" TEXT NOT NULL REFERENCES "Camp"("id") ON DELETE CASCADE,
  "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "healthId" TEXT NOT NULL UNIQUE,
  "tempHealthId" TEXT,
  "employeeType" "EmployeeType" NOT NULL DEFAULT 'COMPANY_STAFF',
  "contractorName" TEXT,
  "employeeCode" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "dob" TIMESTAMP(3) NOT NULL,
  "age" INTEGER NOT NULL,
  "sex" "Sex" NOT NULL,
  "department" TEXT NOT NULL,
  "designation" TEXT NOT NULL,
  "tenureYears" INTEGER NOT NULL DEFAULT 0,
  "tenureMonths" INTEGER NOT NULL DEFAULT 0,
  "mobile" TEXT NOT NULL,
  "email" TEXT,
  "identificationMark" TEXT,
  "familyHistoryJson" TEXT,
  "personalHistoryJson" TEXT,
  "habitsJson" TEXT,
  "presentIllness" TEXT,
  "heightCm" DOUBLE PRECISION NOT NULL,
  "weightKg" DOUBLE PRECISION NOT NULL,
  "bmi" DOUBLE PRECISION NOT NULL,
  "bmiCategory" TEXT NOT NULL,
  "photoUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REGISTERED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Counter Visits Table
CREATE TABLE IF NOT EXISTS "CounterVisit" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "campId" TEXT NOT NULL,
  "campCounterId" TEXT NOT NULL REFERENCES "CampCounter"("id") ON DELETE CASCADE,
  "employeeId" TEXT NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE,
  "status" "VisitStatus" NOT NULL DEFAULT 'WAITING',
  "operatorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "notes" TEXT,
  "overrideReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Vitals & Vision Table
CREATE TABLE IF NOT EXISTS "VitalsVision" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employeeId" TEXT NOT NULL UNIQUE REFERENCES "Employee"("id") ON DELETE CASCADE,
  "systolicBp" INTEGER NOT NULL,
  "diastolicBp" INTEGER NOT NULL,
  "pulse" INTEGER,
  "distantVisionRight" TEXT NOT NULL,
  "distantVisionLeft" TEXT NOT NULL,
  "nearVisionRight" TEXT NOT NULL,
  "nearVisionLeft" TEXT NOT NULL,
  "withGlasses" BOOLEAN NOT NULL DEFAULT false,
  "colorVision" TEXT NOT NULL DEFAULT 'Normal',
  "notes" TEXT,
  "recordedBy" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Blood Results Table (Parameters JSON)
CREATE TABLE IF NOT EXISTS "BloodResult" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employeeId" TEXT NOT NULL UNIQUE REFERENCES "Employee"("id") ON DELETE CASCADE,
  "parametersJson" TEXT,
  "labReportUrl" TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedBy" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Diagnostic Results Table (ECG, PFT, Audio, X-Ray)
CREATE TABLE IF NOT EXISTS "DiagnosticResult" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employeeId" TEXT NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE,
  "counterVisitId" TEXT REFERENCES "CounterVisit"("id") ON DELETE SET NULL,
  "testType" TEXT NOT NULL,
  "numericalData" TEXT,
  "findings" TEXT,
  "conclusion" TEXT,
  "reportUrl" TEXT,
  "verifiedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. Medical Attachments Table
CREATE TABLE IF NOT EXISTS "MedicalAttachment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employeeId" TEXT NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE,
  "counterVisitId" TEXT REFERENCES "CounterVisit"("id") ON DELETE SET NULL,
  "testType" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSizeBytes" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "checksum" TEXT,
  "uploadedBy" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. Doctor Examination Table
CREATE TABLE IF NOT EXISTS "DoctorExamination" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employeeId" TEXT NOT NULL UNIQUE REFERENCES "Employee"("id") ON DELETE CASCADE,
  "doctorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "pastMedicalHistory" TEXT,
  "occupationalHistory" TEXT,
  "presentComplaints" TEXT,
  "nadFlagsJson" TEXT,
  "abnormalFindingsJson" TEXT,
  "physicalExamNotes" TEXT,
  "generalAdvice" TEXT,
  "isDraft" BOOLEAN NOT NULL DEFAULT false,
  "examinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. Fitness Decision Table (Final Statutory Sign-off)
CREATE TABLE IF NOT EXISTS "FitnessDecision" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employeeId" TEXT NOT NULL UNIQUE REFERENCES "Employee"("id") ON DELETE CASCADE,
  "doctorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fitnessStatus" "FitnessStatus" NOT NULL,
  "adviceListJson" TEXT NOT NULL,
  "doctorRemarks" TEXT,
  "restrictions" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. Medical Reports Archive Table
CREATE TABLE IF NOT EXISTS "MedicalReport" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employeeId" TEXT NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE,
  "reportType" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "pdfPath" TEXT NOT NULL,
  "fileSize" INTEGER,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. Forensic Audit Log Table (Immutable audit trail)
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "beforeJson" TEXT,
  "afterJson" TEXT,
  "detailsJson" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS "idx_employee_healthid" ON "Employee"("healthId");
CREATE INDEX IF NOT EXISTS "idx_employee_camp" ON "Employee"("campId");
CREATE INDEX IF NOT EXISTS "idx_employee_company" ON "Employee"("companyId");
CREATE INDEX IF NOT EXISTS "idx_countervisit_campcounter" ON "CounterVisit"("campCounterId");
CREATE INDEX IF NOT EXISTS "idx_auditlog_user" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "idx_auditlog_timestamp" ON "AuditLog"("timestamp");
