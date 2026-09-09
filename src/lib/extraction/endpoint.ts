import {
  MAX_COMBINED_EXTRACTION_NOTE_LENGTH,
  parseExtractionRequest,
  type ExtractionCandidateResponse,
  type ExtractionRequest,
} from "./contract";
import type { OpenRouterExtractionResult } from "./openrouter";

export const MAX_EXTRACTION_REQUEST_BYTES = 25_000;

export interface ExtractionEndpointDependencies {
  origin: string;
  authenticate(): Promise<boolean>;
  extract(request: ExtractionRequest): Promise<OpenRouterExtractionResult>;
}

export async function handleExtractionRequest(
  request: Request,
  dependencies: ExtractionEndpointDependencies,
): Promise<Response> {
  if (request.method !== "POST") {
    return errorResponse("not_found", 405);
  }
  if (request.headers.get("Origin") !== dependencies.origin) {
    return errorResponse("forbidden", 403);
  }
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse("invalid_request", 415);
  }

  const contentLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_EXTRACTION_REQUEST_BYTES) {
    return errorResponse("invalid_request", 413);
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return errorResponse("invalid_request", 400);
  }
  if (new TextEncoder().encode(body).byteLength > MAX_EXTRACTION_REQUEST_BYTES) {
    return errorResponse("invalid_request", 413);
  }

  const extractionRequest = parseExtractionRequest(parseJson(body), MAX_COMBINED_EXTRACTION_NOTE_LENGTH);
  if (!extractionRequest) {
    return errorResponse("invalid_request", 400);
  }

  let authenticated = false;
  try {
    authenticated = await dependencies.authenticate();
  } catch {
    authenticated = false;
  }
  if (!authenticated) {
    return errorResponse("unauthorized", 401);
  }

  const result = await dependencies.extract(extractionRequest);
  if (result.ok) {
    return jsonResponse(result.response, 200);
  }

  return errorResponse(
    result.error,
    result.error === "timeout" ? 504 : result.error === "invalid_response" ? 502 : 503,
  );
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

function errorResponse(error: string, status: number): Response {
  return jsonResponse({ error }, status);
}

function jsonResponse(body: ExtractionCandidateResponse | { error: string }, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
