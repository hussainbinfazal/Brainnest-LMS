"use client"

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, ArrowRight, Star, Users, BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const { data: session } = useSession();
  const router = useRouter();

  const stats = [
    { icon: Users, label: "Active Learners", value: "10K+" },
    { icon: BookOpen, label: "Courses", value: "500+" },
    { icon: Star, label: "Rating", value: "4.9" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>

      <div className="relative container mx-auto px-4 py-20 lg:py-32 max-w-7xl">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge variant="" className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
            🚀 Join 10,000+ learners worldwide
          </Badge>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            {session ? (
              <>
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {session.user?.name?.split(" ")[0]}
                </span>
                <br />
                Continue your learning journey
              </>
            ) : (
              <>
                Transform your career with{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  world-class education
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            Master in-demand skills with expert-led courses, hands-on projects, and personalized learning paths designed for career growth.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
            variant=""
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => router.push('/courses')}
            >
              Explore Courses
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg font-semibold rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
            >
              <PlayCircle className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}