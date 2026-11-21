"use client";

import { useRef, useState, type ClipboardEvent } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendEmailOtp, useVerifyEmailOtp } from "@/hooks/useEmailOtp";
import type { UpdateProfileBody } from "../MyProfileComp/EditMyProfileComp";

type VerifyCodeProps = {
    onVerified: (email: string) => void;
};

export function VerifyCode({ onVerified }: VerifyCodeProps) {
    const { watch } = useFormContext<UpdateProfileBody>();
    const email = watch("email");
    const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
    const [showCodeInput, setShowCodeInput] = useState(false);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const {
        status: sendStatus,
        cooldownSeconds,
        sendOtp,
    } = useSendEmailOtp(email);
    const code = digits.join("");
    const {
        status: verifyStatus,
        verifyOtp,
        unlock,
    } = useVerifyEmailOtp(email, code);

    const handleSendCode = async () => {
        if (!email) {
            toast.error("Enter an email address first");
            return;
        }

        const result = await sendOtp();
        if (result.ok) {
            setDigits(Array(6).fill(""));
            setShowCodeInput(true);
            unlock?.();
            requestAnimationFrame(() => inputRefs.current[0]?.focus());
            toast.success("Verification code sent");
        } else {
            toast.error(result.message);
        }
    };

    const handleVerifyCode = async () => {
        if (code.length !== 6) {
            toast.error("Enter the complete six-digit code");
            return;
        }

        const result = await verifyOtp();
        if (result.ok) {
            onVerified(email);
            toast.success("Email verified");
        } else {
            toast.error(result.message);
        }
    };

    const handleDigitChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        setDigits((current) => {
            const next = [...current];
            next[index] = digit;
            return next;
        });

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const pastedDigits = event.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pastedDigits) return;

        setDigits(
            Array.from({ length: 6 }, (_, index) => pastedDigits[index] ?? "")
        );
        inputRefs.current[Math.min(pastedDigits.length, 6) - 1]?.focus();
    };

    if (verifyStatus === "verified") {
        return (
            <p role="status" className="text-sm text-green-600">
                Email verified successfully.
            </p>
        );
    }

    if (!showCodeInput && (sendStatus === "idle" || sendStatus === "error")) {
        return (
            <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={!email}
            >
                Verify Email
            </Button>
        );
    }

    if (sendStatus === "sending") {
        return (
            <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Sending verification code...
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                    <Input
                        key={index}
                        ref={(element) => {
                            inputRefs.current[index] = element;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        aria-label={`Verification code digit ${index + 1}`}
                        value={digit}
                        maxLength={1}
                        className="h-11 w-11 text-center text-lg"
                        onChange={(event) => handleDigitChange(index, event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Backspace" && !digit && index > 0) {
                                inputRefs.current[index - 1]?.focus();
                            }
                        }}
                    />
                ))}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={code.length !== 6 || verifyStatus === "verifying"}
                >
                    {verifyStatus === "verifying" ? "Verifying..." : "Verify code"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={cooldownSeconds > 0}
                >
                    {cooldownSeconds > 0
                        ? `Resend in ${cooldownSeconds}s`
                        : "Resend code"}
                </Button>
            </div>
        </div>
    );
}
