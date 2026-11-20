"use client";

import { type FormEvent, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Field } from "@/app/components/AdminComp/AdminCourseComp/Create-Course/courseFields";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  isShown: boolean;
  onToggleShown: () => void;
  autoComplete: "current-password" | "new-password";
  disabled: boolean;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  isShown,
  onToggleShown,
  autoComplete,
  disabled,
}: PasswordFieldProps) {
  return (
    <Field label={label} htmlFor={id} required>
      <div className="relative">
        <Input
          id={id}
          type={isShown ? "text" : "password"}
          autoComplete={autoComplete}
          className="pr-10"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
          aria-label={`${isShown ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={isShown}
          onClick={onToggleShown}
          disabled={disabled}
        >
          {isShown ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
    </Field>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCurrentPasswordShown, setIsCurrentPasswordShown] = useState(false);
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
  // const passwordRequirements = [
  //   { label: "At least 8 characters", met: newPassword.length >= 8 },
  //   { label: "A lowercase letter", met: /[a-z]/.test(newPassword) },
  //   { label: "An uppercase letter", met: /[A-Z]/.test(newPassword) },
  //   { label: "A number", met: /[0-9]/.test(newPassword) },
  //   {
  //     label: "A special character",
  //     met: /[^A-Za-z0-9\s]/.test(newPassword),
  //   },
  // ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!passwordRequirements.every(Boolean)) {
      setErrorMessage("Choose a password that meets all the requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.put("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordChanged(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Your password has been updated.");
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ??
          "Unable to change your password. Please try again.")
        : "Unable to change your password. Please try again.";
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
          <CardTitle>Change your password</CardTitle>
          <CardDescription>
            Enter your current password and choose a strong new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {passwordChanged ? (
            <div className="space-y-4">
              <p role="status">Your password has been changed successfully.</p>
              <Button type="button" onClick={() => router.push("/login")}>
                Continue to login
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <PasswordField
                id="current-password"
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                isShown={isCurrentPasswordShown}
                onToggleShown={() =>
                  setIsCurrentPasswordShown((isShown) => !isShown)
                }
                autoComplete="current-password"
                disabled={loading}
              />

              <PasswordField
                id="new-password"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                isShown={isNewPasswordShown}
                onToggleShown={() =>
                  setIsNewPasswordShown((isShown) => !isShown)
                }
                autoComplete="new-password"
                disabled={loading}
              />

              <ul
                className="space-y-1 text-sm text-muted-foreground"
                aria-label="Password requirements"
              >
                {/* {passwordRequirements.map(({ label, met }) => (
                  <li key={label}>
                    {met ? "Met" : "Required"}: {label}
                  </li>
                ))} */}
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
              </ul>

              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                isShown={isConfirmPasswordShown}
                onToggleShown={() =>
                  setIsConfirmPasswordShown((isShown) => !isShown)
                }
                autoComplete="new-password"
                disabled={loading}
              />

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
