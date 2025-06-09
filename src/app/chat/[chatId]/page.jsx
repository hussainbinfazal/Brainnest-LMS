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
import useAuthRedirect from "@/hooks/useAuthRedirect";
export default function ChatIdPage() {
  const user = useAuthStore((state) => state.authUser);
  const userId = useMemo(() => user?._id, [user]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [socket, setSocket] = useState(null);
  const isAuthChecked = useAuthRedirect({redirectIfUnauthenticated: true , redirectIfAuthenticated: false, redirectIfNotInstructor: false, interval: 3000,});
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const messages = [
    {
      message: "This is the sample message in the page ",
    },
  ];
  useEffect(() => {
    const newSocket = connectSocket(userId);
    setSocket(newSocket);

    newSocket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on("userStatus", ({ userId, status }) => {
      // console.log(`${userId} is now ${status}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  const fetchChat = async () =>{
    try{
      const response = await axios.get(`/api/chat/chats`,{sender:userId});
      const data = response.data
      setChats(data.chats)
      // console.log("These are the chats of the User:",data)
    }catch(error){
      throw error
    }
  }
  // const fetchInstructorsFromChats = async () => {
  //   try {
      
  //     const instructors = [];
  //     for (const chat of chats) {
  //       instructors.push(data);
  //     }
  //     return instructors;
  //   } catch (error) {
  //     throw error;
  //   }
  // };
  const sendMessage = (message) => {
    socket.emit("message", {
      sender: userId,
      receiver: "RECEIVER_ID_HERE",
      message,
    });
  };

  const plans = [
    {
      messages: "10",
      price: "100",
    },
    {
      messages: "20",
      price: "200",
    },
    {
      messages: "30",
      price: "300",
    },
  ];
  //   useEffect(() => {
  //     fetch("/api/socket"); // ⬅ initializes the server on first load
  //   }, []);
  useEffect(() => {
    fetchChat()
    setIsLoading(false);
  }, []);
  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-white dark:bg-black justify-start h-screen ">
      <div className="w-full h-[95%] flex justify-between items-start ">
        <div className="flex flex-col items-center justify-start h-full w-1/3 bg-gray-100 dark:bg-black p-4">
          {isLoading ? (
            <Skeleton className="!w-full !h-full py-3" />
          ) : (
            <div className="min-h-screen h-full  overflow-y-auto border-r ">
              <SidebarProvider
                defaultOpen={isSidebarOpen}
                className="min-h-screen h-full"
              >
                <Sidebar className="min-h-screen h-full flex flex-col relative ">
                  <SidebarHeader className="pl-6">
                    <p className="text-2xl dark:white text-white">Chats</p>
                  </SidebarHeader>
                  <SidebarContent className="pl-4 h-full"></SidebarContent>
                  <SidebarFooter />
                </Sidebar>
              </SidebarProvider>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center justify-between  h-full w-2/3 bg-white dark:bg-black p-4 relative">
          {!isLimitExceeded && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center  bg-black/50 backdrop-blur-sm z-985 m-1">
              <div className="flex flex-col items-center gap-4 ">
                <p className="text-2xl text-white dark:text-gray-600">
                  You have exceeded your limit
                </p>

                <Card className="w-[350px]">
                  <CardHeader>
                    <CardTitle className={"text-xl"}>Choose Plan</CardTitle>
                    <CardDescription>
                      Choose a plan that works for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form>
                      <div className="grid w-full gap-4">
                        <RadioGroup
                          value={selectedPlan}
                          onValueChange={setSelectedPlan}
                          className="space-y-2"
                        >
                          {plans.map((plan, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-6"
                            >
                              <RadioGroupItem
                                value={plan.messages}
                                id={`plan-${index}`}
                                className="w-4 h-4"
                              />
                              <Label htmlFor={`plan-${index}`}>
                                {plan.messages} Messages (₹{plan.price})
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-between py-2">
                    <Button variant="outline">Back</Button>
                    <Button>Pay Now</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
          <div className="w-full h-20  flex items-center justify-start gap-4 z-0">
            <div className="w-15 h-15  relative">
              <Image
                src={user?.profileImage}
                fill
                className="object-cover rounded-full"
              />
            </div>{" "}
            <p>{user?.name}</p>
          </div>
          <div className="flex flex-1 w-full h-full z-0">
            <div className="h-full w-full">
              {messages?.map((course) => (
                <div
                  className={`${
                    message?.sender === user?._id || user?.id
                      ? "justify-end"
                      : "justify-start"
                  } flex items-center gap-2 w-full  p-2`}
                >
                  <div
                    className={`min-w-1/3 px-2 py-4 relative bg-red-500 ${
                      message?.sender === user?._id || user?.id
                        ? "rounded-bl-lg rounded-tr-lg rounded-tl-lg"
                        : "rounded-br-lg rounded-tr-lg rounded-tl-lg"
                    }`}
                  >
                    <p>{course?.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full h-[20] flex items-center justify-start gap-4 py-2 z-0">
            <div className="w-full flex justify-between gap-2 relative">
              <Input
                placeholder="Type a message"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                className="w-full h-12 "
              />
              <Button className="w-9 h-9 rounded-full absolute right-2 top-2 z-11">
                <AiOutlineSend />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
