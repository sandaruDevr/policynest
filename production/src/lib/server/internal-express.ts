import "server-only";

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const INTERNAL_SECRET = process.env.INTERNAL_SHARED_SECRET;

/**
 * Call an internal Express endpoint with the shared internal token.
 *
 * Centralizes the secure Next.js -> Express boundary so privileged compute
 * (ingestion, validation, RAG) is never reachable directly from the browser.
 */
export async function callInternalExpress<T = unknown>(
  path: string,
  payload: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  if (!INTERNAL_SECRET) {
    return { ok: false, status: 500, error: "Server not configured" };
  }

  try {
    const res = await fetch(`${EXPRESS_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": INTERNAL_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, error: text || "Upstream error" };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    console.error(`Internal Express call failed (${path}):`, err);
    return { ok: false, status: 502, error: "Failed to reach backend" };
  }
}

/**
 * Forward a multipart file upload to an internal Express endpoint.
 * Used for document extraction (pdf/docx -> text).
 */
export async function forwardFileToExpress(
  path: string,
  file: File,
): Promise<{ ok: true; data: { text: string; filename: string; size: number; mimetype: string } } | { ok: false; status: number; error: string }> {
  if (!INTERNAL_SECRET) {
    return { ok: false, status: 500, error: "Server not configured" };
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${EXPRESS_URL}${path}`, {
      method: "POST",
      headers: {
        "X-Internal-Token": INTERNAL_SECRET,
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, error: text || "Upstream error" };
    }

    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    console.error(`Internal Express file forward failed (${path}):`, err);
    return { ok: false, status: 502, error: "Failed to reach backend" };
  }
}
