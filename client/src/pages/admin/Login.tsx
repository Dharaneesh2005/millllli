import { useState } from "react";
import { Redirect } from "wouter";
import { z } from "zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Phase 1: Initial login with username/password
const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Phase 2: Two-factor authentication
const otpSchema = z.object({
  token: z.string().min(6, { message: "OTP code must be at least 6 digits" }).max(6)
});

type LoginFormValues = z.infer<typeof loginSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

// For this demo, hardcoded credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "millikit2023";

export default function AdminLogin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if already authenticated
    return sessionStorage.getItem("adminAuthenticated") === "true";
  });
  
  // Determines which form to show: login or 2FA
  const [loginPhase, setLoginPhase] = useState<"credentials" | "otp">("credentials");
  
  // For storing QR code data when setting up 2FA for the first time
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  // Store user ID after successful login for 2FA verification
  const [userId, setUserId] = useState<number | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      token: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      const response = await apiRequest("POST", "/api/admin/login", data);
      const result = await response.json();
      
      if (response.ok) {
        // If 2FA is already set up, proceed to OTP verification
        if (result.otpRequired) {
          setUserId(result.userId);
          setLoginPhase("otp");
          toast({
            title: "2FA Required",
            description: "Please enter the code from your Google Authenticator app",
          });
        }
        // If no 2FA is required (first login or 2FA not enabled)
        else if (result.sessionId) {
          // Store session ID for API requests
          sessionStorage.setItem("adminSessionId", result.sessionId);
          sessionStorage.setItem("adminAuthenticated", "true");
          setIsAuthenticated(true);
          toast({
            title: "Login successful",
            description: "Welcome to the admin dashboard!",
          });
        }
        // If we need to set up OTP first time
        else if (result.success) {
          // Request OTP setup
          const setupResponse = await apiRequest("POST", "/api/admin/setup-otp", {
            userId: result.userId
          });
          const setupResult = await setupResponse.json();
          
          if (setupResponse.ok && setupResult.qrCodeUrl) {
            setQrCode(setupResult.qrCodeUrl);
            setUserId(result.userId);
            setLoginPhase("otp");
            toast({
              title: "2FA Setup Required",
              description: "Please scan the QR code with Google Authenticator app and enter the code",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Setup failed",
              description: setupResult.message || "Failed to set up 2FA",
            });
          }
        }
      } else {
        throw new Error(result.message || "Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
    }
  };
  
  const onOtpSubmit = async (data: OtpFormValues) => {
    try {
      if (!userId) {
        throw new Error("Session expired. Please login again.");
      }
      
      const response = await apiRequest("POST", "/api/admin/verify-otp", {
        userId,
        token: data.token
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Store the admin session ID for future API requests
        if (result.sessionId) {
          sessionStorage.setItem("adminSessionId", result.sessionId);
        }
        
        sessionStorage.setItem("adminAuthenticated", "true");
        setIsAuthenticated(true);
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard!",
        });
      } else {
        throw new Error(result.message || "Invalid verification code");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid verification code",
        variant: "destructive",
      });
    }
  };

  if (isAuthenticated) {
    return <Redirect to="/admin" />;
  }

  // Loading spinner component for button
  const LoadingSpinner = () => (
    <span className="flex items-center">
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {loginPhase === "credentials" ? "Logging in..." : "Verifying..."}
    </span>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-100 p-4">
      <motion.div
        className="max-w-5xl w-full bg-white rounded-2xl overflow-hidden shadow-xl flex"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Login</h1>
              <p className="text-gray-600">
                {loginPhase === "credentials" 
                  ? "Enter your credentials to access the dashboard" 
                  : "Enter the verification code from your authenticator app"}
              </p>
            </div>
            
            {loginPhase === "credentials" ? (
              // Username/Password form
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your username"
                            className="bg-gray-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            className="bg-gray-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loginForm.formState.isSubmitting}
                  >
                    {loginForm.formState.isSubmitting ? <LoadingSpinner /> : "Login"}
                  </Button>
                </form>
              </Form>
            ) : (
              // OTP Verification form
              <div className="space-y-6">
                {/* QR Code display for setup */}
                {qrCode && (
                  <div className="mb-6 flex flex-col items-center">
                    <p className="mb-4 text-sm text-gray-600 text-center">
                      Scan this QR code with Google Authenticator app to set up two-factor authentication:
                    </p>
                    <img 
                      src={qrCode} 
                      alt="Google Authenticator QR Code" 
                      className="mx-auto h-48 w-48 border p-2 rounded-md"
                    />
                  </div>
                )}
                
                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                    <FormField
                      control={otpForm.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter 6-digit code"
                              className="bg-gray-50 text-center tracking-widest text-lg font-mono"
                              maxLength={6}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col space-y-2">
                      <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={otpForm.formState.isSubmitting}
                      >
                        {otpForm.formState.isSubmitting ? <LoadingSpinner /> : "Verify"}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setLoginPhase("credentials");
                          setQrCode(null);
                          setUserId(null);
                        }}
                      >
                        Back to Login
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </motion.div>
        </div>

        {/* Hero Section */}
        <motion.div 
          className="hidden md:block md:w-1/2 bg-green-600 text-white p-12 relative"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Millikit Admin Panel</h2>
            <p className="mb-6">Manage your products, check orders, and grow your millet business with our powerful admin tools.</p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Manage your product catalog</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Track customer orders</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>View analytics and reports</span>
              </li>
            </ul>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-yellow-400 rounded-full opacity-20"></div>
          <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-green-800 rounded-full opacity-20"></div>
        </motion.div>
      </motion.div>
    </div>
  );
}