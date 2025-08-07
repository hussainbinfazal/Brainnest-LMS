"use client";
import axios from "axios";
import Link from "next/link";
import { useState, useRef, useMemo, useCallback } from "react";
import { motion, useSpring, useScroll } from "motion/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useChatStore } from "@/lib/store/useChatStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Scroller from "./Scroller";
import { LiaShoppingCartSolid } from "react-icons/lia";
import { CiHeart } from "react-icons/ci";
import { FaGraduationCap } from "react-icons/fa6";
import { badgeVariants } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BarLoader } from "react-spinners";
import { ModeToggle } from "@/components/Dark";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  let [user, setUser] = useState(null);
  const authUser = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const setHasInitialized = useAuthStore((state) => state.setHasInitialized);
  const chat = useChatStore((state) => state.chat);
  const setChat = useChatStore((state) => state.setChat);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null); // <-- Add this
  const avatarRef = useRef(null);
  const [chatAlreadyExists, setChatAlreadyExists] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const { data: session, status } = useSession();
  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios("/api/users/me");
      if (response.data.user) {
        setAuthUser(response.data.user);
        setHasInitialized(true);
      }
    } catch (err) {
      // console.error("Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  }, [authUser?._id]);

  useEffect(() => {
    // Set authUser from session if available
    if (session?.user && !authUser) {
      setAuthUser(session.user);
      setHasInitialized(true);
    } else if (!authUser && status === "unauthenticated") {
      // console.log("Fetching user in header...");
      fetchUser().catch((error) => {
        // console.error("Failed to fetch user:", error);
      });
    }
  }, [session, authUser, status, fetchUser]);

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
    toast.success("Logout successful");
    
  };

  useEffect(() => {
    console.log("authUser", authUser);
  }, [user, authUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const fetchExistingChat = useCallback(async () => {
    try {
      const response = await axios.get("/api/chat");
      const data = response.data.chat;
      setChatAlreadyExists(data.length > 0);
      setChat(data);
    } catch (error) {
      // console.log("Error fetching chat:", error);
    }
  }, []);

  const fetchCartCount = useCallback(async () => {
    try {
      const response = await axios.get("/api/cart");
      const cartData = response.data;
      setCartItemsCount(cartData?.courses?.length || 0);
    } catch (error) {
      setCartItemsCount(0);
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      const timer = setTimeout(() => {
        fetchExistingChat();
        fetchCartCount();
      }, 500); // Add slight delay
      return () => clearTimeout(timer);
    }
  }, [authUser, fetchExistingChat, fetchCartCount]);

  // useEffect(() => {
  //   // console.log("This is the status", status);
  //   // console.log("This is the session", session);
  //   if (session?.user) {
  //     // console.log("Session user:", session.user);
  //   }
  // }, [status, session]);
  return (
    <header className="sticky top-0 z-50 flex justify-center items-center w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 ">
      <Scroller />
      {loading && (
        <div className="absolute bottom-0 left-0 w-full">
          <BarLoader
            color={theme === "dark" ? "#ffff3f" : "#2196f3"}
            width="100%"
            h="3px"
            // className="dark:bg-[#ffff3f]"
          />
        </div>
      )}
      <div
        className={`container flex justify-center h-14 max-w-screen-2xl items-center`}
      >
        <div className="mr-4 flex">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2 cursor-pointer"
          >
            <span className="font-bold  text-3xl flex items-center gap-2">
              {" "}
              <FaGraduationCap className="text-4xl " /> Brainnest
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end ">
          <div className="hidden min-[970px]:flex">
            <nav className="flex items-center">
              <Link
                href="/courses"
                className="px-4 hover:underline underline-offset-4"
              >
                Courses
              </Link>
              <Link
                href="/about"
                className="px-4 hover:underline underline-offset-4"
              >
                About
              </Link>
              <Link
                href="/cart"
                className="px-4 hover:underline underline-offset-4 relative"
              >
                <LiaShoppingCartSolid className="text-3xl" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              <Link href="/courses/liked-courses" className="px-4">
                <CiHeart className="text-2xl hover:text-gray-200 font-semibold" />
              </Link>
              {authUser && "" && (
                <Link
                  href="/about"
                  className="px-4 hover:underline underline-offset-4"
                >
                  Profile
                </Link>
              )}
              {authUser?.role === "instructor" && (
                <Link
                  href={`/myprofile`}
                  className="px-4 hover:underline underline-offset-4"
                >
                  Instructor
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-4">
              <ModeToggle />

              {authUser?.role === "instructor" ? (
                <Link href="/course/manage">
                  <Button className="ml-4 rounded-sm">Manage courses</Button>
                </Link>
              ) : (
                <Link href={"/course/manage"}>
                  <Button className="ml-6 rounded-sm">
                    Teach on Brainnest
                  </Button>
                </Link>
              )}
              {status === "unauthenticated" && (
                <Link href={"/login"}>
                  <Button className="ml-6 rounded-sm">Login</Button>
                </Link>
              )}
              {status === "authenticated" && (
                <Button className="ml-6 rounded-sm" onClick={handleLogout}>
                  Logout
                </Button>
              )}

              <div className="relative ml-4" ref={avatarRef}>
                {authUser && (
                  <Avatar
                    ref={avatarRef}
                    className="ml-4 relative"
                    onClick={() => {
                      setIsMenuOpen((prev) => !prev);
                    }}
                  >
                    <AvatarImage
                      src={
                        authUser?.imageUrl ||
                        authUser?.profileImage ||
                        session?.user?.image
                      }
                    />
                    <AvatarFallback>
                      {authUser?.firstName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {isMenuOpen && (
                  <Card
                    className={`menu absolute top-2 right-5 ${
                      chatAlreadyExists
                        ? "min-h-45"
                        : authUser
                        ? "min-h-38"
                        : " min-h-10"
                    }  w-40 z-[70]`}
                    ref={menuRef}
                  >
                    <CardContent className="flex flex-col gap-3 items-center justify-center">
                      {authUser && authUser.role === "instructor" && (
                        <Link href={`/course/manage`} className="mt-4">
                          <p className="whitespace-pre">Manage Courses</p>
                        </Link>
                      )}
                      {authUser?.role === "instructor" && (
                        <Link
                          href={`/`}
                          className={`${badgeVariants({
                            variant: "outline",
                          })} absolute right-1  top-0.5`}
                        >
                          Instructor
                        </Link>
                      )}

                      {authUser?.enrolledCourses?.length > 0 && authUser && (
                        <Link href={`/mycourses`}>
                          <p>My courses</p>
                        </Link>
                      )}
                      {authUser && (
                        <Link href="/myprofile">
                          <p>Profile</p>
                        </Link>
                      )}
                      {authUser && chatAlreadyExists && (
                        <Link href="/chat">
                          <p>Chat</p>
                        </Link>
                      )}
                      {authUser && authUser?.certificates?.length > 0 && (
                        <Link href="/myprofile/mycertificates">
                          <p>My Certificates</p>
                        </Link>
                      )}

                      <p
                        className="cursor-pointer"
                        onClick={() => handleLogout()}
                      >
                        Logout
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
