"use client";
import React, { useEffect } from "react";
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
import { useAuthStore } from "@/lib/store/useAuthStore";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { OtpSender, OtpVerifier, EmailOtpSender, EmailOtpVerifier } from "../components/PhoneVerificationForm";
import { signIn } from "next-auth/react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ProfileImageUpload from "../components/ProfileImageUpload";
import axios from "axios";
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signUpSchema = z.object({
  name: z.string(),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["USER", "INSTRUCTOR", "ADMIN"]),
  profileImage: z.string(),
  phoneNumber: z.coerce.number({
    required_error: "Phone number is required",
    invalid_type_error: "Phone number must be a number",
  }),
});
const page = () => {
  const [formType, setFormType] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authFormType") || "login";
    }
    return "";
  });
  const [isShown, setIsShown] = React.useState(false);
  const [isOtpSent, setIsOtpSent] = React.useState(false);
  const [isOtpVerified, setIsOtpVerified] = React.useState(false);
  const [isEmailOtpSent, setIsEmailOtpSent] = React.useState(false);
  const [isEmailOtpVerified, setIsEmailOtpVerified] = React.useState(false);
  const { setAuthUser } = useAuthStore();

  const router = useRouter();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm({
    resolver: zodResolver(signUpSchema),

    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "USER",
      profileImage: "",
      phoneNumber: "",
    },
  });
  const watchedPhone = signupForm.watch("phoneNumber");
  const isPhoneValid = /^\d{10}$/.test(watchedPhone);
  const watchedEmail = signupForm.watch("email");
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail);
  const password = signupForm.watch("password");
  const confirmPassword = signupForm.watch("confirmPassword");

  const handleLoginSubmit = async (data) => {
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Invalid credentials");
        return;
      }

      toast.success("Log in successfull");
      router.push("/");
    } catch (error) {
      // console.log(error);
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      toast.error(errorMessage);
    }
  };

  const handleSignupSubmit = async (data) => {
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
      // console.log(response);
      setAuthUser(response.data.user);
      toast.success("Signup successful");
      router.push("/");
    } catch (error) {
      // console.log(error);
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      toast.error(errorMessage);
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

  const onEmailOtpSent = () => {
    toast.success("Email OTP sent successfully!");
    setIsEmailOtpSent(true);
  };

  const onEmailVerified = () => {
    toast.success("Email OTP verified successfully!");
    setIsEmailOtpSent(false);
    setIsEmailOtpVerified(true);
  };

  useEffect(() => {
    if (formType && typeof window !== "undefined") {
      localStorage.setItem("authFormType", formType);
    }
  }, [formType]);

  const handleTabChange = (value) => {
    setFormType(value);
    // When changing tabs manually, update localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("authFormType", value);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen gap-4 overflow-auto pt-8">
      <Tabs
        value={formType}
        onValueChange={handleTabChange}
        className="w-[300px] min-h-[280px] "
      >
        <TabsList className="grid w-full grid-cols-2 h-[40px] rounded-full px-2">
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
            transition={{ type: "smooth", duration: 0.3, bounce: 0.2 }}
          >
            <TabsTrigger
              value="signup"
              className="rounded-full w-full data-[state=active]:shadow-[0px_1px_4px_0px_rgba(255,255,255,0.1)_inset,0px_-1px_2px_0px_rgba(255,255,255,0.1)_inset] data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Sign In
            </TabsTrigger>
          </motion.div>
        </TabsList>
        <TabsContent value="login">
          <Form {...loginForm}>
            <form
              onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
              className="space-y-8 py-4 pb-0 min-h-[500px] overflow-auto"
            >
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} />
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

                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit ">Submit</Button>
              <Separator className="my-4" />
              <div className="flex justify-center items-center gap-4 flex-col">
                <h2>Other Sign In options</h2>

                <Button
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
        <TabsContent value="signup">
          <Form {...signupForm}>
            <form
              onSubmit={signupForm.handleSubmit(handleSignupSubmit)}
              className="space-y-8  py-4 min-h-[500px]"
            >
              <FormField
                control={signupForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signupForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              {isEmailOtpVerified ? (
                <div className="w-full flex justify-end">Email Verified! ✅</div>
              ) : isEmailOtpSent ? (
                <EmailOtpVerifier
                  email={signupForm.watch("email")}
                  onVerified={onEmailVerified}
                  onChangeEmail={() => {
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
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

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signupForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Confirm Password" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-500">Passwords do not match</p>
              )}
              <FormField
                control={signupForm.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Profile Picture</FormLabel>
                    <FormControl>
                      <ProfileImageUpload
                        control={signupForm.control}
                        setValue={signupForm.setValue}
                        trigger={signupForm.trigger}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
              <Separator className="my-4" />
              <div className="flex justify-center items-center gap-4 flex-col">
                <h2>Other Sign In options</h2>
                <Button
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

export default page;
