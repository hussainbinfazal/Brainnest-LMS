"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutlineSend } from "react-icons/ai";
import { connectSocket } from "@/lib/socket";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios from "axios";
export default function ChatIdPage() {
  return <ChatIdPageComp />;
}
