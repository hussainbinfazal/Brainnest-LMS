"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ControllerRenderProps } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Field } from "@/app/components/AdminComp/AdminCourseComp/Create-Course/courseFields";
import { JSX } from "react/jsx-runtime";
import {
  editProfileSchema,
  loginSchema,
  signUpSchema,
} from "@/utils/fieldsValidation/Auth/ZodAuthSchema";
import ProfileImageUpload from "../ProfileImageUpload";
import { cn } from "@/lib/utils";
import { clientLogger } from "@/utils/clientLogger/clientLogger";;
import { getErrorMessage } from "@repo/shared";
import { CAuthUser, CUploadResult } from "@/types/client";

type EditProfileCompProps = {
  savedUser: Partial<CAuthUser>;
  className: string;
};

export const EditProfileComp = ({
  savedUser,
  className,
}: EditProfileCompProps): JSX.Element => {
  const router = useRouter();
  const [user, setUser] = useState<Partial<CAuthUser>>(savedUser);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [fileUploadStatus, setFileUploadStatus] = useState<
    "idle" | "uploading" | "uploaded" | "error"
  >("idle");
  const [fileUploadResult, setFileUploadResult] = useState<
    Partial<CUploadResult>
  >({});
  const getUserFormValues = (user: Partial<CAuthUser>) => {
    return {
      name: user.name,
      phoneNumber: user?.phoneNumber,
      email: user.email,
      profileImage: user.profileImage,
    };
  };
  const editProfileForm = useForm<z.infer<typeof editProfileSchema>>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: getUserFormValues(savedUser),
  });

  const handleUpdateUser = async (data: z.infer<typeof editProfileSchema>) => {
    setIsUpdating(true);
    try {
      let finalData = {
        ...data,
        finalUploadResult: fileUploadResult
      };

    } catch (error: unknown) {
      let message: string = getErrorMessage(error, "Something went wrong");
      clientLogger.error("Something went wrong, while Login the user", {
        message,
      });
      // toast.error();
      setIsUpdating(false);
    }
  };
  return (
    <div
      className={cn(
        "flex justify-center items-center min-h-screen gap-4 overflow-auto pt-8",
        className
      )}
    >
      <Form {...editProfileForm}>
        <form
          onSubmit={editProfileForm.handleSubmit(handleUpdateUser)}
          className="space-y-8  py-4 min-h-125 "
        >
          <FormField
            control={editProfileForm.control}
            name="name"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof editProfileSchema>,
                "name"
              >;
            }) => (
              <Field label="Name" htmlFor="edit-profile-name">
                <FormItem className="">
                  <FormControl id="edit-profile-name">
                    <Input
                      type="text"
                      className=""
                      placeholder="Name"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage className="" />
                </FormItem>
              </Field>
            )}
          />

          <FormField
            control={editProfileForm.control}
            name="email"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof editProfileSchema>,
                "email"
              >;
            }) => (
              <Field label="Email" htmlFor="edit-profile-email">
                <FormItem className="">
                  <FormControl id="edit-profile-email">
                    <Input
                      type="email"
                      className=""
                      placeholder="Email"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage className="" />
                </FormItem>
              </Field>
            )}
          />

          <FormField
            control={editProfileForm.control}
            name="profileImage"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof editProfileSchema>,
                "profileImage"
              >;
            }) => (
              <Field
                label={
                  fileUploadStatus !== "uploaded"
                    ? "Upload Profile Picture"
                    : undefined
                }
              >
                <FormItem className="w-full min-w-0 relative">
                  <FormControl id="edit-profile-image">
                    <ProfileImageUpload<z.infer<typeof editProfileSchema>>
                      field={field}
                      fileUploadResult={setFileUploadResult}
                      uploadStatus={setFileUploadStatus}
                      className="w-full min-w-0"
                      imageUrl={user.profileImage}
                    />
                  </FormControl>

                  <FormMessage className="" />
                </FormItem>
              </Field>
            )}
          />
          <FormField
            control={editProfileForm.control}
            name="email"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof editProfileSchema>,
                "email"
              >;
            }) => (
              <Field label="Email" htmlFor="edit-profile-email">
                <FormItem className="">
                  <FormControl id="edit-profile-email">
                    <Input
                      type="email"
                      className=""
                      placeholder="Email"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage className="" />
                </FormItem>
              </Field>
            )}
          />
          <Button
            size="default"
            variant="default"
            className="w-full cursor-pointer"
            type="submit"
            disabled={editProfileForm.formState.isSubmitting}
          >
            Sign In
          </Button>
        </form>
      </Form>
    </div>
  );
};
