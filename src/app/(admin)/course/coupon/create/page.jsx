"use client";

import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
const page = () => {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const router = useRouter();
  console.log("Page rendered");
  const handleCreateCoupon = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("/api/admin/coupon", {
        code: code,
        discount: discount,
        expiresAt: expiresAt,
        usageLimit: usageLimit,
      });
      const data = response?.data;
      toast.success("Coupon created successfully");
      router.push("/course/coupon");
    } catch (error) {
      throw error;
    }
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="w-[70%] h-full flex items-center justify-center">
        <Card className="w-[550px] space-y-4">
          <CardHeader>
            <CardTitle>Create a Coupon</CardTitle>
            <CardDescription>
              Create a new coupon for your course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Coupon</Label>
                <Input
                  value={code}
                  type="text"
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. JAVASCRIPT100"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
                  value={discount}
                  type="number"
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>
              <div className="space-y-2">
                <Label>Coupon Limit</Label>
                <Input
                  value={usageLimit}
                  type="number"
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="e.g. 75"
                />
              </div>
              <div className="space-y-2">
                <Label>Coupon Duration</Label>
                <Input
                  value={expiresAt}
                  type="date"
                  onChange={(e) => setExpiresAt(e.target.value)}
                  placeholder="e.g. 03/01/2025"
                />
              </div>

              <Button
                type="button"
                onClick={handleCreateCoupon}
                variant="outline"
              >
                + Add Coupon
              </Button>
            </form>
          </CardContent>
          
        </Card>
      </div>
    </div>
  );
};

export default page;
