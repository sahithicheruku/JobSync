import "server-only";

export function isDemoUser(_userId?: string, email?: string | null) {
  const demoEmail = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  return Boolean(demoEmail && email?.trim().toLowerCase() === demoEmail);
}
