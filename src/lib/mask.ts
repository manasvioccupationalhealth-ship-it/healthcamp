/**
 * Medicolegal Data Protection & Privacy Masking Utilities
 * Designed to prevent unauthorized data exfiltration, phone number harvesting,
 * and serological test leakage under Indian Digital Personal Data Protection (DPDP) Act 2023
 * and National Medical Commission Ethics Regulations.
 */

/**
 * Masks a 10-digit mobile number so only the first 2 and last 2 digits are visible
 * Example: "9876543210" -> "98******10"
 * Full number is only exposed to SUPER_ADMIN or DOCTOR if explicitly permitted.
 */
export function maskMobileNumber(mobile: string | null | undefined, userRole?: string): string {
  if (!mobile) return "N/A";
  const cleaned = mobile.trim();
  if (cleaned.length < 6) return cleaned;

  // Doctors and Super Admins may view full contact in emergency / tele-consultation
  if (userRole === "SUPER_ADMIN" || userRole === "DOCTOR") {
    return cleaned;
  }

  const start = cleaned.slice(0, 2);
  const end = cleaned.slice(-2);
  const maskedCount = Math.max(cleaned.length - 4, 4);
  return `${start}${"*".repeat(maskedCount)}${end}`;
}

/**
 * Evaluates whether a user role has clinical privilege to inspect ultra-sensitive serological tests
 * (e.g. HIV ELISA/Rapid, HBsAg, HCV, VDRL/Syphilis).
 * Strict non-clinical roles (Counter operators, Registration, Assistant) cannot view raw serological data.
 */
export function hasSerologyAccess(userRole?: string): boolean {
  if (!userRole) return false;
  return ["DOCTOR", "SUPER_ADMIN", "BACK_OFFICE"].includes(userRole);
}

/**
 * Masks ultra-sensitive test findings for unauthorized roles
 */
export function maskSensitiveSerology(testType: string, resultValue: string, userRole?: string): string {
  const sensitiveTests = ["HIV", "HBSAG", "HCV", "VDRL", "SYPHILIS"];
  const upperType = testType.toUpperCase();

  const isSensitive = sensitiveTests.some((t) => upperType.includes(t));
  if (!isSensitive) {
    return resultValue;
  }

  if (hasSerologyAccess(userRole)) {
    return resultValue;
  }

  return "RESTRICTED (DOCTOR PRIVILEGED ONLY)";
}
