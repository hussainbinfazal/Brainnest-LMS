"use client";
import Link from "next/link";
import { useState } from "react";
import { FaGraduationCap } from "react-icons/fa6";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    setLoading(true);
    setTimeout(() => {
      setEmail("");
      toast.success("Thank You For Subscribing!");
      setLoading(false);
    }, 2000);
  };
  return (
    <footer
      className="bg-black dark:bg-black
     text-white"
    >
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10  rounded-lg flex items-center justify-center mr-3">
                <FaGraduationCap className="text-7xl " />
              </div>
              <h3 className="text-4xl font-bold bg-white text-white bg-clip-text ">
                Brainnest
              </h3>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              Empowering minds through innovative learning experiences. Join
              thousands of learners advancing their careers with our
              comprehensive courses.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-slate-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.162-1.499-.69-2.436-2.878-2.436-4.632 0-3.78 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.758-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-semibold mb-6 text-white">Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/courses"
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  Courses
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/instructors"
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  Instructors
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xl font-semibold mb-6 text-white">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 pt-8 border-t border-slate-700">
          <div className="max-w-md mx-auto text-center lg:max-w-none lg:text-left lg:flex lg:items-center lg:justify-between">
            <div className="lg:flex-1">
              <h4 className="text-xl font-semibold mb-2 text-white">
                Stay Updated
              </h4>
              <p className="text-slate-300">
                Get the latest courses and learning tips delivered to your
                inbox.
              </p>
            </div>
            <div className="mt-6 lg:mt-0 lg:ml-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
                />
                <button
                  variant="outline"
                  className="px-6 py-3 bg-black border-[0.5px] border-white hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                  onClick={handleSubmit}
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-700 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-slate-400 text-sm">
              © 2025 Brainnest. All rights reserved. Brainnest is a registered
              trademark of Brainnest Inc.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-slate-400">
                🌟 Trusted by 5K+ learners worldwide
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-400">
                  System Status: All systems operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
