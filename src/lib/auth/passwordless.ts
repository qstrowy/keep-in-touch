const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CHECK_EMAIL_PATH = "/auth/check-email";
export const SIGN_IN_PATH = "/auth/signin";
export const MAGIC_LINK_REQUEST_ERROR = "We couldn't send a sign-in link. Please try again.";
export const MAGIC_LINK_RETRY_ERROR = "This sign-in link is invalid or has expired. Request a new one.";
export const PRIVATE_START_PATH = "/dashboard";

export interface MagicLinkCodeExchange {
  exchangeCodeForSession(code: string): Promise<{ error: unknown }>;
}

export interface MagicLinkRequester {
  signInWithOtp(input: {
    email: string;
    options: {
      emailRedirectTo: string;
      shouldCreateUser: true;
    };
  }): Promise<{ error: unknown }>;
}

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

export async function requestMagicLink(
  email: string,
  origin: string,
  magicLinkRequester: MagicLinkRequester | null,
): Promise<string> {
  if (!magicLinkRequester) {
    return signInErrorPath(MAGIC_LINK_REQUEST_ERROR);
  }

  try {
    const { error } = await magicLinkRequester.signInWithOtp({
      email,
      options: {
        emailRedirectTo: magicLinkCallbackUrl(origin),
        shouldCreateUser: true,
      },
    });

    return error ? signInErrorPath(MAGIC_LINK_REQUEST_ERROR) : CHECK_EMAIL_PATH;
  } catch {
    return signInErrorPath(MAGIC_LINK_REQUEST_ERROR);
  }
}

export async function completeMagicLinkSignIn(
  code: string | null,
  codeExchange: MagicLinkCodeExchange | null,
): Promise<string> {
  if (!code || !codeExchange) {
    return signInErrorPath(MAGIC_LINK_RETRY_ERROR);
  }

  try {
    const { error } = await codeExchange.exchangeCodeForSession(code);
    return error ? signInErrorPath(MAGIC_LINK_RETRY_ERROR) : PRIVATE_START_PATH;
  } catch {
    return signInErrorPath(MAGIC_LINK_RETRY_ERROR);
  }
}
