"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requiresVerification, setRequiresVerification] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for message in URL query parameters on component mount
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccess(message);
      if (message.includes('email') && message.includes('verify')) {
        setRequiresVerification(true);
      }
    }
  }, [searchParams]);

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Verification email sent successfully. Please check your inbox.");
      } else {
        setError(data.message || "Failed to resend verification email");
      }
    } catch (err) {
      setError("An error occurred while resending verification email");
      console.error("Resend verification error:", err);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to dashboard after successful login
        router.push("/dashboard");
      } else {
        if (data.requiresEmailVerification) {
          setError(data.message || "Please verify your email before logging in.");
          setRequiresVerification(true);
        } else {
          setError(data.message || "Invalid email or password");
          setRequiresVerification(false);
        }
      }
    } catch (err) {
      setError("An error occurred during login");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
          <span className="font-bold text-xl">websiter.click</span>
        </div>
        <nav aria-label="Page navigation">
          <Button variant="outline" asChild>
            <Link href="/" aria-label="Return to home page">Back to Home</Link>
          </Button>
        </nav>
      </header>

      {/* Login Form */}
      <section className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-full max-w-md bg-background p-8 rounded-lg border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your websiter.click account</p>
          </div>

          {error && (
            <div
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-md text-green-700"
              role="status"
              aria-live="polite"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email"
                required
                aria-required="true"
                aria-invalid={!!error && error.includes("email")}
                aria-describedby={error && error.includes("email") ? "email-error" : undefined}
              />
              {error && error.includes("email") && (
                <p id="email-error" className="text-sm text-destructive mt-1">
                  {error}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your password"
                required
                aria-required="true"
                aria-invalid={!!error && error.includes("password")}
                aria-describedby={error && error.includes("password") ? "password-error" : undefined}
              />
              {error && error.includes("password") && (
                <p id="password-error" className="text-sm text-destructive mt-1">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                  aria-describedby="remember-me-description"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-busy={isLoading}
              aria-label={isLoading ? "Signing in to your account" : "Sign in to your account"}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          {requiresVerification && (
            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendVerification}
                disabled={isResending || !email}
                className="w-full"
                aria-label={isResending ? "Sending verification email" : "Resend verification email"}
                aria-busy={isResending}
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}