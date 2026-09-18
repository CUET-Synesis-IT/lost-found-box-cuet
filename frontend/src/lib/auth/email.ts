const CUET_EMAIL_SUFFIXES = ["@student.cuet.ac.bd", "@cuet.ac.bd"];
const ALLOWED_TEST_EMAILS = ["shamsniloy75@gmail.com"];

/** Returns whether an authenticated email belongs to the CUET community or testing whitelist. */
export function isCuetEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return (
    CUET_EMAIL_SUFFIXES.some((suffix) => normalizedEmail.endsWith(suffix)) ||
    ALLOWED_TEST_EMAILS.includes(normalizedEmail)
  );
}
