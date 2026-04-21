import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Home, CheckCircle2 } from "lucide-react";
import ruLogo from "@/assets/ru-logo.jpg";
import logo from "@/assets/logo.png";
import { ForgotPassword } from "@/components/auth/ForgotPassword";

type AuthMode = "signin" | "signup" | "forgot-password";

export function Auth() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const isTauri = "__TAURI__" in window;

  const signInMutation = useMutation(api.adminAuth.signIn);
  const signUpMutation = useMutation(api.adminAuth.signUp);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<string>("");

  // Password strength checker
  const checkPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) {
      setPasswordStrength("");
      return;
    }

    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    setPasswordStrength(labels[strength - 1] || "Very Weak");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Add timeout to prevent infinite loading in production builds
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError(
        "Connection timeout. Please check your internet connection and try again.",
      );
    }, 15000); // 15 second timeout

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          clearTimeout(timeoutId);
          throw new Error("Passwords do not match");
        }
        if (password.length < 8) {
          clearTimeout(timeoutId);
          throw new Error("Password must be at least 8 characters");
        }

        const result = await signUpMutation({
          email,
          password,
          name,
        });

        clearTimeout(timeoutId);

        // Store session info
        localStorage.setItem("sessionId", result.sessionId);
        localStorage.setItem("userRole", result.user.role);
        localStorage.setItem("userName", result.user.name);
        localStorage.setItem("userEmail", email.toLowerCase().trim());
        localStorage.setItem("sessionCreated", Date.now().toString());
      } else {
        const result = await signInMutation({
          email,
          password,
        });

        clearTimeout(timeoutId);

        // Store session info
        localStorage.setItem("sessionId", result.sessionId);
        localStorage.setItem("userRole", result.user.role);
        localStorage.setItem("userName", result.user.name);
        localStorage.setItem("userEmail", email.toLowerCase().trim());
        localStorage.setItem("sessionCreated", Date.now().toString());
      }

      // Reload page to ensure AuthContext picks up the new role
      window.location.href = "/";
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Auth error:", err);
      let msg = "Authentication failed. Please try again.";
      if (err instanceof Error) {
        const errMsg = err.message.toLowerCase();

        // Check specific errors first
        if (
          errMsg.includes("wrong password") ||
          errMsg.includes("wrong password or email")
        ) {
          msg = "Wrong password or email";
        } else if (errMsg.includes("email already registered")) {
          msg = "This email is already registered";
        } else if (errMsg.includes("invalid email")) {
          msg = "Please enter a valid email address";
        } else if (errMsg.includes("password must")) {
          msg = err.message; // Keep password requirement messages
        } else if (errMsg.includes("locked")) {
          msg = err.message; // Keep account locked messages
        } else if (errMsg.includes("name must")) {
          msg = "Name must be between 2 and 100 characters";
        } else if (errMsg.includes("timeout")) {
          msg = "Connection timeout. Please check your internet connection.";
        } else if (
          errMsg.includes("[convex") ||
          errMsg.includes("server error")
        ) {
          // Generic Convex errors only if not caught above
          msg = "Incorrect email or password.";
        } else {
          msg = "Authentication failed. Please try again.";
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start lg:justify-center px-0 py-0 lg:px-4 lg:py-6 bg-white overflow-hidden">
      {/* Home button for desktop */}
      {isTauri && (
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="absolute top-4 left-4 z-10 gap-2 bg-white/90 hover:bg-white shadow-lg"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
      )}

      {/* Main Layout Container */}
      <div className="w-full max-w-none lg:max-w-6xl relative z-10 flex flex-col lg:flex-row gap-0 lg:shadow-2xl lg:rounded-3xl lg:overflow-hidden lg:min-h-96">
        {/* Content without Card */}
        <div className="relative overflow-hidden w-full lg:w-1/2">
          {/* Curved Gradient Header Section */}
          <div className="relative h-40 lg:h-48 bg-gradient-to-br from-blue-600 to-blue-500 overflow-hidden">
            {/* White curved divider at bottom */}
            <svg
              className="absolute bottom-0 left-0 w-full"
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 0,50 Q 100,10 200,50 T 400,50 L 400,100 L 0,100 Z"
                fill="white"
              />
            </svg>

            {/* Header Content */}
            <div className="relative h-full flex flex-col items-start justify-start px-6 pt-8">
              {mode !== "forgot-password" && (
                <>
                  <p className="text-white/80 text-sm font-medium">
                    {mode === "signin" ? "Welcome Back." : "Hello,"}
                  </p>
                  <h1 className="text-white text-4xl font-bold">
                    {mode === "signin" ? "Log In!" : "Sign Up!"}
                  </h1>
                </>
              )}
              {mode === "forgot-password" && (
                <h1 className="text-white text-4xl font-bold">
                  Reset Password
                </h1>
              )}
            </div>

            {/* Decorative curved shape on right */}
            <div className="absolute -right-20 top-0 w-60 h-60 bg-white/10 rounded-full" />
          </div>

          {/* Form Section */}
          <div className="px-6 sm:px-8 lg:px-12 pt-12 pb-8 bg-white w-full">
            {mode === "forgot-password" ? (
              <ForgotPassword onBack={() => setMode("signin")} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      USER NAME
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Joacob josef"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 bg-white border-2 border-gray-200 rounded-lg focus-visible:ring-0 focus-visible:border-blue-500 text-sm"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    EMAIL ADDRESS
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="joacob@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 bg-white border-2 border-gray-200 rounded-lg focus-visible:ring-0 focus-visible:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      PASSWORD
                    </Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot-password")}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (mode === "signup")
                          checkPasswordStrength(e.target.value);
                      }}
                      className="h-11 bg-white border-2 border-gray-200 rounded-lg pr-10 focus-visible:ring-0 focus-visible:border-blue-500 text-sm"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {mode === "signup" && passwordStrength && (
                    <p
                      className={`text-xs font-medium ${
                        passwordStrength === "Strong"
                          ? "text-green-600"
                          : passwordStrength === "Good"
                            ? "text-blue-600"
                            : passwordStrength === "Fair"
                              ? "text-yellow-600"
                              : "text-red-600"
                      }`}
                    >
                      Password strength: {passwordStrength}
                    </p>
                  )}
                </div>

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      CONFIRM PASSWORD
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 bg-white border-2 border-gray-200 rounded-lg focus-visible:ring-0 focus-visible:border-blue-500 text-sm"
                      required
                    />
                  </div>
                )}

                {/* Checkbox */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={mode === "signin" ? rememberMe : true}
                    onChange={(e) => {
                      if (mode === "signin") setRememberMe(e.target.checked);
                    }}
                    className="w-4 h-4 rounded border-2 border-gray-300 accent-blue-600"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-600">
                    {mode === "signin"
                      ? "Remember me"
                      : "I accept the policy and terms"}
                  </label>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : mode === "signin" ? (
                    "Log In"
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            )}

            {/* Toggle Link */}
            {mode !== "forgot-password" && (
              <div className="text-center mt-6 pt-4 border-t border-gray-200">
                {mode === "signin" ? (
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setError(null);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setError(null);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Log In
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Illustration Section */}
        <div className="hidden lg:flex relative w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 items-center justify-center p-8">
          <div className="text-center max-w-xs">
            {/* Illustration area with logo and decorative elements */}
            <div className="relative mb-8">
              <div className="absolute -top-8 -left-8 w-16 h-16 rounded-full bg-red-200/30 flex items-center justify-center">
                <span className="text-2xl">🍕</span>
              </div>
              <div className="absolute -top-12 right-0 w-14 h-14 rounded-full bg-cyan-200/30 flex items-center justify-center">
                <span className="text-xl">🍔</span>
              </div>
              <div className="absolute top-4 -right-8 w-16 h-16 rounded-full bg-orange-200/30 flex items-center justify-center">
                <span className="text-2xl">🍜</span>
              </div>
              <div className="absolute bottom-4 -left-6 w-14 h-14 rounded-full bg-purple-200/30 flex items-center justify-center">
                <span className="text-xl">🥗</span>
              </div>
              <div className="absolute bottom-0 right-2 w-12 h-12 rounded-full bg-green-200/30 flex items-center justify-center">
                <span className="text-lg">🍰</span>
              </div>

              {/* Center logo */}
              <div className="w-40 h-40 mx-auto flex items-center justify-center">
                <img
                  src={logo}
                  alt="Manna Palace Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Text content */}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Manna Palace
            </h2>
            <p className="text-gray-600 text-sm">Point of Sale System</p>

            {/* Dots indicator */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <span className="w-6 h-1.5 rounded-full bg-blue-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
