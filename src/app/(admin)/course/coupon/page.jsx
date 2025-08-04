"use client";

import React, { useCallback } from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MdOutlineDelete } from "react-icons/md";
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
import { MdCancel } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { IoSearch } from "react-icons/io5";
const page = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  console.log("Page rendered");
  const [editForm, setEditForm] = useState({
    code: "",
    discount: "",
    usageLimit: "",
    expiresAt: "",
  });
  const [editingCouponId, setEditingCouponId] = useState(null);
  const handleUpdateCoupon = async (couponId) => {
    setIsEditing(true);
    setLoading(true);
    try {
      const response = await axios.put(`/api/admin/coupon`, {
        couponId,
        editForm,
      });
      const updatedCoupon = response.data.updatedCoupon;

      toast.success("Coupon updated successfully");
      setCoupons((prevCoupons) =>
        prevCoupons.map((coupon) =>
          coupon._id === couponId ? updatedCoupon : coupon
        )
      );
      setEditingCouponId(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    setIsEditing(false);
    setLoading(true);
    try {
      const response = await axios.delete(`/api/admin/coupon`, {
        data: { couponId },
      });
      const data = response?.data;
      toast.success("Coupon deleted successfully");
      setCoupons((prevCoupons) =>
        prevCoupons.filter((coupon) => coupon._id !== couponId)
      );
      setEditingCouponId(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/coupon`);
      const data = response.data;
      setCoupons(data);
      setLoading(false);
    } catch (error) {
      throw error;
    }
  }, []);

  const filteredCoupons =
    searchTerm.trim() === ""
      ? coupons
      : coupons.filter((coupon) => {
          const code = coupon?.code?.toLowerCase() || "";

          const term = searchTerm.toLowerCase();

          return code.includes(term);
        });

  useEffect(() => {
    const timer = setTimeout(() => {fetchCoupons()}, 1000);

    return () => clearTimeout(timer);
  }, [coupons.length]);
  return (
    <div className="min-h-screen w-full flex items-start justify-center">
      <div className="w-[90%] lg:w-[70%] min-h-screen flex flex-col items-center justify-center py-6">
        <div className="w-full items-center justify-start text-3xl font-semibold">
          My Coupons
        </div>
        <div className="w-full min-h-screen flex flex-col items-center justify-center relative ">
          <div className="w-full absolute top-0 left-0">
            <div className="w-full flex justify-end">
              <Button
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
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <Skeleton className="w-[300px]" />
              <Skeleton className="w-[300px]" />
              <Skeleton className="w-[300px]" />
              <Skeleton className="w-[300px]" />
            </>
          ) : (
            <div className="w-full min-h-[290px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 justify-items-start gap-4">
              {(filteredCoupons || []).map((coupon) => (
                <Card key={coupon._id} className="w-[290px] space-y-4 bg-black">
                  <CardHeader className={"bg-black"}>
                    <CardTitle>Coupon</CardTitle>
                  </CardHeader>
                  <CardContent className={"bg-black"}>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label>Code</Label>
                        <Input
                          value={
                            editingCouponId === coupon._id
                              ? editForm.code
                              : coupon.code
                          }
                          placeholder="e.g. JavaScript Course"
                          disabled={editingCouponId !== coupon._id}
                          onChange={(e) =>
                            setEditForm({ ...editForm, code: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount</Label>
                        <Input
                          type="number"
                          value={
                            editingCouponId === coupon._id
                              ? editForm.discount
                              : coupon.discount
                          }
                          disabled={editingCouponId !== coupon._id}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              discount: e.target.value,
                            })
                          }
                          max={100}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Usage Limit</Label>
                        <Input
                          value={
                            editingCouponId === coupon._id
                              ? editForm.usageLimit
                              : coupon.usageLimit
                          }
                          disabled={editingCouponId !== coupon._id}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              usageLimit: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expired At</Label>
                        <Input
                          value={
                            editingCouponId === coupon._id
                              ? editForm.expiresAt
                              : coupon.expiresAt &&
                                !isNaN(new Date(coupon.expiresAt))
                              ? new Date(coupon.expiresAt)
                                  .toISOString()
                                  .slice(0, 10)
                              : ""
                          }
                          disabled={editingCouponId !== coupon._id}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              expiresAt: e.target.value,
                            })
                          }
                        />
                      </div>

                      {isEditing && editingCouponId === coupon._id ? (
                        <div className="flex gap-2">
                          <Button
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
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon._id)}
                            variant="outline"
                            className="px-7"
                          >
                            <span className="w-full flex  justify-center">
                              <MdDeleteForever />
                            </span>
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              handleUpdateCoupon(coupon._id);
                            }}
                            variant="outline"
                          >
                            Update
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => {
                            setIsEditing(!isEditing);
                            setEditingCouponId(coupon._id);
                            setEditForm({
                              code: coupon.code,
                              discount: coupon.discount,
                              usageLimit: coupon.usageLimit,
                              expiresAt: new Date(coupon.expiresAt)
                                .toISOString()
                                .slice(0, 10), // format for input type="date"
                            });
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

export default page;
