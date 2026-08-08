"use client";

import React, { useCallback } from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MdCancel } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { IoSearch } from "react-icons/io5";
import { CCoupon, CDeleteCouponResponse, CfetchCouponsResponse, CUpdateCouponResponse } from "@/types/client";
import { updateCoupon, zodUpdateCouponSchema } from "@/utils/fieldsValidation/Client/couponSchemaValidation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "@/components/ui/switch"




export const ManageCouponComp: React.FC<{ className?: string }> = ({ className }): React.ReactElement => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [coupons, setCoupons] = useState<CCoupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const form = useForm<updateCoupon>({
    resolver: zodResolver(zodUpdateCouponSchema),
    defaultValues: {
      code: "",
      discountValue: 0,
      discountType: "percentage",
      maxUses: 0,
      isActive: true,
      createdBy: "",
      expiresAt: "",
    }
  });
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = form;
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const handleUpdateCoupon = async (couponId: string, data: updateCoupon) => {
    setIsEditing(true);
    setLoading(true);
    try {
      const response = await axios.put<CUpdateCouponResponse>(`/api/admin/coupon`, {
        couponId,
        ...data,

      });
      const updatedCoupon = response.data.updatedCoupon;

      toast.success("Coupon updated successfully");
      setCoupons((prevCoupons: CCoupon[]) =>
        prevCoupons.map((coupon: CCoupon) =>
          coupon._id === couponId ? updatedCoupon : coupon
        )
      );
      setEditingCouponId(null);
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    setIsEditing(false);
    setLoading(true);
    try {
      const response = await axios.delete<CDeleteCouponResponse>(`/api/admin/coupon`, {
        data: { couponId },
      });
      const data: CDeleteCouponResponse = response?.data;
      toast.success("Coupon deleted successfully");
      setCoupons((prevCoupons: CCoupon[]) =>
        prevCoupons.filter((coupon: CCoupon) => coupon._id !== couponId)
      );
      setEditingCouponId(null);
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const fetchCoupons = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get<CfetchCouponsResponse>(`/api/admin/coupon`);
      const data = response.data;
      setCoupons(data.coupons);
      setLoading(false);
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
      throw error;
    }
  }, []);

  const filteredCoupons: CCoupon[] =
    searchTerm.trim() === ""
      ? coupons
      : coupons.filter((coupon: CCoupon) => {
        const code: string = coupon?.code?.toLowerCase() || "";

        const term: string = searchTerm.toLowerCase();

        return code.includes(term);
      });

  useEffect(() => {
    const timer = setTimeout(() => { fetchCoupons() }, 500);

    return () => clearTimeout(timer);
  }, [coupons?.length]);
  return (
    <div className={cn("min-h-screen w-full flex items-start justify-center", className)}>
      <div className="w-[90%] lg:w-[70%] min-h-screen flex flex-col items-center justify-center py-6">
        <div className="w-full items-center justify-start text-3xl font-semibold">
          My Coupons
        </div>
        <div className="w-full min-h-screen flex flex-col items-center justify-center relative ">
          <div className="w-full absolute top-0 left-0">
            <div className="w-full flex justify-end">
              <Button
                size='default'
                type="button"
                onClick={() => {
                  router.push("/course/coupon/create");
                }}
                variant="outline"
                className="rounded-sm"
              >
                Create Coupon
              </Button>
            </div>
          </div>
          <span className="w-full absolute top-12 left-0">
            <div className="w-full flex justify-end">
              <span className="relative w-1/3">
                <Input
                  type="text"
                  placeholder="Search"
                  className="w-full"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
                <IoSearch className="absolute top-2 right-2" />
              </span>
            </div>
          </span>
          {loading || coupons.length === 0 ? (
            <div className="w-full flex-1 flex justify-center items-center ">
              <div>
                <span className="text-3xl">No Coupons Found</span>
              </div>
            </div>
          ) : coupons.length === 0 ? (
            <>
              <Skeleton className="w-75" />
              <Skeleton className="w-75" />
              <Skeleton className="w-75" />
              <Skeleton className="w-75" />
            </>
          ) : (
            <div className="w-full min-h-72.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 justify-items-start gap-4">
              {(filteredCoupons || []).map((coupon) => (
                <Card key={coupon._id} className="w-72.5 space-y-4 bg-black">
                  <CardHeader className={"bg-black"}>
                    <CardTitle className="">Coupon</CardTitle>
                  </CardHeader>
                  <CardContent className={"bg-black"}>
                    <form className="space-y-4" onSubmit={handleSubmit((data) => handleUpdateCoupon(coupon._id, data))}>
                      <div className="space-y-2">
                        <Label className="">Code</Label>
                        <Input
                          type="text"
                          className=""
                          {...register("code")}
                          placeholder="e.g. JavaScript Course"
                          disabled={editingCouponId !== coupon._id}

                        />
                        {editingCouponId === coupon._id && errors.code && (
                          <span className="text-red-500">{errors.code.message}</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="">Discount Type</Label>
                        <Input
                          className=""
                          type="text"
                          {...register("discountType")}
                          placeholder="e.g. Percentage"
                          disabled={editingCouponId !== coupon._id}

                          max={100}
                          min={0}
                        />
                        {editingCouponId === coupon._id && errors.discountType && (
                          <span className="text-red-500">{errors.discountType.message}</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="">Discount Value</Label>
                        <Input
                          className=""
                          type="number"
                          {...register("discountValue")}
                          placeholder="e.g. 20"
                          disabled={editingCouponId !== coupon._id}

                          max={100}
                          min={0}
                        />
                        {editingCouponId === coupon._id && errors.discountValue && (
                          <span className="text-red-500">{errors.discountValue.message}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between space-y-2">
                        <Label>Active</Label>
                        <Controller
                          name="isActive"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={editingCouponId !== coupon._id}
                            />
                          )}
                        />
                      </div>
                      {editingCouponId === coupon._id && errors.isActive && (
                        <span className="text-red-500">{errors.isActive.message}</span>
                      )}
                      <div className="space-y-2">
                        <Label className="">Usage Limit / Used Count</Label>
                        <Input
                          type="number"
                          className=""
                          {...register("maxUses")}
                          disabled={editingCouponId !== coupon._id}

                        />
                        {editingCouponId === coupon._id && errors.maxUses && (
                          <span className="text-red-500">{errors.maxUses.message}</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="">Expired At</Label>
                        <Input
                          type="date"
                          className=""
                          {...register("expiresAt")}
                          disabled={editingCouponId !== coupon._id}

                        />
                        {editingCouponId === coupon._id && errors.expiresAt && (
                          <span className="text-red-500">{errors.expiresAt.message}</span>
                        )}
                      </div>

                      {isEditing && editingCouponId === coupon._id ? (
                        <div className="flex gap-2">
                          <Button
                            size="default"
                            type="button"
                            onClick={() => {
                              setIsEditing(!isEditing);
                              setEditingCouponId(null);
                            }}
                            variant="outline"
                            className="px-7"
                          >
                            <span className="w-full items-center">
                              <MdCancel />
                            </span>
                          </Button>
                          <Button
                            size="default"
                            type="button"
                            onClick={() => handleDeleteCoupon(editingCouponId)}
                            variant="outline"
                            className="px-7"
                          >
                            <span className="w-full flex  justify-center">
                              <MdDeleteForever />
                            </span>
                          </Button>
                          <Button
                            className=""
                            size="default"
                            type="submit"
                            variant="outline"
                          >
                            Update
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className=""
                          size="default"
                          type="button"
                          onClick={() => {
                            setIsEditing(!isEditing);
                            setEditingCouponId(coupon._id);
                            reset({
                              code: coupon.code,
                              discountType: coupon.discountType,
                              discountValue: coupon.discountValue,
                              maxUses: coupon.maxUses,
                              expiresAt: coupon.expiresAt
                                ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
                                : "",
                              isActive: coupon.isActive,

                            })

                          }}
                          variant="outline"
                        >
                          Edit Coupon
                        </Button>
                      )}
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCouponComp;
