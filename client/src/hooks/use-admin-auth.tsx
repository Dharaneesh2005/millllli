import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { adminApiRequest, getAdminQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Type for admin user data
interface AdminUser {
  userId: number;
  username: string;
  isAdmin: boolean;
}

// Admin auth context type
interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logoutMutation: UseMutationResult<void, Error, void>;
}

// Create context
const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

// Provider component
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("adminAuthenticated") === "true";
  });

  // Debug session state
  useEffect(() => {
    console.log("AdminAuthProvider initial state:", { 
      isAuthenticated,
      sessionId: sessionStorage.getItem("adminSessionId"),
      adminAuthenticated: sessionStorage.getItem("adminAuthenticated")
    });
  }, []);

  // Check if admin session is valid
  const {
    data,
    isLoading,
    refetch,
  } = useQuery<{ success: boolean; authenticated: boolean; isAdmin: boolean; userId: number; username: string } | null>({
    queryKey: ["/api/admin/session"],
    queryFn: getAdminQueryFn({ on401: "returnNull" }),
    enabled: true, // Always check session status
    retry: false,
    refetchOnWindowFocus: true,
  });
  
  // Debug query result
  useEffect(() => {
    console.log("Admin session query result:", data);
  }, [data]);
  
  // Convert API response to AdminUser format
  const adminUser: AdminUser | null = data && data.success && data.authenticated ? {
    userId: data.userId,
    username: data.username,
    isAdmin: data.isAdmin
  } : null;

  // Effect to update authentication state when data changes
  useEffect(() => {
    if (adminUser && adminUser.isAdmin) {
      console.log("Setting authenticated = true from valid admin user");
      setIsAuthenticated(true);
      sessionStorage.setItem("adminAuthenticated", "true");
    } else if (data && (!data.authenticated || !data.success) && isAuthenticated) {
      // If session check explicitly failed and we thought we were authenticated
      console.log("Setting authenticated = false from failed session check");
      setIsAuthenticated(false);
      sessionStorage.removeItem("adminAuthenticated");
      sessionStorage.removeItem("adminSessionId");
    }
  }, [data, adminUser, isAuthenticated]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await adminApiRequest("POST", "/api/admin/logout");
      // Clear session storage
      sessionStorage.removeItem("adminAuthenticated");
      sessionStorage.removeItem("adminSessionId");
      setIsAuthenticated(false);
    },
    onSuccess: () => {
      // Invalidate the admin session query
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      
      // Still remove session data even if API request fails
      sessionStorage.removeItem("adminAuthenticated");
      sessionStorage.removeItem("adminSessionId");
      setIsAuthenticated(false);
      
      toast({
        title: "Logout error",
        description: "There was an error logging out, but we've cleared your local session",
        variant: "destructive",
      });
    },
  });

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser: adminUser || null,
        isLoading,
        isAuthenticated,
        logoutMutation,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

// Hook to use the admin auth context
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  
  return context;
}