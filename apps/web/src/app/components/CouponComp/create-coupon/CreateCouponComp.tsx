"use client";

import React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
import { toast } from "sonner";
import { CCreateCouponResponse } from "@/types/client";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { zodCouponSchema, CreateCoupon } from "@/utils/fieldsValidation/Client/couponSchemaValidation";

const CreateCouponComp: React.FC = (): React.JSX.Element => {

  const form = useForm<CreateCoupon>({
    resolver: zodResolver(zodCouponSchema),
    defaultValues: {
      code: "",
      discountValue: 0,
      discountType: "percentage",
      maxUses: 0,
      expiresAt: "",
    },

  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const router = useRouter();
  const handleCreateCoupon = async (data:
    CreateCoupon): Promise<void> => {

    try {
      const response = await axios.post<CCreateCouponResponse>("/api/admin/coupon", data);
      toast.success("Coupon created successfully");
      router.push("/course/coupon");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong";

      toast.error(message);

      throw new Error(message);
    }
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="w-[70%] h-full flex items-center justify-center">
        <Card className="w-137.5 space-y-4">
          <CardHeader className="">
            <CardTitle className="">Create a Coupon</CardTitle>
            <CardDescription className="">
              Create a new coupon for your course
            </CardDescription>
          </CardHeader>
          <CardContent className="">
            <form className="space-y-4" onSubmit={handleSubmit(handleCreateCoupon)}>
              <div className="space-y-2">
                <Label className="">Coupon</Label>
                <Input
                  className=""
                  type="text"
                  {...register("code")}
                  placeholder="e.g. JAVASCRIPT100"
                />
                {errors.code && (
                  <p className="text-sm text-red-500">
                    {errors.code.message}
                  </p>
                )}              </div>
              <div className="space-y-2">
                <Label className="">Discount Value</Label>
                <Input
                  className=""
                  {...register("discountValue", {
                    valueAsNumber: true
                  })}
                  type="number"
                  placeholder="e.g. 10"
                />
               {errors.discountValue && (
                  <p className="text-sm text-red-500">
                    {errors.discountValue.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="">Discount Type</Label>
                <select
                  className=""
                  {...register("discountType")}
                  defaultValue="percentage"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
                {errors.discountType && (
                  <p className="text-sm text-red-500">
                    {errors.discountType.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="">Coupon Limit</Label>
                <Input
                  className=""
                  type="number"
                  placeholder="e.g. 75"
                  {...register("maxUses", { valueAsNumber: true })}
                />
               {errors.maxUses && (
                  <p className="text-sm text-red-500">
                    {errors.maxUses.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="">Coupon Duration</Label>
                <Input
                  className=""
                  type="date"
                  {...register("expiresAt")}
                  placeholder="e.g. 03/01/2025"
                />
              </div>

              <Button
                size="default"
                className=""
                type="submit"
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

export default CreateCouponComp;
