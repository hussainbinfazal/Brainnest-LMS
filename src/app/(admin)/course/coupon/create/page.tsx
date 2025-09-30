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
import { CreateCouponResponse } from "@/types/client";


const CouponPage: React.FC = (): React.JSX.Element => {
  const [code, setCode] = useState<string>("");
  const [discount, setDiscount] = useState<string | number>("");
  const [usageLimit, setUsageLimit] = useState<string | number | null>("");
  const [expiresAt, setExpiresAt] = useState< string | null>("");
  const router = useRouter();
  console.log("Page rendered");
 
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post<CreateCouponResponse>("/api/admin/coupon", {
        code: code,
        discount: discount,
        expiresAt: expiresAt,
        usageLimit: usageLimit,
      });
      const data = response?.data;
      toast.success("Coupon created successfully");
      router.push("/course/coupon");
    } catch (error : any) {
      throw error;
    }
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="w-[70%] h-full flex items-center justify-center">
        <Card className="w-[550px] space-y-4">
          <CardHeader className="">
            <CardTitle className="">Create a Coupon</CardTitle>
            <CardDescription className="">
              Create a new coupon for your course
            </CardDescription>
          </CardHeader>
          <CardContent className="">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label className="">Coupon</Label>
                <Input
                  className=""
                  value={code}
                  type="text"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                  placeholder="e.g. JAVASCRIPT100"
                />
              </div>
              <div className="space-y-2">
                <Label className="">Discount</Label>
                <Input
                  className=""
                  value={discount}
                  type="number"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscount(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>
              <div className="space-y-2">
                <Label className="">Coupon Limit</Label>
                <Input
                 className=""
                  value={usageLimit}
                  type="number"
                  onChange={(e : React.ChangeEvent<HTMLInputElement>) => setUsageLimit(e.target.value)}
                  placeholder="e.g. 75"
                />
              </div>
              <div className="space-y-2">
                <Label className="">Coupon Duration</Label>
                <Input
                  className=""
                  value={expiresAt}
                  type="date"
                  onChange={(e : React.ChangeEvent<HTMLInputElement>) => setExpiresAt(e.target.value)}
                  placeholder="e.g. 03/01/2025"
                />
              </div>

              <Button
                size=""
                className=""
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

export default CouponPage;
