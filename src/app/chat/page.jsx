"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { Plus } from "lucide-react";
import { Minus } from "lucide-react";
import { MessageCirclePlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import { MdCircle } from "react-icons/md";
export default function ChatIdPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.authUser);
  const userId = useMemo(() => user?._id, [user]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isLimitExceeded, setIsLimitExceeded] = useState();
  const [isActive, setIsActive] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [instructors, setInstructors] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isComponentLoading, setIsComponentLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [activeChatId, setActiveChatId] = useState();
  const [messageCount, setMessageCount] = useState(0);
  const socketRef = useRef(null);
  const [userStatus, setUserStatus] = useState({});
  const onlineUserIds = useMemo(() => {
    return Object.entries(userStatus)
      .filter(([_, status]) => status === "online")
      .map(([userId]) => userId);
  }, [userStatus]);
  const fetchChat = useCallback(async () => {
    setIsComponentLoading(true);
    try {
      const response = await axios.get("/api/chat");
      const data = response.data.chat;
      setChats(data);

      console.log("This is the complete response :", response);
      const instructors = [];
      for (const chat of chats) {
        instructors.push(chat.receiver);
        setInstructors(instructors);
      }
      console.log("These are the chats of the User:", data);
      router.push("/chat");
    } catch (error) {
      throw error;
    } finally {
      setIsComponentLoading(false);
    }
  },[chats]);
  const verifyPayment = async (paymentData) => {
    try {
      const response = await axios.put("/api/message/payment/verify", {
        orderId: paymentData.razorpay_order_id,
        paymentId: paymentData.razorpay_payment_id,
        signature: paymentData.razorpay_signature,
        chatId: activeChat._id,
        sender: activeChat?.sender,
        receiver: activeChat?.receiver,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Payment verification failed");
      }

      return response.data;
    } catch (error) {
      console.error("Error verifying payment:", error);
      // Convert axios error to a more readable format
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(
          error.response.data.message ||
            `Payment verification failed with status ${error.response.status}`
        );
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error("No response received from verification server");
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(
          error.message || "Error setting up verification request"
        );
      }
    }
  };
  const handleBuyPlans = async () => {
    if (!activeChat || activeChat == "")
      return toast.error("Please select a chat first");
    try {
      // Check if user is logged in
      if (!user) {
        toast.error("Please login first");
        return router.push("/login");
      }

      // Show loading state
      toast.loading("Processing your purchase...");

      // Create an order object with course details
      const orderData = {
        chatId: activeChat._id,
        amount: selectedPlan.price,
        messageLimit: selectedPlan.messages,
        userId: user?._id || user?.id,
      };

      // Call API to create order and process payment
      const response = await axios.put(`/api/message/payment`, orderData);
      const data = response?.data;

      console.log("This is message data in the course Id Page ", data);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: selectedPlan * 100, // Amount in paisa
        currency: "INR",
        name: "Brainnest LMS",
        description: `Purchase: Message Plans`,
        order_id: data.razorpayChatId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            toast.loading("processing payment...");
            const verification = await verifyPayment(response);

            if (verification.success) {
              toast.success(
                "Payment successful! You now have access to the message."
              );
              toast.dismiss();
              setIsPaid(true);
              const updatedChatResponse = await axios.get("/api/chat");
              const updatedChats = updatedChatResponse.data.chat;
              setChats(updatedChats);

              const updatedActive = updatedChats.find(
                (c) => c._id === activeChat._id
              );
              if (updatedActive) {
                setActiveChat(updatedActive); // ✅ this will trigger useEffect and reset isActive
              }
              // Redirect to course page or dashboard
              // router.push(`/courses/${course._id}`);
            } else {
              toast.error(
                "Payment verification failed. Please contact support."
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || "",
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
      };

      const razor = new window.Razorpay(options);
      razor.open();
      toast.dismiss();

      if (response.data.success) {
        toast.success("Credits purchased successfully!");

        // Refresh user data to update enrolled courses
        await fetchChat();

        // Redirect to course view page
      } else {
        toast.error(response.data.message || "Failed to process payment");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Something went wrong");
      console.error("Buy now error:", error);
      console.error("Payment initiation failed:", error);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  const sendMessage = (message) => {
    if (isActive)
      return toast.error("Message limit reached. Please buy a plan.");
    // setMessages((messages) => [
    //   ...messages,
    //   {
    //     message,
    //     sender: activeChat?.sender,
    //     receiver: activeChat?.receiver,
    //     createdAt: new Date().toISOString(),
    //     updatedAt: new Date().toISOString(),
    //   },
    // ]);
    console.log("✅ Emitting message", {
      sender: userId,
      receiver: activeChat?.receiver,
      message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    socket.emit("message", {
      sender: activeChat?.sender,
      receiver: activeChat?.receiver,
      message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const response = console.log("This is the message :", message);

    setMessage("");
    console.log("This is the updated state of the messages :", messages);
  };

  const saveMessage = async () => {
    if (isActive) {
      toast.error("Message limit reached. Please buy a plan.");
      return;
    }
    console.log("Message controller called in this ");
    const messageData = {
      message,
      sender: userId,
      receiver: activeChat?.receiver,
      chatId: activeChat?._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      sendMessage(message);
      const response = await axios.post("/api/message", { messageData });
      const data = response?.data;
      console.log("This is the data :", data);
      toast.success("Message sent successfully");
      const updatedChats = await axios.get("/api/chat");
      const updatedChat = updatedChats?.data?.chat;
      const updatedActiveChat = updatedChat.filter(
        (c) => c._id === activeChat._id
      );
      setChats(updatedChat);
      setActiveChat(updatedActiveChat[0]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      throw error;
    } finally {
    }
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
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        saveMessage();
      }
    }
  };
 
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (user && !socketRef.current) {
      fetch("/api/socket").then(() => {
        if (isMounted) {
          const newSocket = connectSocket(userId);
          setSocket(newSocket);
          socketRef.current = newSocket;

          newSocket.on("connect", () => {
            // console.log("Socket connected:", newSocket.id);
          });

          newSocket.on("messageByAdmin", (msg) => {
            setMessages((prev) => [...prev, msg]);
          });
          newSocket.on("message", (msg) => {
            setMessages((prev) => [...prev, msg]);
          });

          newSocket.on("userStatus", ({ userId, status }) => {
            // console.log(`${userId} is now ${status}`);
            setUserStatus((prev) => ({
              ...prev,
              [userId]: status,
            }));
            // console.log(
            //   "This is the user Id received from in the user Status :",
            //   userId
            // );
          });
        }
      });
    }
    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, userId]);

  useEffect(() => {
    if (activeChat?.allMessages) {
      setMessages(activeChat.allMessages);
    }
  }, [activeChat]);

  useEffect(() => {
    
    if (user) {
      const timer = setTimeout(() => {
      
      fetchChat();
      setIsLoading(false);
      setSelectedPlan(plans[0]);
    }, 300); // Small delay to prevent immediate load
    return () => clearTimeout(timer);
    }
  }, [user,fetchChat]);
  useEffect(() => {
    // console.log("This is the selected plan", selectedPlan);
  }, [selectedPlan]);
  useEffect(() => {
    if (activeChat) {
      setIsActive(activeChat.messageRemaining <= 0 || !activeChat.isActive);
    }
  }, [activeChat]);

  useEffect(() => {
    // console.log("This is the isLimitExceeded :", isActive);
  }, [isActive]);
  useEffect(() => {
    // console.log("This is the currect active Chat", activeChat);
  }, [activeChat]);
  const scrollToBottom = () => {
    // if (messagesContainerRef.current) {
    //   messagesContainerRef.current.scrollToBottom =
    //     messagesContainerRef.current.scrollHeight;
    // }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };
  const isAuthChecked = useAuthRedirect({
    redirectIfUnauthenticated: true,
    redirectIfAuthenticated: false,
    redirectIfNotInstructor: false,
    interval: 10000,
  });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    // console.log("This is the User Id in the console ", userId);
  }, []);

  useEffect(() => {
    // console.log(
    //   "This is the User Status in the console in the user section ",
    //   userStatus
    // );
  }, [userStatus]);
  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-white dark:bg-black justify-start h-screen ">
      <div className="w-full h-[95%] flex justify-between items-start overflow-none bg-black">
        <div
          className={`flex flex-col  justify-start h-full overflow-hidden ${
            isCollapsed ? "w-[80px]" : "w-[300px]"
          } bg-black dark:bg-black  gap-2`}
        >
          {isLoading ? (
            <Skeleton className="w-full !h-full py-3" />
          ) : (
            <div className="w-full h-full  overflow-y-none border-r bg-black ">
              <div
                defaultOpen={isSidebarOpen}
                className=" h-full w-full !bg-black !flex"
              >
                <div
                  className={`transition-all duration-300 h-full flex flex-col relative bg-black gap-2 ${
                    isCollapsed ? "w-[80px] pr-3" : "w-[300px]"
                  }`}
                >
                  <div className="pl-4 w-full flex !border-none !outline-none items-center bg-black">
                    <div
                      className={`w-full flex items-center ${
                        isCollapsed ? "justify-center" : "justify-between"
                      } px-2 py-4 pb-2`}
                    >
                      {!isCollapsed && (
                        <p className="text-2xl text-white">Chats</p>
                      )}
                      <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-white px-0 py-0"
                        title={isCollapsed ? "Expand" : "Collapse"}
                      >
                        {isCollapsed ? <MessageCirclePlus /> : <Minus />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center !border-none !outline-none bg-black">
                    <Separator className="!w-1/3 h-px bg-gray-200 !border-none !shadow-none !outline-none ml-2" />
                  </div>
                  <div className="pl-2 h-full bg-black w-full !border-none !outline-none flex flex-col gap-3">
                    {chats.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p>No Chats Found</p>
                      </div>
                    ) : (
                      chats.map((chat) => (
                        <div key={chat._id}>
                          <div
                            className={`flex items-center gap-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded-md ${
                              activeChatId === chat._id
                                ? "bg-gray-200 dark:bg-gray-700"
                                : ""
                            }`}
                            onClick={() => {
                              setActiveChatId(chat._id);
                              setActiveChat(chat);
                            }}
                          >
                            {isComponentLoading ? (
                              <Skeleton className="w-12 h-12  relative" />
                            ) : (
                              <div className="w-12 h-12  relative">
                                <Image
                                  src={chat.receiver?.profileImage}
                                  fill
                                  className="object-cover rounded-full"
                                />
                                {onlineUserIds.includes(chat.sender?._id) && (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white">
                                    <MdCircle className="w-full h-full text-green-500" />
                                  </div>
                                )}
                              </div>
                            )}{" "}
                            {!isCollapsed &&
                              (isComponentLoading ? (
                                <Skeleton className={"w-[50px] h-[5px]"} />
                              ) : (
                                <p className="text-white truncate">
                                  {chat.receiver?.name}
                                </p>
                              ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center justify-between  h-full flex-1 bg-white dark:bg-black p-4 relative">
          {isActive && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center  bg-black/50 backdrop-blur-sm z-15 m-1">
              <div className="flex flex-col items-center gap-4 ">
                <p className="text-2xl text-white dark:text-gray-600">
                  Buy Credits
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
                          defaultValue={JSON.stringify(selectedPlan)}
                          value={JSON.stringify(selectedPlan)}
                          onValueChange={(value) =>
                            setSelectedPlan(JSON.parse(value))
                          }
                          className="space-y-2"
                        >
                          {plans.map((plan, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-6"
                            >
                              <RadioGroupItem
                                value={JSON.stringify(plan)}
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
                    <Button variant="outline cursor-pointer">Back</Button>
                    <Button className="cursor-pointer" onClick={handleBuyPlans}>
                      Pay Now
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
          {activeChat ? (
            <>
              <div className="w-full h-20  flex items-center justify-start gap-4 z-0">
                {activeChat === null || activeChat === "" ? (
                  <Skeleton className="w-15 h-15  relative rounded-full" />
                ) : (
                  <div className="w-15 h-15  relative">
                    <Image
                      src={activeChat?.receiver?.profileImage}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                )}
                {activeChat === null || activeChat === "" ? (
                  <Skeleton className="w-[80px] h-[15px] rounded-lg" />
                ) : (
                  <p>{activeChat?.receiver?.name}</p>
                )}
              </div>
              <div className="flex-1 w-full overflow-hidden flex flex-col z-0 ">
                <div className=" flex-1 overflow-y-auto px-4 h-[calc(100%-110px)]">
                  {messages?.map((message) => {
                    const isCurrentUserSender =
                      message?.sender === userId ||
                      message?.sender?._id === userId;
                    return (
                      <div
                        key={message._id}
                        ref={messagesContainerRef}
                        className={`${
                          isCurrentUserSender ? "justify-end" : "justify-start"
                        } flex items-center gap-2 w-full  p-2`}
                      >
                        <div
                          className={`min-w-1/3 px-2 py-4 relative bg-red-500 ${
                            isCurrentUserSender
                              ? "rounded-bl-lg rounded-tr-lg rounded-tl-lg"
                              : "rounded-br-lg rounded-tr-lg rounded-tl-lg"
                          }`}
                        >
                          <div className="absolute bottom-0 right-1 text-sm">
                            {new Date(message.createdAt).toLocaleTimeString(
                              "en-US"
                            )}
                          </div>
                          <p>{message?.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="w-full h-[20] flex items-center justify-start gap-4 py-2 z-0">
                <div className="w-full flex justify-between gap-2 relative">
                  {activeChat === null || activeChat === "" ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <Input
                      placeholder="Type a message"
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                      }}
                      className="w-full h-12 "
                      disabled={isActive}
                      onKeyDown={handleKeyDown}
                    />
                  )}
                  {activeChat === null || activeChat === "" ? (
                    <Skeleton className=" w-12 h-12 rounded-full mx-auto my-auto " />
                  ) : (
                    <Button
                      className="w-9 h-9 rounded-full absolute right-2 top-2 z-11"
                      onClick={() => saveMessage()}
                      disabled={isActive}
                    >
                      <AiOutlineSend />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center ">
              <p>Chat with Your Instructors</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
