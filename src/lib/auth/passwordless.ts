const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CHECK_EMAIL_PATH = "/auth/check-email";
export const SIGN_IN_PATH = "/auth/signin";
export const MAGIC_LINK_REQUEST_ERROR = "We couldn't send a sign-in link. Please try again.";

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function normalizeEmail(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return isValidEmail(email) ? email : null;
}

export function magicLinkCallbackUrl(origin: string): string {
  return new URL("/api/auth/callback", origin).toString();
}

export function signInErrorPath(message: string): string {
  return `${SIGN_IN_PATH}?error=${encodeURIComponent(message)}`;
}
