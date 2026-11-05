export const apiUrl = import.meta.env.VITE_API_URL || "";

/**
 * POSTs JSON to the Apps Script web app. Content-Type is text/plain on purpose: it is a
 * "simple" request, so the browser skips the CORS preflight that Apps Script can't answer.
 * Throws if the request fails or the script reports ok:false.
 */
export async function postToApi(body: Record<string, unknown>): Promise<void> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json().catch(() => null);
  if (!data || data.ok !== true) throw new Error("API rejected the submission");
}
