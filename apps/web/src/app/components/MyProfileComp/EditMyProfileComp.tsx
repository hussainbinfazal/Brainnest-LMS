"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ControllerRenderProps } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Field, FileField } from "@/app/components/AdminComp/AdminCourseComp/Create-Course/courseFields";
import { JSX } from "react/jsx-runtime";
import {
  editProfileSchema,
  loginSchema,
  signUpSchema,
} from "@/utils/fieldsValidation/Auth/ZodAuthSchema";
import ProfileImageUpload from "../ProfileImageUpload";
import { cn } from "@/lib/utils";
import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { getErrorMessage } from "@repo/shared";
import { CAuthUser, CUploadResult } from "@/types/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFileUploadField } from "@/hooks/Video/useFileUploadField";
import { toast } from "sonner";
import axios from "axios";
import { useSession } from "next-auth/react";
import { VerifyCode } from "../AuthComponents/VerifyCode";
import { useAuthStore } from "@/lib/store/usersStore/useAuthStore";

type EditProfileCompProps = {
  savedUser: Partial<CAuthUser>;
  className?: string;
};
export type UpdateProfileBody = z.infer<typeof editProfileSchema>;

export const EditProfileComp = ({
  savedUser,
  className = "",
}: EditProfileCompProps): JSX.Element => {
  const router = useRouter();
  const { data: session, status } = useSession()
  const [user, setUser] = useState<Partial<CAuthUser>>(savedUser);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [profileUpdated, setProfileUpdated] = useState<boolean>(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [fileUploadStatus, setFileUploadStatus] = useState<
    "idle" | "uploading" | "uploaded" | "error"
  >("idle");
  const fetchAuthUser = useAuthStore((state) => state.fetchAuthUser);
  const [fileUploadResult, setFileUploadResult] = useState<
    Partial<CUploadResult>
  >({});
  const profile = useFileUploadField()
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
  const {
    register,
    control,
    setValue,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = editProfileForm;
  const email = watch("email")?.trim().toLowerCase();
  const originalEmail = savedUser.email?.trim().toLowerCase();
  const isNewEmail = Boolean(email && email !== originalEmail);
  const onSubmit = async (data: UpdateProfileBody) => {
    console.log("Update Profile button clicked");
    try {
      const submittedEmail = data.email.trim().toLowerCase();
      if (
        submittedEmail !== originalEmail &&
        verifiedEmail !== submittedEmail
      ) {
        toast.error("Please verify new email first");
        return;
      }
      await handleUpdateUser(data);
      // feedback and redirect
      toast.success("Profile updated successfully");
      fetchAuthUser();
      router.back();
      // router.push("/course/manage");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to create course");
      toast.error(message);
    }
  };


  const onInvalidSubmit = () => {
    toast.error("Please complete the required fields highlighted in the form.");
  };
  const handleUpdateUser = async (data: z.infer<typeof editProfileSchema>) => {
    setIsUpdating(true);
    try {
      let finalData = {
        ...data,
        finalUploadResult: fileUploadResult,
      };
      await axios.put(`/api/users/${user._id ?? session?.user.id}`, {
        userData: finalData,
      })
      setProfileUpdated(true)
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
    <main className={cn("flex min-h-screen items-center justify-center px-4 py-12", className)}>
      <FormProvider {...editProfileForm}>
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Edit your profile</CardTitle>
            {/* <CardDescription>
              Enter your current password and choose a strong new password.
            </CardDescription> */}
          </CardHeader>
          <CardContent className="space-y-5">
            {profileUpdated ? (
              <div className="space-y-4">
                <p role="status">Your info has been changed successfully.</p>
                <Button type="button" onClick={() => router.push("/login")}>
                  Continue to login
                </Button>
              </div>
            ) : (
              <form id="edit-profile-form" className="space-y-6" onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
              >
                <Field
                  id="name"
                  label="Name"
                  error={errors.name?.message}
                  required={true}
                >
                  <div className="relative">
                    <Input
                      type="name"
                      min={3}
                      {...register("name")}
                      placeholder="Enter your name"
                    />

                  </div>
                </Field>
                <Field
                  id="email"
                  label="Email"
                  error={errors.email?.message}
                  required={true}
                >
                  <div className="relative">
                    <Input
                      type="email"
                      min={3}
                      {...register("email")}
                      placeholder="Enter your email"
                    />

                  </div>
                </Field>
                {isNewEmail && (
                  <VerifyCode
                    onVerified={(verified) =>
                      setVerifiedEmail(verified.trim().toLowerCase())
                    }
                  />
                )}
                {/* {/Add Email Verification here} */}
                {/* <FileField
                  label="Profile Image"
                  accept="image/*"
                  {...profile}
                  onFile={async (f) => {
                    const result = await profile.upload(f, "avatar");
                    if (result) {
                      setValue("profileImage", result.url, {
                        shouldValidate: true,
                      });
                      setValue("profileImagePublicId", result.public_id, {
                        shouldValidate: true,
                      });
                      // setPreviewNewCover(result.url);
                    }
                  }}
                  error={
                    errors.profileImage?.message ?? errors?.profileImagePublicId?.message
                  }
                  required={true}
                  onCancel={profile.cancel}
                  isUploading={profile.isUploading}
                  progress={profile.progress}
                  url={watch("profileImage") ?? ""}
                  fileKind="image"
                /> */}
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
                    <FormItem className="w-full min-w-0 relative">
                      {fileUploadStatus !== "uploaded" && (
                        <FormLabel className="">Upload Profile Picture</FormLabel>
                      )}
                      <FormControl>
                        <ProfileImageUpload<z.infer<typeof editProfileSchema>>
                          field={field}
                          fileUploadResult={setFileUploadResult}
                          uploadStatus={setFileUploadStatus}
                          className="w-full min-w-0"
                          imageUrl={watch("profileImage") ?? ""}
                        />
                      </FormControl>

                      <FormMessage className="" />
                    </FormItem>
                  )}
                />

                <Button
                  className="active:scale-90 hover:scale-120 ease-in-out duration-600"
                  type="submit"
                  form="edit-profile-form"
                  disabled={isUpdating}
                  size="default"
                  variant="default"
                >
                  {isUpdating ? "Updating..." : "Update"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </FormProvider>
    </main>
  );
};