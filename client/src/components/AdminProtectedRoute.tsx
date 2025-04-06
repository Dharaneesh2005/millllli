import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";
import { ReactNode } from "react";

interface AdminProtectedRouteProps extends RouteProps {
  children: ReactNode;
}

/**
 * A route that requires admin authentication
 * Redirects to login page if not authenticated
 */
export function AdminProtectedRoute({ children, ...rest }: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading, adminUser } = useAdminAuth();
  
  // For debugging only
  console.log("AdminProtectedRoute:", { 
    isAuthenticated, 
    isLoading, 
    adminUser, 
    sessionStorageAuth: sessionStorage.getItem("adminAuthenticated"),
    path: rest.path
  });
  
  return (
    <Route
      {...rest}
      component={() => {
        // Show loading spinner while checking authentication
        if (isLoading) {
          return (
            <div className="flex justify-center items-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          );
        }
        
        // Check if we have a session ID in storage
        const sessionId = sessionStorage.getItem("adminSessionId");
        const isAdminAuth = sessionStorage.getItem("adminAuthenticated") === "true";
        
        // If we have session ID but no authenticated state yet, show loading
        if (sessionId && isAdminAuth && !adminUser) {
          return (
            <div className="flex justify-center items-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          );
        }
        
        // Redirect to login if not authenticated
        if (!isAuthenticated || !isAdminAuth) {
          return <Redirect to="/admin/login" />;
        }
        
        // Redirect to home if authenticated but not admin
        if (adminUser && !adminUser.isAdmin) {
          return <Redirect to="/" />;
        }
        
        // Render the protected content
        return <>{children}</>;
      }}
    />
  );
}