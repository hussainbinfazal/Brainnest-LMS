"use client"
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store/usersStore/useAuthStore";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { ControllerRenderProps, FieldValues, FieldPath } from "react-hook-form";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { JSX } from "react/jsx-runtime";
import { loginSchema, signUpSchema } from "@/utils/fieldsValidation/Auth/ZodAuthSchema";
import ProfileImageUpload from "../ProfileImageUpload";
import { EmailOtpSender, EmailOtpVerifier } from "../PhoneVerificationForm";
import { cn } from "@/lib/utils";
import { clientLogger } from "@/utils/logger/clientLogger";
import { useUsernameAvailability } from "@/hooks/userUsernameAvailability";
import { validatePhoneNumber } from "@/utils/phoneValidators";
import { validateEmail } from "@/utils/phoneValidators";
import { useSendEmailOtp } from "@/hooks/useSendEmailOtp";


export const AuthPageComp = ({ className }: { className?: string }): JSX.Element => {
    const router = useRouter();
    const [formType, setFormType] = useState<string>("login");
    const [isShown, setIsShown] = useState<boolean>(false);
    const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
    const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
    const [isEmailOtpSent, setIsEmailOtpSent] = useState<boolean>(false);
    const [isEmailOtpVerified, setIsEmailOtpVerified] = useState<boolean>(false);
    const { setAuthUser } = useAuthStore();
    const loginForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const signupForm = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),

        defaultValues: {
            name: "",
            email: "",
            username: "",
            password: "",
            confirmPassword: "",
            role: "USER",
            profileImage: "",
            phoneNumber: 0,
        },
    });
    const watchedUsername = signupForm.watch('username');
    const usernameStatus = useUsernameAvailability(watchedUsername);
    const watchedPhone: number = signupForm.watch("phoneNumber");
    const isPhoneValid: boolean = validatePhoneNumber(watchedPhone.toString());
    const watchedEmail = signupForm.watch("email");
    const isEmailValid: boolean = validateEmail(watchedEmail.toString());
    const password: string = signupForm.watch("password");
    const confirmPassword: string = signupForm.watch("confirmPassword");
    const { status, error, cooldownSeconds, sendOtp } = useSendEmailOtp(signupForm.watch("email"));
    const handleLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
        try {
            const res = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (res?.error) {
                clientLogger.error("Something went wrong while login", { message: res.error });
                toast.error("Invalid credentials");
                return;
            };
            toast.success("Log in successfull");
            router.replace("/");
        } catch (error: unknown) {
            let message = "Something went wrong";
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || error.message || message;

            } else if (error instanceof Error) {
                message = error.message;
            }
            clientLogger.error("Something went wrong, while fetching the user", { message });
            // toast.error();
        }
    };

    const handleSignupSubmit = async (data: z.infer<typeof signUpSchema>) => {
        if (!isEmailOtpVerified) {
            return toast.error("Please verify your email address");
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        // Phone verification is disabled for now
        // if (!isOtpVerified) {
        //   return toast.error("Please verify your phone number");
        // }
        try {
            const response = await axios.post("/api/users/register", data);
            const res = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false
            })
            if (res?.error) {
                clientLogger.error("Singup secceded but automatic sign in failed"), { message: res.error, error: res.error }
                toast.error("Something went wrong. Please try again.");
                return
            }
            toast.success("Signup successful");
            router.replace("/");
        } catch (error: unknown) {
            let message = "Something went wrong";
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || error.message || message;

            } else if (error instanceof Error) {
                message = error.message;
            }
            clientLogger.error("Something went wrong, while fetching the user", { message });
        }
    };

    const onOtpSent = () => {
        // console.log("OTP sent successfully!");
        toast.success("OTP sent successfully!");
        setIsOtpSent(true);
    };

    const onVerified = () => {
        // console.log("OTP verified successfully!");
        toast.success("OTP verified successfully!");
        setIsOtpSent(false);
        setIsOtpVerified(true);
    };

    const onEmailOtpSent = (): void => {
        toast.success("Email OTP sent successfully!");
        setIsEmailOtpSent(true);
    };

    const onEmailVerified = (): void => {
        toast.success("Email OTP verified successfully!");
        setIsEmailOtpSent(false);
        setIsEmailOtpVerified(true);
    };

    useEffect(() => {
        const savedFormType = localStorage.getItem("authFormType");

        if (savedFormType === "login" || savedFormType === "signup") {
            setFormType(savedFormType);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("authFormType", formType);
    }, [formType]);

    const handleTabChange = (value: string): void => {
        setFormType(value);
        // When changing tabs manually, update localStorage
        if (typeof window !== "undefined") {
            localStorage.setItem("authFormType", value);
        }
    };

    return (
        <div className={cn("flex justify-center items-center min-h-screen gap-4 overflow-auto pt-8", className)}>
            <Tabs
                value={formType}
                onValueChange={handleTabChange}
                className="w-75 min-h-70 "
            >
                <TabsList className="grid w-full grid-cols-2 h-10 rounded-full px-2">
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <TabsTrigger
                            value="login"
                            className="rounded-full w-full  data-[state=active]:shadow-[0px_1px_4px_0px_rgba(255,255,255,0.1)_inset,0px_-1px_2px_0px_rgba(255,255,255,0.1)_inset] data-[state=active]:bg-black data-[state=active]:text-white"
                        >
                            Login
                        </TabsTrigger>
                    </motion.div>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
                    >
                        <TabsTrigger
                            value="signup"
                            className="rounded-full w-full data-[state=active]:shadow-[0px_1px_4px_0px_rgba(255,255,255,0.1)_inset,0px_-1px_2px_0px_rgba(255,255,255,0.1)_inset] data-[state=active]:bg-black data-[state=active]:text-white"
                        >
                            Sign In
                        </TabsTrigger>
                    </motion.div>
                </TabsList>
                <TabsContent className='' value="login">
                    <Form {...loginForm}>
                        <form
                            onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                            className="space-y-8 py-4 pb-0 min-h-125 overflow-auto"
                        >
                            <FormField
                                control={loginForm.control}
                                name="email"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof loginSchema>, "email"> }) => (
                                    <FormItem className=''>
                                        <FormLabel className=''>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                className=''
                                                type='' placeholder="Email" {...field} />
                                        </FormControl>

                                        <FormMessage className='' />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={loginForm.control}
                                name="password"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof loginSchema>, "password"> }) => (
                                    <FormItem className=''>
                                        <FormLabel className=''>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={isShown ? "text" : "password"}
                                                    placeholder="Password"
                                                    {...field}
                                                    className="pr-10" // Make space for the icon
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsShown(!isShown)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                    tabIndex={-1} // prevents tab focus
                                                >
                                                    {isShown ? (
                                                        <EyeOff className="w-5 h-5" />
                                                    ) : (
                                                        <Eye className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>

                                        <FormMessage className='' />
                                    </FormItem>
                                )}
                            />

                            <Button className='w-full' variant='default' size='default' type="submit">Log In</Button>
                            <Separator className="my-4" />
                            <div className="flex justify-center items-center gap-4 flex-col">
                                <h2>Other Sign In options</h2>

                                <Button
                                    variant='default' size='default'
                                    type="button"
                                    onClick={() => {
                                        sessionStorage.setItem('justLoggedIn', 'true');
                                        signIn("google", { callbackUrl: "/" });
                                    }}
                                    className="w-full p-2 bg-red-500 text-white rounded"
                                >
                                    <FcGoogle className="w-6 h-6" />
                                    Log in With Google
                                </Button>
                                <Button
                                    variant='default' size='default'
                                    type="button"
                                    onClick={() => {
                                        sessionStorage.setItem('justLoggedIn', 'true');
                                        signIn("github", { callbackUrl: "/" });
                                    }}
                                    className="w-full p-2 bg-black text-white rounded"
                                >
                                    <FaGithub className="w-6 h-6" />
                                    Log In With GitHub
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent className='' value="signup">
                    <Form {...signupForm}>
                        <form
                            onSubmit={signupForm.handleSubmit(handleSignupSubmit)}
                            className="space-y-8  py-4 min-h-125"
                        >
                            <FormField
                                control={signupForm.control}
                                name="name"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof signUpSchema>, "name"> }) => (
                                    <FormItem className=''>
                                        <FormLabel className=''>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='text'
                                                className=''
                                                placeholder="Name" {...field} />
                                        </FormControl>

                                        <FormMessage className='' />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={signupForm.control}
                                name="username"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof signUpSchema>, "username"> }) => (
                                    <FormItem className=''>
                                        <FormLabel className=''>Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='text'
                                                className=''
                                                placeholder="Username" {...field} />
                                        </FormControl>
                                        {usernameStatus === "checking" && (
                                            <p className="animate-pulse">Checking...</p>
                                        )}
                                        {usernameStatus === "available" && (
                                            <p className="text-green-500">Available</p>
                                        )}
                                        {usernameStatus === 'taken' && (
                                            <p className="text-red-500">Already Taken</p>
                                        )}
                                        <FormMessage className='' />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={signupForm.control}
                                name="email"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof signUpSchema>, "email"> }) => (
                                    <FormItem className=''>
                                        <FormLabel className=''>Email</FormLabel>
                                        <FormControl>
                                            <Input type='email'
                                                className='' placeholder="Email" {...field} />
                                        </FormControl>

                                        <FormMessage className='' />
                                    </FormItem>
                                )}
                            />
                            {isEmailOtpVerified ? (
                                <div className="w-full flex justify-end">Email Verified! ✅</div>
                            ) : isEmailOtpSent ? (
                                <EmailOtpVerifier
                                    email={signupForm.watch("email")}
                                    phoneNumber={signupForm.watch("phoneNumber").toString()}
                                    onVerified={onEmailVerified}
                                    onChangeEmail={(): void => {
                                        setIsEmailOtpSent(false);
                                        setIsEmailOtpVerified(false);
                                    }}
                                    onChangeNumber={(): void => {
                                        setIsEmailOtpSent(false);
                                        setIsEmailOtpVerified(false);
                                    }}
                                />
                            ) : (
                                isEmailValid && (
                                    <EmailOtpSender
                                        email={signupForm.watch("email")}
                                        onOtpSent={onEmailOtpSent}
                                    />
                                )
                            )}
                            {/* <FormField
                control={signupForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone Number" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              {isOtpVerified ? (
                <div className="w-full flex justify-end">OTP Verified! ✅</div> // or go to next step in your form
              ) : isOtpSent ? (
                <OtpVerifier
                  phoneNumber={signupForm.watch("phoneNumber")}
                  setIsOtpSent={setIsOtpSent}
                  onVerified={onVerified}
                />
              ) : (
                isPhoneValid && (
                  <OtpSender
                    phoneNumber={signupForm.watch("phoneNumber")}
                    onOtpSent={onOtpSent}
                  />
                )
              )} */}

                            <FormField
                                control={signupForm.control}
                                name="password"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof signUpSchema>, "password"> }) => (
                                    <FormItem className=''>
                                        <FormLabel className=''>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={isShown ? "text" : "password"}
                                                    placeholder="Password"
                                                    {...field}
                                                    className="pr-10" // Make space for the icon
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsShown(!isShown)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                    tabIndex={-1} // prevents tab focus
                                                >
                                                    {isShown ? (
                                                        <EyeOff className="w-5 h-5" />
                                                    ) : (
                                                        <Eye className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>

                                        <FormMessage className='' />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={signupForm.control}
                                name="confirmPassword"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof signUpSchema>, "confirmPassword"> }) => (
                                    <FormItem className=''>
                                        <FormLabel className=''>Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type=''
                                                className='' placeholder="Confirm Password" {...field} />
                                        </FormControl>

                                        <FormMessage className='' />
                                    </FormItem>
                                )}
                            />
                            {password && confirmPassword && password !== confirmPassword && (
                                <p className="text-red-500">Passwords do not match</p>
                            )}
                            <FormField
                                control={signupForm.control}
                                name="profileImage"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof signUpSchema>, "profileImage"> }) => (
                                    <FormItem className=''>
                                        <FormLabel className=''>Upload Profile Picture</FormLabel>
                                        <FormControl>
                                            <ProfileImageUpload
                                                control={signupForm.control}
                                                setValue={signupForm.setValue as (field: string, value: any) => void}
                                                trigger={signupForm.trigger as (field: string) => void}
                                            />
                                        </FormControl>

                                        <FormMessage className='' />
                                    </FormItem>
                                )}
                            />
                            <Button size='default' variant='default' className='w-full cursor-pointer' type="submit">Sign In</Button>
                            <Separator className="my-4" />
                            <div className="flex justify-center items-center gap-4 flex-col">
                                <h2>Other Sign In options</h2>
                                <Button
                                    variant='default' size='default'
                                    type="button"
                                    onClick={() => {
                                        sessionStorage.setItem('justLoggedIn', 'true');
                                        signIn("google", { callbackUrl: "/" });
                                    }}
                                    className="w-full p-2 bg-red-500 text-white rounded"
                                >
                                    <FcGoogle className="w-6 h-6" />
                                    Sign In with Google
                                </Button>
                                <Button
                                    variant='default' size='default'
                                    type="button"
                                    onClick={() => {
                                        sessionStorage.setItem('justLoggedIn', 'true');
                                        signIn("github", { callbackUrl: "/" });
                                    }}
                                    className="w-full p-2 bg-red-500 text-white rounded"
                                >
                                    <FaGithub className="w-6 h-6" />
                                    Sign In with GitHub
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>
            </Tabs>
        </div>
    );
};


