const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function parseResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  return text ? { message: text } : {};
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await parseResponse(res);
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
}
