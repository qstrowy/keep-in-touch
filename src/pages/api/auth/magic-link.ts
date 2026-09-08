import type { APIRoute } from "astro";
import {
  CHECK_EMAIL_PATH,
  MAGIC_LINK_REQUEST_ERROR,
  magicLinkCallbackUrl,
  normalizeEmail,
  signInErrorPath,
} from "@/lib/auth/passwordless";
import { createClient } from "@/lib/supabase";

const INVALID_EMAIL_ERROR = "Enter a valid email address.";

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const email = normalizeEmail(form.get("email"));

  if (!email) {
    return context.redirect(signInErrorPath(INVALID_EMAIL_ERROR));
  }

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return context.redirect(signInErrorPath(MAGIC_LINK_REQUEST_ERROR));
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: magicLinkCallbackUrl(context.url.origin),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return context.redirect(signInErrorPath(MAGIC_LINK_REQUEST_ERROR));
  }

  return context.redirect(CHECK_EMAIL_PATH);
};
