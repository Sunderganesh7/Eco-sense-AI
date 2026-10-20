// Base fetch client
const envBase = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://ecomind-ai-5.onrender.com' : '')
).replace(/\/+$/, '');

// Ensure /api/v1 prefix is appended cleanly without duplicate paths
export const API_BASE = envBase
  ? (envBase.endsWith('/api/v1') ? envBase : `${envBase}/api/v1`)
  : '/api/v1';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    let detail = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.message) detail = parsed.message;
      else if (parsed.error?.message) detail = parsed.error.message;
      else if (parsed.detail) detail = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
    } catch (_) {}
    throw new Error(`API Error (${response.status}): ${detail}`);
  }

  return response.json();
}
