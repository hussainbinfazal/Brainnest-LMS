"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Button } from "./ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { LiaShoppingCartSolid } from "react-icons/lia";
import { CiHeart } from "react-icons/ci";
import { useState, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react"

import { useClerk, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HiChevronUp, HiChevronDown } from "react-icons/hi";
export function AppSidebar() {
  const router = useRouter();
  // const { signOut } = useClerk();
  const authUser = useAuthStore((state) => state.authUser);
  const clearAuthUser = useAuthStore((state) => state.clearAuthUser);
  const setHasInitialized = useAuthStore((state) => state.setHasInitialized);
  const menuRef = useRef(null); // <-- Add this
  const avatarRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();

    await axios.post("/api/users/logout");
    // setUser(null);

    clearAuthUser();
    setHasInitialized(false);

    toast.success("Logout successful");
    router.push("/login");
  };
  return (
    <Sidebar>
      <SidebarContent className="flex flex-col items-center justify-start pt-10 gap-4">
        <div className="flex flex-col">
          <nav className="flex flex-col items-center justify-center gap-4">
            {authUser && (
              <Link href="/mycourses" className="px-4 text-xl font-semibold">
                My Courses
              </Link>
            )}
            {authUser && (
              <Link href="/courses" className="px-4 text-xl font-semibold">
                Courses
              </Link>
            )}
            <Link href="/about" className="px-4 text-xl font-semibold">
              About
            </Link>
            <Link href="/cart" className="px-4">
              <LiaShoppingCartSolid className="text-4xl" />
            </Link>
            <Link href="/courses/liked-courses" className="px-4">
              <CiHeart className="text-4xl hover:text-gray-200 font-semibold" />
            </Link>
            {authUser && (
              <Link href="/myprofile" className="px-4 text-xl font-semibold">
                Profile
              </Link>
            )}
            {authUser && (
              <Link
                href="/myprofile/mycertificates"
                className="px-4 text-xl font-semibold"
              >
                My Certificates{}
              </Link>
            )}
          </nav>

          <div className="flex flex-col items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className=""
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {/* Simple sun icon for light mode */}
              <span className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0">
                🔆
              </span>
              {/* Simple moon icon for dark mode */}
              <span className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100">
                🌙
              </span>
              <span className="sr-only">Toggle theme</span>
            </Button>

            {authUser &&
              (authUser.role === "instructor" ? (
                <Link href="/course/manage">
                  <Button className=" rounded-sm">Manage</Button>
                </Link>
              ) : (
                <Link href={"/course/manage"}>
                  <Button className="ml-4 rounded-sm">
                    Teach on Brainnest
                  </Button>
                </Link>
              ))}
            {authUser ? (
              <Button onClick={handleLogout}>Sign out</Button>
            ) : (
              <Link href="/login">
                <Button className="rounded-sm">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  {authUser && (
                    <Avatar className="ml-4 relative">
                      <AvatarImage
                        src={authUser?.imageUrl || authUser?.profileImage}
                      />
                      <AvatarFallback>
                        {authUser?.firstName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}{" "}
                  {authUser?.name}
                  {isMenuOpen ? (
                    <HiChevronDown
                      className="ml-auto"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    />
                  ) : (
                    <HiChevronUp
                      className="ml-auto"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    />
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={() => router.push("/myprofile")}>
                  <span onClick={() => router.push("/mycourses")}>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span onClick={() => router.push("/course/manage")}>
                    Manage Courses
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>
                    {authUser ? (
                      <p
                        className="text-red-600"
                        onClick={() => {
                          handleLogout();
                        }}
                      >
                        Sign Out
                      </p>
                    ) : (
                      <p onClick={() => router.push("/login")}>Login</p>
                    )}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
