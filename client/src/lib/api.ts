// COMPLETELY REPLACE WITH:
"use client";

// No more refresh logic needed in frontend!
export async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    credentials: "include",  // Always send cookies
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
    },
  });

  // If unauthorized, refresh will happen automatically via cookie
  if (res.status === 401) {
    // Try to refresh
    const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/refresh/`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      // Retry original request
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        ...options,
        credentials: "include",
        headers: {
          ...(options.headers || {}),
          "Content-Type": "application/json",
        },
      });
    }
    
    // Refresh failed, redirect to login
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  return res;
}