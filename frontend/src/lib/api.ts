const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ??
  'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }

  return (await response.json()) as T;
}

export async function apiBlob(
  path: string,
  options: RequestInit = {},
): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }

  return {
    blob: await response.blob(),
    filename: extractFilename(response) ?? 'download.pdf',
  };
}

async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message;

    return message ?? body.error ?? fallback;
  } catch {
    return fallback;
  }
}

function extractFilename(response: Response): string | undefined {
  const disposition = response.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="([^"]+)"/);

  return match?.[1];
}
