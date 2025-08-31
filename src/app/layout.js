


import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import Header from './components/Header'
import Footer from "./components/Footer"
import { Toaster } from "@/components/ui/sonner"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

import { AppSidebar } from "@/components/AppSidebar";
import { HiOutlineChevronLeft } from "react-icons/hi";
import LoadingBarLoader from "./components/shared/LoadingBarLoader";
import NextAuthSessionProvider from "./provider/sessionProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Brainnest",
  description: "Brainnest is a comprehensive learning management system (LMS) designed to provide an engaging and interactive learning experience. It offers a wide range of courses, quizzes, and resources to help learners achieve their educational goals.",
};


export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextAuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > <SidebarProvider>
              <div className="w-full">
                <div className="block md:hidden">
                  <AppSidebar />
                </div>

                <div className="">
                  <Header />
                  {/* <LoadingBarLoader /> */}
                  <main className="flex-1">
                    <div className="block md:hidden text-2xl">
                      <SidebarTrigger />

                    </div>
                    {children}
                  </main>
                  <Footer />
                  <Toaster />
                </div>


              </div>
            </SidebarProvider>
          </ThemeProvider>
        </NextAuthSessionProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
