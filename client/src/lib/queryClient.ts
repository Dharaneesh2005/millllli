import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * API request specifically for admin-related endpoints that need authentication
 */
export async function adminApiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get admin session ID from sessionStorage
  const sessionId = sessionStorage.getItem("adminSessionId");
  
  // Prepare headers with session ID if available
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  // Try session-based auth first
  if (sessionId) {
    headers["admin-session-id"] = sessionId;
  }
  
  // Add admin key if available (for serverless environments like Vercel)
  const adminKey = import.meta.env.VITE_ADMIN_KEY;
  if (adminKey) {
    headers["x-admin-key"] = adminKey;
    console.log("Added admin key to request");
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

/**
 * Query function for admin endpoints that need to include the session ID
 * Also supports admin key authentication for serverless environments
 */
export const getAdminQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get admin session ID from sessionStorage
    const sessionId = sessionStorage.getItem("adminSessionId");
    const isAdminAuth = sessionStorage.getItem("adminAuthenticated") === "true";
    
    console.log("getAdminQueryFn executing with:", { 
      sessionId, 
      isAdminAuth, 
      queryKey 
    });
    
    // If we don't have a session ID and we're not authenticated, return null early
    // But only if we also don't have an admin key available
    const adminKey = import.meta.env.VITE_ADMIN_KEY;
    if (!sessionId && !isAdminAuth && !adminKey && unauthorizedBehavior === "returnNull") {
      console.log("No admin authentication found, returning null");
      return null;
    }
    
    // Prepare headers with session ID if available
    const headers: Record<string, string> = {};
    
    // Try session-based auth first
    if (sessionId) {
      headers["admin-session-id"] = sessionId;
    }
    
    // Add admin key if available (for serverless environments like Vercel)
    if (adminKey) {
      headers["x-admin-key"] = adminKey;
      console.log("Added admin key to query request");
    }
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers,
      });
  
      console.log(`Admin API response for ${queryKey[0]}:`, { 
        status: res.status,
        ok: res.ok,
      });
  
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        // Clear stored session on 401
        console.log("Received 401, clearing session data");
        sessionStorage.removeItem("adminAuthenticated");
        sessionStorage.removeItem("adminSessionId");
        return null;
      }
  
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error("Error in admin query function:", error);
      
      // If we should return null on error with 401-related errors
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
