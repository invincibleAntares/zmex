/**
 * Error class thrown by apiClient when a request fails or returns an error response.
 */
export class ApiClientError extends Error {
  public status: number;
  public code?: string;
  public details?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Standard shape of ZMEX API responses.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Request options for the API client.
 */
interface RequestOptions extends RequestInit {
  data?: unknown; // JSON body
}

/**
 * Generic typed fetch helper for calling ZMEX backend APIs.
 * Automatically serializes JSON, parses responses, and throws clean ApiClientError.
 */
export async function apiClient<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { data, headers, ...fetchOptions } = options;

  const requestHeaders = new Headers(headers);

  // Set default JSON headers if data is provided
  if (data !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // Set default accept header
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  } catch {
    // Catch absolute network failures (e.g. DNS, connection refused, CORS)
    throw new ApiClientError("Network error. Please check your connection.", 0);
  }

  // Attempt to parse JSON response. Even 4xx/5xx should have standard JSON.
  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new ApiClientError(
      "Received an invalid response from the server.",
      response.status,
    );
  }

  // Handle expected application errors based on the standardized API contract
  if (!response.ok || !json.success) {
    const errorData = json.error;
    throw new ApiClientError(
      errorData?.message || "An unexpected error occurred.",
      response.status,
      errorData?.code || "UNKNOWN_ERROR",
      errorData?.details,
    );
  }

  // Success path: return the nested data object
  return json.data as T;
}
