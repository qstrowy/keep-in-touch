import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";
import { getE2ETestUser } from "@/lib/auth/e2e-session";

const PROTECTED_ROUTES = ["/dashboard"];

export const onRequest = defineMiddleware(async (context, next) => {
  const e2eTestUser = getE2ETestUser(context.request);
  if (e2eTestUser) {
    context.locals.user = e2eTestUser;
  } else {
    const supabase = createClient(context.request.headers, context.cookies);

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      context.locals.user = user ?? null;
    } else {
      context.locals.user = null;
    }
  }

  if (PROTECTED_ROUTES.some((route) => context.url.pathname.startsWith(route))) {
    if (!context.locals.user) {
      return context.redirect("/auth/signin");
    }
  }

  return next();
});
