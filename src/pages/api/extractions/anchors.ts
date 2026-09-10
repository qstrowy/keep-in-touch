import { OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_PROVIDER } from "astro:env/server";
import type { APIRoute } from "astro";

import { handleExtractionRequest } from "@/lib/extraction/endpoint";
import { createOpenRouterExtractor, type OpenRouterExtractionDiagnosticEvent } from "@/lib/extraction/openrouter";
import { createClient } from "@/lib/supabase";

const extractor = createOpenRouterExtractor({
  apiKey: environmentString(OPENROUTER_API_KEY),
  model: environmentString(OPENROUTER_MODEL),
  provider: environmentString(OPENROUTER_PROVIDER),
});

export const POST: APIRoute = async (context) => {
  const requestId = import.meta.env.DEV ? crypto.randomUUID() : undefined;
  reportLocalDiagnostic(requestId, { stage: "relay_received" });

  return handleExtractionRequest(context.request, {
    origin: context.url.origin,
    async authenticate() {
      reportLocalDiagnostic(requestId, { stage: "authentication_started" });
      const supabase = createClient(context.request.headers, context.cookies);
      if (!supabase) {
        reportLocalDiagnostic(requestId, { stage: "authentication_unavailable" });
        return false;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const authenticated = Boolean(user);
        reportLocalDiagnostic(requestId, {
          stage: authenticated ? "authentication_succeeded" : "authentication_rejected",
        });
        return authenticated;
      } catch {
        reportLocalDiagnostic(requestId, { stage: "authentication_unavailable" });
        return false;
      }
    },
    async extract(request) {
      reportLocalDiagnostic(requestId, { stage: "provider_handoff_started" });
      const result = await extractor.extract(
        request,
        requestId
          ? {
              requestId,
              httpReferer: context.url.origin,
              report: reportOpenRouterDiagnostic,
            }
          : undefined,
      );
      reportLocalDiagnostic(requestId, {
        stage: "provider_handoff_finished",
        outcome: result.ok ? "success" : result.error,
      });
      return result;
    },
  });
};

function environmentString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function reportOpenRouterDiagnostic(event: OpenRouterExtractionDiagnosticEvent): void {
  // eslint-disable-next-line no-console -- Development-only, privacy-safe relay diagnostics.
  console.info("[extraction diagnostic]", JSON.stringify(event));
}

function reportLocalDiagnostic(requestId: string | undefined, event: Record<string, string>): void {
  if (!requestId) return;
  // eslint-disable-next-line no-console -- Development-only, privacy-safe relay diagnostics.
  console.info("[extraction diagnostic]", JSON.stringify({ requestId, ...event }));
}
