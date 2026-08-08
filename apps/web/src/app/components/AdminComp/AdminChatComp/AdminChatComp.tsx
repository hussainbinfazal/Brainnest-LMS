"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutlineSend } from "react-icons/ai";
import { connectSocket } from "@/lib/socket";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import axios from "axios";
import { Minus } from "lucide-react";
import { MessageCirclePlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CiCircleInfo } from "react-icons/ci";
import { TfiLayoutMenuSeparated } from "react-icons/tfi";

import { RxDropdownMenu } from "react-icons/rx";
import { MdCircle } from "react-icons/md";
import { CAuthUser, CChat, CChatMessage, CClientToServerEvents, CMessage, CServerToClientEvents } from "@/types/client";
import { Socket } from "socket.io-client";
import { cn } from "@/lib/utils";

type MinimalUser = {
  _id: string;
  name: string;
  profileImage: string;
};

export default function AdminChat({className}: {className?: string}): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((state) => state.authUser);
  const userId = useMemo(() => user?._id, [user]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [messageText, setMessageText] = useState<string>("");
  const [message, setMessage] = useState<CMessage>({
    _id: "", message: "", sender: {
      _id: "",
      name: "",
      profileImage: ""
    }, receiver: {
      _id: "",
      name: "",
      profileImage: ""
    }, createdAt: new Date(), updatedAt: new Date()
  });
  const [chats, setChats] = useState<CChat[]>([]);
  const [socket, setSocket] = useState<Socket<CClientToServerEvents, CServerToClientEvents> | null>(null);
  const [isLimitExceeded, setIsLimitExceeded] = useState<boolean>();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [users, setUsers] = useState<MinimalUser[]>([]);
  const [activeChat, setActiveChat] = useState<CChat | null>(null);
  const [messages, setMessages] = useState<CMessage[]>([]);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const [isComponentLoading, setIsComponentLoading] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [activeChatId, setActiveChatId] = useState<string>();
  const [messageCount, setMessageCount] = useState<number>(0);
  const [viewLimitInfo, setViewLimitInfo] = useState<string | null | boolean>("");
  const [viewRemainingInfo, setViewRemainingInfo] = useState<string | number | boolean>("");
  const [viewCountInfo, setViewCountInfo] = useState<string | boolean>("");
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [userStatus, setUserStatus] = useState<{ [key: string]: string }>({});
  const onlineUserIds = useMemo(() => {
    return Object.entries(userStatus)
      .filter(([_, status]) => status === "online")
      .map(([userId]) => userId);
  }, [userStatus]);
  const socketRef = useRef<Socket<CClientToServerEvents, CServerToClientEvents> | null>(null);
  const fetchChat = useCallback(async (): Promise<void> => {
    setIsComponentLoading(true);
    try {
      const response = await axios.get("/api/chat/admin");
      const data = response?.data?.chatOfAdmins;
      setChats(data);

      const allUsers = [];
      for (const chat of chats) {
        allUsers.push(chat?.sender);
        setUsers(allUsers);
      }
      setIsLoading(false);
      // router.push("/chat");
    } catch (error) {
      throw error;
    } finally {
      setIsComponentLoading(false);
    }
  }, []);

  const sendMessage = (message: CMessage): void => {
    if (isActive) {
      toast.error("Message limit reached. Please buy a plan.");
      return;
    }

    if (!socket) {
      toast.error("Socket not connected");
      return;
    }
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
    // console.log("✅ Emitting message", {
    //   sender: activeChat?.sender,
    //   receiver: activeChat?.receiver,
    //   message,
    //   createdAt: new Date().toISOString(),
    //   updatedAt: new Date().toISOString(),
    // });

    socket.emit("messageByAdmin", {
      _id: "",
      sender: activeChat!.sender,
      receiver: activeChat!.receiver,
      message: messageText,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const response = console.log("This is the message :", messageText);

    setMessage({
      _id: "", message: "", sender: {
        _id: "",
        name: "",
        profileImage: ""
      }, receiver: {
        _id: "",
        name: "",
        profileImage: ""
      }, createdAt: new Date(), updatedAt: new Date()
    });
  };

  const saveMessage = async (): Promise<void> => {
    if (isActive) {
      toast.error("Message limit reached. Please buy a plan.");
      return;
    }
    const messageData = {
      message: messageText,
      sender: userId,
      receiver: activeChat?.sender,
      chatId: activeChat?._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      sendMessage(message);
      const response = await axios.post("/api/message/admin", { messageData });
      const data = response?.data;
      toast.success("Message sent successfully");
      const updatedChats = await axios.get("/api/chat/admin");
      const updatedChat = updatedChats?.data?.chatOfAdmins;
      const updatedActiveChat = updatedChat.filter(
        (c: CChat) => c._id === activeChat?._id
      );
      setChats(updatedChat);
      setActiveChat(updatedActiveChat[0]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
      throw error;
    } finally {
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message) {
        saveMessage();
      }
    } else if (e.key === 'Enter' && e.shiftKey) {

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
          if (!userId) return;
          const newSocket = connectSocket(userId);

          setSocket(newSocket);
          socketRef.current = newSocket;

          newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
          });

          newSocket?.on("messageByAdmin", (msg: CMessage) => {
            setMessages((prev) => [...prev, msg]);
          });

          newSocket?.on("message", (msg: CMessage) => {
            setMessages((prev) => [...prev, msg]);
            if (!activeChat) return;
            const usersMessageCount = activeChat.messageCount++;
            setActiveChat((prevChat) => {
              if (!prevChat) return prevChat;
              return {
                ...prevChat,
                messageCount: usersMessageCount,
                messageRemaining: prevChat.messageRemaining - 1,
              };
            });
          });
          newSocket?.on("userStatus", ({ userId, status }: { userId: string, status: 'online' | 'offline' }) => {
            console.log(`${userId} is now ${status}`);
            setUserStatus((prev) => ({
              ...prev,
              [userId]: status,
            }));
          });
          console.log(
            "This is the user Id received from in the user Status :",
            userId
          );
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
      setMessages(activeChat?.allMessages);
    }
  }, [activeChat]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChat();
    }, 300); // Small delay to prevent immediate load
    return () => clearTimeout(timer);
  }, [fetchChat, user]);
  useEffect(() => {
  }, [selectedPlan]);
  useEffect(() => {
    if (activeChat) {
      setIsActive(activeChat.messageRemaining <= 0 || !activeChat.isActive);
    }
  }, [activeChat]);

  useEffect(() => {
  }, [isActive]);
  useEffect(() => {
  }, [activeChat]);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  useEffect(() => { }, [userId]);
  useEffect(() => {
    const updateChat = async (): Promise<void> => {
      const updatedChats = await axios.get("/api/chat");
      const updatedChat = updatedChats?.data?.chat;
      const updatedActiveChat = updatedChat?.filter(
        (c: CChat) => c._id === activeChat?._id
      );
      setChats(updatedChat);
      setActiveChat(updatedActiveChat[0]);
    };
    updateChat();
  }, [messages?.length]);
  useEffect(() => { }, [userStatus]);


  return (
    <div className={cn("w-full min-h-screen flex flex-col items-center bg-white dark:bg-black justify-start h-screen ", className)}>
      <div className="w-full h-[95%] flex justify-between items-start overflow-none bg-black">
        <div
          className={`flex flex-col  justify-start  h-full overflow-hidden ${isCollapsed ? "w-20 " : "w-80"
            } bg-black dark:bg-black gap-2`}
        >
          {isLoading ? (
            <Skeleton className="w-full h-full! py-3" />
          ) : (
            <div className="w-full h-full  overflow-y-auto border-r bg-black  ">
              <div

                // defaultOpen={isSidebarOpen}
                className=" h-full w-full bg-black!"
              >
                {/* <div className="w-full flex justify-end items-center px-2">
                  <SidebarTrigger>
                    <button className="text-white px-2 py-1">Click</button>
                  </SidebarTrigger>
                </div> */}
                <div
                  className={`transition-all duration-300 h-full flex! flex-col! relative bg-black gap-2${isCollapsed ? "w-20 pr-3" : "w-80"
                    } `}
                >
                  <div className="pl-4 w-full flex! border-none! outline-none! items-center bg-black">
                    <div
                      className={`w-full flex! items-center ${isCollapsed ? "justify-center" : "justify-between"
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
                  <div className="flex justify-center border-none! outline-none! bg-black">
                    <Separator className="w-1/3! h-px bg-gray-200 border-none! shadow-none! outline-none! ml-2" />
                  </div>
                  <div className="pl-2 h-full bg-black w-full border-none! outline-none! flex flex-col gap-3">
                    {chats.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p>No Chats Found</p>
                      </div>
                    ) : (
                      chats.map((chat) => (
                        <div key={chat._id}>
                          <div
                            className={`flex items-center gap-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-md ${activeChatId === chat._id
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
                                  alt="profile"

                                  src={chat?.sender?.profileImage}
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
                                <Skeleton className={"w-12.5 h-4"} />
                              ) : (
                                <p className="text-white truncate">
                                  {chat.sender?.name}
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
          {activeChat ? (
            <>
              <div className="w-full h-20  flex items-center justify-start gap-4 z-0 border-b border-opacity-50">
                {activeChat === null ? (
                  <Skeleton className="w-15 h-15  relative rounded-full" />
                ) : (
                  <div className="w-15 h-15  relative">
                    <Image
                      alt="profile"
                      src={activeChat?.receiver?.profileImage}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                )}
                {activeChat === null ? (
                  <Skeleton className="w-20 h-3.75 rounded-lg" />
                ) : (
                  <p>{activeChat?.receiver?.name}</p>
                )}
              </div>
              <div className="flex-1 w-full overflow-hidden flex flex-col z-0 ">
                <div className=" flex-1 overflow-y-auto px-4 h-[calc(100%-110px)]">
                  {messages?.map((message: CMessage) => {
                    const isCurrentUserSender =
                      message?.sender._id === activeChat?.receiver?._id || message?.sender?._id === activeChat?.receiver?._id;

                    console.log(
                      "This is the sender and userId of the message",
                      message.sender,
                      activeChat?.receiver?._id,
                      "This is :",
                      isCurrentUserSender,
                      "This  is the messageId :",
                      message._id
                    );
                    return (
                      <div
                        key={message._id}
                        ref={messagesContainerRef}
                        className={`${isCurrentUserSender ? "justify-end" : "justify-start"
                          } flex items-center gap-2 w-full  p-2`}
                      >
                        <div
                          className={`min-w-1/3 px-2 py-4 relative bg-red-500 max-w-1/2 overflow-hidden wrap-break-word  ${isCurrentUserSender
                            ? "rounded-bl-lg rounded-tr-lg rounded-tl-lg"
                            : "rounded-br-lg rounded-tr-lg rounded-tl-lg"
                            }`}
                        >
                          <div className="absolute bottom-0 right-1 text-sm">
                            {message.createdAt &&
                              ((message?.createdAt))
                              ? new Date(message.createdAt).toLocaleTimeString(
                                "en-US"
                              )
                              : "Invalid Time"}
                          </div>
                          <p>{message?.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              {showInfo ? (
                <div className="w-full h-30 flex items-center justify-between gap-4 py-2 z-0  px-6 relative">
                  <div className="absolute top-1 -left-3">
                    <RxDropdownMenu
                      onClick={() => setShowInfo(false)}
                      className="text-2xl cursor-pointer dark:text-white text-black z-25"
                    />
                  </div>
                  <Card className="w-87.5 h-full relative flex flex-col">
                    <CardContent className={"flex flex-1"}>
                      <p>User's Message Count: {activeChat?.messageCount}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="w-full flex justify-end">
                        <div
                          onMouseEnter={() => setViewCountInfo(true)}
                          onMouseLeave={() => setViewCountInfo(false)}
                          className="relative"
                        >
                          <CiCircleInfo className="text-xl cursor-pointer" />
                          {viewCountInfo && (
                            <Card className="absolute -top-24 right-3 z-10 w-87.5 h-25 rounded-br-none">
                              <CardContent className="">
                                <p>
                                  This count shows the number of messages the
                                  user has sent.
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                  <Card className="w-87.5 h-full relative flex flex-col ">
                    <CardContent className={" flex flex-1"}>
                      <p>
                        User's Remaining Messages:{" "}
                        {activeChat?.messageRemaining}
                      </p>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                      <div className="w-full flex justify-end">
                        <div
                          onMouseEnter={() => setViewRemainingInfo(true)}
                          onMouseLeave={() => setViewRemainingInfo(false)}
                          className="relative"
                        >
                          <CiCircleInfo className="text-xl cursor-pointer" />
                          {viewRemainingInfo && (
                            <Card className="absolute -top-24 right-3 z-10 w-87.5 h-25 rounded-br-none">
                              <CardContent className="">
                                <p>
                                  This count shows the number of remaining
                                  messages user can send.
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                  <Card className="w-87.5 h-full relative flex  flex-col">
                    <CardContent className={"flex flex-1"}>
                      <p>User's Message Limit: {activeChat?.messageLimit}</p>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                      <div className="w-full flex justify-end">
                        <div
                          onMouseEnter={() => setViewLimitInfo(true)}
                          onMouseLeave={() => setViewLimitInfo(false)}
                          className="relative"
                        >
                          <CiCircleInfo className="text-xl cursor-pointer" />
                          {viewLimitInfo && (
                            <Card className="absolute -top-24 right-3 z-10 w-87.5 h-25 rounded-br-none">
                              <CardContent className="">
                                <p>
                                  This count shows the total number of messages
                                  user can send.
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                <div className="w-full h-25 flex items-center justify-center gap-4 py-2 z-0  px-6">
                  <TfiLayoutMenuSeparated
                    className="dark:text-white text-black text-4xl cursor-pointer  "
                    onClick={() => setShowInfo(true)}
                  />
                </div>
              )}

              <div className="w-full h-25 flex items-center justify-start gap-4 py-2 z-0">
                <div className="w-full flex justify-between gap-2 relative">
                  {activeChat === null || activeChat === null ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <Input
                      type="text"
                      placeholder="Type a message"
                      value={messageText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setMessageText(e.target.value);
                      }}
                      className="w-full h-12 "
                      disabled={isActive}
                      onKeyDown={handleKeyDown}
                    />
                  )}
                  {activeChat === null || activeChat === null ? (
                    <Skeleton className=" w-12 h-12 rounded-full mx-auto my-auto " />
                  ) : (
                    <Button
                      variant="default"
                      size="default"
                      className="w-9 h-9 rounded-full absolute right-2 top-2 z-11"
                      onClick={() => saveMessage()}
                      disabled={isActive || !messageText.trim()}
                    >
                      <AiOutlineSend />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center ">
              <p>Chat with Your Students</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
