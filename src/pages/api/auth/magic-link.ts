import type { APIRoute } from "astro";
import { normalizeEmail, requestMagicLink, signInErrorPath } from "@/lib/auth/passwordless";
import { createClient } from "@/lib/supabase";

const INVALID_EMAIL_ERROR = "Enter a valid email address.";

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const email = normalizeEmail(form.get("email"));

  if (!email) {
    return context.redirect(signInErrorPath(INVALID_EMAIL_ERROR));
  }

  const supabase = createClient(context.request.headers, context.cookies);
  const destination = await requestMagicLink(email, context.url.origin, supabase?.auth ?? null);
  return context.redirect(destination);
};
