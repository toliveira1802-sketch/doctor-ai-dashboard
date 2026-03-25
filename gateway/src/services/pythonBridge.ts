// Hardcoded for local dev - Docker Compose will override via env
const BASE_URL = process.env.PYTHON_SERVICE_URL ?? "http://127.0.0.1:8006";

console.log(`[PythonBridge] URL: ${BASE_URL}`);

export async function callPython<T = any>(
  path: string,
  method: "GET" | "POST" = "POST",
  body?: any
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" && body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Python ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}
