const CUET_EMAIL_SUFFIXES = ["@student.cuet.ac.bd", "@cuet.ac.bd"];

/** Returns whether an authenticated email belongs to the CUET community. */
export function isCuetEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return CUET_EMAIL_SUFFIXES.some((suffix) => normalizedEmail.endsWith(suffix));
}
