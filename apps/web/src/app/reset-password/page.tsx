"use client";

import { type FormEvent, Suspense, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? searchParams.get("t");
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isNewPasswordShown, setIsNewPasswordShown] = useState(false);
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const passwordRequirements = [
    newPassword.length >= 8,
    /[a-z]/.test(newPassword),
    /[A-Z]/.test(newPassword),
    /[0-9]/.test(newPassword),
    /[^A-Za-z0-9\s]/.test(newPassword),
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("This password reset link is invalid or expired.");
      return;
    }

    if (!passwordRequirements.every(Boolean)) {
      setErrorMessage("Choose a password that meets all the requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { token, newPassword });
      setPasswordChanged(true);
      toast.success("Your password has been updated.");
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ??
          "Unable to reset your password. Please try again.")
        : "Unable to reset your password. Please try again.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create a new password</CardTitle>
          <CardDescription>
            Choose a strong password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {passwordChanged ? (
            <div className="space-y-4">
              <p role="status">Your password has been changed successfully.</p>
              <Button type="button" onClick={() => router.push("/login")}>
                Go to login
              </Button>
            </div>
          ) : !token ? (
            <div className="space-y-4">
              <p className="text-destructive" role="alert">
                This password reset link is invalid or expired.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/login")}
              >
                Back to login
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-4 block text-sm font-medium"
                >
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={isNewPasswordShown ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10"
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                    aria-label={
                      isNewPasswordShown ? "Hide password" : "Show password"
                    }
                    aria-pressed={isNewPasswordShown}
                    onClick={() =>
                      setIsNewPasswordShown((isShown) => !isShown)
                    }
                    disabled={loading}
                  >
                    {isNewPasswordShown ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <ul
                className="space-y-1 text-sm text-muted-foreground"
                aria-label="Password requirements"
              >
                {!passwordRequirements[0] && <li>
                  {passwordRequirements[0] ? "Met" : "Required"}: at least 8
                  characters
                </li>}
                {!passwordRequirements[1] && <li>
                  {passwordRequirements[1] ? "Met" : "Required"}: a lowercase
                  letter
                </li>}
                {!passwordRequirements[2] && <li>
                  {passwordRequirements[2] ? "Met" : "Required"}: an uppercase
                  letter
                </li>}
                {!passwordRequirements[3] && <li>
                  {passwordRequirements[3] ? "Met" : "Required"}: a number
                </li>}
                {!passwordRequirements[4] && <li>
                  {passwordRequirements[4] ? "Met" : "Required"}: a special
                  character
                </li>}
              </ul>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={isConfirmPasswordShown ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                    aria-label={
                      isConfirmPasswordShown
                        ? "Hide password confirmation"
                        : "Show password confirmation"
                    }
                    aria-pressed={isConfirmPasswordShown}
                    onClick={() =>
                      setIsConfirmPasswordShown((isShown) => !isShown)
                    }
                    disabled={loading}
                  >
                    {isConfirmPasswordShown ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              )}

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Updating password..." : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
          <Skeleton className="h-64 w-full max-w-lg" />
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
