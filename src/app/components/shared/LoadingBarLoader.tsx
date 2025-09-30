"use client";

import { LoadingBarLoaderProps } from "@/types/client";
import { useTheme } from "next-themes";
import { BarLoader } from "react-spinners";


const LoadingBarLoader = ({ isLoading = true, color: color, className = "" }: LoadingBarLoaderProps) => {
  const { theme } = useTheme();

  // Determine the color based on props or theme
  const loaderColor = color || (theme === "dark" ? "#ffff3f" : "#2196f3");

  if (!isLoading) return null;

  return (
    <div className={`absolute top-0 left-0 w-full py-2 ${className}`}>
      <BarLoader color={loaderColor} width="100%" height="3px" />
    </div>
  );
};

export default LoadingBarLoader;
