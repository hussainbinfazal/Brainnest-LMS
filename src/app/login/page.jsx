"use client";
import React, { useEffect } from "react";
import { motion, useSpring, useScroll } from "motion/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Cookies from "js-cookie";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { FcGoogle } from "react-icons/fc";
import { OtpSender, OtpVerifier } from "../components/PhoneVerificationForm";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import { useSignIn } from "@clerk/clerk-react";

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { sign } from "jsonwebtoken";
import ProfileImageUpload from "../components/profileImageUpload";
import axios from "axios";
import { useUser, useSignUp, useSession } from "@clerk/clerk-react";
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
  const [refreshUserData, setRefreshUserData] = React.useState(false);
  const { authUser, setAuthUser } = useAuthStore();
  const setHasInitialized = useAuthStore((state) => state.setHasInitialized);
  const userLoggedInitialized = useAuthStore((state) => state.hasInitialized);
  const setUserLoggedInitialized = useAuthStore(
    (state) => state.setUserLoggedInitialized
  );
  useAuthRedirect({
    redirectIfUnauthenticated: false,
    redirectIfAuthenticated: true,
    redirectIfNotInstructor: false,
    interval: 3000,
  });

  const [nonClerkUser, setNonClerkUser] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nonClerkUser") !== "false";
    }
    return true;
  });
  const { user } = useUser();
  const { signIn, setActive } = useSignIn();
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
  const password = signupForm.watch("password");
  const confirmPassword = signupForm.watch("confirmPassword");

  const handleLoginSubmit = async (data) => {
    try {
      const response = await axios.post("/api/users/login", data);
      console.log(response);
      setAuthUser(response.data.user);
      setHasInitialized(true);
      setUserLoggedInitialized(true);
      toast.success("Login successful");
      // window.location.reload();
      router.push("/");

      setRefreshUserData(true);
    } catch (error) {
      console.log(error);
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      toast.error(errorMessage);
    }
  };

  const handleSignupSubmit = async (data) => {
    // console.log(data);
    // console.log("Sign in function called ");
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!isOtpVerified) {
      return toast.error("Please verify your phone number");
    }
    try {
      const response = await axios.post("/api/users/register", data);
      // console.log(response);
      setAuthUser(response.data.user);
      setHasInitialized(true);
      setUserLoggedInitialized(true);
      toast.success("Signup successful");
      // window.location.reload();
      router.push("/");

      setRefreshUserData(true);
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

  useEffect(() => {
    if (formType && typeof window !== "undefined") {
      localStorage.setItem("authFormType", formType);
    }
  }, [formType]);

  useEffect(() => {
    const stored = localStorage.getItem("nonClerkUser");
    if (stored !== null) {
      setNonClerkUser(stored !== "false");
    }
  }, []);
  const loginWithClerk = async () => {
    const toastId = toast.loading("loading...");

    const userData = {
      email: user.primaryEmailAddress?.emailAddress,
      fromOAuth: true,
    };
    // console.log("This is the userData in the login console ", userData);

    try {
      const response = await axios.post("/api/users/login", userData);
      const { token, user: registeredUser } = response.data;
      setAuthUser(registeredUser);
      setHasInitialized(true);
      setUserLoggedInitialized(true);
      toast.success("Login successful");
      setRefreshUserData(false);

      // console.log("Token Value in the login console ", token);

      localStorage.removeItem("authFormType");
      router.push("/");
    } catch (err) {
      toast.dismiss(toastId);

      // console.log("Login error:", err);
      const errorMessage =
        err.response?.data?.message || // custom message from your backend
        err.response?.data?.error || // some APIs use 'error' instead
        "Registration failed. Please try again."; // fallback

      toast.error(errorMessage);
      if (errorMessage === "User already exists") {
        setFormType("login");
      }
    } finally {
      toast.dismiss();
    }
    toast.dismiss(toastId);
  };

  const registerWithClerk = async () => {
    const userData = {
      name: user.fullName,
      email: user.primaryEmailAddress?.emailAddress,
      password: user.id,
      fromOAuth: true,
      profileImage: user.imageUrl,
      phoneNumber: user.primaryPhoneNumber?.phoneNumber || "",
    };

    // console.log("This is the userData in the register console ", userData);
    try {
      const response = await axios.post("/api/users/register", userData);
      // console.log("This is the response from the backend", response);
      const { token, user } = response.data;
      setAuthUser(user);
      setHasInitialized(true);
      setUserLoggedInitialized(true);

      // console.log("Token Value in the register console ", token);

      toast.success("User registered via Clerk");
      const toastId = toast.loading("loading...");
      setRefreshUserData(true);

      toast.dismiss(toastId);
      localStorage.removeItem("authFormType");

      router.push("/");
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err.response?.data?.message || // custom message from your backend
        err.response?.data?.error || // some APIs use 'error' instead
        "Registration failed. Please try again."; // fallback

      toast.error(errorMessage);
    } finally {
      toast.dismiss();
    }
  };

  const handleTabChange = (value) => {
    setFormType(value);
    // When changing tabs manually, update localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("authFormType", value);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      // console.log("DEBUG useEffect check", {
      //   user,
      //   formType,
      //   nonClerkUser,
      // });
      // if (user && !authUser || nonClerkUser) return;

      // Fix your useEffect logic
      if (formType === "signup" && !userLoggedInitialized) {
        if (user && !authUser && !nonClerkUser) {
          registerWithClerk(); // Call registerWithClerk();
        }
      }
      if (formType === "login" && !userLoggedInitialized) {
        if (user && !authUser && !nonClerkUser) {
          loginWithClerk();
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, formType, nonClerkUser]);

  useEffect(() => {
    if (refreshUserData) {
      router.refresh();
      setRefreshUserData(false);
    }
  }, [refreshUserData]);

  // if(authUser) return null;
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

              <Button
                type="submit "
                onClick={() => {
                  setNonClerkUser(true);
                  localStorage.setItem("nonClerkUser", "true");
                }}
              >
                Submit
              </Button>
              <Separator className="my-4" />
              <div className="flex justify-center items-center gap-4 flex-col">
                <h2>Other Sign In options</h2>
                <SignInButton mode="redirect" redirectUrl="/login">
                  <button
                    type="button"
                    onClick={() => {
                      setNonClerkUser(false);
                      localStorage.setItem("nonClerkUser", "false");
                    }}
                    className="w-full h-[50px] border border-black rounded-sm mt-4 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FcGoogle className="w-6 h-6" />
                    Log In With Google
                  </button>
                </SignInButton>
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
              <FormField
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
              )}

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
              <Button
                type="submit"
                onClick={() => {
                  setNonClerkUser(true);
                  localStorage.setItem("nonClerkUser", "true");
                }}
              >
                Submit
              </Button>
              <Separator className="my-4" />
              <div className="flex justify-center items-center gap-4 flex-col">
                <h2>Other Sign In options</h2>
                <SignUpButton mode="redirect" redirectUrl="/login">
                  <button
                    onClick={() => {
                      setNonClerkUser(false);
                      localStorage.setItem("nonClerkUser", "false");
                    }}
                    type="button"
                    className="w-full h-[50px] border border-black rounded-sm mt-4 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FcGoogle className="w-6 h-6" />
                    Sign In With Google
                  </button>
                </SignUpButton>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default page;
