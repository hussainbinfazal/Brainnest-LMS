"use client";
import axios from "axios";
import Link from "next/link";
import { useState, useRef, useMemo, useCallback } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/usersStore/useAuthStore";
import { useChatStore } from "@/lib/store/usersStore/useChatStore";
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
import { User } from "next-auth";
import { CAuthUser, CChatMessage } from "@/types/client";
import { cn } from "@/lib/utils";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { useUserCourseStore } from "@/lib/store/usersStore/useUserCourseStore";
import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { useClickOutSide } from "@/hooks/useClickOutside";
///Add Skeletons while loading
export default function Header({ className }: { className?: string }): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const authUser: CAuthUser | null = useAuthStore((state) => state.authUser);
  const fetchAuthUser = useAuthStore((state) => state.fetchAuthUser)
  const clearAuthUser = useAuthStore((state) => state.clearAuthUser)
  const updateUserRoleToInstructor = useAuthStore((state) => state.updateUserToInstructor);
  const isUpdating = useAuthStore((state) => state.isUpdatingRole)
  console.log("This is the authUser in header", authUser)
  const sessionUser = session?.user
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const enrolledCourses = useUserCourseStore((state) => state.enrolledCourseIds);
  const chat: CChatMessage[] | null = useChatStore((state) => state.chat);
  const setChat = useChatStore((state) => state.setChat);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [chatAlreadyExists, setChatAlreadyExists] = useState<boolean>(false);
  const [cartItemsCount, setCartItemsCount] = useState<number>(0);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true)
    await signOut();
    setIsMenuOpen(false);
    toast.success("Logout successful");
  };

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useClickOutSide(
    [menuRef, avatarRef],
    handleCloseMenu,
    isMenuOpen
  );

  const fetchExistingChat = useCallback(async () => {
    try {
      const response = await axios.get("/api/chat");
      const data = response.data.chat;
      setChatAlreadyExists(data.length > 0);
      setChat(data);
    } catch (error: unknown) {
      // console.log("Error fetching chat:", error);
    }
  }, []);

  const fetchCartCount = useCallback(async () => {
    try {
      const response = await axios.get("/api/cart");
      const cartData = response.data;
      setCartItemsCount(cartData?.courses?.length || 0);
    } catch (error: unknown) {
      setCartItemsCount(0);
    }
  }, []);

  ///This is the function to fetch the authUser 
  const fetchAuthUserCallback = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    fetchAuthUser().finally(() => setIsLoading(false));
  }, [fetchAuthUser])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAuthUserCallback();
    };  //Explicit refresh of authUser
    if (status === "unauthenticated") clearAuthUser();
  }, [status, fetchAuthUser, clearAuthUser])

  // useEffect(() => {
  //   if (authUser) {
  //     const timer = setTimeout(() => {
  //       fetchExistingChat();
  //       fetchCartCount();
  //     }, 500); // Add slight delay
  //     return () => clearTimeout(timer);
  //   }
  // }, [authUser, fetchExistingChat, fetchCartCount]);

  // useEffect(() => {
  //   // console.log("This is the status", status);
  //   // console.log("This is the session", session);
  //   if (session?.user) {
  //     // console.log("Session user:", session.user);
  //   }
  // }, [status, session]);
  return (
    <header className={cn("sticky top-0 z-50 flex justify-center items-center w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4", className)}>
      <Scroller />
      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full">
          <BarLoader
            color={theme === "dark" ? "#ffff3f" : "#2196f3"}
            width="100%"
            height="3px"
          // className="dark:bg-[#ffff3f]"
          />
        </div>
      )}
      <DottedGlowBackground className="hidden z-0 dark:block" />
      <div
        className={`container flex justify-center h-14 max-w-screen-2xl items-center relative`}
      >
        <div className="mr-4 flex">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2 cursor-pointer"
            onClick={(event) => {
              if (pathname === "/") {
                event.preventDefault();
              }
            }}
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
                  <span className="absolute -top-2 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              <Link href="/courses/liked-courses" className="px-4">
                <CiHeart className="text-2xl hover:text-gray-200 font-semibold" />
              </Link>
              {session?.user && "" && (
                <Link
                  href="/about"
                  className="px-4 hover:underline underline-offset-4"
                >
                  Profile
                </Link>
              )}
              {sessionUser ? sessionUser?.role === "instructor" : authUser?.role === "instructor" && (
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

              {sessionUser?.role === "instructor" ? (
                <Link href="instructor/course/manage">
                  <Button className="ml-4 rounded-sm cursor-pointer">Manage courses</Button>
                </Link>
              ) : (
                <Button className="ml-6 rounded-sm cursor-pointer" onClick={() => {
                  if (session?.user) updateUserRoleToInstructor(session?.user?.id)
                  else {
                    toast.error("You are not logged in")
                  }
                }}>
                  {isUpdating ? "Updating" : "Teach on Brainnest"}
                </Button>

              )}
              {!sessionUser && (
                <Link href={"/login"}>
                  <Button className="ml-6 rounded-sm cursor-pointer">Login</Button>
                </Link>
              )}
              {/* {sessionUser && (
                <Button className="ml-6 rounded-sm cursor-pointer" onClick={handleLogout}>
                  {isLoggingOut ? 'Logging Out' : 'Logout'}
                </Button>
              )} */}

              <div className="relative ml-4"
                ref={avatarRef}
              >
                {sessionUser && (
                  <Avatar

                    className="ml-4 relative cursor-pointer"
                    onClick={() => {
                      setIsMenuOpen((prev) => !prev);
                    }}

                  >
                    <AvatarImage
                      src={sessionUser.profileImage || "/assets/default-avatar.svg"}
                      alt="User Avatar"
                      className="cursor-pointer"
                    />
                    <AvatarFallback className="cursor-pointer dark:bg-neutral-400 dark:text-neutral-200">
                      {sessionUser?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {isMenuOpen && (
                  <div ref={menuRef}>
                    <Card
                      className={`menu absolute top-2 right-5 ${chatAlreadyExists
                        ? "min-h-45"
                        : sessionUser
                          ? "min-h-38"
                          : " min-h-10"
                        }  w-40 z-70`}

                    >
                      <CardContent className="flex flex-col gap-3 items-center justify-center">
                        {session?.user && (
                          <Link href={`/course/manage`} className="mt-4">
                            <p className="whitespace-pre">Manage Courses</p>
                          </Link>
                        )}
                        {sessionUser?.role === "instructor" && (
                          <Link
                            href={`/`}
                            className={`${badgeVariants({
                              variant: "outline",
                            })} absolute right-1  top-0.5`}
                          >
                            Instructor
                          </Link>
                        )}

                        {sessionUser && enrolledCourses.size > 0 ? (
                          <Link href={`/mycourses`}>
                            <p>My courses</p>
                          </Link>
                        ) : null}
                        {sessionUser && (
                          <Link href="/myprofile">
                            <p>Profile</p>
                          </Link>
                        )}
                        {sessionUser && chatAlreadyExists && (
                          <Link href="/chat">
                            <p>Chat</p>
                          </Link>
                        )}
                        {/* {sessionUser && sessionUser?.certificates?.length > 0 && (
                          <Link href="/myprofile/mycertificates">
                            <p>My Certificates</p>
                          </Link>
                        )} */}

                        <p
                          className="cursor-pointer"
                          onClick={() => handleLogout()}
                        >
                          {isLoggingOut ? 'Logging Out' : 'Logout'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header >
  );
}
