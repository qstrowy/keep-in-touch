import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";
import { getE2ETestUser, isE2ETestModeEnabled } from "@/lib/auth/e2e-session";
import { shouldRedirectUnauthenticated } from "@/lib/auth/route-access";

export const onRequest = defineMiddleware(async (context, next) => {
  if (isE2ETestModeEnabled()) {
    context.locals.user = getE2ETestUser(context.request);
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

  if (shouldRedirectUnauthenticated(context.url.pathname, context.locals.user)) {
    return context.redirect("/auth/signin");
  }

  return next();
});
