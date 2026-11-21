import { EditProfileComp } from "@/app/components/MyProfileComp/EditMyProfileComp";
import { auth } from "@/auth";
import {
  connectDB,
  EDIT_AUTH_USER,
  getCached,
  IUser,
  logger,
  User,
} from "@repo/shared/server";
import { redirect } from "next/navigation";
import { JSX } from "react";
type EditProfileUser = Pick<
  IUser,
  "name" | "email" | "phoneNumber" | "profileImage"
>;
export default async function editProfilePage(): Promise<JSX.Element> {
  const userSession = await auth();
  if (!userSession?.user?.id) {
    logger.warn("Unauthorized access attempt", { userSession });
    redirect("/login");
  }

  const userId = userSession.user.id;
  let savedUser = await getCached<EditProfileUser>(
    EDIT_AUTH_USER.namespace,
    userId
  );

  if (!savedUser) {
    try {
      await connectDB(process.env.MONGODB_URI!);
      savedUser = await User.findOne({ _id: userId })
        .select("_id name email phoneNumber profileImage")
        .lean()
        .exec();
    } catch (fetchError: unknown) {
      logger.error("Something went wrong while fetching the user", {
        error: fetchError,
      });
      redirect("/myprofile");
    }

    if (!savedUser) {
      redirect("/myprofile");
    }
  }

  const plainSavedUser = {
    name: savedUser.name ?? "",
    email: savedUser.email ?? "",
    phoneNumber: savedUser.phoneNumber ?? "",
    profileImage: savedUser.profileImage ?? "",
  };

  return <EditProfileComp savedUser={plainSavedUser} className="" />;
}
