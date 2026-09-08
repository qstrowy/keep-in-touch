import type { APIRoute } from "astro";
import { completeMagicLinkSignIn } from "@/lib/auth/passwordless";
import { createClient } from "@/lib/supabase";

export const GET: APIRoute = async (context) => {
  const code = context.url.searchParams.get("code");
  const supabase = createClient(context.request.headers, context.cookies);

  const destination = await completeMagicLinkSignIn(code, supabase?.auth ?? null);
  return context.redirect(destination);
};
