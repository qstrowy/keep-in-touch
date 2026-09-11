import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";
import { getE2ETestUser } from "@/lib/auth/e2e-session";
import { shouldRedirectUnauthenticated } from "@/lib/auth/route-access";

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

  if (shouldRedirectUnauthenticated(context.url.pathname, context.locals.user)) {
    return context.redirect("/auth/signin");
  }

  return next();
});
