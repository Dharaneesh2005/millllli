import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoPath from "@assets/LOGO-removebg-preview.png";

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, Lock, User, KeyRound } from "lucide-react";

// Login Schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// OTP Schema
const otpSchema = z.object({
  token: z.string().min(6, "OTP code must be 6 digits").max(6, "OTP code must be 6 digits"),
});

// Define form types
type LoginFormValues = z.infer<typeof loginSchema>;
type OTPFormValues = z.infer<typeof otpSchema>;

export default function AdminLogin() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Login states
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [otpInputValue, setOtpInputValue] = useState("");
  
  // OTP setup states
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [otpSecret, setOtpSecret] = useState<string | null>(null);
  const [setupOtpInputValue, setSetupOtpInputValue] = useState("");
  const [needsCurrentOtp, setNeedsCurrentOtp] = useState(false);
  const [currentOtpInputValue, setCurrentOtpInputValue] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  
  // Setup the login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "admin", // Use the predefined admin username
      password: "",
    },
  });
  
  // Setup the OTP form
  const otpForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      token: "",
    },
  });
  
  // Reset all form states to clean state
  const resetAllForms = () => {
    setShowOtpForm(false);
    setUserId(null);
    setQrCodeUrl(null);
    setOtpSecret(null);
    setOtpInputValue("");
    setSetupOtpInputValue("");
    setNeedsCurrentOtp(false);
    setCurrentOtpInputValue("");
    loginForm.reset({ username: "admin", password: "" });
    otpForm.reset({ token: "" });
  };

  // Handle login submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    try {
      const response = await apiRequest("POST", "/api/admin/login", data);
      const result = await response.json();
      
      if (result.otpRequired) {
        // User has OTP enabled, show OTP form
        setUserId(result.userId);
        // Reset OTP form to make sure it's clean
        otpForm.reset({ token: "" });
        setShowOtpForm(true);
        toast({
          title: "OTP Required",
          description: "Please enter your Google Authenticator code",
        });
      } else if (result.success) {
        // No OTP required, directly log in
        // Store admin session ID in sessionStorage
        sessionStorage.setItem("adminSessionId", result.sessionId);
        sessionStorage.setItem("adminAuthenticated", "true");
        
        toast({
          title: "Login successful",
          description: "Welcome to admin dashboard",
        });
        navigate("/admin");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Handle OTP submission
  const onOtpSubmit = async (data: OTPFormValues) => {
    if (!userId) return;
    
    setIsLoggingIn(true);
    try {
      const response = await apiRequest("POST", "/api/admin/verify-otp", {
        userId,
        token: data.token,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Store the admin session ID in sessionStorage
        sessionStorage.setItem("adminSessionId", result.sessionId);
        sessionStorage.setItem("adminAuthenticated", "true");
        
        toast({
          title: "Login successful",
          description: "Welcome to admin dashboard",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Verification failed",
          description: "Invalid or expired OTP code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification failed",
        description: "An error occurred during OTP verification",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Setup Admin 2FA
  const setupAdminOTP = async (currentOtp?: string) => {
    setIsLoggingIn(true);
    try {
      // Get admin credentials
      const credentials = loginForm.getValues();
      
      console.log("Setting up OTP with current token:", currentOtp);
      
      // Generate OTP secret and QR code for the predefined admin user
      const setupResponse = await apiRequest("POST", "/api/admin/setup-otp", {
        username: credentials.username,
        password: credentials.password,
        currentOtpToken: currentOtp // Include current OTP if provided
      });
      
      const setupResult = await setupResponse.json();
      console.log("Setup OTP response:", setupResult);
      
      if (setupResult.success) {
        setUserId(setupResult.userId);
        setQrCodeUrl(setupResult.qrCodeUrl);
        setOtpSecret(setupResult.secret);
        setNeedsCurrentOtp(false); // Reset this state
        setActiveTab("setup");
        
        // Show different toast messages depending on whether 2FA is being reconfigured
        if (setupResult.alreadyEnabled) {
          toast({
            title: "Reconfiguring 2FA",
            description: "Scan new QR code with Google Authenticator to update your 2FA",
          });
        } else {
          toast({
            title: "Setup initialized",
            description: "Scan the QR code with Google Authenticator",
          });
        }
      } else if (setupResult.needsCurrentOtp) {
        // User already has OTP enabled, need to verify current OTP before generating new one
        setUserId(setupResult.userId);
        setNeedsCurrentOtp(true);
        
        toast({
          title: "Verification Required",
          description: "Please enter your current Google Authenticator code to reconfigure 2FA",
        });
      } else {
        throw new Error(setupResult.message || "Failed to setup OTP");
      }
    } catch (error: any) {
      console.error("Setup error:", error);
      toast({
        title: "Setup failed",
        description: error.message || "An error occurred during OTP setup",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Handle OTP verification after setup
  const onSetupVerifySubmit = async (data: OTPFormValues) => {
    if (!userId || !otpSecret) return;
    
    setIsLoggingIn(true);
    try {
      const response = await apiRequest("POST", "/api/admin/verify-setup", {
        userId,
        token: data.token,
        secret: otpSecret,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "OTP setup complete",
          description: "You can now log in with Google Authenticator",
        });
        setQrCodeUrl(null);
        setOtpSecret(null);
        setActiveTab("login");
        
        // Reset forms
        setOtpInputValue("");
        setSetupOtpInputValue("");
        loginForm.reset({ username: "admin", password: "" });
        otpForm.reset({ token: "" });
      } else {
        toast({
          title: "Verification failed",
          description: "Invalid OTP code. Try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Setup verification error:", error);
      toast({
        title: "Verification failed",
        description: "An error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.img
            src={logoPath}
            alt="Millikit Logo"
            className="h-20 mx-auto mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.h1 
            className="text-3xl font-bold text-green-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Admin Portal
          </motion.h1>
        </div>
        
        <Card className="shadow-lg border-green-100">
          <CardHeader className="bg-green-700 text-white rounded-t-lg">
            <CardTitle className="text-xl flex items-center">
              <Lock className="mr-2" />
              Secure Admin Access
            </CardTitle>
            <CardDescription className="text-green-100">
              Login with admin credentials and Google Authenticator
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => {
                setActiveTab(value);
                // Reset forms when switching tabs
                resetAllForms();
              }} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="setup">Set up 2FA</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0">
                {!showOtpForm ? (
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input 
                                  placeholder="Enter your username" 
                                  className="pl-10" 
                                  {...field} 
                                  disabled
                                />
                              </div>
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
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                  type="password"
                                  placeholder="Enter your password"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Verification Required</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        Please enter the 6-digit code from your Google Authenticator app
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Authentication Code
                      </label>
                      <div className="relative mt-2">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Enter 6-digit code"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 text-center tracking-widest text-lg"
                          maxLength={6}
                          value={otpInputValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value) && value.length <= 6) {
                              setOtpInputValue(value);
                              otpForm.setValue("token", value);
                            }
                          }}
                        />
                      </div>
                      {otpForm.formState.errors.token && (
                        <p className="text-sm font-medium text-destructive">
                          {otpForm.formState.errors.token.message}
                        </p>
                      )}
                      {otpForm.getValues().token && otpForm.getValues().token.length !== 6 && (
                        <p className="text-sm font-medium text-destructive">
                          OTP code must be 6 digits
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowOtpForm(false);
                          resetAllForms();
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        disabled={isLoggingIn || otpForm.getValues().token.length !== 6}
                        onClick={async () => {
                          if (!userId) return;
                          setIsLoggingIn(true);
                          try {
                            const response = await apiRequest("POST", "/api/admin/verify-otp", {
                              userId,
                              token: otpForm.getValues().token,
                            });
                            
                            const result = await response.json();
                            console.log("OTP verification result:", result);
                            
                            if (result.success) {
                              // Store session ID in sessionStorage
                              sessionStorage.setItem("adminSessionId", result.sessionId);
                              sessionStorage.setItem("adminAuthenticated", "true");
                              
                              toast({
                                title: "Login successful",
                                description: "Welcome to admin dashboard",
                              });
                              
                              // Use window.location to force a full page reload
                              window.location.href = "/admin";
                            } else {
                              toast({
                                title: "Verification failed",
                                description: "Invalid or expired OTP code",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            console.error("OTP verification error:", error);
                            toast({
                              title: "Verification failed",
                              description: "An error occurred during OTP verification",
                              variant: "destructive",
                            });
                          } finally {
                            setIsLoggingIn(false);
                          }
                        }}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="setup" className="mt-0">
                {needsCurrentOtp ? (
                  // When admin needs to verify current OTP before reconfiguring
                  <div className="space-y-4">
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Verification Required</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        Please enter your current Google Authenticator code to reconfigure 2FA
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Current Authentication Code
                      </label>
                      <div className="relative mt-2">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Enter your current 6-digit code"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 text-center tracking-widest text-lg"
                          maxLength={6}
                          value={currentOtpInputValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value) && value.length <= 6) {
                              setCurrentOtpInputValue(value);
                            }
                          }}
                        />
                      </div>
                      {currentOtpInputValue && currentOtpInputValue.length !== 6 && (
                        <p className="text-sm font-medium text-destructive">
                          OTP code must be 6 digits
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setNeedsCurrentOtp(false);
                          resetAllForms();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        disabled={isLoggingIn || currentOtpInputValue.length !== 6}
                        onClick={() => {
                          setupAdminOTP(currentOtpInputValue);
                        }}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify & Continue"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : !qrCodeUrl ? (
                  <Form {...loginForm}>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (loginForm.getValues().username === "admin" && 
                          loginForm.getValues().password === "millikit2023") {
                        setupAdminOTP();
                      } else {
                        toast({
                          title: "Authentication Failed",
                          description: "You must enter valid admin credentials to setup 2FA",
                          variant: "destructive",
                        });
                      }
                    }} className="space-y-4">
                      <Alert className="bg-blue-50 border-blue-200 mb-4">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">2FA Setup</AlertTitle>
                        <AlertDescription className="text-blue-700">
                          Set up Google Authenticator for secure admin access
                        </AlertDescription>
                      </Alert>
                      
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input 
                                  placeholder="Enter admin username" 
                                  className="pl-10" 
                                  {...field} 
                                  disabled
                                />
                              </div>
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
                            <FormLabel>Admin Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                  type="password"
                                  placeholder="Enter admin password"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Enter admin credentials to generate a QR code that you can scan with the Google Authenticator app.
                      </p>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Generate QR Code"
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-6">
                    <Alert className="bg-green-50 border-green-200">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Scan QR Code</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Scan this QR code with the Google Authenticator app on your phone. 
                        {userId === 1 && "This will update your existing 2FA configuration if you already have one."}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-white">
                      <div className="mb-4">
                        <img
                          src={qrCodeUrl}
                          alt="Google Authenticator QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-500 mb-1">Can't scan the QR code?</p>
                        <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                          {otpSecret}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Verification Code
                        </label>
                        <div className="relative mt-2">
                          <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Enter the 6-digit code"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 text-center tracking-widest text-lg"
                            maxLength={6}
                            value={setupOtpInputValue}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*$/.test(value) && value.length <= 6) {
                                setSetupOtpInputValue(value);
                                otpForm.setValue("token", value);
                              }
                            }}
                          />
                        </div>
                        {otpForm.getValues().token && otpForm.getValues().token.length !== 6 && (
                          <p className="text-sm font-medium text-destructive">
                            OTP code must be 6 digits
                          </p>
                        )}
                      </div>
                      
                      <Button
                        type="button"
                        className="w-full"
                        disabled={isLoggingIn || otpForm.getValues().token.length !== 6}
                        onClick={async () => {
                          if (!userId || !otpSecret) return;
                          
                          setIsLoggingIn(true);
                          try {
                            const response = await apiRequest("POST", "/api/admin/verify-setup", {
                              userId,
                              token: otpForm.getValues().token,
                              secret: otpSecret,
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                              toast({
                                title: "OTP setup complete",
                                description: userId === 1 && qrCodeUrl ? 
                                  "Your Google Authenticator configuration has been updated successfully" : 
                                  "You can now log in with Google Authenticator",
                              });
                              setQrCodeUrl(null);
                              setOtpSecret(null);
                              setActiveTab("login");
                              
                              // Reset forms
                              setOtpInputValue("");
                              setSetupOtpInputValue("");
                              setCurrentOtpInputValue("");
                              setNeedsCurrentOtp(false);
                              loginForm.reset({ username: "admin", password: "" });
                              otpForm.reset({ token: "" });
                            } else {
                              toast({
                                title: "Verification failed",
                                description: "Invalid OTP code. Try again.",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            console.error("Setup verification error:", error);
                            toast({
                              title: "Verification failed",
                              description: "An error occurred during verification",
                              variant: "destructive",
                            });
                          } finally {
                            setIsLoggingIn(false);
                          }
                        }}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify & Complete Setup"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}