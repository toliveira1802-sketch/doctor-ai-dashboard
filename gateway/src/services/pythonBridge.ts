import { config } from "../config/env.js";

const BASE_URL = config.pythonServiceUrl;

export async function callPython<T = any>(
  path: string,
  method: "GET" | "POST" = "POST",
  body?: any
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body && method === "POST") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Python service error (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
}
