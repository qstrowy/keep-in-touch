import { OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_PROVIDER } from "astro:env/server";
import type { APIRoute } from "astro";

import { handleExtractionRequest } from "@/lib/extraction/endpoint";
import { createOpenRouterExtractor } from "@/lib/extraction/openrouter";
import { createClient } from "@/lib/supabase";

const extractor = createOpenRouterExtractor({
  apiKey: environmentString(OPENROUTER_API_KEY),
  model: environmentString(OPENROUTER_MODEL),
  provider: environmentString(OPENROUTER_PROVIDER),
});

export const POST: APIRoute = async (context) =>
  handleExtractionRequest(context.request, {
    origin: context.url.origin,
    async authenticate() {
      const supabase = createClient(context.request.headers, context.cookies);
      if (!supabase) {
        return false;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        return Boolean(user);
      } catch {
        return false;
      }
    },
    extract: (request) => extractor.extract(request),
  });

function environmentString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
