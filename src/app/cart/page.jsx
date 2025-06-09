"use client";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { toast } from "sonner";
import axios from "axios";
import { LiaShoppingCartSolid } from "react-icons/lia";
import { MdDelete } from "react-icons/md";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
const CartPage = () => {
  const [cartCartCourses, setCartCourses] = useState([]);
  const [cart, setCart] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [maxDistance, setMaxDistance] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const [coupon, setCoupon] = useState(null);
  const containerRef = useRef(null);
  const [paymentError, setPaymentError] = useState(null);
  const scrollValue = scrollYProgress;
  const x = useTransform(scrollYProgress, [0, 1], [0, maxDistance]);
  const [isFixed, setIsFixed] = useState(false);
  const user = useAuthStore((state) => state.authUser);
  const router = useRouter();
  // const [cart, setCart] = useState({
  //   _id: "6641320fd8342c7f98765432",
  //   user: "663fe7f4c24e1b001f8a1234",
  //   cartItems: [
  //     {
  //       _id: "663faaaa34eeae0123456789",
  //       title: "Full-Stack Web Development",
  //       description: "Learn MERN stack from scratch.",
  //       price: 100,
  //       discount: 10,
  //       instructor: "Instructor Name",
  //       createdAt: "2024-04-01T12:00:00.000Z",
  //       updatedAt: "2024-04-10T12:00:00.000Z",
  //       __v: 0,
  //     },
  //     {
  //       _id: "663fabcd78dfae0123456790",
  //       title: "React Advanced Course",
  //       description: "Advanced patterns and performance optimization in React.",
  //       price: 80,
  //       discount: 0,
  //       instructor: "Another Instructor",
  //       createdAt: "2024-03-15T15:00:00.000Z",
  //       updatedAt: "2024-03-20T15:00:00.000Z",
  //       __v: 0,
  //     },
  //     {
  //       _id: "663fabcd78dfae0123456790",
  //       title: "React Advanced Course",
  //       description: "Advanced patterns and performance optimization in React.",
  //       price: 80,
  //       discount: 0,
  //       instructor: "Another Instructor",
  //       createdAt: "2024-03-15T15:00:00.000Z",
  //       updatedAt: "2024-03-20T15:00:00.000Z",
  //       __v: 0,
  //     },
  //     {
  //       _id: "663fabcd78dfae0123456790",
  //       title: "React Advanced Course",
  //       description: "Advanced patterns and performance optimization in React.",
  //       price: 80,
  //       discount: 0,
  //       instructor: "Another Instructor",
  //       createdAt: "2024-03-15T15:00:00.000Z",
  //       updatedAt: "2024-03-20T15:00:00.000Z",
  //       __v: 0,
  //     },
  //     {
  //       _id: "663fabcd78dfae0123456790",
  //       title: "React Advanced Course",
  //       description: "Advanced patterns and performance optimization in React.",
  //       price: 80,
  //       discount: 0,
  //       instructor: "Another Instructor",
  //       createdAt: "2024-03-15T15:00:00.000Z",
  //       updatedAt: "2024-03-20T15:00:00.000Z",
  //       __v: 0,
  //     },
  //     {
  //       _id: "663fabcd78dfae0123456790",
  //       title: "React Advanced Course",
  //       description: "Advanced patterns and performance optimization in React.",
  //       price: 80,
  //       discount: 0,
  //       instructor: "Another Instructor",
  //       createdAt: "2024-03-15T15:00:00.000Z",
  //       updatedAt: "2024-03-20T15:00:00.000Z",
  //       __v: 0,
  //     },
  //     {
  //       _id: "663fabcd78dfae0123456790",
  //       title: "React Advanced Course",
  //       description: "Advanced patterns and performance optimization in React.",
  //       price: 80,
  //       discount: 0,
  //       instructor: "Another Instructor",
  //       createdAt: "2024-03-15T15:00:00.000Z",
  //       updatedAt: "2024-03-20T15:00:00.000Z",
  //       __v: 0,
  //     },
  //   ],
  //   subtotal: 180,
  //   tax: 18,
  //   discount: 10,
  //   total: 188,
  //   createdAt: "2024-05-09T12:00:00.000Z",
  //   updatedAt: "2024-05-09T12:00:00.000Z",

  //   __v: 0,
  // });
  // useEffect(() => {
  //   setCartItems(cart?.cartItems);
  // }, []);
  useEffect(() => {
    const handleScroll = () => {
      setIsFixed(window.scrollY > 0); // threshold: 50px scroll
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    if (containerRef.current) {
      // This will be approximately the width of the content area minus the icon width
      const containerWidth = containerRef.current.offsetWidth;
      setMaxDistance(containerWidth * 0.99); // Use 85% of container width
    }
  }, [windowWidth]);

  const fetchCart = useCallback(async () => {
    try {
      const response = await axios.get("/api/cart");
      const data = response?.data;
      setCart(data);
      // console.log("Cart :", data);
      setCartItems(data?.courses);
      setLoading(false);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong while liking the course.";

      toast.error(message);
    }
  }, [cartItems?.length]);
  const verifyPayment = async (paymentData) => {
    try {
      const response = await axios.post("/api/order/cartOrder/verify", {
        orderId: paymentData.razorpay_order_id,
        paymentId: paymentData.razorpay_payment_id,
        signature: paymentData.razorpay_signature,

        userId: user._id,
        amount: paymentData.amount,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Payment verification failed");
      }

      toast;
      return response.data;
    } catch (error) {
      // console.error("Error verifying payment:", error);
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
  const handleBuyNow = async () => {
    try {
      // Check if user is logged in
      if (!user) {
        toast.error("Please login first");
        return router.push("/login");
      }

      // Show loading state
      toast.loading("Processing your purchase...");

      // Create an order object with course details
      const orderData = {};

      // Call API to create order and process payment
      const response = await axios.post(`/api/order/cartOrder`, orderData);
      const data = response?.data;
      // console.log("This is order data in the course Id Page ", data);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount * 100, // Amount in paisa
        currency: "INR",
        name: "Brainnest LMS",
        description: `Purchase: ${data?.courses?.[0]?.title}`,
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          const toastId = toast.loading("Verifying payment...");
          try {
            // Verify payment on backend
            const verification = await verifyPayment({
              ...response,
              amount: data.amount,
              userId: user._id,
            });
            const responseFromVerifyPayment = verification?.data?.message;
            setPaymentError(responseFromVerifyPayment);
            if (verification.success) {
              toast.success(
                "Payment successful! You now have access to the course."
              );
              // Redirect to course page or dashboard
              toast.dismiss(toastId);
              router.push(`/myprofile`);
            } else {
              alert("Payment verification failed. Please contact support.");
              toast.success(responseFromVerifyPayment);
              toast.dismiss(toastId);
            }
          } catch (error) {
            alert("Payment verification failed. Please contact support.");
            toast.dismiss(toastId);
            toast.error(error.message || "Payment verification failed");
            toast.dismiss();
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
            setLoading(false);
          },
        },
      };

      const razor = new window.Razorpay(options);
      razor.open();

      if (response.data.success) {
        toast.success("Course purchased successfully!");
        toast.dismiss();

        // Refresh user data to update enrolled courses
        await fetchUser();

        // Redirect to course view page
      } else {
        toast.error(response.data.message || "Failed to process payment");
        toast.dismiss();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Something went wrong");
      // console.error("Buy now error:", error);
      // console.error("Payment initiation failed:", error);
      alert("Failed to initiate payment. Please try again.");
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

  function convertToTotalHours(timeStr) {
    const parts = timeStr.toString().split(":").map(Number);

    let hours = 0;
    if (parts.length === 3) {
      hours = parts[0] + parts[1] / 60 + parts[2] / 3600;
    } else if (parts.length === 2) {
      hours = parts[0] / 60 + parts[1] / 3600;
    } else if (parts.length === 1) {
      hours = parts[0] / 3600;
    }

    return parseFloat(hours.toFixed(2)); // rounded to 2 decimals
  }
  function formatRatingNumber(num) {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    } else {
      return num.toString();
    }
  }

  const deleteFromCart = async (courseId) => {
    try {
      const response = await axios.delete(`/api/cart/${courseId}`);
      const data = response.data;
      // console.log(data);
      const updatedCartItems = cartItems.filter(
        (item) => item._id !== courseId
      );
      setCartItems(updatedCartItems);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchCart();
      }, 300); // Small delay to prevent immediate load
      return () => clearTimeout(timer);
    }
  }, [fetchCart, user]);
  return (
    <div className="min-h-screen w-screen flex flex-col overflow-auto px-4">
      <div
        ref={containerRef}
        className="w-full min-h-screen py-8 flex flex-col gap-6 "
      >
        {cartItems?.length === 0 ? (
          <div className="w-full min-h-screen  flex justify-center items-center">
            <span className="flex flex-col justify-center items-center text-2xl gap-6">
              <span className="flex items-center justify-center">
                <p>No Course in the Cart </p>
                <LiaShoppingCartSolid className="text-3xl" />
              </span>
              <Button
                className="cursor-pointer rounded-sm"
                onClick={() => router.push("/courses")}
              >
                {" "}
                Add one{" "}
              </Button>
            </span>
          </div>
        ) : (
          <>
            <div className="text-3xl font-semibold flex gap-4 w-full justify-start items-center">
              Your Items in cart{" "}
              <motion.span
                style={{ x }}
                className={`text-6xl origin-left ${
                  isFixed
                    ? "fixed top-11 left-2 lg:left-0 xl:left-0 2xl:left:0  z-[40]"
                    : ""
                }`}
              >
                <LiaShoppingCartSolid className="z-[60]" />
              </motion.span>
            </div>

            <div className=" w-full h-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  ">
              {cartItems?.length === 0 ? (
                <div>no items found in the cart</div>
              ) : (
                <>
                  {cartItems?.map((course) => {
                    return (
                      <div
                        key={course?._id}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-4"
                      >
                        <div>
                          <Card
                            key={course?._id}
                            className="w-[300px] h-[380px] relative py-4"
                          >
                            <CardContent className="h-3/5 w-full flex justify-center relative">
                              {course?.coverImage ? (
                                <div className="relative w-full h-full p-4 rounded-xl overflow-hidden">
                                  <Image
                                    src={course.coverImage}
                                    alt={course.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <Skeleton className="w-full h-[200px]" />
                              )}
                            </CardContent>
                            <CardFooter className="flex-1">
                              <div className="w-full h-full flex flex-col justify-between gap-3">
                                <div className="w-full flex flex-col flex-1 gap-2">
                                  <p className="capitalize text-xl font-semibold  leading-snug overflow-hidden text-ellipsis whitespace-nowrap">
                                    {course.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {course?.instructor?.name}
                                  </p>
                                  <div className="flex gap-2">
                                    <Badge variant="outline">
                                      {course?.rating
                                        ? formatRatingNumber(course.rating)
                                        : "0"}
                                    </Badge>
                                    <Badge variant="outline">
                                      {course?.duration
                                        ? convertToTotalHours(course.duration)
                                        : "0"}{" "}
                                      hours
                                    </Badge>
                                  </div>
                                </div>
                                <div className="w-full flex justify-between ">
                                  <Button
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteFromCart(course._id);
                                    }}
                                    className="px-10"
                                  >
                                    <span className="w-full flex justify-center">
                                      <MdDelete className="text-2xl " />
                                    </span>
                                  </Button>

                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/courses/${course._id}`);
                                    }}
                                  >
                                    View Course
                                  </Button>
                                </div>
                              </div>
                            </CardFooter>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}
        {cartItems?.length > 0 && (
          <div className="w-full flex justify-between">
            <div className="inline-block">
              <Card className="w-[350px]">
                <CardContent>
                  <form>
                    <div className="grid w-full items-center gap-4">
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="name" className="text-xl my-4">
                          Apply Coupon
                        </Label>
                        <Input
                          id="coupon"
                          placeholder="Apply Coupon"
                          value={coupon}
                          onChange={(e) => {
                            setCoupon(e.target.value);
                          }}
                        />
                      </div>
                      {cart?.coupon && (
                        <div>
                          <p className="text-lg font-semibold">
                            Coupon: {cart?.coupon?.code}
                          </p>
                          <p className="text-lg font-semibold">
                            Discount: {cart?.coupon?.value}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-end items-center">
                        <Button>Apply</Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
            <div className="w-full flex flex-col items-end justify-end">
              <div className="inline-block">
                <Card className="w-[350px]">
                  <CardContent>
                    <div className="grid w-full items-center gap-4">
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="name" className="text-xl my-4">
                          Total
                        </Label>
                        <p className="text-lg font-semibold w-full flex justify-between">
                          <span> Subtotal:</span>{" "}
                          <span>₹ {Math.floor(cart?.subTotal || 0)}</span>
                        </p>
                      </div>
                      {cart?.discount && (
                        <div>
                          <span className="text-lg font-semibold w-full flex justify-between">
                            <span>Discount:</span>{" "}
                            <span>{Math.floor(cart?.discount)}</span>
                          </span>
                        </div>
                      )}
                      {cart?.tax && (
                        <div>
                          <span className="text-lg font-semibold w-full flex justify-between">
                            <span>Tax:</span>{" "}
                            <span>{Math.floor(cart?.tax)}</span>
                          </span>
                        </div>
                      )}
                      {cart?.total && (
                        <div>
                          <span className="text-lg font-semibold w-full flex justify-between">
                            <span> Total: </span>{" "}
                            <span>₹ {Math.floor(cart?.total)} </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        {cartItems?.length > 0 && (
          <div className="flex justify-end mt-8 ">
            <Button
              onClick={() => {
                handleBuyNow();
              }}
              className="h-15 w-50 rounded-none"
            >
              Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
